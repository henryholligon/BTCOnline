---
name: Dashboard history
description: Merchant growth charts use daily snapshots collected from feature launch onward.
---

The public acceptance dashboard must distinguish live totals from historical growth. It uses Google Sheet Date added and Date last verified fields when present, with daily snapshots as a fallback until those fields are populated.

**Why:** The directory originally stored only each merchant's latest survey date, so a historical series should only be shown as authoritative after the sheet supplies explicit dates.

**How to apply:** Keep the chart's limited-history state explicit, label the source of the series, and use last-surveyed values only as a clearly marked fallback.