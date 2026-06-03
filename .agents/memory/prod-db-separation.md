---
name: Dev vs prod database separation
description: Production has its own database; how merchant data/logos must reach prod.
---

# Production uses a SEPARATE database from development

Replit deployment for this project runs against its own production database
(different rows/IDs than dev). Direct edits to the **development** DB (manual SQL,
one-off migration scripts, `executeSql` writes) do **NOT** propagate to production.
`executeSql({environment:"production"})` is **read-only** — you cannot fix prod data
with it.

**Why this matters:** logos were once set by a one-off script against dev only, so the
published site kept showing old `/assets/*` logos and stale merchants (e.g. Cheap Air)
even though dev looked correct.

**How to apply — make prod self-heal from code-run sources of truth:**
- Merchant list: the Google Sheet CSV (sheet sync prunes anything not in the CSV).
- Logos: the Cloudinary folder "BTC Online Merchant Logos" — `runSheetSync` looks up
  each merchant's logo via `getLogoUrlMap()` (Search API) and applies it, so logos
  never depend on manual DB edits. Sheet logo column (if added) takes priority.
- Prod config bootstrap: `startSheetSyncPoller` writes a DEFAULT_CSV_URL + enabled=true
  when the DB has no csvUrl, so a fresh prod DB auto-syncs without manual setup.
- After any data-shaping code change, the fix only reaches prod on **redeploy/publish**.
