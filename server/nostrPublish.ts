/**
 * Server-side Nostr publisher.
 *
 * Publishes merchants as NIP-99 kind 30402 (classified listing) events,
 * signed by a master keypair stored in NOSTR_MASTER_NSEC.
 *
 * Required env vars:
 *   NOSTR_MASTER_NSEC  — nsec-encoded private key for the directory identity
 *   NOSTR_RELAY_URL    — optional; defaults to wss://relay.primal.net
 *
 * Gracefully no-ops if NOSTR_MASTER_NSEC is not set.
 */

import { finalizeEvent, getPublicKey, type VerifiedEvent } from "nostr-tools";
import { decode } from "nostr-tools/nip19";
import WebSocket from "ws";
import type { Merchant } from "@shared/schema";

const DEFAULT_RELAY_URL = "wss://relay.primal.net";
const PUBLISH_TIMEOUT_MS = 15_000;

// ── Helpers ──────────────────────────────────────────────────────────────────

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getMasterKey(): Uint8Array | null {
  const nsec = process.env.NOSTR_MASTER_NSEC;
  if (!nsec) return null;
  try {
    const decoded = decode(nsec);
    if (decoded.type !== "nsec") {
      console.error("[nostr] NOSTR_MASTER_NSEC is not a valid nsec string");
      return null;
    }
    return decoded.data as Uint8Array;
  } catch (e: any) {
    console.error("[nostr] Failed to decode NOSTR_MASTER_NSEC:", e.message);
    return null;
  }
}

/** Returns the hex pubkey of the master key, or null if unconfigured. */
export function getMasterPubkey(): string | null {
  const key = getMasterKey();
  return key ? getPublicKey(key) : null;
}

/** True when NOSTR_MASTER_NSEC is set and decodable. */
export function nostrConfigured(): boolean {
  return getMasterKey() !== null;
}

export function getRelayUrl(): string {
  return process.env.NOSTR_RELAY_URL || DEFAULT_RELAY_URL;
}

// ── Event builder ─────────────────────────────────────────────────────────────

function buildKind30402(merchant: Merchant, secretKey: Uint8Array) {
  const tags: string[][] = [
    // `d` tag is the stable identifier — updates replace the same event
    ["d", slugify(merchant.name)],
    ["title", merchant.name],
    ["summary", merchant.description],
    ["r", merchant.website],
  ];

  // Category tags
  for (const cat of merchant.categories) {
    tags.push(["t", cat.toLowerCase()]);
  }

  // Logo image
  if (merchant.logo?.startsWith("http")) {
    tags.push(["image", merchant.logo]);
  }

  // Payment method tags (NIP-99 convention)
  if (merchant.onchainSupported) tags.push(["payment", "on-chain"]);
  if (merchant.lightningSupported) tags.push(["payment", "lightning"]);
  if (merchant.cashuSupported) tags.push(["payment", "cashu"]);
  if (merchant.liquidSupported) tags.push(["payment", "liquid"]);

  // Geography
  if (merchant.countryMadeIn) tags.push(["location", merchant.countryMadeIn]);
  for (const country of merchant.shippingCountries ?? []) {
    tags.push(["ship-to", country]);
  }

  // Provider
  if (merchant.paymentProvider) tags.push(["provider", merchant.paymentProvider]);

  return finalizeEvent(
    {
      kind: 30402,
      created_at: Math.floor(Date.now() / 1000),
      tags,
      content: merchant.description,
    },
    secretKey,
  );
}

// ── Relay transport ───────────────────────────────────────────────────────────

function publishEventToRelay(
  relayUrl: string,
  event: VerifiedEvent,
): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false;
    const settle = (val: boolean) => {
      if (!settled) {
        settled = true;
        resolve(val);
      }
    };

    const timer = setTimeout(() => {
      try { ws.terminate(); } catch {}
      settle(false);
    }, PUBLISH_TIMEOUT_MS);

    const ws = new WebSocket(relayUrl);

    ws.on("open", () => {
      ws.send(JSON.stringify(["EVENT", event]));
    });

    ws.on("message", (data) => {
      try {
        const msg = JSON.parse(data.toString());
        // NIP-01: ["OK", <event-id>, <true|false>, <message>]
        if (Array.isArray(msg) && msg[0] === "OK" && msg[1] === event.id) {
          clearTimeout(timer);
          ws.close();
          settle(msg[2] === true);
        }
      } catch {}
    });

    ws.on("error", (err) => {
      console.error("[nostr] WebSocket error:", (err as Error).message);
      clearTimeout(timer);
      settle(false);
    });

    ws.on("close", () => {
      clearTimeout(timer);
      settle(false);
    });
  });
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Publish a single merchant to the configured relay.
 * Returns the Nostr event ID on success, null on failure or if unconfigured.
 */
export async function publishMerchant(merchant: Merchant): Promise<string | null> {
  const secretKey = getMasterKey();
  if (!secretKey) return null;

  const relayUrl = getRelayUrl();
  try {
    const event = buildKind30402(merchant, secretKey);
    const ok = await publishEventToRelay(relayUrl, event);
    return ok ? event.id : null;
  } catch (e: any) {
    console.error(`[nostr] Failed to publish "${merchant.name}":`, e.message);
    return null;
  }
}

/**
 * Publish a list of merchants (typically those with no nostrEventId yet).
 * Returns per-merchant results so the caller can update the DB.
 */
export async function publishMerchants(
  merchants: Merchant[],
): Promise<Array<{ id: number; eventId: string | null }>> {
  const secretKey = getMasterKey();
  if (!secretKey) return merchants.map((m) => ({ id: m.id, eventId: null }));

  const relayUrl = getRelayUrl();
  const results: Array<{ id: number; eventId: string | null }> = [];

  for (const merchant of merchants) {
    try {
      const event = buildKind30402(merchant, secretKey);
      const ok = await publishEventToRelay(relayUrl, event);
      results.push({ id: merchant.id, eventId: ok ? event.id : null });
    } catch (e: any) {
      console.error(`[nostr] Failed to publish "${merchant.name}":`, e.message);
      results.push({ id: merchant.id, eventId: null });
    }
  }

  return results;
}
