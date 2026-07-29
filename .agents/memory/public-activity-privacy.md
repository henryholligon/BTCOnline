---
name: Public activity privacy
description: Rules for displaying participant identities on merchant activity.
---

Only public Nostr likes may be attributed to named profiles; private likes must remain undisclosed. Database-backed comments and reviews may show their existing derived author names.

**Why:** Users explicitly control whether their Nostr likes are public, so participant discovery must not bypass that privacy choice.

**How to apply:** When adding activity summaries or participant lists, filter private kind-10003 events and use profile names with a shortened npub fallback.