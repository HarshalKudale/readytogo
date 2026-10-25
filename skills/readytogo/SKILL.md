---
name: readytogo
description: Get a product ready to ship. Audits a repo for launch readiness, works out which checks apply (web, iOS, Android, desktop, browser extension, CLI, library, API), fixes what it can, and produces what a launch needs: exact-size store icons, favicons and screenshots, SEO, link and backlink audits, unused-code analysis, plus guided 2D and 3D product mockups from shipped OS frames, phone and laptop models and a camera-directed scene. Use when the user says ship, launch, release, publish, "submit to App Store / Google Play / Chrome Web Store / Firefox / Edge / Microsoft Store", Product Hunt, "launch checklist", "store assets", "app icon", "favicon", "screenshots", "mockup", "product video", "backlinks", "dead code", or "is this ready to launch".
---

# ReadyToGo

Turn "is this ready to ship?" into a verified list, and produce the assets a launch needs.

**The rule that organises everything here:**
- **Static and repeated across projects → a tool** (the `readytogo` CLI). Deterministic converters, resizers and analysers: same input, same output, no creativity.
- **Dynamic and customised per product → a guideline plus shipped assets.** Mockups, promo art, 3D shots, camera moves and copy are *yours to author* from the frames, models, templates and guidelines in this skill. No tool designs anything for you, so results are never the same stock output.

Run the CLI as `npx -y readytogo@latest <command>` (written `readytogo`; alias `rtg`). In a Claude Code plugin install: `node "${CLAUDE_PLUGIN_ROOT}/bin/readytogo.js"`. Needs Node 20+.

## One-time setup (ask first)

External tools are **downloaded on demand, never bundled**, so they stay current. `readytogo doctor` shows what is missing. Ask the user before downloading; say what and how big:

| Command | Installs | Needed for |
|---|---|---|
| `readytogo setup render` | Playwright + Chromium (~250 MB) into `~/.readytogo/tools` | `render`, frames, 3D scenes, capturing screenshots |
| `readytogo setup deadcode` | tree-sitter + grammars (~55 MB) | `deadcode` |
| ffmpeg (install yourself: `brew`/`winget`/`apt install ffmpeg`) | – | `video`, MP4/GIF output |

`readytogo setup --update` refreshes them to current versions.

## Workflow

1. **Profile the product.** `readytogo scan --write` reads the repo and proposes tags (platform, framework, hosting, services). It lists *assumed* tags and questions only the user can answer (`stores, monetization, data, regions, ai, have, goal`). Answer what you can from README and config; **ask the user once, in one batch**, for the rest (options in `data/questions.json`). Record with `readytogo profile --add tag,tag --name "…" --tagline "…" --confirm`.
2. **Plan.** `readytogo plan --open` lists only the checklists and items that apply. Read `references/checklists/<slug>.md` for the ones you will work on (index: `references/checklists.md`).
3. **Check and fix.** `readytogo check` runs the automatic checks and saves results. Fix what is fixable in code, config and content; re-run. For items without a check, verify from the item's steps and `readytogo mark <id> done --note "evidence"`.
4. **Analyse** where the plan says so: `seo`, `links`, `backlinks`, `deadcode` (below).
5. **Produce assets.** Icons, screenshots and listing text with tools; mockups and promo art by authoring them (below).
6. **Hand the rest to the human.** Accounts, payments, legal sign-off, DNS, store submission cannot be done by you. List each with exact steps. Do not mark them done without confirmation or real evidence.
7. **Report.** `readytogo report` writes `READYTOGO.md` and exits non-zero while blockers are open. End with: blockers still open, what you changed, what only the user can do.

## Tools (converters, resizers, analysers)

