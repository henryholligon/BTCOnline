---
name: Comment authentication
description: Comments support custodial email sessions and pure Nostr identities without email.
---

Server-backed comments authenticate custodial email users through the session cookie and pure Nostr users through a short-lived, endpoint-bound signed Nostr event. Pure Nostr users are represented by pubkey-only records; private keys never reach the server.

**Why:** Pure Nostr accounts have no email session, so requiring `req.session.userEmail` blocked new non-custodial users from commenting.

**How to apply:** Any new server-backed action available to both account types must accept the same two authentication paths and bind Nostr proofs to the exact request path and method.