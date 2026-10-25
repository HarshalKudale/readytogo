# Tools and guidelines

**The rule:** static work repeated across projects is a **tool** (the `readytogo` CLI: deterministic converters, resizers, analysers). Dynamic, per-product work (mockups, promo art, 3D shots, camera moves, copy) is a **guideline plus shipped assets**: you author it, no command designs anything for you.

## Tools

| Need | Command |
|---|---|
| App icons for a store or OS (App Store, Play, Chrome, Firefox, Edge, favicon, icns, ico) | `readytogo icons <master.png\|svg> --for <set>` |
| Fit a screenshot to a store's exact pixels | `readytogo shot <file...> --target <id>` (ids: `readytogo specs --store <store>`) |
| Does this file meet the store spec? (size, format, alpha, bytes) | `readytogo verify <file...> --target <id\|WxH>` |
| Convert, trim or probe a screen recording | `readytogo video <in> --out <file>` |
| Hide secrets or PII, or highlight a region | `readytogo annotate <img> --box x,y,w,h --mode redact\|highlight` |
| Store listing text within character limits | `readytogo listing fields.json` |
| Which domains look free | `readytogo domains <name...> [--tlds com,io]` |
| On-page SEO score and link-preview tags | `readytogo seo <page.html\|url>` |
| Broken, redirecting or unsafe links on a page | `readytogo links <page.html\|url>` |
| Who links to you, and do they still? | `readytogo backlinks <export> --target yoursite.com --verify` |
| Unused imports, locals, unreachable code, unreferenced declarations and files | `readytogo deadcode [dir]` |
| HTML or 3D page to PNG, WebM, MP4 or GIF at an exact size | `readytogo render <page> --size WxH --out …` |

Outputs go to `.readytogo/assets/…` unless you pass `--out`. Do not overwrite existing user assets without asking.

## Guidelines (author these; the assets are provided)

| Goal | Read | Start from |
|---|---|---|
| Where do the screenshots and recordings come from? | `capture.md` | |
| 2D mockups, store screenshot sets, promo tiles, OG and social images | `mockups.md` | `assets/frames/` (7 OS frames, light/dark, `compose.html`), `templates/promo/` |
| 3D phone and laptop shots, camera moves, video on the screen | `mockups-3d.md` | `assets/3d/models/` (4 phones, 3 laptops), `templates/3d/scene.html` + `examples/` |
| Icon master, placement per platform, listing copy | `assets.md` | |

### Always ask before making mockups

Ask once, in one message:
1. **Media source:** "Do you have screenshots or screen recordings I should use, or should I capture fresh ones (Playwright for web and extensions, simulator or emulator for mobile, OS capture for desktop)?" If they have files, ask for the paths. If fresh, confirm what to show (flows, account state, theme, language) and that it is safe to run the app with demo data.
2. **Surface and style:** where it is used (store listing, landing hero, Product Hunt, social), still or video, light or dark, brand colours.

Do not capture the user's real data, sign in with their accounts, or run their app without their go-ahead.

## One-time setup (ask first, say the size)

External tools are downloaded on demand, never bundled. `readytogo doctor` shows what is missing.

| Command | Installs | Needed for |
|---|---|---|
| `readytogo setup render` | Playwright + Chromium (~250 MB) into `~/.readytogo/tools` | `render`, frames, 3D scenes, capturing screenshots |
| `readytogo setup deadcode` | tree-sitter + grammars (~55 MB) | `deadcode` |
| ffmpeg (install yourself: `brew`, `winget`, `apt install ffmpeg`) | | `video`, MP4 and GIF output |

`readytogo setup --update` refreshes them.
