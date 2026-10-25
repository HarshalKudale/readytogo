# Getting screenshots and screen recordings

Mockups are only as good as the media inside them. **Ask the user which route to take** (SKILL.md → "Always ask before making mockups"):

| Route | When | What you do |
|---|---|---|
| **A. User supplies files** | They already have screenshots/recordings, or a designer exported them | Ask for the paths. Check size and aspect with `readytogo verify <file> --target WxH` or `readytogo video <file>` (probe). Do not recompress or crop without saying so. |
| **B. Capture fresh** | No files, or they are stale/ugly | Pick the tool for the platform below, with the user's OK to run their app and use demo data. |
| **C. Mixed** | Some screens exist, some are missing | Use A for what exists, B for the gaps, keep theme/viewport consistent. |

Never capture real customer data, sign in as the user, or run their app against production without explicit go-ahead. Use a seeded demo account and demo data; if a real account is unavoidable, redact afterwards (`readytogo annotate --mode redact`) and tell the user.

## Decide the shot list first

Write 3–6 shots before capturing anything: one line each ("Dashboard with 3 projects, dark mode"). For each, record the **target aspect** (store sizes: `readytogo specs --store <store>`; laptop screens are 16:10, phones ~9:19.5), the **state** (data, theme, language, empty/full) and whether it needs a **still or a recording**. Capture at the target aspect, at device scale factor 2 where sharpness matters. Recapturing at the right aspect beats cropping.

## Web apps (Playwright)

`templates/capture/playwright-web.mjs` is a starting point: copy it, edit the steps, run it with Node. Needs `readytogo setup render` (or Playwright in the project).

- Fixed viewport per shot (`1280×800` for browser-store screenshots and laptop screens, `390×844` + `isMobile` for phone screens, `deviceScaleFactor: 2`).
- Seed state before navigating (API fixtures, `storageState`, a demo user). Wait for something visible (`getByRole(...).waitFor()`), never a fixed sleep. Disable animations with `page.emulateMedia({ reducedMotion: "reduce" })` and `await page.addStyleTag({ content: "*{animation:none!important;transition:none!important;caret-color:transparent!important}" })` for stills.
- Hide dev overlays, cookie banners and toasts the user would not ship; mask volatile text with `screenshot({ mask: [...] })`.
- **Recordings**: `browser.newContext({ recordVideo: { dir, size: { width: 1280, height: 800 } } })`, drive the flow with deliberate pauses (`page.waitForTimeout(600)` between steps reads as human), close the context to flush the file. Output is **WebM**, which the 3D scene and frames play directly. Move the cursor visibly (`page.mouse.move` in steps) so viewers can follow.

## Browser extensions

`templates/capture/playwright-extension.mjs`: launches Chromium with the unpacked extension (`launchPersistentContext` with `--disable-extensions-except` and `--load-extension`), finds the extension id from the service worker URL, then captures:
- the **popup** at its natural size by opening `chrome-extension://<id>/popup.html` in a page with a matching viewport (screenshot the element, not the page);
- the **options/side-panel** pages the same way;
- the **extension working on a real page**: navigate to a stable demo page you control, trigger the content script, screenshot at 1280×800. This is usually the best store screenshot; the popup alone is the weakest.
Chrome store screenshots are 1280×800 (or 640×400); frame popups with `assets/frames` `card`-style composition (see `mockups.md`), not a browser frame.

## Mobile

| Platform | Still | Recording |
|---|---|---|
| iOS Simulator | `xcrun simctl io booted screenshot out.png` (clean status bar first: `xcrun simctl status_bar booted override --time 9:41 --batteryState charged --batteryLevel 100 --cellularBars 4`) | `xcrun simctl io booted recordVideo --codec=h264 out.mp4` (stop with Ctrl-C), then `readytogo video out.mp4 --out out.webm` |
| Android emulator/device | `adb exec-out screencap -p > out.png` (demo mode for the status bar: `adb shell settings put global sysui_demo_allowed 1`) | `adb shell screenrecord --time-limit 30 /sdcard/r.mp4 && adb pull /sdcard/r.mp4`, then convert |
| Expo/React Native web target | Playwright with mobile emulation | `recordVideo` as above |

Use the device size the store wants (see `store-specs.md`). Real devices give the best fidelity; simulators are fine for store sets.

## Desktop apps

| App | How |
|---|---|
| Electron | `@playwright/test` `_electron.launch()`; `window.screenshot()`; `recordVideo` works for Electron windows too |
| Tauri / native | Fixed-size window, then OS capture: macOS `screencapture -l <windowId>`, Windows Snipping Tool/`PrintWindow`, Linux `import -window <id>`. Recording: `ffmpeg -f gdigrab -framerate 30 -i title="App" out.mp4` (Windows), `-f avfoundation -i "1"` (macOS), `-f x11grab` (Linux) |
| CLI / TUI | `vhs` (a `.tape` script → GIF/WebM) or `asciinema` + `agg`; keep the terminal at 100×30, a plain theme, no personal paths in the prompt |

## After capturing

1. Check each file: `readytogo verify shot.png --target WxH` (stills), `readytogo video rec.webm` (probe: size, fps, seconds).
2. Convert recordings for the scene/frames: `readytogo video rec.mp4 --out rec.webm --width 1280 --fps 30` (headless Chromium plays WebM/VP9, not H.264 MP4).
3. Trim dead time: `--start 1.5 --duration 8`. Aim for 6–12 s of purposeful motion; a recording loops inside the scene if shorter than the shot.
4. Keep originals; write derived files next to them with clear names (`dashboard-dark.png`, `onboarding.webm`).
5. Tell the user what you captured and from which build/branch, so they can sanity-check the content.
