# CLI reference

All commands accept `--root <dir>` (the project; default: current directory). Output paths without `--out` go to `<root>/.readytogo/assets/…`. Paths you pass (inputs and `--out`) resolve against the current directory.
Exit codes: `0` ok · `1` a check/limit/report failed · `2` bad usage or error (message on stderr, starts with `error:`).

## Readiness

### `scan [--write] [--json]`
Reads the repo. Prints tags, the evidence for each, product facts (name, description), tags that are only **assumed**, and the questions only the user can answer. `--write` saves `.readytogo/profile.json` (keeps earlier confirmations).

### `profile [--add t,t] [--remove t,t] [--name s] [--tagline s] [--confirm] [--tags]`
Show or edit the profile. Unknown tags are rejected. `--tags` lists every valid tag with a description. `--confirm` marks the profile as user-confirmed.

### `plan [--open] [--priority blocker|recommended|nice] [--checklist slug] [--json]`
Which checklists and items apply, with status. Markers: `[ ]` open · `[!]` failing · `[v]` verified by a check · `[x]` done · `[-]` skipped / not applicable. `--json` gives full items (steps, why, tools).

### `check [--only id,id]`
Runs automatic checks for the items in the plan and saves `.readytogo/checks.json`. Each result is `PASS`, `FAIL` or `????` (needs your judgement). Which items have one is shown in the checklist file (`Auto-check`).

### `mark <item-id> <done|skipped|na|open> [--note "evidence"]`
Records a manual decision in `.readytogo/state.json`. `open` removes the mark.

### `report [--out READYTOGO.md] [--no-fail]`
Writes the Markdown report. Exits 1 if blockers are open unless `--no-fail`.

## Assets

### `specs [--store <store>] [--json]`
Asset ids with pixel sizes, required/optional and counts. `--store` filters by store tag name (`chrome_web_store`, `play_store`, `app_store`, `mac_app_store`, `microsoft_store`, `edge_addons`, `firefox_addons`, …) or an id.

### `icons <src.png|svg> --for <set> [--out dir] [--bg #hex] [--padding 0.1] [--round] [--mac-grid] [--name "App"]`
Sets: `app_store`, `play_store`, `chrome_web_store`, `firefox_addons`, `edge_addons`, `favicon`, `icns`, `ico`.
- `--bg` fills transparency (also used behind the App Store icon, which must have no alpha; default white).
- `--padding 0.1` shrinks the art 10% each side (safe zone for logos that touch the edge).
- `--round` applies a rounded-square mask (Android legacy / marketing tiles). `--mac-grid` fits the macOS icon grid (824px art in a 1024 canvas, rounded).
- `favicon` also writes `site.webmanifest` and prints the `<head>` snippet.
Warns when the source is not square or smaller than the largest output.

### `shot <screenshot...> --target <id> [--fit cover|contain] [--bg #hex] [--out dir]`
Resizes/crops each screenshot to the exact store size, opaque PNG, numbered `<id>-01.png`…. `cover` crops (anchored to the top), `contain` pads with `--bg`. Warns when cropping would remove more than 15% or the input is much smaller than the target.

### `verify <image...> --target <id|WxH>`
Does each file meet the store spec? Checks exact pixels, format (PNG/JPEG), alpha channel (stores reject it) and size (~8 MB cap). Exit 1 on any problem. Run it on everything you are about to upload, including images you made by hand.

### `video <in> [--out file.webm|mp4|gif] [--width 1280] [--fps 30] [--start s] [--duration s] [--crf n] [--transparent]`
Without `--out`, prints the probe (codec, size, fps, duration). With `--out`, converts with sane flags for the target format (mp4 = H.264 yuv420p faststart, webm = VP9, gif = palette). Needs `ffmpeg`.

### `annotate <image> --box x,y,w,h [--box …] [--mode highlight|redact] [--color #ef4444] [--out file]`
Pixel coordinates. `redact` pixelates; `highlight` draws a rounded outline.

### `listing <fields.json>`
`{"gp_title":"…","gp_short":"…"}` → length vs limit per field (ids in `references/store-specs.md`). Exit 1 if any are over.

### `seo <page.html|https://url> [--allow-local]`
Weighted on-page SEO score with fixes, plus the Open Graph and Twitter tags found.

### `links <page.html|https://url> [--no-check] [--limit 150] [--url base] [--allow-local] [--json]`
Lists the links on a page and checks each: broken, redirecting, unsafe `target=_blank`, mixed content. For a local file pass `--url https://yoursite.com/page` so relative links resolve. Exit 1 if any is an error. Private and loopback addresses are refused unless `--allow-local`.

### `backlinks <export.csv|urls.txt> --target example.com [--verify] [--limit 100] [--json]`
Reads a Search Console, Ahrefs, Semrush or Moz export (or a plain URL list). Reports referring domains, TLD and anchor mix, concentration, and domains that look risky (heuristic). `--verify` fetches the referring pages and says which still link to you and which are nofollow/sponsored/ugc/noindex.

### `deadcode [dir] [--lang ts,py] [--ignore glob,glob] [--min high|medium|low] [--max 200] [--strict] [--json]`
Unused functions, classes, imports and files, found with tree-sitter. Name-based and conservative; confirm `low` and `medium` before deleting (dynamic access, reflection and framework conventions are invisible). Needs `readytogo setup deadcode`.

## Setup

### `setup [deadcode] [render] [--update]`
Downloads the external tools into `~/.readytogo/tools` (override with `READYTOGO_HOME`): `deadcode` = web-tree-sitter + grammars (~55 MB), `render` = Playwright + Chromium (~250 MB). They are never bundled, so they stay current; `--update` refreshes. With no group, installs both. Ask the user before running it (it downloads).

## Mockup base assets and rendering

Mockups are designed by you, from guidelines, not generated by a command. These commands only give you the parts. See `references/mockups.md` and `references/mockups-3d.md`.

### `scaffold <3d|frames|promo> [--dir path] [--model id]`
Copies the starter into the project (default `.readytogo/mockups/<kind>/`) so you can edit it. `3d` = the scene stage and director examples; `frames` = OS window frames and `compose.html`; `promo` = the tile template. `--model` (repeatable, `3d` only) also copies bundled GLB models.

### `models`
Lists the bundled 3D phone and laptop models with their screen aspect.

### `render <page.html[?query]> --size WxH --out file.png [--at seconds] [--transparent] [--scale 2] [--wait ms]`
Renders an HTML page in headless Chromium. The page is served from `--root` (so `/shot.png` means `<root>/shot.png`); the skill's own files are under `/__skill/…` (e.g. `/__skill/assets/frames/compose.html`, `/__skill/templates/3d/scene.html`). Needs `readytogo setup render`.
Animated: `--video out.mp4|webm|gif` (or `--frames N --out dir`). The page must expose `window.__seek(seconds)`. Scene pages declare their own `window.__duration` and `window.__fps`, so `--duration` and `--fps` are optional for them. If `ffmpeg` is missing, frames are kept and the encode command is printed.
`--transparent` keeps alpha (use `.png` or `.webm`). A page may set `window.__ready = true` once assets are loaded; `render` waits for it.

### `doctor`
Node version, sharp, the setup tools (tree-sitter, Playwright), ffmpeg.
