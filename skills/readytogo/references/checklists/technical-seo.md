# Technical SEO

Indexable pages that look good when shared.

Phase: Pre-launch · Last verified: 2026-10-24 · Checklist applies when: any of store:website

## seo.title-meta: Unique title (50–60 chars) and meta description (140–160)

- **Priority:** blocker · ~20 min · **Applies when:** the checklist applies
- **Why:** Search results and link previews use these first.
- **Auto-check:** `readytogo check` verifies this one.
- **Needs product copy:** name, tagline, description
- **Generate:** `readytogo seo <page.html|url>`
- **Steps:**
  1. Write a unique title and description for each page.
  2. (any of fw:nextjs) Next.js: export metadata (or generateMetadata) from each page.
  3. (any of fw:react_router) React Router: export a meta function from each route.

## seo.og: Open Graph and Twitter card tags with a 1200×630 image

- **Priority:** recommended · ~20 min · **Applies when:** the checklist applies
- **Why:** Without them, links on X, LinkedIn and Slack show as bare URLs.
- **Auto-check:** `readytogo check` verifies this one.
- **Generate:** `readytogo seo <page.html|url>`
- **Steps:**
  1. Add og:title, og:description, og:image and twitter:card.

## seo.prerender: Public pages are prerendered or server-rendered

- **Priority:** blocker · ~60 min · **Applies when:** any of render:spa
- **Why:** A client-rendered SPA shows search engines and link previews an empty page.
- **Steps:**
  1. (any of fw:react_vite) React + Vite: prerender the landing and marketing pages (vite-plugin-prerender, or move them to Astro).
  2. (any of fw:angular) Angular: enable SSR or prerendering with @angular/ssr.
  3. Check with curl that the HTML contains your headline.

## seo.noindex: No accidental noindex on production

- **Priority:** blocker · ~5 min · **Applies when:** the checklist applies
- **Why:** A leftover staging noindex hides your whole site from Google.
- **Auto-check:** `readytogo check` verifies this one.
- **Steps:**
  1. View source on production and search for 'noindex'.
  2. Check robots.txt doesn't Disallow: /.

## seo.sitemap: sitemap.xml and robots.txt

- **Priority:** recommended · ~15 min · **Applies when:** the checklist applies
- **Why:** Helps search engines find every page quickly.
- **Auto-check:** `readytogo check` verifies this one.
- **Steps:**
  1. (any of fw:nextjs) Next.js: add app/sitemap.ts and app/robots.ts.
  2. (any of fw:astro) Astro: add @astrojs/sitemap.
  3. Reference the sitemap from /robots.txt.

## seo.search-console: Google Search Console and Bing Webmaster verified

- **Priority:** recommended · ~15 min · **Applies when:** the checklist applies
- **Why:** Shows indexing errors and lets you submit your sitemap.
- **Steps:**
  1. Verify via a DNS TXT record.
  2. Submit your sitemap.

## seo.store-badges: Official store badges linking to live listings

- **Priority:** recommended · ~15 min · **Applies when:** any of mobile, platform:extension, store:mac_app_store, store:microsoft_store
- **Why:** Badges convert better than text links and reviewers check them.
- **Steps:**
  1. (any of store:app_store, store:mac_app_store) Use Apple's 'Download on the App Store' badge artwork unmodified.
  2. (any of store:play_store) Use the 'Get it on Google Play' badge from Google's badge generator.
  3. (any of platform:extension) Use the official Chrome Web Store and Firefox Add-ons badges.
  4. (any of store:microsoft_store) Use the Microsoft Store badge from the badge generator.

## seo.smart-banner: Smart App Banner for your iOS app

- **Priority:** nice · ~5 min · **Applies when:** any of store:app_store
- **Why:** Safari visitors get a one-tap install banner on your site.
- **Steps:**
  1. Add <meta name="apple-itunes-app" content="app-id=YOUR_ID"> to your pages.

## seo.software-schema: SoftwareApplication structured data

- **Priority:** nice · ~20 min · **Applies when:** any of mobile, platform:desktop, platform:extension
- **Why:** Lets Google show rating, price and OS for your app in results.
- **Auto-check:** `readytogo check` verifies this one.
- **Steps:**
  1. Add JSON-LD with @type SoftwareApplication, operatingSystem, applicationCategory and offers.

## seo.docs: Docs are public, indexable and fast

- **Priority:** recommended · ~60 min · **Applies when:** any of platform:api, platform:library, platform:cli
- **Why:** Developers find tools through docs search results.
- **Steps:**
  1. Host docs on your domain (docs.yourdomain.com or /docs).
  2. (any of store:crates_io) Rust: make sure docs.rs builds your crate; link it from the README.
  3. Add an llms.txt so AI assistants can read your docs.
