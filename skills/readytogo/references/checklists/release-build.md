# Release build hygiene

What ships in your production build, and what must not.

Phase: Pre-launch · Last verified: 2026-10-24 · Checklist applies when: always

## build.secrets-repo: No secrets in the repo or its history

- **Priority:** blocker · ~20 min · **Applies when:** none of fw:nocode
- **Why:** Leaked keys are found by bots within minutes of a public push.
- **Auto-check:** `readytogo check` verifies this one.
- **Steps:**
  1. Run gitleaks detect on the full history.
  2. Rotate anything it finds, then remove it from history.

## build.public-env: Only public env vars reach the client bundle

- **Priority:** blocker · ~15 min · **Applies when:** any of bundle:js
- **Why:** Anything with the public prefix is baked into JavaScript every user downloads.
- **Auto-check:** `readytogo check` verifies this one.
- **Steps:**
  1. (any of fw:nextjs) Next.js: only NEXT_PUBLIC_* vars are exposed. Keep secret keys unprefixed and use them in server code only.
  2. (any of fw:react_vite, fw:react_router, fw:astro, fw:tauri, fw:electron) Vite: only VITE_* vars are exposed via import.meta.env. Never prefix a secret with VITE_.
  3. (any of fw:sveltekit) SvelteKit: import secrets from $env/static/private, never $env/static/public.
  4. (any of fw:nuxt) Nuxt: put secrets in runtimeConfig, not runtimeConfig.public.
  5. (any of fw:expo) Expo: EXPO_PUBLIC_* vars are inlined into the app binary. Keep secrets on your backend.
  6. (any of platform:extension) Extensions: anything in the package is readable. Call your backend for secret-backed APIs.
  7. Search the built output for 'sk_', 'secret' and your API key prefixes.

## build.web-sourcemaps: Production source maps aren't publicly served

- **Priority:** recommended · ~15 min · **Applies when:** all of platform:web, bundle:js
- **Why:** Public source maps hand anyone your original code and comments.
- **Steps:**
  1. (any of fw:nextjs) Next.js: keep productionBrowserSourceMaps off (the default) in next.config.
  2. (any of fw:react_vite, fw:react_router, fw:sveltekit, fw:astro) Vite: set build.sourcemap to false, or 'hidden' and upload maps to your error tracker only.
  3. (any of fw:nuxt) Nuxt: set sourcemap.client to false in nuxt.config.
  4. (any of fw:angular) Angular: set sourceMap to false in the production configuration.
  5. Open your live site, then DevTools > Sources: no original .ts/.tsx files should appear.

## build.desktop-sourcemaps: Electron build ships without source maps or DevTools

- **Priority:** blocker · ~20 min · **Applies when:** any of fw:electron
- **Why:** ASAR archives unpack in seconds. Shipped maps and DevTools expose your code and internals.
- **Steps:**
  1. Set build.sourcemap false in the renderer's Vite/webpack config and exclude **/*.map in electron-builder 'files'.
  2. Only open DevTools when !app.isPackaged.
  3. Unpack the release ASAR (npx @electron/asar extract) and confirm no .map files are inside.

## build.tauri-release: Tauri release build has no DevTools or source maps

- **Priority:** blocker · ~15 min · **Applies when:** any of fw:tauri
- **Why:** A release webview with DevTools lets anyone poke at your IPC commands.
- **Steps:**
  1. Don't enable the 'devtools' Cargo feature for release builds.
  2. (all of bundle:js) Set build.sourcemap false in vite.config for the frontend.
  3. Build with tauri build and right-click in the app: Inspect must not appear.

## build.electron-security: Electron security defaults on

- **Priority:** blocker · ~45 min · **Applies when:** any of fw:electron
- **Why:** A renderer with Node access turns any XSS into full control of the user's machine.
- **Auto-check:** `readytogo check` verifies this one.
- **Steps:**
  1. Keep contextIsolation: true, nodeIntegration: false and sandbox: true for every BrowserWindow.
  2. Expose a minimal API with contextBridge in the preload script; validate every IPC message.
  3. Turn on the ASAR integrity and OnlyLoadAppFromAsar fuses with @electron/fuses.
  4. Set a Content-Security-Policy for your renderer.

## build.tauri-capabilities: Tauri capabilities are minimal

