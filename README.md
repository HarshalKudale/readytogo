# ReadyToGo

An agent skill and CLI that gets a product **ready to ship**. Point your coding agent at a repo; it works out which launch checks apply (web, iOS, Android, desktop, browser extension, CLI, library, API), fixes what it can, and generates the assets stores ask for: icons, favicons, store screenshots at exact pixel sizes, promo tiles, device mockups, and animated 3D (three.js) mockups.

- **180 checks in 22 checklists, grouped into 10 areas**, tag-filtered so a Chrome extension never sees App Store items.
- **36 automatic checks** that read the repo (secrets, icon size and alpha channel, manifest, SEO and Open Graph tags, privacy page, CI, crash reporting, target SDK …).
- **Tools** for static, repeated work (exact and deterministic, no AI drawing): icon sets for every store, screenshot fitting, spec `verify`, video convert, redaction, listing-text limits, SEO score, broken-link audit, backlink analysis, dead-code finder.
- **Guidelines plus shipped assets** for anything that must be designed per product: OS window frames, seven generic 3D phone and laptop models, a director-driven three.js scene (camera moves, video on screens), promo and capture templates. The agent composes; it asks you first whether to use your screenshots or capture fresh.
- The agent supplies judgement; the CLI supplies exactness and memory (`.readytogo/` in the repo).

## Install

Pick one.

**Claude Code plugin** (skill + slash commands `/readytogo:ship`, `/readytogo:assets`, `/readytogo:mockup`):

```
/plugin marketplace add HarshalKudale/readytogo
/plugin install readytogo@readytogo
```

**Any agent that reads `SKILL.md`** (Claude Code, Codex, Cursor, Copilot, …):

```bash
npx skills add HarshalKudale/readytogo
```

**Manual**: copy `skills/readytogo/` into your agent's skills folder (for Claude Code: `~/.claude/skills/readytogo/` or `<project>/.claude/skills/readytogo/`).

The skill runs the CLI through `npx -y readytogo@latest …`. Heavy external tools are never bundled (so they cannot go stale); download them once, on demand, into `~/.readytogo/tools`:

```bash
npx readytogo setup render     # Playwright + Chromium: render, frames, 3D, fresh screenshots (~250 MB)
npx readytogo setup deadcode   # tree-sitter + grammars, for deadcode (~55 MB)
```

`readytogo doctor` tells you what is missing. The video tool also needs `ffmpeg`.

## How it works

Every launch concern is an **area** (`seo`, `packaging`, `docs`, `brand`, `domain`, `legal`, `quality`, `assets`, `stores`, `launch`), and each area is a checklist the project goes through. Run one area or all of them:

```
/readytogo:ship                 # everything
/readytogo:seo                  # only SEO: nothing else is scanned or read
/readytogo:packaging            # source maps, bundle size, images, dependencies, installers
/readytogo:docs  /readytogo:stores  /readytogo:brand  /readytogo:domain  /readytogo:legal  /readytogo:quality  /readytogo:launch
/readytogo:assets  /readytogo:mockup
```

1. **Analyse** (read-only): finds what is not ready, saves a **before** snapshot, writes the report.
2. **Ask**: you get the decisions ("remove source maps or upload them to Sentry?", "look for free domains?", "your screenshots or capture fresh?").
3. **Work on a branch**: `readytogo/<area>-<date>`, small commits, nothing pushed or merged, so your code stays safe.
4. **Compare**: `readytogo diff` shows before vs now and every file the agent touched.

## Use

Just ask your agent:

> Make the SEO of this project ready to ship.
> Shrink the production bundle and check for source maps.
> Get this ready to ship. It goes on the App Store and Google Play.
> Make a 6-second looping laptop hero video of our dashboard.

or run the CLI yourself:

```bash
npx readytogo analyze --area seo,packaging         # what is not ready, before-snapshot, decisions
npx readytogo branch --area seo,packaging          # safe work branch
npx readytogo check --area seo,packaging
npx readytogo diff                                  # before vs now, commits, files
npx readytogo report --area seo,packaging           # READYTOGO.md with before/after; exit 1 while blockers are open

npx readytogo profile --add store:chrome_web_store,pricing:free --name "Acme" --tagline "Do more" --confirm
npx readytogo domains acme acmeapp --tlds com,dev,app
npx readytogo mark legal.privacy done --note "https://acme.com/privacy"

npx readytogo icons logo.svg --for chrome_web_store
npx readytogo shot cap/*.png --target chrome       # 1280×800 store screenshots
npx readytogo verify out/*.png --target chrome     # does each file meet the store spec?
npx readytogo links https://acme.com               # broken or unsafe links
npx readytogo backlinks export.csv --target acme.com --verify
npx readytogo deadcode src                         # unused code

# mockups: start from the shipped parts, edit, render
npx readytogo scaffold 3d --model laptop-notch
npx readytogo render ".readytogo/mockups/3d/scene.html?config=./director.js" --size 1920x1080 --video hero.mp4
```

Full command reference: [`skills/readytogo/references/commands.md`](skills/readytogo/references/commands.md).

## What's inside

```
skills/readytogo/
  SKILL.md                      the agent's entry point (workflow, rules, tool vs guideline)
  references/
    areas/<area>.md             start here: one file per area, links only what that area needs
    tools.md                    every tool, mockup guidelines, setup
    workflow.md  commands.md    how to profile, work a checklist, gate CI; every CLI option
    assets.md  capture.md       master icon, placement, listing copy; capturing real screenshots per platform
    mockups.md  mockups-3d.md   composition guidelines for 2D and three.js mockups, motion, GLB contract
    store-specs.md              generated pixel sizes and character limits
    checklists/*.md             generated: one file per checklist
  assets/frames/                OS browser and app window frames (HTML + CSS) and compose.html
  assets/3d/models/             generic GLB phone and laptop models + contract
  templates/3d/                 scene.html stage + director examples
  templates/promo/  capture/    promo tile; Playwright capture scripts
bin/ src/                       the CLI (Node 20+, sharp)
data/                           the catalog: checklists, items, store specs, icon sets, tags, questions (JSON)
commands/                       Claude Code slash commands
scripts/                        build-references.mjs (data -> docs), build-models.mjs (GLB generator)
```

## Keeping the catalog current

The catalog is plain JSON: `data/catalog.json` (checklists and items, each with `appliesTo` tag expressions, steps, priority, tool hints) and `data/specs.json` (store asset sizes and listing limits). Edit those, then run `npm run build:docs` to regenerate `references/checklists/*.md` and `references/store-specs.md`, and commit both. Do not hand-edit the generated Markdown. Each checklist carries a `lastVerified` date; stores change rules, so the agent is told to re-verify old ones against live docs. To add an automatic check, add a function keyed by item id in `src/checks.js`. Pull requests that fix a store requirement are the most valuable contribution.

## Develop

```bash
npm install
npm test                       # plan, checks, icons, verify, models, links, backlinks, deadcode, video
READYTOGO_E2E=1 npm test       # also renders the 3D scene and frames (needs `readytogo setup render` + network for three.js)
```

## Limits (honest)

- Automatic checks read the repo; they cannot see your DNS, store consoles or hosted pages. Those stay open until a person confirms.
- Legal items are drafts and prompts, not legal advice.
- Store requirements change; sizes and limits here are as of each checklist's `lastVerified` date.
- Frames and 3D devices are generic, original designs, not any manufacturer's.
- `deadcode` and the `backlinks` risk flags are heuristics; confirm before deleting or disavowing.

MIT licensed.
