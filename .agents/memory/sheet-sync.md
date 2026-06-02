---
name: Google Sheet sync gotchas
description: Column-name aliasing and dedup rules for the merchant sheet sync
---
The published Google Sheet CSV uses human headers that differ from DB field names:
`Category` (singular), `Delivery to`, `Made in`, `Discount`, and has NO logo column.

**Why:** Sync (server/sheetSync.ts) normalizes header keys and must alias these to `categories`, `shippingCountries`, `countryMadeIn`, `bitcoinDiscount`. Missing aliases silently wipe those fields on every sync.

**How to apply:**
- Sync is name-based upsert (no deletes). Preserve existing `logo` and `bitcoinDiscount` when the sheet row leaves them blank (sheet has no logo column — logos are uploaded separately to GCS).
- `getMerchantByName` falls back to normalized (lowercase, strip non-alphanumeric) matching so "NIC NAC" vs "NICNAC" don't create duplicates; sync then updates by `existing.id`.
- To check for dupes: GROUP BY `lower(regexp_replace(name,'[^a-zA-Z0-9]','','g'))`.
