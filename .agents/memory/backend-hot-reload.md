---
name: Backend has no hot-reload
description: Server code changes require a manual workflow restart in dev
---
The dev workflow runs the server via plain `tsx server/index.ts` (NOT `tsx watch`).

**Why:** Only the Vite frontend hot-reloads. Backend files (server/*.ts) keep running the OLD code until the "Start application" workflow is restarted.

**How to apply:** After editing anything under `server/` (routes, storage, sheetSync, etc.), restart the workflow before testing via curl or triggering jobs. Symptom of forgetting: a fix appears to not work / a DB cleanup gets re-broken because stale code ran against the DB.
