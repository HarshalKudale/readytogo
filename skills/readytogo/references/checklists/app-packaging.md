# Packaging and size

What goes into the shipped artifact: bundles, source maps, assets, dependencies, installers. Smaller and safer builds.

Phase: Pre-launch · Last verified: 2026-10-26 · Checklist applies when: always

## build.web-sourcemaps: Production source maps aren't publicly served

- **Priority:** recommended · ~15 min · **Applies when:** all of platform:web, bundle:js
- **Why:** Public source maps hand anyone your original code and comments.
- **Auto-check:** `readytogo check` verifies this one.
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

## pack.minify: Production build is minified and tree-shaken

- **Priority:** recommended · ~30 min · **Applies when:** any of bundle:js
- **Why:** Dev-mode bundles are several times bigger and slower than production builds.
- **Steps:**
  1. Build with NODE_ENV=production (the framework's build command does this); never ship the dev server output.
  2. Check package.json `sideEffects` is correct (false for pure libraries) so unused exports are dropped.
  3. (any of bundle:js) Import from ESM entry points (lodash-es, date-fns) instead of whole CommonJS libraries.
  4. Compare size before and after with the bundler's analyser (vite-bundle-visualizer, @next/bundle-analyzer, webpack-bundle-analyzer, source-map-explorer).

## pack.bundle-size: Bundle size budget and code splitting

- **Priority:** recommended · ~60 min · **Applies when:** all of platform:web, bundle:js
- **Why:** Every extra 100 KB of JavaScript costs real users seconds on a mid-range phone.
- **Steps:**
  1. Set a budget (a common start: under 200 KB gzipped for the first route) and fail CI when it is exceeded.
  2. Lazy-load routes and heavy widgets (editors, charts, maps) with dynamic import().
  3. Replace heavy dependencies with lighter ones: moment to date-fns or dayjs, full lodash to lodash-es per-function imports, icon packs to per-icon imports.
  4. Load third-party scripts (analytics, chat) after first paint.

## pack.heavy-deps: No known-heavy or unused dependencies

- **Priority:** recommended · ~30 min · **Applies when:** any of bundle:js
- **Why:** Unused and heavyweight packages bloat bundles, installs and the attack surface.
- **Auto-check:** `readytogo check` verifies this one.
- **Steps:**
  1. Run `npx depcheck` (or knip) and remove dependencies nothing imports.
  2. Move build-only and test-only packages to devDependencies.
  3. Replace moment, request, left-pad-style packages and full lodash with native or lighter equivalents.
  4. Reinstall from the lockfile and make sure the app still builds and starts.

## pack.images: Images are compressed and right-sized

- **Priority:** recommended · ~45 min · **Applies when:** the checklist applies
- **Why:** Images are usually the largest part of a web page and an app package.
- **Auto-check:** `readytogo check` verifies this one.
- **Steps:**
  1. Find images over ~300 KB (`readytogo check` lists them) and compress or resize them to the largest size they are displayed at.
  2. (any of platform:web) Serve WebP or AVIF with a fallback; use the framework's image component (next/image, astro:assets, vite-imagetools).
  3. Run svgo on SVGs; delete unused images and design-source files from the package.
  4. (any of platform:ios) Use asset catalogs with correct @2x/@3x variants only; remove unused assets.
  5. (any of platform:android) Use WebP/vector drawables for Android; remove unused drawables with lint (`./gradlew lint`).

## pack.fonts: Fonts are subset and in WOFF2

- **Priority:** nice · ~20 min · **Applies when:** any of platform:web, platform:extension, fw:electron, fw:tauri
- **Why:** Full font families can add hundreds of KB before the first paint.
- **Steps:**
  1. Ship WOFF2 only; drop TTF/OTF/EOT from web builds.
  2. Subset to the languages you support, or use the font provider's `text=` or unicode-range subsets.
  3. Preload the one or two fonts used above the fold; set font-display: swap.

## pack.strip-debug: No debugger statements or debug logging in production

- **Priority:** recommended · ~15 min · **Applies when:** any of bundle:js
- **Why:** Leftover debug code leaks internals and slows the app.
- **Auto-check:** `readytogo check` verifies this one.
- **Steps:**
  1. Remove `debugger;` statements.
  2. Strip console.log in production builds (esbuild `drop: ['console','debugger']`, terser `drop_console`, Next.js `compiler.removeConsole`), keeping console.error if you rely on it.
  3. Gate verbose logging behind a log level that defaults to warn in production.

## pack.cache-headers: Hashed assets with long-lived caching and compression

- **Priority:** recommended · ~20 min · **Applies when:** all of platform:web
- **Why:** Repeat visits should download almost nothing, and text should travel compressed.
- **Steps:**
  1. Build output filenames contain a content hash (the default in Vite, Next.js, Astro).
  2. Serve hashed assets with `Cache-Control: public, max-age=31536000, immutable`; serve HTML with a short cache or revalidation.
  3. Enable Brotli (or gzip) for text responses on your host or CDN. Verify: `curl -sI -H 'Accept-Encoding: br' https://yoursite/app.js`.

## pack.npm-files: Published npm package contains only what users need

- **Priority:** blocker · ~15 min · **Applies when:** any of store:npm
- **Why:** Accidentally publishing tests, source maps, .env files or the whole repo is common and permanent.
- **Auto-check:** `readytogo check` verifies this one.
- **Steps:**
  1. Add a `files` whitelist to package.json (dist, README, LICENSE) or an .npmignore.
  2. Run `npm pack --dry-run` and read the file list and the unpacked size.
  3. Make sure no .env, credentials, test fixtures or large media are in the list.

## pack.docker: Container image is small, multi-stage and non-root

- **Priority:** recommended · ~40 min · **Applies when:** any of platform:api, host:self, host:paas, host:cloud
- **Why:** Smaller images deploy faster and carry fewer vulnerabilities.
- **Auto-check:** `readytogo check` verifies this one.
- **Steps:**
  1. Use a multi-stage build: compile in a builder stage, copy only the output into a slim or distroless runtime image.
  2. Add a .dockerignore (node_modules, .git, tests, .env).
  3. Run as a non-root USER and pin base image versions.
  4. Check size with `docker images` and layers with `docker history`.

## pack.android-shrink: Android release enables R8 shrinking and ships an AAB

- **Priority:** recommended · ~45 min · **Applies when:** any of platform:android; none of fw:flutter
- **Why:** Shrinking removes unused code and resources; AAB lets Play deliver per-device APKs.
- **Auto-check:** `readytogo check` verifies this one.
- **Steps:**
  1. Set `minifyEnabled true` and `shrinkResources true` for the release build type (Kotlin DSL: `isMinifyEnabled = true`).
  2. Keep rules for reflection and serialization libraries in proguard-rules.pro; test the release build on a device.
  3. Upload an Android App Bundle (.aab), not an APK; check the size in Play Console's app size report.
  4. Upload the R8 mapping file so crash traces are readable.

## build.tauri-release: Tauri release build has no DevTools or source maps

- **Priority:** blocker · ~15 min · **Applies when:** any of fw:tauri
- **Why:** A release webview with DevTools lets anyone poke at your IPC commands.
- **Steps:**
  1. Don't enable the 'devtools' Cargo feature for release builds.
  2. (all of bundle:js) Set build.sourcemap false in vite.config for the frontend.
  3. Build with tauri build and right-click in the app: Inspect must not appear.

## pack.ios-size: iOS build is thinned and stripped

- **Priority:** nice · ~30 min · **Applies when:** any of platform:ios
- **Why:** App Store download size affects installs, and the cellular download limit still matters.
- **Steps:**
  1. Archive with Release configuration; leave Bitcode irrelevant (removed), strip debug symbols and keep dSYMs for crash reports.
  2. Use asset catalogs so app thinning delivers only the right variants; compress large media.
  3. Check the size report from Xcode's Distribute App > App Thinning Size Report.

## pack.electron-size: Electron app packages only runtime files

- **Priority:** recommended · ~45 min · **Applies when:** any of fw:electron
- **Why:** Electron apps are big already; packaging dev files makes it worse and leaks source.
- **Steps:**
  1. Enable asar packaging; list `files` in electron-builder so tests, docs and source maps are excluded.
  2. Keep build tools in devDependencies so they are not bundled.
  3. Bundle the main and renderer code (esbuild/Vite) instead of shipping node_modules wholesale.
  4. Compare installer sizes before and after; maximum compression is fine for releases.

## pack.ext-size: Extension zip contains only the built output

- **Priority:** recommended · ~15 min · **Applies when:** any of platform:extension
- **Why:** Store reviews are quicker and uploads smaller when the package is clean.
- **Steps:**
  1. Zip the build output folder only (dist/ or .output/), never the repo.
  2. Exclude source maps, test files and unused locales.
  3. Bundle dependencies instead of loading remote scripts (remote code is rejected under Manifest V3).
  4. Open the zip and check its size and file list.

## pack.wasm-native: Native and WASM builds use size-optimised release profiles

- **Priority:** nice · ~30 min · **Applies when:** any of lang:rust, lang:go, fw:flutter; none of fw:tauri
- **Why:** Compiler flags can cut binary size by half.
- **Steps:**
  1. (any of lang:rust) Rust: opt-level = 'z' or 's', lto = true, codegen-units = 1, panic = 'abort' if you do not catch panics, strip = true.
  2. (any of lang:go) Go: build with `-ldflags='-s -w' -trimpath`.
  3. (any of fw:flutter) Flutter: build with --split-debug-info and --obfuscate; use --split-per-abi for APKs.
  4. Measure the binary before and after with `ls -l`; keep debug symbols separate for crash reports.

## build.rust-release: Rust release profile tuned, debug symbols kept separately

- **Priority:** recommended · ~30 min · **Applies when:** any of platform:desktop, platform:cli; all of lang:rust
- **Why:** Smaller, faster binaries for users, with symbols kept so crash reports stay readable.
- **Steps:**
  1. In Cargo.toml [profile.release]: lto = "thin", codegen-units = 1, and strip = "debuginfo" or split-debuginfo.
  2. Build with cargo build --release --locked so CI uses exactly your Cargo.lock.
  3. (any of platform:desktop) Upload the split debug info (.dSYM / .pdb / .dwp) to your crash reporter for each release.
  4. (any of platform:cli) Set opt-level = "z" only if binary size matters more than speed for your CLI.

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
