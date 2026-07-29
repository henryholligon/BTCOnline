---
name: Comment authentication
description: Server-backed comments require the email session even when the Nostr key is client-held.
---

Email accounts must establish the server email session for both custodial and self-custody modes. The private Nostr key can remain client-side while the session authorizes comments and ratings.

**Why:** Self-custody email login previously showed the user as signed in in the client but left `req.session.userEmail` empty, causing every comment request to return 401.

**How to apply:** When adding server-backed features to Nostr-authenticated UI, verify both the client session state and the server session/identity path.