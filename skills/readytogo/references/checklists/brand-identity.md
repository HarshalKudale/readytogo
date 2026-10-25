# Brand and identity

Name, logo, icons and the copy every listing reuses.

Phase: Foundation · Last verified: 2026-10-24 · Checklist applies when: always

## brand.name: Final name, checked for trademark conflicts

- **Priority:** blocker · ~30 min · **Applies when:** the checklist applies
- **Why:** Renaming after launch costs you every link, review and listing you earned.
- **Needs product copy:** name
- **Steps:**
  1. Search USPTO, EUIPO and the India IP office for your name in your category.
  2. (any of platform:ios, store:mac_app_store) Search the App Store for apps with the same or a similar name.
  3. (any of platform:android) Search Google Play for apps with the same or a similar name.
  4. (any of platform:library, platform:cli; all of lang:rust) Check the name is free on crates.io; crate names are first come, first served.
  5. (any of platform:library, platform:cli; all of lang:js) Check the name is free on npm; package names are first come, first served.
  6. (any of platform:library, platform:cli; all of lang:python) Check the name is free on PyPI; project names are first come, first served.
  7. (any of platform:library, platform:cli; all of lang:go) Check the module path you'll publish under (github.com/you/name) is available.

## brand.handles: Domain and social handles reserved

- **Priority:** recommended · ~20 min · **Applies when:** the checklist applies
- **Why:** A consistent name across your domain and socials makes you findable.
- **Steps:**
  1. Check the .com or a strong alternative TLD.
  2. Reserve the handle on X, LinkedIn and GitHub.

## brand.logo: Logo in SVG with light, dark and mono variants

- **Priority:** recommended · ~60 min · **Applies when:** the checklist applies
- **Why:** Stores, directories and press all ask for a logo, often on dark backgrounds.
- **Steps:**
  1. Export a square SVG and a 1024×1024 PNG.
  2. Check it reads at 16px and on dark backgrounds.

## brand.app-icon: App icon master at 1024×1024

- **Priority:** blocker · ~30 min · **Applies when:** any of mobile, platform:desktop, platform:extension
- **Why:** Every store and OS icon size is generated from one high-resolution master.
- **Auto-check:** `readytogo check` verifies this one.
- **Generate:** `readytogo icons <master-icon.png|svg> --for app_store` · `readytogo icons <master-icon.png|svg> --for play_store` · `readytogo icons <master-icon.png|svg> --for icns` · `readytogo icons <master-icon.png|svg> --for ico` · `readytogo icons <master-icon.png|svg> --for chrome_web_store` · `readytogo icons <master-icon.png|svg> --for firefox_addons` · `readytogo icons <master-icon.png|svg> --for edge_addons`
- **Steps:**
  1. (any of platform:ios) iOS: no transparency, no rounded corners. The OS applies the mask.
  2. (any of platform:android) Android: prepare an adaptive icon (foreground and background layers).
  3. (all of platform:desktop, os:macos) macOS: follow the rounded-square grid with a soft shadow, and export an .icns.
  4. (all of platform:desktop, os:windows) Windows: export a multi-size .ico (16–256px).
  5. (any of platform:extension) Extensions need 16, 32, 48 and 128px icons.

## brand.favicon: Favicon set (.ico, 16, 32, 180, 192, 512)

- **Priority:** recommended · ~10 min · **Applies when:** any of store:website
- **Why:** Browsers, iOS home screens and PWAs each pick a different size.
- **Auto-check:** `readytogo check` verifies this one.
- **Generate:** `readytogo icons <logo> --for favicon`
- **Steps:**
  1. Generate the set from your square logo.
  2. Paste the HTML snippet into your <head>.

## brand.copy: Tagline (under 60 chars) and 160-char description

- **Priority:** blocker · ~30 min · **Applies when:** the checklist applies
- **Why:** Every store, directory and meta tag reuses these. Write them once, well.
- **Needs product copy:** tagline, description
- **Steps:**
  1. Say what it does and for whom.
  2. Keep the tagline under 60 characters for Product Hunt.

## brand.social-preview: README banner and GitHub social preview (1280×640)

- **Priority:** recommended · ~20 min · **Applies when:** any of platform:library, platform:cli
- **Why:** Your repo is your landing page. Links to it show this image everywhere.
- **Steps:**
  1. Add a banner with logo and tagline to the top of your README.
  2. Upload a 1280×640 image under repo Settings > Social preview.
