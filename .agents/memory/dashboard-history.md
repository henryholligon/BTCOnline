---
name: Dashboard history
description: Merchant growth charts use daily snapshots collected from feature launch onward.
---

The public acceptance dashboard must distinguish live totals from historical growth. Daily merchant-count snapshots begin when the dashboard feature is enabled; do not backfill a fabricated historical series from current merchant metadata.

**Why:** The directory stores each merchant's latest survey date, not historical membership snapshots, so backfilled growth would imply accuracy the data cannot support.

**How to apply:** Keep the chart's empty/limited-history state explicit until enough daily snapshots exist, and label current verification metrics separately from growth history.