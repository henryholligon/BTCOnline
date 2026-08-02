---
name: Likes encoding on the relay
description: Public likes are kind-7 NIP-25 reactions; private likes are encrypted kind-30078 app-data; kind 10003 is read-only legacy and must never be written for likes.
---

Public likes = NIP-25 kind-7 reactions (`content: "+"`, `["r", <merchant-url>]`); an unlike = kind-5 deleting ALL live reactions for that (author, url). Private likes = NIP-44-encrypted NIP-78 app-data event, kind 30078 with d-tag `btconline-private-likes`. Kind 10003 must never be written for likes — it is read-only legacy compat.

**Why:** The relay owner rejected likes arriving as kind-10003 bookmark events and required kind-7 NIP-25. The owner also rejected any private-likes flow that makes custodial (email-login) users interact with signer extensions — so private likes encrypt silently in the browser using the session key, which only custodial-email and generated-key sessions have.

**How to apply:** When touching likes code (`client/src/lib/nostr.ts`, `client/src/context/NostrContext.tsx`): keep the public/private kind split; container reads must constrain kind-30078 by `#d = btconline-private-likes` and exclude containers tombstoned by the author's kind-5 deletions; NIP-07/bunker users stay public-only until signer NIP-44 support is added. Legacy kind-10003 containers are migrated (kind-7 rewrite or 30078 rewrite + kind-5 tombstone) on the user's next write.
