---
name: Cloudinary dynamic folders
description: This Cloudinary account uses dynamic folders; how to find/list/upload assets correctly.
---

# Cloudinary dynamic folders (account dqd8n9tnn)

This Cloudinary account is configured for **dynamic folders**, where a folder is
metadata (`asset_folder`) stored separately from the asset's `public_id` (the
public_id does NOT contain the folder path).

**Why this matters:** the Admin API `cloudinary.api.resources({ type, prefix: "Folder/" })`
returns **0 results** even when the folder is full, because it filters by public_id
prefix. `api.root_folders()` shows the folder but `resources({prefix})` finds nothing.

**How to apply:**
- To list/find assets in a folder, use the Search API:
  `cloudinary.search.expression('asset_folder="BTC Online Merchant Logos"').max_results(500).execute()`.
- To upload INTO the folder, pass `asset_folder: "<folder>"` on the upload call
  (do NOT use the legacy `folder:` param, which creates path-based public_ids).
- Merchant logos live in folder **"BTC Online Merchant Logos"**. Public IDs follow
  `MerchantName_<6char>` (Cloudinary unique-filename suffix). To match a logo to a
  merchant: strip trailing `_[a-z0-9]{6}` from public_id, then normalize
  (lowercase, strip non-alphanumeric) and compare to the normalized merchant name.
- code_execution sandbox does NOT expose process.env (Cloudinary creds). Run
  Cloudinary scripts from a workspace `.mjs` file via the real shell (env present),
  and place the file in the workspace root so `node_modules` resolves (not /tmp).
