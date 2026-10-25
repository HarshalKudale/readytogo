# Desktop distribution

Signing, packaging and updates for each OS.

Phase: Pre-launch · Last verified: 2026-10-24 · Checklist applies when: any of platform:desktop

## desk.mac-sign: macOS: signed with Developer ID and notarized

- **Priority:** blocker · ~90 min · **Applies when:** any of os:macos; none of store:mac_app_store
- **Why:** Unsigned or un-notarized apps are blocked by Gatekeeper on first open.
- **Steps:**
  1. Join the Apple Developer Program and create a Developer ID Application certificate.
  2. (any of fw:electron) Electron: configure notarization in electron-builder with an App Store Connect API key.
  3. (any of fw:tauri) Tauri: set APPLE_SIGNING_IDENTITY and the APPLE_API_* env vars; tauri build signs and notarizes.
  4. (any of fw:gpui, fw:egui_iced, fw:slint) Rust native: bundle the .app with cargo-packager or cargo-bundle, sign with codesign --options runtime, then xcrun notarytool submit --wait and stapler staple.
  5. (any of fw:flutter) Flutter: sign in Xcode with the Developer ID profile, then notarize the exported app.
  6. Verify with spctl -a -vv YourApp.app.

## desk.win-sign: Windows: installer and binary code-signed

- **Priority:** blocker · ~90 min · **Applies when:** any of os:windows
- **Why:** Unsigned installers trigger SmartScreen warnings that scare most users away.
- **Steps:**
  1. Use Azure Trusted Signing or an OV/EV code signing certificate.
  2. (any of fw:electron) Electron: set win.azureSignOptions (or signtool options) in electron-builder.
  3. (any of fw:tauri) Tauri: set bundle.windows.signCommand or certificateThumbprint in tauri.conf.json.
  4. (any of fw:gpui, fw:egui_iced, fw:slint) Rust native: sign the .exe and the installer (cargo-packager's NSIS/WiX output) with signtool.

## desk.linux-packages: Linux: AppImage plus deb or rpm

- **Priority:** recommended · ~45 min · **Applies when:** any of os:linux
- **Why:** Linux users expect a package that fits their distro.
- **Steps:**
  1. (any of fw:electron) Electron: add AppImage and deb targets in electron-builder.
  2. (any of fw:tauri) Tauri: enable the appimage, deb and rpm bundle targets.
  3. (any of fw:gpui, fw:egui_iced, fw:slint) Rust native: cargo-packager builds AppImage and deb; declare system deps (libxkbcommon, vulkan) in the deb.
  4. Test install and launch on a fresh Ubuntu VM under both X11 and Wayland.

## desk.updates: Auto-updates configured and signed

- **Priority:** blocker · ~60 min · **Applies when:** none of store:mac_app_store, store:microsoft_store
- **Why:** Users won't come back for v1.0.1. The app has to update itself.
- **Steps:**
  1. (any of fw:electron) Electron: use electron-updater with GitHub Releases or S3 as the feed.
  2. (any of fw:tauri) Tauri: add the updater plugin, generate a signing key and publish latest.json.
  3. (any of fw:gpui, fw:egui_iced, fw:slint) Rust native: use cargo-packager's updater or Velopack, with signed update manifests.
  4. Ship a test update from version N to N+1 before launch.

## desk.download-page: Download page picks the right build per OS and CPU

- **Priority:** recommended · ~30 min · **Applies when:** any of store:website
- **Why:** A wall of .dmg, .exe and .AppImage links loses people.
- **Steps:**
  1. Detect the visitor's OS and highlight that download.
  2. (any of os:macos) Offer separate Apple Silicon and Intel builds, or a universal binary.
  3. Show version, file size and system requirements.
