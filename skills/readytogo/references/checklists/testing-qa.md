# Testing and QA

Automated checks on the flows that matter.

Phase: Pre-launch · Last verified: 2026-10-24 · Checklist applies when: always

## qa.e2e-web: Playwright tests for your core web flows

- **Priority:** recommended · ~120 min · **Applies when:** any of platform:web; none of fw:nocode
- **Why:** Signup, login and checkout break silently. A browser test catches it before your users do.
- **Steps:**
  1. Run npm init playwright@latest.
  2. Cover signup to first value, login, and checkout if you charge.
  3. Add Chromium, WebKit and a mobile viewport as Playwright projects.
  4. (any of fw:nextjs) Next.js: point webServer at next build && next start, not the dev server.
  5. (any of fw:leptos) Rust web (Leptos/Dioxus): run cargo leptos build --release in webServer, then drive it with Playwright.

## qa.e2e-electron: Playwright tests for the Electron app

- **Priority:** recommended · ~90 min · **Applies when:** any of fw:electron
- **Why:** Playwright can launch your packaged Electron app and drive real windows.
- **Steps:**
  1. Launch the app with _electron.launch({ args: ['.'] }) from @playwright/test.
  2. Test first launch, your main window flow and update prompts.

## qa.e2e-tauri: WebDriver tests for the Tauri app

- **Priority:** recommended · ~120 min · **Applies when:** any of fw:tauri
- **Why:** Tauri apps are tested through tauri-driver; cover the flows a first-time user hits.
- **Steps:**
  1. Install tauri-driver and a WebDriver client (WebdriverIO).
  2. Run against a release build on Windows and Linux in CI (macOS has no WKWebView driver).

## qa.rust: cargo clippy and cargo test gate every merge

- **Priority:** recommended · ~60 min · **Applies when:** all of lang:rust; none of fw:tauri
- **Why:** Clippy catches real bugs; tests keep refactors safe.
- **Steps:**
  1. Run cargo clippy --all-targets -- -D warnings and cargo test --locked in CI.
  2. (any of fw:gpui) GPUI: test view and model state with #[gpui::test] and TestAppContext, no window needed.
  3. (any of fw:egui_iced) egui: drive UI tests headlessly with egui_kittest.
  4. (any of fw:slint) Slint: use the testing backend (i-slint-backend-testing) to assert on UI state.
  5. (any of platform:desktop, platform:cli) Test on every target OS in CI with a matrix (macos-latest, windows-latest, ubuntu-latest).
  6. (any of platform:library) Pin and test your minimum supported Rust version (rust-version in Cargo.toml).

## qa.e2e-mobile: End-to-end tests on a simulator or device

- **Priority:** recommended · ~120 min · **Applies when:** any of mobile
- **Why:** Store reviewers will find a crash on first launch if your tests don't.
- **Steps:**
  1. (any of fw:expo) Expo / React Native: write Maestro flows (or Detox) for onboarding and your main action.
  2. (any of fw:flutter) Flutter: add integration_test and run it on an emulator in CI.
  3. (all of fw:swift, platform:ios) Swift: add an XCUITest target for launch, sign-in and the main screen.
  4. (any of fw:kotlin) Kotlin: write Compose UI tests or Espresso tests for the main flows.
  5. (any of fw:capacitor) Capacitor: test the web layer with Playwright, then smoke-test on a device.

## qa.cli: CLI output and exit codes covered by tests

- **Priority:** recommended · ~60 min · **Applies when:** any of platform:cli
- **Why:** Scripts and CI pipelines depend on your exit codes and output format.
- **Steps:**
  1. (any of lang:rust) Rust: assert_cmd for invocations and insta for snapshot-testing output.
  2. (any of lang:js) Node: run the binary with execa in Vitest and snapshot stdout.
  3. (any of lang:python) Python: test commands with Click's CliRunner or Typer's testing client.
  4. (any of lang:go) Go: use testscript for end-to-end CLI scripts.
  5. Test --help, a bad flag, and a missing-file error.

## qa.library: Public API tested on every supported runtime version

- **Priority:** recommended · ~60 min · **Applies when:** any of platform:library
- **Why:** Users run versions you don't. A matrix catches it before an issue does.
- **Steps:**
  1. (any of lang:js) Node: test against every active LTS in a CI matrix.
  2. (any of lang:python) Python: test supported versions with nox or tox.
  3. (any of lang:rust) Rust: test on stable and your MSRV; run cargo test --doc so examples compile.
  4. Run your README examples as tests.

## qa.api: API contract tests run in CI

- **Priority:** recommended · ~60 min · **Applies when:** any of platform:api
- **Why:** A changed response shape breaks every client at once.
- **Steps:**
  1. Keep an OpenAPI spec or request collection for every endpoint.
  2. Run it against a staging deploy in CI (Postman CLI, Schemathesis or similar).

## qa.ci: CI runs build and tests on every pull request

- **Priority:** recommended · ~45 min · **Applies when:** none of fw:nocode
- **Why:** Tests nobody runs don't protect anything.
- **Auto-check:** `readytogo check` verifies this one.
- **Steps:**
  1. Add a GitHub Actions workflow that installs, builds and tests.
  2. Block merges when it fails.
  3. (any of lang:rust) Cache ~/.cargo and target/ with Swatinem/rust-cache to keep builds fast.
  4. (all of platform:web; none of fw:nocode) Upload the Playwright HTML report as an artifact.

## qa.crash-reporting: Error and crash reporting live

- **Priority:** blocker · ~30 min · **Applies when:** any of platform:web, mobile, platform:desktop, platform:extension, platform:api; none of fw:nocode
- **Why:** Launch day is when you find bugs. You need the stack trace, not a vague tweet.
- **Auto-check:** `readytogo check` verifies this one.
- **Steps:**
  1. (any of fw:nextjs) Next.js: npx @sentry/wizard -i nextjs.
  2. (any of fw:electron) Electron: add @sentry/electron in both main and renderer.
  3. (any of lang:rust) Rust: add the sentry crate with the panic integration.
  4. (any of fw:expo) Expo: add @sentry/react-native with the Expo config plugin.
  5. (any of fw:flutter) Flutter: add sentry_flutter or Firebase Crashlytics.
  6. (any of fw:swift) Swift: Firebase Crashlytics or the Sentry Cocoa SDK.
  7. (any of fw:kotlin) Kotlin: Firebase Crashlytics or the Sentry Android SDK.
  8. Trigger a test error in a release build and confirm it arrives.

## qa.real-devices: Checked on Safari, Firefox and a real phone

- **Priority:** recommended · ~45 min · **Applies when:** any of store:website
- **Why:** Safari and small screens break layouts that look fine in Chrome.
- **Steps:**
  1. Check Chrome, Safari and Firefox.
  2. Check a real phone at 375px wide: no horizontal scroll.

## qa.install: Fresh-machine install test on every OS you ship

- **Priority:** blocker · ~60 min · **Applies when:** any of platform:desktop, platform:cli
- **Why:** Missing runtimes, DLLs and permissions only show up on a clean machine.
- **Steps:**
  1. (any of os:macos) macOS: install from the notarized .dmg on a fresh user account, and open it with no Gatekeeper warning.
  2. (any of os:windows) Windows: install on a clean VM and check for a SmartScreen warning and missing VC++ runtimes.
  3. (any of os:linux) Linux: install the AppImage/deb on a fresh Ubuntu VM and check GPU/Wayland.
  4. (any of fw:gpui, fw:egui_iced, fw:slint) Rust GPU apps: test on a machine without a discrete GPU and under a VM's software renderer.
