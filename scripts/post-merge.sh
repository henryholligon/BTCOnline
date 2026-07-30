#!/bin/bash
set -e

npm install --no-audit

# Idempotent schema migrations — run before db:push so the column
# already exists if drizzle-kit's interactive prompt blocks the push.
node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('ALTER TABLE category_emojis ADD COLUMN IF NOT EXISTS restricted boolean NOT NULL DEFAULT false')
  .then(() => pool.end())
  .catch(e => { console.error(e.message); pool.end(); process.exit(1); });
"

npm run db:push -- --force
