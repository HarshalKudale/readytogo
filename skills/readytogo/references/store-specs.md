# Store asset specs

Generated from `data/specs.json`. Stores change these; if `Last verified` on the relevant checklist is old, confirm against the store's live docs before generating in bulk.

Use the id with `readytogo shot --target <id>` (screenshots) or `readytogo promo --target <id>` (graphics).

| id | type | store | label | size | status | count | note |
|---|---|---|---|---|---|---|---|
| `app_store` | screenshot | app_store | iPhone 6.9" screenshot | 1320×2868 | **required** | up to 10 | 1 to 10 images |
| `ipad` | screenshot | app_store | iPad 13" screenshot | 2064×2752 | optional | up to 10 | Required for apps that run on iPad |
| `play_phone` | screenshot | play_store | Phone screenshot | 1080×1920 | **required** | up to 8 | 2 to 8 images |
| `play_tablet7` | screenshot | play_store | 7" tablet screenshot | 1200×1920 | optional | up to 8 | Optional, up to 8 |
| `play_tablet` | screenshot | play_store | 10" tablet screenshot | 1600×2560 | optional | up to 8 | Optional, up to 8 |
| `chrome` | screenshot | chrome_web_store | Screenshot | 1280×800 | **required** | up to 5 | 1 to 5 images |
| `firefox` | screenshot | firefox_addons | Screenshot | 1280×800 | optional | up to 10 | Optional but recommended |
| `edge` | screenshot | edge_addons | Screenshot | 1280×800 | **required** | up to 10 | 1 to 10 images |
| `mac_app_store` | screenshot | mac_app_store | Mac screenshot | 2880×1800 | **required** | up to 10 | 1 to 10 images |
| `ms_store` | screenshot | microsoft_store | Screenshot | 1920×1080 | **required** | up to 10 | At least 1 image |
| `product_hunt` | screenshot | any | Gallery image | 1270×760 | optional | up to 8 | Shown on your launch page |
| `cws_small` | graphic | chrome_web_store | Small promo tile | 440×280 | **required** | 1 | Required |
| `cws_marquee` | graphic | chrome_web_store | Marquee promo tile | 1400×560 | optional | 1 | Optional, needed to be featured |
| `edge_logo` | graphic | edge_addons | Store logo | 300×300 | **required** | 1 | Required |
| `edge_small` | graphic | edge_addons | Small promo tile | 440×280 | optional | 1 | Optional |
| `edge_large` | graphic | edge_addons | Large promo tile | 1400×560 | optional | 1 | Optional |
| `play_feature` | graphic | play_store | Feature graphic | 1024×500 | **required** | 1 | Required |
| `ms_logo` | graphic | microsoft_store | Store logo 1:1 | 300×300 | **required** | 1 | Required |
| `ms_poster` | graphic | microsoft_store | Poster art 2:3 | 720×1080 | optional | 1 | Recommended |
| `ms_box` | graphic | microsoft_store | Box art 1:1 | 1080×1080 | optional | 1 | Recommended |
| `ms_hero` | graphic | microsoft_store | Hero art 16:9 | 1920×1080 | optional | 1 | Optional |
| `ms_promo` | graphic | microsoft_store | Promotional image | 2400×1200 | optional | 1 | Optional |
| `ph_thumb` | graphic | any | Thumbnail | 240×240 | **required** | 1 | Next to your name on the list |
| `og` | graphic | website | Open Graph image | 1200×630 | **required** | 1 | Link previews on most platforms |
| `github_social` | graphic | github | Social preview | 1280×640 | optional | 1 | Repo link cards |
| `x_card` | graphic | any | X post card | 1200×628 | optional | 1 | Large link card on X |
| `linkedin_card` | graphic | any | LinkedIn post image | 1200×627 | optional | 1 | Link and image posts |
| `x_header` | graphic | any | X header | 1500×500 | optional | 1 | Profile banner |
| `linkedin_banner` | graphic | any | LinkedIn banner | 1584×396 | optional | 1 | Page banner |
| `yt_thumb` | graphic | any | YouTube thumbnail | 1280×720 | optional | 1 | Under 2 MB |

## Icon sets (`readytogo icons <src> --for <key>`)

### `app_store` — Apple App Store

- 1024×1024 → `ios/AppStore-1024.png` (no alpha channel)
- 180×180 → `ios/Icon-60@3x.png`
- 120×120 → `ios/Icon-60@2x.png`
- 167×167 → `ios/Icon-83.5@2x.png`
- 152×152 → `ios/Icon-76@2x.png`
- 87×87 → `ios/Icon-29@3x.png`
- 80×80 → `ios/Icon-40@2x.png`
- 58×58 → `ios/Icon-29@2x.png`
- 40×40 → `ios/Icon-20@2x.png`

### `play_store` — Google Play

- 512×512 → `android/play-store-512.png`
- 192×192 → `android/mipmap-xxxhdpi/ic_launcher.png`
- 144×144 → `android/mipmap-xxhdpi/ic_launcher.png`
- 96×96 → `android/mipmap-xhdpi/ic_launcher.png`
- 72×72 → `android/mipmap-hdpi/ic_launcher.png`
- 48×48 → `android/mipmap-mdpi/ic_launcher.png`

### `chrome_web_store` — Chrome Web Store

- 128×128 → `chrome/icon-128.png`
- 48×48 → `chrome/icon-48.png`
- 32×32 → `chrome/icon-32.png`
- 16×16 → `chrome/icon-16.png`

### `firefox_addons` — Firefox Add-ons

- 128×128 → `firefox/icon-128.png`
- 96×96 → `firefox/icon-96.png`
- 48×48 → `firefox/icon-48.png`
- 32×32 → `firefox/icon-32.png`

### `edge_addons` — Edge Add-ons

- 300×300 → `edge/store-logo-300.png`
- 128×128 → `edge/icon-128.png`
- 48×48 → `edge/icon-48.png`
- 32×32 → `edge/icon-32.png`
- 16×16 → `edge/icon-16.png`

### `favicon` — Web favicon set

- `favicon.ico` (16, 32, 48), `favicon-16x16.png`, `favicon-32x32.png`, `apple-touch-icon.png` (180, opaque), `icon-192.png`, `icon-512.png`, `site.webmanifest` + HTML snippet

### `icns` / `ico` — desktop app icon files

- `icns`: macOS .icns with 16–1024 (use `--mac-grid` to fit the rounded-square grid) · `ico`: Windows .ico with 16–256

## Listing text limits (`readytogo listing <fields.json>`)

| id | label | max chars |
|---|---|---|
| `as_name` | App name | 30 |
| `as_subtitle` | Subtitle | 30 |
| `as_promo` | Promotional text | 170 |
| `as_keywords` | Keywords | 100 |
| `as_description` | Description | 4000 |
| `gp_title` | App name | 30 |
| `gp_short` | Short description | 80 |
| `gp_full` | Full description | 4000 |
| `cws_name` | Extension name | 75 |
| `cws_summary` | Summary | 132 |
| `amo_name` | Add-on name | 50 |
| `amo_summary` | Summary | 250 |
| `ph_name` | Name | 40 |
| `ph_tagline` | Tagline | 60 |
| `ph_description` | Description | 260 |
