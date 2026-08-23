# BTC Online

> A community-sourced directory for discovering online merchants that accept Bitcoin.

[![Website](https://img.shields.io/badge/website-btc--online.org-F7931A?style=flat-square&logo=bitcoin&logoColor=white)](https://btc-online.org)
[![License](https://img.shields.io/badge/license-MIT-111111?style=flat-square)](LICENSE)

BTC Online makes it easier to find products and services that can be purchased with Bitcoin. Browse a growing directory of online merchants, filter by payment method and availability, and open a listing to see the information that matters before visiting the merchant’s site.

## What it does

- Browse a curated directory of Bitcoin-accepting online merchants
- Filter by category, payment method, shipping availability, country of manufacture, and sort order
- Identify merchants accepting Lightning, on-chain Bitcoin, Cashu, and Liquid
- Open shareable merchant pages with human-readable URLs and QR codes
- Follow directory updates through Nostr
- Publish merchant listings as Nostr classified listings
- Manage merchants, categories, badges, and logos through an admin interface
- Import and synchronise merchant data from a published spreadsheet
- Support age-restricted categories with an explicit visitor confirmation flow
- Provide email-based accounts alongside non-custodial Nostr identities
- Report inaccurate or inappropriate listings for review

## Why BTC Online?

Bitcoin adoption is easier when people can find places to use it. BTC Online focuses on the practical discovery problem: a clean, searchable directory for online merchants, with payment and shipping information presented consistently across listings.

The project is designed to be useful to both shoppers looking for somewhere to spend Bitcoin and contributors helping keep the directory accurate.

## Tech stack

- **Frontend:** React, Vite, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion
- **Backend:** Express.js and TypeScript
- **Database:** PostgreSQL with Drizzle ORM
- **Identity and social layer:** Nostr
- **Media:** Cloudinary
- **Email:** Resend
- **Data operations:** Published CSV / spreadsheet synchronisation
- **Deployment:** Replit with a production build served by Node.js

## Getting started

### Requirements

- Node.js 20 or newer
- PostgreSQL
- npm

### Install

```bash
git clone https://github.com/henryholligon/BTCOnline.git
cd BTCOnline
npm install
```

### Configure the environment

Set `DATABASE_URL` to a PostgreSQL database that you control before starting the
server. The application also supports optional integrations for media storage,
email delivery, Nostr publishing, and maintainer workflows. Configure those
through your hosting provider’s secret manager or local environment settings
when you need them.

The exact production credentials and administrative access settings are
intentionally not documented here. They are deployment configuration, not
requirements for understanding or contributing to the codebase.

Never commit secrets, private keys, tokens, or production credentials to the
repository.

### Start the development server

```bash
npm run dev
```

The application is available at [http://localhost:5000](http://localhost:5000).

### Check and build

```bash
npm run check
npm run build
```

The production server can be started with:

```bash
npm start
```

## Project structure

```text
client/             React application and UI components
  src/pages/        Public directory and admin pages
  src/components/   Merchant cards, filters, navigation, and shared UI
server/             Express routes, storage, sync, email, and Nostr publishing
shared/             Database schema and shared TypeScript types
script/             Production build tooling
attached_assets/    Project imagery and merchant assets
```

Important areas of the codebase:

- `shared/schema.ts` — PostgreSQL schema and shared merchant types
- `server/routes.ts` — HTTP API routes
- `server/storage.ts` — Database access layer
- `server/sheetSync.ts` — Spreadsheet synchronisation
- `server/nostrPublish.ts` — Nostr listing publishing
- `server/cloudinary.ts` — Merchant logo storage
- `client/src/pages/home.tsx` — Public directory experience
- `client/src/components/merchant-card.tsx` — Listing presentation and expanded details
- `client/src/components/filters.tsx` — Directory filtering and sorting

## Merchant data

Merchant records are maintained through the admin workflow and synchronised from a published spreadsheet. The sync process updates directory data, applies category and country emoji metadata, resolves merchant logos, and removes records that are no longer present in the source data.

This keeps the public directory data-driven while allowing maintainers to manage listings without editing application code.

## Nostr

BTC Online uses Nostr to make directory listings portable and discoverable beyond the website. Merchant listings can be published as NIP-99 classified listings, and the application supports Nostr identities for community participation.

Nostr publishing is optional for local development. A local instance can run
the directory and database without publishing events when Nostr publishing has
not been configured.

## Contributing

Contributions that improve data quality, usability, accessibility, privacy, and Bitcoin payment discovery are welcome.

Before opening a pull request:

1. Explain the problem and the proposed change.
2. Keep changes focused and avoid committing secrets or private data.
3. Run `npm run check`.
4. Run `npm run build`.
5. Include screenshots for meaningful UI changes.

For merchant corrections, use the report flow where possible so maintainers can review the listing and its source information.

## License

BTC Online is released under the [MIT License](LICENSE).

## Links

- Website: [btc-online.org](https://btc-online.org)
- Source code: [github.com/henryholligon/BTCOnline](https://github.com/henryholligon/BTCOnline)