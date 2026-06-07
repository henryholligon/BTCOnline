---
name: Add Merchant forms (btconline)
description: There are TWO distinct "add merchant" forms — which one to edit for which request.
---

# Two separate "Add Merchant" forms

btconline has two unrelated forms that both add merchants. Confusing them costs real rework.

- **Public submission form** = the "Add Merchant" dialog in `client/src/components/navbar.tsx`.
  - This is what end users see (the button top-right of the site).
  - It is a **frontend-only stub**: `handleSubmitMerchant` only shows a toast, it does NOT persist
    anything to the backend. So UI-only changes here need no schema/route/DB work.
- **Admin form** = `client/src/pages/admin.tsx`, reached at the obfuscated route `/x7k2m9p4r1qn`.
  - This one actually POSTs to `/api/merchants` and persists.

**How to apply:** When a user talks about the "merchant submission form" / "when Add Merchant is
pressed", they almost certainly mean the public navbar dialog, NOT the admin page. Confirm with the
visible UI before making data-model/backend changes.
