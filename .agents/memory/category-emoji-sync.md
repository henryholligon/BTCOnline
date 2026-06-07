---
name: Category emoji sync
description: How category→emoji mapping is sourced from a separate sheet tab and self-heals in production
---

# Category emoji sync

Category emojis are data-driven, not hardcoded. The runtime source of truth is the
`category_emojis` table; the frontend loads it via `GET /api/category-emojis` (a
lowercase-keyed map) and resolves labels with `categoryWithEmoji(category, map)` from
`@shared/schema` (via the `useCategoryEmojis` hook).

**Source of truth chain:** a dedicated published CSV tab (`emojiCsvUrl` on
`sheet_sync_config`, distinct `gid` from the merchant CSV) → parsed each sheet sync →
replaces the `category_emojis` table. The static `CATEGORY_EMOJIS` map in
`shared/schema.ts` is now only a fallback/seed.

**Self-healing (mirrors merchant sync):**
- `bootstrapCategoryEmojis()` seeds `category_emojis` from `CATEGORY_EMOJIS` when the
  table is empty, so a fresh/production DB shows emojis with no regression even before
  any emoji CSV URL is configured.
- Emoji sync is wrapped in try/catch inside `runSheetSync` so a failed/empty/unreachable
  emoji tab never breaks merchant sync and keeps the last known-good map (never wiped).

**Why:** prod runs a separate read-only-via-tools DB; emojis must be editable in the
spreadsheet and propagate on the 5-min poll without code changes or republish.

**Gotcha:** `categoryWithEmoji` guards with `/^\p{Extended_Pictographic}/u` — labels
that already start with an emoji (e.g. admin custom categories) are returned untouched
to avoid double-prefixing. The user supplies the emoji tab URL via the admin Sync tab.
