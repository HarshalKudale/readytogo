# Launch visuals

Mockups, demos and images for your listings and posts.

Phase: Build assets · Last verified: 2026-10-24 · Checklist applies when: always

## assets.mockups: 2–3 device mockups of your main screens

- **Priority:** recommended · ~20 min · **Applies when:** any of platform:web, mobile, platform:desktop, platform:extension
- **Why:** A product shot in a device frame reads as a real product at a glance.
- **Generate:** frame the screenshot: see `references/mockups.md` (OS frames in assets/frames, device scene in templates/3d) · 3D scene: see `references/mockups-3d.md`
- **Steps:**
  1. Pick your 3 strongest screens.
  2. Drop them into a frame that matches where it runs.

## assets.og-image: 1200×630 share image

- **Priority:** recommended · ~15 min · **Applies when:** any of store:website
- **Why:** Used whenever someone shares your link on X, LinkedIn, Slack or WhatsApp.
- **Auto-check:** `readytogo check` verifies this one.
- **Generate:** design it as HTML at the exact size (references/mockups.md), `readytogo render` it, then `readytogo verify <file> --target <id>` (ids: og) · frame the screenshot: see `references/mockups.md` (OS frames in assets/frames, device scene in templates/3d)
- **Asset ids needed:** og
- **Steps:**
  1. Use a mockup or your logo with your tagline.
  2. Export at 1200×630 and reference it as og:image.

## assets.terminal-demo: Terminal demo GIF

- **Priority:** recommended · ~30 min · **Applies when:** any of platform:cli
- **Why:** One looping GIF of your CLI in action sells it faster than any paragraph.
- **Steps:**
  1. Script the demo with VHS (charmbracelet/vhs) so it's reproducible.
  2. Keep it under 20 seconds and put it at the top of the README.

## assets.quickstart: Copy-paste quickstart that works in under a minute

- **Priority:** blocker · ~45 min · **Applies when:** any of platform:library, platform:api, platform:cli
- **Why:** Developers decide in the first 60 seconds whether your tool is worth it.
- **Steps:**
  1. (any of lang:rust) Rust: cargo add <crate> plus a 10-line example that compiles.
  2. (any of store:npm) JavaScript: npm i <pkg> plus a runnable snippet.
  3. (any of store:pypi) Python: pip install <pkg> plus a runnable snippet.
  4. (any of platform:api) API: a curl request with a test key that returns real data.
  5. Run it yourself in a fresh environment.

## assets.demo-video: 30–60 second demo video

- **Priority:** nice · ~90 min · **Applies when:** any of platform:web, mobile, platform:desktop, platform:extension
- **Why:** Product Hunt, landing pages and store previews all convert better with motion.
- **Steps:**
  1. Show one problem and its solution, with no intro.
  2. (any of os:macos) macOS: record with the built-in screen recorder (Cmd+Shift+5).
  3. (any of store:app_store) App Store app previews: 15–30 seconds, recorded on device.
