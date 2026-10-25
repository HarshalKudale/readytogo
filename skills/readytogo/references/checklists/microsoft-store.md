# Microsoft Store

Partner Center listing and package requirements.

Phase: Pre-launch · Last verified: 2026-10-24 · Checklist applies when: any of store:microsoft_store

## msstore.account: Partner Center developer account

- **Priority:** blocker · ~30 min · **Applies when:** the checklist applies
- **Why:** Required to reserve your app name and submit.
- **Steps:**
  1. Register at partner.microsoft.com and reserve your product name.

## msstore.package: MSIX package, or a Win32 installer with silent install

- **Priority:** blocker · ~60 min · **Applies when:** the checklist applies
- **Why:** The Store only accepts these package types.
- **Steps:**
  1. (any of fw:electron) Electron: add the appx target in electron-builder.
  2. (any of fw:tauri) Tauri: submit the NSIS or MSI installer as a Win32 app with silent-install switches.
  3. (any of fw:gpui, fw:egui_iced, fw:slint) Rust native: package with cargo-packager (NSIS/WiX) and submit as Win32, or wrap in MSIX with the MSIX Packaging Tool.
  4. (any of fw:flutter) Flutter: build an MSIX with the msix pub package.
  5. (any of fw:dotnet) .NET: use a Windows Application Packaging project or single-project MSIX.

## msstore.listing: Screenshots (1366×768+), age rating and privacy URL

- **Priority:** blocker · ~45 min · **Applies when:** the checklist applies
- **Why:** All required before certification.
- **Generate:** `readytogo shot <screenshot> --target <id>` · `readytogo promo --target <id> --title "…"` (ids: ms_store, ms_logo, ms_poster, ms_box, ms_hero, ms_promo)
- **Asset ids needed:** ms_store
- **Steps:**
  1. Upload at least one 1366×768 screenshot.
  2. Complete the IARC age rating questionnaire.