| Need | Command |
|---|---|
| App icons for a store or OS (App Store, Play, Chrome, Firefox, Edge, favicon, icns, ico) | `readytogo icons <master.png\|svg> --for <set>` |
| Fit a screenshot to a store's exact pixels | `readytogo shot <file...> --target <id>` (ids: `readytogo specs --store <store>`) |
| Does this file meet the store spec? (size, format, alpha, bytes) | `readytogo verify <file...> --target <id\|WxH>` |
| Convert/trim/probe a screen recording (MP4 → WebM, GIF) | `readytogo video <in> --out <file>` |
| Hide secrets/PII or highlight a region of a screenshot | `readytogo annotate <img> --box x,y,w,h --mode redact\|highlight` |
| Store listing text within character limits | `readytogo listing fields.json` |
| On-page SEO score and link-preview tags | `readytogo seo <page.html\|url>` |
| Broken, redirecting or unsafe links on a page | `readytogo links <page.html\|url>` |
| Who links to you, and do they still? (Search Console / SEO-tool export or URL list) | `readytogo backlinks <export> --target yoursite.com --verify` |
| Unused imports, locals, unreachable code, unreferenced declarations and files | `readytogo deadcode [dir]` |
| HTML/3D page → PNG, WebM, MP4 or GIF at exact size | `readytogo render <page> --size WxH --out …` |

Outputs go to `.readytogo/assets/…` unless you pass `--out`. Do not overwrite existing user assets without asking.

## Guidelines (author these; assets are provided)

| Goal | Read | Assets you start from |
|---|---|---|
| **Where do the screenshots / recordings come from?** | `references/capture.md` | – |
| 2D mockups: screenshot in a macOS, Windows or Linux browser or app window; store screenshot sets; promo tiles; OG and social images | `references/mockups.md` | `assets/frames/` (7 OS frames, light/dark, `compose.html`), `templates/promo/` |
| 3D: phone and laptop shots with camera moves, video on the screen, backgrounds | `references/mockups-3d.md` | `assets/3d/models/` (4 phones, 3 laptops), `templates/3d/scene.html` + `examples/` |
| Icon master, capture, placement per platform, listing copy | `references/assets.md` | – |

### Always ask before making mockups

Before any mockup or promo asset, ask the user (in one message):
1. **Media source:** "Do you have screenshots or screen recordings I should use, or should I capture fresh ones (Playwright for web and extensions, simulator/emulator for mobile, OS capture for desktop)?" If they have files, ask for the paths. If fresh, confirm what to show (flows, account state, theme, language) and that it is safe to run the app and use demo data.
2. **Surface and style:** where it will be used (store listing, landing hero, Product Hunt, social), still or video, light/dark, brand colours.

Do not capture the user's real data, sign in with their accounts, or run their app without their go-ahead.

## Rules

- **Screenshots show the real product.** Never draw UI that does not exist or claim features the product lacks. Seed demo data; redact personal data.
- **Store rules drift.** Each checklist has a `Last verified` date; if older than ~90 days, or the item is high-stakes (privacy label, data safety, signing), confirm against the store's live documentation first.
- **Do not submit, publish, pay or sign for the user.** Prepare everything; stop before the irreversible step.
- **Legal text is a draft** that needs the owner's review. Never invent company details.
- **Never write secrets** into files, logs or assets. `build.secrets-repo` failures are fixed by rotating the key.
- **Analysers advise, you decide.** `deadcode` and `backlinks` are heuristics: confirm before deleting code or disavowing links.
- **Marks are claims.** `done` means verified; put the evidence in `--note`.
- Use the profile's name, tagline and description for all copy; keep to the limits in `references/store-specs.md`.

## Files

`references/`: `workflow.md` (state, monorepos, CI), `commands.md` (every command), `capture.md`, `assets.md`, `mockups.md`, `mockups-3d.md`, `store-specs.md` and `checklists/` (generated from `data/*.json`).
`assets/frames/` OS frames · `assets/3d/models/` device models · `templates/3d/` director-driven scene + examples · `templates/promo/` HTML promo starter.
