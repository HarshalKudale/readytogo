# Analytics and monitoring

Know what launch day did, and when something breaks.

Phase: Pre-launch · Last verified: 2026-10-24 · Checklist applies when: none of platform:library

## seo.analytics: Web analytics installed

- **Priority:** blocker · ~15 min · **Applies when:** any of store:website
- **Why:** You can't tell which launch channel worked without it.
- **Steps:**
  1. Install Plausible, Umami or GA4.
  2. Verify a pageview arrives.
  3. (any of region:eu) Respect cookie consent for EU visitors.

## an.product-events: Product analytics for signup, activation and your key action

- **Priority:** recommended · ~60 min · **Applies when:** any of platform:web, mobile, platform:desktop, platform:extension; none of data:none
- **Why:** Visits don't matter. You need to know who reached first value.
- **Steps:**
  1. (any of svc:posthog) PostHog/Mixpanel: track signup, activation and key action events.
  2. (any of platform:desktop) Desktop: make usage telemetry opt-in and say so in your privacy policy.
  3. Build one funnel from install or visit to activation.

## an.uptime: Uptime monitor and a status page

- **Priority:** recommended · ~20 min · **Applies when:** any of platform:web, platform:api
- **Why:** Find out your site is down before Product Hunt commenters tell you.
- **Steps:**
  1. Monitor your homepage and a health endpoint every minute.
  2. Alert to your phone, not just email.

## an.store-analytics: Store analytics enabled

- **Priority:** nice · ~10 min · **Applies when:** any of store:app_store, store:play_store
- **Why:** Impressions to installs is the number ASO improves.
- **Steps:**
  1. (any of store:app_store) App Store Connect: check App Analytics and opt in to sharing.
  2. (any of store:play_store) Play Console: turn on store listing acquisition reports.

## an.utm: UTM links for every launch channel

- **Priority:** recommended · ~10 min · **Applies when:** any of store:website
- **Why:** Without them, Product Hunt, Reddit and newsletters all show up as 'direct'.
- **Steps:**
  1. Use utm_source=<channel>&utm_campaign=launch on every link you post.

## an.downloads: Download and install counts tracked

- **Priority:** nice · ~10 min · **Applies when:** any of store:crates_io, store:npm, store:pypi, store:github
- **Why:** Registries and releases are your funnel. Watch them on launch day.
- **Steps:**
  1. (any of store:crates_io) crates.io shows daily downloads per version.
  2. (any of store:npm) npm: check npm-stat or the npm website's weekly downloads.
  3. (any of store:pypi) PyPI: use pypistats.
  4. (any of store:github) GitHub: release asset download counts via the API.
