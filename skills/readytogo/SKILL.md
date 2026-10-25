---
name: readytogo
description: Get a product from side project to ship-ready, one area at a time or all of it. Analyses what is not ready (SEO, packaging and bundle size, documentation, brand, domain and email, legal, quality, store assets and mockups, store submissions, launch), saves a before-snapshot, asks the user how they want to proceed, then fixes on a safe git branch and shows what changed. Includes exact-size store icons and screenshots, link and backlink audits, unused-code analysis, domain lookups, and guided 2D and 3D product mockups. Use when the user says ship, launch, release, publish, "ready to ship", "is this ready", SEO, "source maps", "bundle size", "optimize the build", README or docs, App Store, Google Play, Chrome Web Store, Firefox, Edge, Microsoft Store, Product Hunt, "store assets", "app icon", favicon, screenshots, mockup, "product video", backlinks, "dead code" or "available domain".
---

# ReadyToGo

Takes a product from "works on my machine" to "ready to ship": it **analyses** an area, **reports** what is not ready, **asks** the user how to proceed, **works on a branch** so the code stays safe, and **shows what changed**.

Run the CLI as `npx -y readytogo@latest <command>` (written `readytogo`; alias `rtg`). In a Claude Code plugin install: `node "${CLAUDE_PLUGIN_ROOT}/bin/readytogo.js"`. Needs Node 20+.

## Do only what was asked (saves tokens)

Work on the **areas** the user named; ignore the rest. `readytogo areas` lists them; each has its own slash command (`/readytogo:seo`, `:packaging`, `:docs`, `:brand`, `:domain`, `:legal`, `:quality`, `:assets`, `:mockup`, `:stores`, `:launch`) and `/readytogo:ship` does all of them.

| Area | Covers |
|---|---|
| `seo` | titles, meta, Open Graph, sitemap, structured data, broken links, backlinks |
| `packaging` | source maps, minify, bundle size, images, dependencies, installers, release hygiene |
| `docs` | README and quickstart, API reference, env docs, security policy, support page |
| `brand` | name, logo, icon master, favicon, tagline |
| `domain` | domain, HTTPS, DNS, email deliverability |
| `legal` | privacy, terms, consent, regional law, payments and tax |
| `quality` | CI, tests, crash reporting, analytics, uptime |
| `assets` | icons, screenshots, promo art, 2D and 3D mockups, demo video |
| `stores` | App Store, Google Play, extension stores, Microsoft Store, desktop signing, registries |
| `launch` | launch sites, communities, reviews, second wave |

**Load only the requested area:** read `references/areas/<area>.md` (it links the few checklists and tools that area uses). Pass `--area <a,b>` to `analyze`, `plan`, `check`, `report`, `diff`. Never scan or read other areas' checklists. Reading a checklist file is only for items `analyze` showed as open.

## The loop

1. **Analyse.** `readytogo analyze --area <area>` (or no `--area` for everything). It profiles the repo if needed, runs that area's automatic checks, **saves the "before" snapshot** (`.readytogo/baseline.json`, kept until `--rebaseline`), and prints what is not ready (blockers first) plus the decisions to ask the user. It changes no project file.
2. **Confirm the profile if it says so.** Stores, pricing, data collected, regions and AI use cannot be read from code. Ask once, in one batch (options in `data/questions.json`), then `readytogo profile --add tag,tag --name "…" --tagline "…" --confirm`.
3. **Ask the user** the listed decisions in **one message**: which items to do, how (e.g. "remove source maps or upload them to your error tracker?", "should I look for free domains?", "your screenshots or capture fresh?"), and what they will handle themselves. Wait for the answers. Do not start fixing before they answer.
4. **Branch.** `readytogo branch --area <area>` creates `readytogo/<area>-<date>` from the current commit. It refuses if there are uncommitted changes: ask the user to commit or stash (or pass `--allow-dirty` if they say so). No git repo: ask them to `git init` and commit first. **All changes happen on that branch.** Commit small, one concern per commit. Never push, merge, publish, pay or submit.
5. **Fix** only what was approved, from the item's steps (`references/checklists/<slug>.md`). Use tools for exact work and the guidelines for designed work (`references/tools.md`). Items without a check: verify, then `readytogo mark <id> done --note "evidence"`.
6. **Re-check and compare.** `readytogo check --area <area>`, then `readytogo diff --area <area>`: before vs now per area, items that moved or regressed, commits and files changed. `readytogo report --area <area>` writes `READYTOGO.md` with the same before/after.
7. **Hand back.** Finish with: fixed (with the diff summary), still open, and what only the user can do (accounts, payments, legal sign-off, DNS, store submission) with exact steps. Tell them the branch name so they can review, merge or delete it.

## Rules

- **Safe by default:** analysis is read-only; changes only on the readytogo branch; destructive or irreversible steps (deleting code, replacing user assets, rotating keys, publishing) need an explicit yes.
- **Screenshots show the real product.** Never draw UI that does not exist or claim features the product lacks. Seed demo data; redact personal data. Before mockups, always ask: use the user's media or capture fresh (`references/capture.md`).
- **Store rules drift.** Each checklist has a `Last verified` date; if older than ~90 days, or the item is high-stakes (privacy label, data safety, signing), confirm against the store's live docs first.
- **Legal text is a draft** that needs the owner's review. Never invent company details.
- **Never write secrets** into files, logs or assets. `build.secrets-repo` failures are fixed by rotating the key.
- **Analysers advise, you decide.** `deadcode`, `backlinks` and `domains` are heuristics: confirm before deleting code, disavowing links or telling the user a domain is free.
- **Marks are claims.** `done` means verified; put the evidence in `--note`.
- Use the profile's name, tagline and description for all copy; keep to the limits in `references/store-specs.md`.

## Files

`references/areas/<area>.md` (start here) · `references/tools.md` (every tool, mockup guidelines, setup) · `references/commands.md` (every CLI option) · `references/workflow.md` (state, baseline, branches, monorepos, CI) · `capture.md`, `mockups.md`, `mockups-3d.md`, `assets.md`, `store-specs.md` · `checklists/` (generated from `data/*.json`).
`assets/frames/` OS frames · `assets/3d/models/` device models · `templates/3d/` director-driven scene · `templates/promo/` promo starter · `templates/capture/` Playwright capture scripts.
