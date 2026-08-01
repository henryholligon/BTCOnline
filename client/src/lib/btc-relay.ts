/**
 * btc-relay.ts — Canonical relay integration for btconline.
 *
 * The btc-online relay is the sole authoritative source for all community
 * data: likes, saves, comments, merchant lists, favourites.
 *
 * Publishing contract (per spec):
 *   1. Sign event locally.
 *   2. Add to durable localStorage outbox.
 *   3. Connect to canonical relay → receive ["AUTH", challenge].
 *   4. Sign kind-22242 and respond with ["AUTH", signed].
 *   5. Wait for ["OK", authId, true, ""] before sending the event.
 *   6. Send ["EVENT", signedEvent]; wait for ["OK", eventId, true, ""].
 *   7. Only remove from outbox after OK is true.
 *   8. On failure, retry with bounded exponential backoff.
 *   9. Optionally publish to backup relays (fire-and-forget, no auth required).
 *
 * Reading: point SimplePool at [CANONICAL_RELAY] only.
 * Backup relays are NEVER used as a source for canonical/community data.
 * If the canonical relay is down, community data simply shows as unavailable.
 */

import type { EventTemplate, VerifiedEvent } from 'nostr-tools';

// ── Relay URLs ────────────────────────────────────────────────────────────────

export const CANONICAL_RELAY = 'wss://nostr-permissioned-host.replit.app/';
export const CANONICAL_RELAY_HTTP = 'https://nostr-permissioned-host.replit.app';

/**
 * Backup relays for optional redundant publishing and profile bootstrapping.
 * Never used as an authoritative source for btconline community data.
 */
export const BACKUP_RELAYS = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.nostr.band',
  'wss://nostr.wine',
];

// ── Access Request ────────────────────────────────────────────────────────────

/**
 * Register a pubkey with the canonical relay's access-request endpoint.
 * Fire-and-forget — never sends the user's private key.
 * Silently ignores 409 Conflict (already registered).
 */
