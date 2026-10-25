# Assets: sources, capture, placement

Stores reject assets for avoidable reasons (alpha channel, wrong pixels, text-heavy art, placeholder UI). The CLI guarantees pixels and alpha; **you** are responsible for the source material being right.

## 1. The master icon

One source file, everything else is derived. Requirements:

- **SVG, or PNG ≥ 1024×1024, square.** If the project only has a small PNG, say so and ask for the original; upscaling looks soft in the store.
- Art centred with breathing room (about 10% each side); no text smaller than the icon's 48px rendering can show; no screenshots; no drop shadow baked in.
- Flat, opaque background for App Store and Play adaptive icons. If the logo is transparent, pick `--bg` from the brand colour.
- Where to look first: `public/`, `assets/`, `brand/`, `design/`, `ios/…/AppIcon.appiconset`, `android/…/res/mipmap-*`, `src-tauri/icons`, `build/icon.*`, README header image. `readytogo check` (`brand.app-icon`) finds square PNGs ≥1024 named like an icon or logo.
- If there is no logo at all: ask the user. Do not invent a brand mark with the image tools; a simple lettermark SVG is acceptable only as a clearly labelled placeholder, and the checklist item stays open.

Run: `readytogo icons logo.svg --for app_store` (repeat per store the profile includes). Verify with `readytogo check --only appstore.icon,cws.assets`.

## 2. Where outputs go

| Output | Put it |
|---|---|
| `favicon/*` | web root (`public/`, `static/`, `app/` for Next metadata files); add the printed `<head>` snippet or framework equivalent (Next.js: `app/icon.png`, `app/apple-icon.png`; Astro/Vite: `<link>` tags in the layout). |
| `ios/AppStore-1024.png` + sizes | `Assets.xcassets/AppIcon.appiconset`. Modern Xcode needs only the 1024 single-size icon; keep the others for older targets, Expo (`icon` in `app.json`), Capacitor. |
| `android/mipmap-*/ic_launcher.png`, `play-store-512.png` | `app/src/main/res/mipmap-*`; the 512 goes to Play Console only. Prefer adaptive icons (foreground/background) for new apps; generate the foreground with `--padding 0.18` so the launcher mask does not clip it. |
| `chrome/icon-{16,32,48,128}.png` | the extension folder; reference in `manifest.json` → `icons` (and `action.default_icon`). Chrome Web Store reads the 128. |
| `icns` / `ico` | `build/`, `src-tauri/icons/`, `resources/` per the desktop framework's config (`electron-builder`: `build/icon.icns`, `build/icon.ico`; Tauri: `src-tauri/icons/`). Use `--mac-grid` for `icns`. |
| `screenshots/<id>/` | not committed to app source; upload to the store console. A `store-assets/` or `docs/store/` folder in the repo is fine and helps future releases. |

Always ask before replacing an existing icon or screenshot set.

## 3. Capturing real screenshots

Screenshots must show the actual product with believable demo data. Pick the right capture route:

| Product | How |
|---|---|
| Web app | Playwright, a fixed viewport, seeded account, `page.screenshot({ path, fullPage: false })`. Capture at the **aspect the target needs** (see `specs`), at device scale 2 for sharpness. Both light and dark if the product has both. |
| Browser extension | Playwright with `chromium.launchPersistentContext` + `--load-extension=<dist>` (and `--disable-extensions-except`); open the popup page URL `chrome-extension://<id>/popup.html` at a popup-sized viewport, and the options/new-tab pages at 1280×800. Capture the *extension's value on a real page*, not only its settings. |
| iOS | Simulator at the device size the store wants: `xcrun simctl boot "<device>"`, then `xcrun simctl io booted screenshot out.png`. Set a clean status bar: `xcrun simctl status_bar booted override --time "9:41" --batteryState charged --batteryLevel 100 --cellularBars 4`. |
| Android | Emulator or device: `adb exec-out screencap -p > out.png`; demo mode for the status bar: `adb shell settings put global sysui_demo_allowed 1` then `adb shell am broadcast -a com.android.systemui.demo -e command clock -e hhmm 1200`. |
| Electron | `@playwright/test` `_electron.launch()`, `window.screenshot()`; or OS screenshot of a fixed window size. |
| Tauri / native desktop | OS-level window capture at a fixed size (macOS `screencapture -l <windowid>`, Windows Snipping/`PrintWindow`, Linux `import -window`), or WebDriver for Tauri. |
| CLI / TUI | Record with `asciinema` or `vhs` (a `.tape` script) and render a PNG/GIF from the final frame. |

Preparation checklist: seeded, plausible data (no lorem ipsum, no real customers); no debug banners, dev toolbars or localhost URLs; consistent theme and language; notifications and unrelated windows off; no personal data (use `annotate --mode redact` if unavoidable).

Then fit to the store: `readytogo shot cap/*.png --target play_phone`. If it warns about cropping, recapture at the right aspect instead of accepting a bad crop.

## 4. Promo tiles and graphics

Use `readytogo promo --target <id>` for clean text-and-logo tiles. Rules of thumb:

- One idea per tile: product name plus a benefit of at most six words. The small tiles (440×280, 240×240) are read at thumbnail size; if you cannot read it at 25% zoom, cut words.
- High contrast (WCAG AA at least), brand colours from the logo, logo clearly visible, safe margin 8–10%.
- No store badges, no pricing, no "#1", no claims you cannot prove, no screenshots of competitors.
- Feature graphics and marquees get cropped differently across surfaces; keep key content in the centre 80%.
- For art that needs real screenshots, brand fonts or layered shapes, copy `templates/promo/tile.html`, edit it, and render it: `readytogo render "/__skill/templates/promo/tile.html?title=…&logo=/logo.png&shot=/shot.png" --size 1400x560 --out marquee.png`.

## 5. Listing copy

Write from the product's real README, site and features; never invent features or statistics.

1. Pull `name`, `tagline`, `description` from the profile (set them if missing).
2. Draft each field for each store in `fields.json` using the ids in `references/store-specs.md` (`gp_title`, `gp_short`, `cws_summary`, …).
3. `readytogo listing fields.json` until nothing is over.
4. Style: lead with what the user gets, then how; plain words; no keyword stuffing; no ALL CAPS; no emoji walls; no unverifiable superlatives; no references to other platforms by name in a store listing (stores reject "also on Android" in some fields).
5. Keywords (App Store, 100 chars): comma-separated, no spaces after commas, do not repeat words already in the name or subtitle, no competitor names.

## 6. Licensing hygiene

- Fonts and icons used in art must be licensed for commercial use; prefer the product's own brand assets.
- Device frames from `frame` and the 3D template are generic and original, not any manufacturer's artwork, so they are safe to publish. Do not add Apple/Google trademarked badges or logos to art unless the user supplies the official badge from the vendor's marketing guidelines.
- GLB models: see `assets/3d/models/README.md`; keep `license` and attribution.
