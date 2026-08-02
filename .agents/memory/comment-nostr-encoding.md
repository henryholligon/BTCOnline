---
name: Comments and reviews as Nostr events
description: Comments and star ratings are kind-1111 (NIP-22) events on the canonical relay, replacing the server-side comments DB table.
---

Comments and reviews are now Nostr kind-1111 events published to and read from the canonical relay.

## Encoding (decided in task #103)

- **Kind**: 1111 (NIP-22 comment)
- **Star rating**: `["rating", "<1-5>"]` tag on the event. No rating tag = plain comment.
- **Merchant reference**: `["r", <merchant-website>]` — used for `#r` filter queries
- **NIP-22 merchant reference**: `["E", <merchant-nostr-event-id>, "", "root"]` and `["e", <merchant-nostr-event-id>, "", "root"]`
- **Threaded reply**: `["e", <parent-event-id>, "", "reply"]`
- **Content**: plain human-readable text (empty for star-only reviews)

## Client-side (task #101)

- `use-comments.ts` rewritten: all hooks query the canonical relay via `poolQuerySync` and publish via `publishEvent` (NostrContext)
- `merchant-card.tsx` updated: hooks take `merchant.website` instead of `merchant.id`; comment form publishes directly to Nostr (no DB round-trip)
- Profile activity reads kind-1111 events by author pubkey then matches merchants by `r` tag website

## Server-side (task #101)

- All old DB-backed comment REST endpoints removed from `routes.ts`
- `getCommentUser` function removed
- `comments` import removed from routes

## Migration (task #102)

- `server/migrate-comments.ts` publishes existing DB comments as kind-1111 events
- All 14 existing comments migrated to the relay (signed with master key, tagged with `["migrated", "author:<pubkey>"]`)
- The `comments` table still exists in the DB but is no longer read by the app. Drop when confident.

**Why**: Comments and reviews need to be Nostr-native so they're visible to other Nostr clients and can't be lost if the server DB is reset.
