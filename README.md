# ReadyToGo

An agent skill and CLI that gets a product **ready to ship**. Point your coding agent at a repo; it works out which launch checks apply (web, iOS, Android, desktop, browser extension, CLI, library, API), fixes what it can, and generates the assets stores ask for: icons, favicons, store screenshots at exact pixel sizes, promo tiles, device mockups, and animated 3D (three.js) mockups.

- **158 checks in 20 checklists**, tag-filtered so a Chrome extension never sees App Store items.
- **27 automatic checks** that read the repo (secrets, icon size and alpha channel, manifest, SEO and Open Graph tags, privacy page, CI, crash reporting, target SDK …).
- **Deterministic asset tools** (no AI drawing): icon sets for App Store, Google Play, Chrome, Firefox, Edge, favicon, `.icns`, `.ico`; screenshot fitting; device frames; promo tiles; redaction; listing-text limits.
- **3D mockups**: a procedural phone, tablet, laptop and phone-pair scene with motion presets, rendered frame-exact to PNG, transparent WebM, MP4 or GIF. Bring your own GLB models.
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

The skill runs the CLI through `npx -y readytogo@latest …`, so there is nothing else to install. For HTML and 3D rendering add Playwright once per project:

```bash
npm i -D playwright && npx playwright install chromium
```

(`readytogo doctor` tells you what is missing. Video output also needs `ffmpeg`.)

## Use

Just ask your agent:

> Get this ready to ship. It goes on the App Store and Google Play.
> Make Chrome Web Store assets for this extension.
> Make a 6-second looping laptop hero video of our dashboard.

or run the CLI yourself:

```bash
npx readytogo scan --write                         # detect platform, stack, services
npx readytogo profile --add store:chrome_web_store,pricing:free --name "Acme" --tagline "Do more" --confirm
npx readytogo plan --open                          # only what applies, by phase
npx readytogo check                                # automatic checks
npx readytogo mark legal.privacy done --note "https://acme.com/privacy"
npx readytogo report                               # READYTOGO.md; exit 1 while blockers are open

npx readytogo icons logo.svg --for chrome_web_store
npx readytogo shot cap/*.png --target chrome       # 1280×800 store screenshots
npx readytogo frame cap/home.png --frame browser --url acme.com --size hero --bg "grad:#6366f1,#8b5cf6"
npx readytogo promo --target cws_small --title "Do more, faster" --logo logo.svg
npx readytogo render "/__skill/templates/3d/device-scene.html?device=laptop&screen=/cap/home.png&anim=open&capture=1" \
  --size 1920x1080 --duration 6 --fps 30 --video hero.mp4
```

Full command reference: [`skills/readytogo/references/commands.md`](skills/readytogo/references/commands.md).

## What's inside

```
skills/readytogo/
  SKILL.md                      the agent's entry point (workflow, rules, asset table)
  references/
    workflow.md  commands.md    how to profile, work a checklist, gate CI; every CLI option
    assets.md                   master icon, real-screenshot capture per platform, placement, listing copy
    mockups.md                  2D mockup and store-screenshot composition guidelines
    mockups-3d.md               three.js mockups: camera, lighting, motion design, render pipeline, GLB contract
    store-specs.md              generated pixel sizes and character limits
    checklists/*.md             generated: one file per checklist
  templates/3d/device-scene.html    deterministic three.js scene (window.__seek)
  templates/promo/tile.html         HTML/CSS promo tile
  assets/3d/models/                 drop-in GLB device models + contract (none bundled yet)
bin/ src/                       the CLI (Node 20+, sharp; Playwright optional)
data/                           the catalog: checklists + items, store specs, icon sets, tags, questions (JSON)
commands/                       Claude Code slash commands
scripts/build-references.mjs    data/*.json -> references/checklists/*.md and store-specs.md
```

## Keeping the catalog current

The catalog is plain JSON: `data/catalog.json` (checklists and items, each with `appliesTo` tag expressions, steps, priority, tool hints) and `data/specs.json` (store asset sizes and listing limits). Edit those, then run `npm run build:docs` to regenerate `references/checklists/*.md` and `references/store-specs.md`, and commit both. Do not hand-edit the generated Markdown. Each checklist carries a `lastVerified` date; stores change rules, so the agent is told to re-verify old ones against live docs. To add an automatic check, add a function keyed by item id in `src/checks.js`. Pull requests that fix a store requirement are the most valuable contribution.

## Develop

```bash
npm install
npm test                       # unit tests: plan, checks, icons, frames, promo, annotate
READYTOGO_E2E=1 npm test       # also renders the 3D template (needs Playwright + network for three.js)
```

## Limits (honest)

- Automatic checks read the repo; they cannot see your DNS, store consoles or hosted pages. Those stay open until a person confirms.
- Legal items are drafts and prompts, not legal advice.
- Store requirements change; sizes and limits here are as of each checklist's `lastVerified` date.
- Frames and 3D devices are generic, original designs, not any manufacturer's.
- Text in `promo` tiles uses system fonts; use the HTML template for brand fonts.

MIT licensed.
