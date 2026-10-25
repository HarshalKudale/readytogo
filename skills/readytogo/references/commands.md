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

### `frame <screenshot> --frame phone|tablet|browser|window|laptop [--size landscape|og|square|hero|none|WxH] [--bg "<color>|grad:#a,#b,135|transparent"] [--url example.com] [--dark] [--color #hex] [--out file]`
Puts the screenshot in a device frame on a canvas with a soft shadow. Sizes: `landscape` 1600×1200, `og` 1200×630, `square` 1080², `hero` 1920×1080, `none` = the frame alone with transparency.

### `promo --target <id> --title "…" [--subtitle "…"] [--logo file] [--bg …] [--fg #fff] [--accent #hex] [--out file]`
Text-and-logo tile at a store's exact size (ids with `kind: graphic` in `specs`, e.g. `cws_small`, `cws_marquee`, `play_feature`, `ms_*`, `ph_thumb`, `og`, `x_card`, `github_social`). Text is fitted to the box. Uses system fonts; for brand fonts or screenshots in the art use `templates/promo/tile.html`.

### `annotate <image> --box x,y,w,h [--box …] [--mode highlight|redact] [--color #ef4444] [--out file]`
Pixel coordinates. `redact` pixelates; `highlight` draws a rounded outline.

### `listing <fields.json>`
`{"gp_title":"…","gp_short":"…"}` → length vs limit per field (ids in `references/store-specs.md`). Exit 1 if any are over.

### `seo <page.html|https://url>`
Weighted on-page SEO score with fixes, plus the Open Graph and Twitter tags found.

## Rendering and 3D

### `scaffold <3d|promo> [--dir path] [--model name]`
Copies the template (and optionally bundled GLB models) into the project (default `.readytogo/mockups/<kind>/`) so you can edit it.

### `models`
Lists bundled GLB device models (none yet).

### `render <page.html[?query]> --size WxH --out file.png [--at seconds] [--transparent] [--scale 2] [--wait ms]`
Renders an HTML page in headless Chromium to a PNG. The page is served from `--root` (so `/shot.png` means `<root>/shot.png`); the skill's own templates are available under `/__skill/templates/…`.
Animated: `--duration 4 --fps 30 --video out.mp4|webm|gif` (or `--frames N --out dir`). Needs the page to expose `window.__seek(seconds)`. If `ffmpeg` is missing, frames are kept and the encode command is printed.
`--transparent` keeps alpha (use `.png` or `.webm`). A page may set `window.__ready = true` once assets are loaded; `render` waits for it.

### `doctor`
Node version, sharp, Playwright, ffmpeg.