export async function requestRelayAccess(pubkey: string, note = ''): Promise<void> {
  try {
    const res = await fetch(`${CANONICAL_RELAY_HTTP}/api/relay/access-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pubkey, ...(note ? { note } : {}) }),
    });
    if (!res.ok && res.status !== 409) {
      console.warn('[btc-relay] access-request returned', res.status);
    }
  } catch (err) {
    // Network failure is non-fatal — user can still interact optimistically.
    console.warn('[btc-relay] access-request failed:', err);
  }
}

// ── Outbox ────────────────────────────────────────────────────────────────────

const OUTBOX_KEY = 'btc_nostr_outbox';

export interface OutboxEntry {
  event: VerifiedEvent;
  addedAt: number;
  attempts: number;
  nextRetryAt: number;
}

function loadOutbox(): Record<string, OutboxEntry> {
  try { return JSON.parse(localStorage.getItem(OUTBOX_KEY) ?? '{}'); }
  catch { return {}; }
}

function saveOutbox(o: Record<string, OutboxEntry>): void {
  try { localStorage.setItem(OUTBOX_KEY, JSON.stringify(o)); } catch { /* quota exceeded */ }
}

/** Persist a signed event to the outbox (idempotent by event id). */
export function addToOutbox(event: VerifiedEvent): void {
  const o = loadOutbox();
  if (!o[event.id]) {
    o[event.id] = { event, addedAt: Date.now(), attempts: 0, nextRetryAt: 0 };
    saveOutbox(o);
  }
}

/** Remove a confirmed event from the outbox. */
export function removeFromOutbox(eventId: string): void {
  const o = loadOutbox();
  if (eventId in o) { delete o[eventId]; saveOutbox(o); }
}

/** Return all outbox entries whose nextRetryAt is now or in the past. */
export function getPendingOutboxEntries(): OutboxEntry[] {
  const now = Date.now();
  return Object.values(loadOutbox()).filter(e => e.nextRetryAt <= now);
}

const MAX_BACKOFF_MS = 5 * 60_000; // 5 minutes
const MAX_ATTEMPTS = 20;

/**
 * Mark a failed publish attempt, advancing the retry delay with bounded
 * exponential backoff (2 s → 4 s → 8 s … capped at 5 min).
 * Entries exceeding MAX_ATTEMPTS are discarded.
 */
export function markOutboxAttempt(eventId: string): void {
  const o = loadOutbox();
  const entry = o[eventId];
  if (!entry) return;
  if (entry.attempts >= MAX_ATTEMPTS) {
    delete o[eventId];
  } else {
    const delay = Math.min(2_000 * Math.pow(2, entry.attempts), MAX_BACKOFF_MS);
    entry.attempts += 1;
    entry.nextRetryAt = Date.now() + delay;
  }
  saveOutbox(o);
}

// ── NIP-42 Authenticated Publisher ───────────────────────────────────────────

export type SignerFn = (template: EventTemplate) => Promise<VerifiedEvent>;

const PUBLISH_TIMEOUT_MS = 20_000;

/**
 * Publish a pre-signed event to the canonical relay using NIP-42 AUTH.
 *
 * Wire protocol:
 *   connect
 *   ← ["AUTH", challenge]
 *   → ["AUTH", kind-22242-event]
 *   ← ["OK", authEventId, true, ""]
 *   → ["EVENT", signedEvent]
 *   ← ["OK", signedEvent.id, true, ""]
 *
 * Rejects if AUTH is denied, the relay rejects the event, or the timeout fires.
 * The caller is responsible for outbox accounting (add before, remove after OK).
 */
export function publishToCanonical(
  signedEvent: VerifiedEvent,
  signer: SignerFn,
): Promise<void> {
  return new Promise((resolve, reject) => {
    let settled = false;
    let authEventId = '';
    let authComplete = false;

    const settle = (err?: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try { ws.close(); } catch { /* ignore */ }
      if (err) reject(err); else resolve();
    };

    const timer = setTimeout(
      () => settle(new Error('canonical relay publish timed out')),
      PUBLISH_TIMEOUT_MS,
    );

    const ws = new WebSocket(CANONICAL_RELAY);

    ws.onmessage = async (raw) => {
      let msg: unknown;
      try { msg = JSON.parse(raw.data as string); } catch { return; }
      if (!Array.isArray(msg)) return;

      // ── AUTH challenge ──────────────────────────────────────────────────────
      if (msg[0] === 'AUTH' && typeof msg[1] === 'string' && !authComplete) {
        const challenge = msg[1] as string;
        try {
          const authEv = await signer({
            kind: 22242,
            created_at: Math.floor(Date.now() / 1000),
            tags: [['challenge', challenge], ['relay', CANONICAL_RELAY]],
            content: '',
          });
          authEventId = authEv.id;
          ws.send(JSON.stringify(['AUTH', authEv]));
        } catch (e) {
          settle(new Error(`NIP-42 signing failed: ${e}`));
        }
        return;
      }

      // ── OK response ─────────────────────────────────────────────────────────
      if (msg[0] === 'OK' && typeof msg[1] === 'string') {
        const id = msg[1] as string;
        const ok = msg[2] as boolean;
        const reason = (msg[3] as string) ?? '';

        // AUTH confirmation
        if (id === authEventId && !authComplete) {
          if (!ok) { settle(new Error(`relay auth rejected: ${reason}`)); return; }
          authComplete = true;
          ws.send(JSON.stringify(['EVENT', signedEvent]));
          return;
        }

        // EVENT confirmation
        if (id === signedEvent.id) {
          if (ok) settle();
          else settle(new Error(`relay rejected event: ${reason}`));
        }
      }
    };

    ws.onerror = () => settle(new Error('WebSocket error on canonical relay'));
    ws.onclose = (ev) => {
      if (!settled) settle(new Error(`connection closed unexpectedly (code ${ev.code})`));
    };
  });
}
