# btconline - Bitcoin Merchant Directory

## Overview
A free and open-source directory of businesses that accept Bitcoin online. Displays merchant listings with categories, payment methods (Lightning/On-chain), shipping information, and website links.

## Recent Changes
- Category tags auto-get an emoji: `getCategoryWithEmoji` now falls back to a keyword matcher (`autoEmojiForCategory` in `shared/schema.ts`) for categories not in `CATEGORY_EMOJIS`, with a generic 🏷️ fallback. Explicit `CATEGORY_EMOJIS` entries still override (the "unless I say otherwise" case).
- Production fix (separate prod DB): published site was stale because production runs its own database that dev edits never reach (and prod DB is read-only via tools). The app now self-heals on deploy:
  - Logos resolve from the Cloudinary folder during sync via `getLogoUrlMap()` (name-normalized + override map for filename typos); sheet logo column would take priority if added. No more reliance on manual DB logo edits.
  - `startSheetSyncPoller` bootstraps a `DEFAULT_CSV_URL` + enables sync when the DB has no csvUrl, so a fresh/production DB auto-syncs (prunes to the sheet + applies Cloudinary logos) without manual setup.
- Sheet sync now treats the CSV as the source of truth: merchants absent from the sheet are pruned (deleted) on every sync (auto every 5 min + manual trigger). `runSheetSync` returns `removed` count.
- Merchant logos now served from Cloudinary folder "BTC Online Merchant Logos" (cloud: dqd8n9tnn)
  - All merchant logos point to that folder's Cloudinary URLs; no Replit Object Storage reliance
  - Account uses Cloudinary "dynamic folders" — list/find assets via Search API (`asset_folder="..."`), NOT `api.resources({prefix})` which returns 0
  - Admin uploads (/api/upload-logos) go to the same folder with collision-safe unique filenames; listing (/api/uploaded-logos) uses Search API
  - Removed dead object-storage logo route (/api/logos) and constants
- Added `bitcoinDiscount` field (nullable text) to merchants table for data-driven discount/promo badges
  - "NEW" value renders rainbow animated tag; any other value renders green discount badge
  - Supported in CSV import via `bitcoinDiscount` or `bitcoin_discount` column
- Added unique merchant URLs via slug-based routing (/merchant/:slug) with auto-scroll on deep link
- Added Share button with QR code popover in expanded merchant cards
- Multi-select filters for all dropdowns (categories, countries, payment, provider)
- Added admin page (/admin) with CSV bulk import and multi-logo upload (drag & drop)
- CSV import validates through insertMerchantSchema, supports flexible field names (snake_case and camelCase)
- Logo uploads saved to Replit App Storage (GCS) — persist across deployments, served as public https:// URLs
- Migrated merchant data from mock-data.ts to PostgreSQL database
- Created API routes for serving merchant data (GET /api/merchants, POST /api/merchants)
- Frontend fetches merchants from API instead of importing static data
- Removed ratings/reviews system entirely
- Removed Nostr login functionality

## Architecture
- **Frontend**: React + Vite, shadcn/ui components, wouter routing, framer-motion animations
- **Backend**: Express.js with PostgreSQL via Drizzle ORM
- **Database**: PostgreSQL with merchants table
- **Schema**: shared/schema.ts defines Merchant type and constants (CATEGORIES, COUNTRIES, PAYMENT_PROVIDERS)
- **Storage**: server/storage.ts implements DatabaseStorage with CRUD operations
- **Seed**: server/seed.ts populates database with 113 merchants

## Key Files
- `shared/schema.ts` - Database schema, types, and filter constants
- `server/storage.ts` - Database storage interface
- `server/routes.ts` - API routes (/api/merchants, /api/merchants/import, /api/upload-logos)
- `client/src/pages/admin.tsx` - Admin page with CSV import and logo upload
- `server/seed.ts` - Database seed script
- `server/db.ts` - Database connection
- `client/src/pages/home.tsx` - Main page with filtering logic
- `client/src/components/merchant-card.tsx` - Merchant card component
- `client/src/components/filters.tsx` - Filter sidebar component
- `client/src/lib/utils.ts` - Utility functions including slugify for merchant URLs
- `client/src/lib/mock-data.ts` - Legacy mock data (no longer used by frontend)

## User Preferences
- Clean UX, no mobile filter buttons
- No ratings/reviews system
- Open-source project (license TBD)
- Merchant data manageable via spreadsheets (Proton Sheets)
- Logo sizes to be standardized (64x64 or 128x128 PNG/WebP)
- New merchant categories should auto-generate an appropriate emoji (built-in keyword matcher, no AI) unless an explicit emoji is set in `CATEGORY_EMOJIS`
