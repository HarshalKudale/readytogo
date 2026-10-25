---
name: readytogo
description: Get a product ready to ship. Audits a repo for launch readiness, works out which checks apply (web, iOS, Android, desktop, browser extension, CLI, library, API), fixes what it can, and generates the assets stores require (app icons, favicons, store screenshots at exact sizes, promo tiles, OG images, device mockups, 3D three.js mockups and animations). Use when the user says ship, launch, release, publish, "submit to App Store / Google Play / Chrome Web Store / Firefox / Edge / Microsoft Store", Product Hunt, "launch checklist", "store assets", "app icon", "favicon", "screenshots", "mockup", or "is this ready to launch".
---

# ReadyToGo

Turn "is this ready to ship?" into a verified list, and produce the assets a launch needs.
You do the thinking (what applies, what to write, what to fix). The CLI does the exact work (pixels, sizes, state, checks).

Run the CLI as `npx -y readytogo@latest <command>` (written `readytogo` below). In a Claude Code plugin install it is
`node "${CLAUDE_PLUGIN_ROOT}/bin/readytogo.js"`. Needs Node 20+. Rendering HTML/3D also needs `npm i -D playwright && npx playwright install chromium`; `readytogo doctor` shows what is missing.

## Workflow

1. **Profile the product.** `readytogo scan --write` reads the repo and proposes tags (platform, framework, hosting, services).
   - It lists tags marked *assumed* and questions the repo cannot answer: `stores, monetization, data, regions, ai, have, goal`.
   - Answer what you can from README, docs and config; **ask the user once, in one batch, for the rest** (options in `data/questions.json`).
   - Record with `readytogo profile --add tag,tag --remove tag --name "…" --tagline "…" --confirm`. List valid tags with `readytogo profile --tags`.
2. **Plan.** `readytogo plan --open` lists only the checklists and items that apply, grouped by phase. Read `references/checklists/<slug>.md` for the checklists you will work on (not all of them; the index is `references/checklists.md`).
3. **Check and fix.** `readytogo check` runs the automatic checks (secrets, icons and alpha, manifest, SEO tags, CI, privacy page, and more) and saves results. Fix what is fixable in code, config and content. Re-run `check`. Items with no automatic check are yours to verify from the item's steps: look at the repo, then `readytogo mark <id> done --note "evidence"`.
4. **Generate assets** the plan calls for. See the table below, and `references/assets.md` for sources, placement and capture.
5. **Hand the rest to the human.** Accounts, payments, legal sign-off, DNS, store submission and reviews cannot be done by you. List each with the exact steps from the checklist. Do not mark them done without the user's confirmation or real evidence.
6. **Report.** `readytogo report` writes `READYTOGO.md` and exits non-zero while blockers are open. End your reply with: blockers still open, what you changed, what only the user can do.

## Generate assets (exact pixels, no AI drawing)

| Need | Command | Read |
|---|---|---|
| App icons for a store or OS | `readytogo icons <master.png\|svg> --for app_store\|play_store\|chrome_web_store\|firefox_addons\|edge_addons\|favicon\|icns\|ico` | `references/assets.md` |
| Store screenshots at the store's size | `readytogo shot <screenshot...> --target <id>` (ids: `readytogo specs --store <store>`) | `references/store-specs.md` |
| Screenshot inside a phone / tablet / browser / window / laptop frame | `readytogo frame <screenshot> --frame phone --size landscape --bg "grad:#hex,#hex"` | `references/mockups.md` |
| Promo tile, feature graphic, OG image, social card | `readytogo promo --target <id> --title "…" --logo logo.svg` or the HTML template for richer art | `references/mockups.md` |
| 3D device mockup, hero image, animated loop or video | scaffold `templates/3d`, then `readytogo render … --video out.mp4` | `references/mockups-3d.md` |
| Listing text within limits | write it, then `readytogo listing fields.json` | `references/store-specs.md` |
| Hide secrets/PII in a screenshot, or highlight a region | `readytogo annotate img.png --box x,y,w,h --mode redact\|highlight` | `references/assets.md` |
| On-page SEO score and link-preview tags | `readytogo seo page.html\|https://…` | `references/checklists/technical-seo.md` |

Every command writes to `.readytogo/assets/…` unless you pass `--out`. Copy results to where the project expects them (see placement in `references/assets.md`); do not overwrite existing user assets without asking.

## Rules

- **Screenshots show the real product.** Capture them from the running app (Playwright for web and extensions, simulator or `adb` for mobile, see `references/assets.md`). Never draw UI that does not exist or claim features the product lacks. Seed demo data; redact personal data.
- **Store rules drift.** Each checklist has a `Last verified` date. If it is older than ~90 days, or the item is high-stakes (privacy label, data safety, signing), confirm against the store's live documentation before bulk-generating.
- **Do not submit, publish, pay or sign for the user.** Prepare everything; stop before the irreversible step.
- **Legal text is a draft.** You may draft privacy policy, terms and refund text from the product facts, but say plainly that it needs the owner's review. Never invent company details, addresses or registrations.
- **Never write secrets** into files, logs or assets. `build.secrets-repo` failures are fixed by rotating the key, not only deleting the line.
- **Marks are claims.** `done` means you or the user verified it; put the evidence in `--note`.
- Use the product's own name, tagline and description from the profile for all copy; keep to the character limits in `references/store-specs.md`.

## Files

- `references/workflow.md`: details on profiling, monorepos, state files, CI gating, re-runs.
- `references/commands.md`: every CLI command and option.
- `references/assets.md`: master icon rules, capture, placement per platform, promo copy.
- `references/mockups.md`: 2D mockup and screenshot composition guidelines.
- `references/mockups-3d.md`: three.js mockups, motion design, render pipeline, GLB model contract.
- `references/store-specs.md`: generated size and limit tables. `references/checklists/`: generated checklists.
- `templates/3d/device-scene.html`, `templates/promo/tile.html`: editable render templates.
- `assets/3d/models/`: bundled GLB device models (none yet) and their contract.
