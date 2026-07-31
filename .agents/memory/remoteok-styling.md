---
name: Remote OK style matching
description: Ground truth for the Remote OK-inspired restyle of merchant cards/filters
---
The card restyle mimics remoteok.com. Key verified facts:
- All card text (title, company/description, tag pills) is near-black **#111111**; visual hierarchy comes from font weight/size, NOT grey tints. Guessing grey (#666/#888) was rejected by the user.
- Page background is warm off-white **#fbfaf8** (their `--global-background-color`).
- The live site's primary font stack is `system-ui, sans-serif, "Nunito", "Helvetica", "Arial", sans-serif`; Nunito is not first.
- curl of remoteok.com returns a bot-challenge page — to verify colors, screenshot the live site and sample the *darkest* pixel in a text crop (antialiasing makes single-pixel sampling useless).

**How to apply:** any further Remote OK-matching work must verify against the live site, never guess from memory or eyeballing.
