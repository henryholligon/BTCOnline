---
name: Canonical relay architecture
description: btconline canonical relay URL, NIP-42 publish flow, outbox pattern, and read vs write relay split.
---

# Canonical relay architecture

## Relay URLs
- **Canonical (primary):** `wss://nostr-permissioned-host.replit.app/`
- **HTTP base:** `https://nostr-permissioned-host.replit.app`
- **Backup relays:** damus.io, nos.lol, relay.nostr.band, nostr.wine
  (used for redundant publishing and profile bootstrapping only — never canonical reads)

## Access request
POST `https://nostr-permissioned-host.replit.app/api/relay/access-requests`
Body: `{ pubkey: "<hex>", note?: "..." }`
Called fire-and-forget on every login (nip07, nip46, generated, restored session).
409 Conflict is silently ignored (already registered).
`status: "pending"` only confirms that the request was recorded; it does not
add the pubkey to the relay allowlist. A publish can authenticate successfully
with NIP-42 and still receive `blocked: pubkey not on relay allowlist`.
Once allowlisted, the same identity receives `AUTH OK`, `EVENT OK`, and can
complete an authenticated `REQ`/`EOSE` read on the canonical relay.

## NIP-42 publish flow (client-side)
Implemented in `client/src/lib/btc-relay.ts → publishToCanonical()`.
1. Sign event locally.
2. `addToOutbox(event)` — localStorage key `btc_nostr_outbox`.
3. Open fresh WebSocket to canonical relay.
4. Relay sends `["AUTH", challenge]` immediately.
5. Sign kind-22242 with `["challenge", challenge], ["relay", wss://...]` using the user's signer.
6. Send `["AUTH", signedAuthEvent]`.
7. Wait for `["OK", authEventId, true, ""]`.
8. Send `["EVENT", signedEvent]`.
9. Wait for `["OK", eventId, true, ""]`.
10. `removeFromOutbox(event.id)` on success.
11. `markOutboxAttempt(event.id)` on failure — bounded exponential backoff (2 s → 5 min cap, 20 attempt max).

## NIP-42 publish flow (server-side)
Implemented in `server/nostrPublish.ts → publishEventToRelay()`.
- Master key from `NOSTR_MASTER_NSEC` signs the kind-22242 auth challenge.
- 3 s grace timer: if no AUTH arrives, publish without auth (backward compat with non-auth relays).
- Default relay is now the canonical relay (NOSTR_RELAY_URL env var overrides).

## Outbox drain
After every successful login, `NostrContext` drains pending outbox entries via `publishToCanonical`.
The drain is idempotent per login session (guarded by `outboxDrainedRef`).

## Read relay policy
- ALL community data reads (likes, saves, lists, favourites, follows, comments) → `[CANONICAL_RELAY]` only.
- Profile lookups (kind:0) → `[CANONICAL_RELAY, ...BACKUP_RELAYS]` for bootstrap.
- Backup relay reads are NEVER merged into canonical/community feeds.
- If canonical relay is down, community data shows as unavailable (no silent fallback).
- Reads use `SimplePool` pointed at `[CANONICAL_RELAY]`. SimplePool ignores AUTH messages
  from the relay; this works as long as the relay allows unauthenticated REQ (public reads).
  If the relay restricts REQ to authenticated sessions, a `queryCanonical()` helper with
  full NIP-42 AUTH will be needed (not yet implemented).

**Why:** Prevent stale or forked community data from appearing on the site. One relay = one source of truth.
**How to apply:** Any new relay query for community data must use `[CANONICAL_RELAY]` only.
