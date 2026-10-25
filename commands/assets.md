---
description: Generate the icons, screenshots and promo graphics this product's stores require
argument-hint: "[store or asset, e.g. play_store | chrome_web_store | favicon | all]"
---

Use the `readytogo` skill to generate store and launch assets for this project. Target: $ARGUMENTS (if empty, everything the profile's stores need).

1. Load or create the profile (`readytogo scan --write`, confirm stores with me).
2. For each store, `readytogo specs --store <store>` and list what is required vs optional.
3. Find the master icon (ask me if there is none); generate icons; ask me whether to use my screenshots or capture fresh (`references/capture.md`), then fit them with `readytogo shot`; build promo tiles and mockups from the shipped starters (`readytogo scaffold promo|frames|3d`, see `references/mockups.md`) and `readytogo render` them.
4. Draft listing text and verify it with `readytogo listing`.
5. Place outputs where the project expects them (ask before overwriting), `readytogo verify` every file against its target, and re-run `readytogo check`.
