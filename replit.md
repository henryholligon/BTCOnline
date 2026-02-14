# btconline - Bitcoin Merchant Directory

## Overview
A free and open-source directory of businesses that accept Bitcoin online. Displays merchant listings with categories, payment methods (Lightning/On-chain), shipping information, and website links.

## Recent Changes
- Added admin page (/admin) with CSV bulk import and multi-logo upload (drag & drop)
- CSV import validates through insertMerchantSchema, supports flexible field names (snake_case and camelCase)
- Logo uploads saved to client/public/assets/ with collision-safe filenames
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
- `client/src/lib/mock-data.ts` - Legacy mock data (no longer used by frontend)

## User Preferences
- Clean UX, no mobile filter buttons
- No ratings/reviews system
- Open-source project (license TBD)
- Merchant data manageable via spreadsheets (Proton Sheets)
- Logo sizes to be standardized (64x64 or 128x128 PNG/WebP)