- **Priority:** blocker · ~30 min · **Applies when:** any of fw:tauri
- **Why:** Every allowed command and permission is attack surface for the webview.
- **Steps:**
  1. Grant only the permissions you use in src-tauri/capabilities/*.json, scoped to specific windows.
  2. Scope filesystem and shell permissions to exact paths and commands.
  3. Set app.security.csp in tauri.conf.json.

## build.rust-release: Rust release profile tuned, debug symbols kept separately

- **Priority:** recommended · ~30 min · **Applies when:** any of platform:desktop, platform:cli; all of lang:rust
- **Why:** Smaller, faster binaries for users, with symbols kept so crash reports stay readable.
- **Steps:**
  1. In Cargo.toml [profile.release]: lto = "thin", codegen-units = 1, and strip = "debuginfo" or split-debuginfo.
  2. Build with cargo build --release --locked so CI uses exactly your Cargo.lock.
  3. (any of platform:desktop) Upload the split debug info (.dSYM / .pdb / .dwp) to your crash reporter for each release.
  4. (any of platform:cli) Set opt-level = "z" only if binary size matters more than speed for your CLI.

## build.rust-panics: Panics are caught, logged and reported

- **Priority:** blocker · ~45 min · **Applies when:** all of lang:rust, platform:desktop
- **Why:** A release GUI that panics just vanishes. Users can't tell you what happened.
- **Steps:**
  1. Install a panic hook (std::panic::set_hook) that writes a crash log to the app's data directory.
  2. Report it with the sentry crate (panic integration), or offer 'send crash report' on next launch.
  3. (any of fw:gpui) GPUI: wrap fallible entity updates and surface errors in the UI instead of unwrap().

## build.rust-native-assets: Fonts, icons and assets bundled into the binary

- **Priority:** blocker · ~30 min · **Applies when:** any of fw:gpui, fw:egui_iced, fw:slint
- **Why:** Native Rust apps often load assets from relative paths that don't exist once installed.
- **Steps:**
  1. Embed assets with include_bytes! or rust-embed, or resolve them relative to the app bundle.
  2. (any of fw:gpui) GPUI: serve embedded assets through your AssetSource implementation.
  3. Install the release build on a clean machine and check fonts and icons render.

## build.dead-code: Unused code and imports removed

- **Priority:** recommended · ~30 min · **Applies when:** none of fw:nocode
- **Why:** Dead code ships to users, inflates bundles, hides real bugs and leaks removed features.
- **Run:** `readytogo setup deadcode   (once)` · `readytogo deadcode --min medium`
- **Steps:**
  1. Run the analyser, review HIGH findings (unused imports, unreachable code, unreferenced private declarations) and delete them.
  2. Treat MEDIUM and LOW findings (unused exports, unreferenced files) as questions: public API, entry points and framework routes can look unused.
  3. Re-run tests and the build after deleting.

## build.flutter-obfuscate: Flutter release builds obfuscated, symbols uploaded

- **Priority:** recommended · ~20 min · **Applies when:** any of fw:flutter
- **Why:** Obfuscation slows reverse engineering; uploaded symbols keep crash reports readable.
- **Steps:**
  1. Build with flutter build <target> --release --obfuscate --split-debug-info=build/symbols.
  2. Upload the symbols directory to your crash reporter.

## build.expo-release: EAS production build and update channel set up

- **Priority:** recommended · ~30 min · **Applies when:** any of fw:expo
- **Why:** Store builds and over-the-air updates need separate, predictable profiles.
- **Steps:**
  1. Add a production profile in eas.json and build with eas build --profile production.
  2. Point production builds at a production EAS Update channel.
  3. Enable R8 minification for Android release builds.

## build.native-symbols: Release symbols uploaded for crash reports

- **Priority:** recommended · ~20 min · **Applies when:** any of fw:swift, fw:kotlin
- **Why:** Without dSYMs or mapping files, production crash reports are unreadable.
- **Steps:**
  1. (any of fw:swift) Apple platforms: upload dSYMs from each archive to your crash reporter.
  2. (any of fw:kotlin) Android: keep R8 on and upload mapping.txt for each release.

## build.ext-package: Store package has no dev-only permissions

- **Priority:** blocker · ~15 min · **Applies when:** any of platform:extension
- **Why:** Leftover localhost hosts or broad permissions trigger rejections and scare users.
- **Auto-check:** `readytogo check` verifies this one.
- **Steps:**
  1. (any of fw:wxt) WXT: build the store zip with wxt zip (and wxt zip -b firefox for AMO).
  2. (any of fw:plasmo) Plasmo: run plasmo package to produce the store zip.
  3. Check manifest.json: no localhost in host_permissions, no unused permissions.

## build.deps-audit: Dependency vulnerability scan passes

- **Priority:** recommended · ~20 min · **Applies when:** none of fw:nocode
- **Why:** Known-vulnerable dependencies are the easiest way in.
- **Steps:**
  1. (any of lang:rust) Rust: cargo audit (or cargo deny check advisories).
  2. (any of lang:js) JavaScript: npm audit --omit=dev, and fix highs and criticals.
  3. (any of lang:python) Python: pip-audit.
  4. (any of lang:go) Go: govulncheck ./...
  5. (any of lang:dart) Dart: dart pub outdated, then upgrade flagged packages.
  6. Run it in CI so new advisories fail the build.

## build.security-headers: Security headers set

- **Priority:** recommended · ~30 min · **Applies when:** any of platform:web
- **Why:** CSP, HSTS and frame protection block whole classes of attacks for free.
- **Steps:**
  1. Set Content-Security-Policy, Strict-Transport-Security, X-Content-Type-Options and Referrer-Policy.
  2. (any of fw:nextjs) Next.js: add them in the headers() function in next.config.
  3. (any of host:cloudflare) Cloudflare: add a _headers file or a Transform Rule.
  4. (any of host:vercel) Vercel: add a headers block to vercel.json.
  5. Check the result with securityheaders.com.

## build.rate-limit: Rate limits on auth and expensive endpoints

- **Priority:** blocker · ~45 min · **Applies when:** any of platform:api, data:accounts, ai:any; none of fw:nocode
- **Why:** Launch traffic and bots hit login and AI endpoints hardest.
- **Steps:**
  1. Limit login, signup, password reset and any endpoint that costs you money.
  2. (any of ai:any) AI endpoints: cap requests and tokens per user per day.

## build.backups: Database backups running, one restore tested

- **Priority:** blocker · ~45 min · **Applies when:** any of data:accounts, data:ugc, data:payments
- **Why:** A backup you haven't restored is a hope, not a backup.
- **Steps:**
  1. (any of svc:supabase) Supabase: turn on daily backups or PITR, and restore one into a branch.
  2. (any of svc:firebase) Firebase: schedule Firestore exports to Cloud Storage.
  3. Restore into a scratch database and check the row counts.
