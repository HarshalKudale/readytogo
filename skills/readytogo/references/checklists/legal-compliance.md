# Legal and compliance

The policies stores and users require. Templates are not legal advice.

Phase: Foundation · Last verified: 2026-10-24 · Checklist applies when: always

## legal.privacy: Privacy policy, publicly linked

- **Priority:** blocker · ~45 min · **Applies when:** any of data:personal, mobile, platform:extension, platform:desktop, platform:web, platform:api
- **Why:** Every app and extension store rejects listings without one, and the law requires it once you handle personal data.
- **Auto-check:** `readytogo check` verifies this one.
- **Steps:**
  1. List exactly what you collect and every third-party service that sees it.
  2. (any of mobile, platform:desktop, platform:extension) Link it from your app's settings screen and the store listing.
  3. (any of store:website) Link it in your site footer.

## legal.terms: Terms of service

- **Priority:** blocker · ~30 min · **Applies when:** any of platform:web, platform:api, data:accounts, paid
- **Why:** Limits your liability and sets the rules for accounts and payments.
- **Auto-check:** `readytogo check` verifies this one.
- **Steps:**
  1. Cover acceptable use, termination, liability and governing law.

## legal.license: Open-source license chosen and included

- **Priority:** blocker · ~10 min · **Applies when:** any of platform:library, platform:cli
- **Why:** Code without a license can't legally be used by anyone.
- **Auto-check:** `readytogo check` verifies this one.
- **Steps:**
  1. Pick a license (MIT or Apache-2.0 are common) and add a LICENSE file.
  2. (any of lang:rust) Rust: set license = "MIT OR Apache-2.0" in Cargo.toml.
  3. (any of store:npm) npm: set the license field in package.json.

## legal.refund: Refund and cancellation policy

- **Priority:** recommended · ~15 min · **Applies when:** any of paid
- **Why:** Payment providers and merchants of record require one.
- **Steps:**
  1. State the refund window and how to cancel.
  2. (any of pricing:subscription) Explain that cancelling stops the next renewal.

## legal.cookies: Cookie consent for EU/UK visitors

- **Priority:** recommended · ~30 min · **Applies when:** all of store:website, region:eu
- **Why:** Non-essential cookies need opt-in consent under GDPR and ePrivacy.
- **Steps:**
  1. Block analytics until consent, or use a cookieless analytics tool.

## legal.gdpr: GDPR basics: data requests and retention

- **Priority:** recommended · ~60 min · **Applies when:** all of region:eu, data:personal
- **Why:** EU users can ask you to export or delete their data.
- **Steps:**
  1. Document how you handle access, export and delete requests.
  2. Set retention periods for each data type.

## legal.ccpa: CCPA notice for California users

- **Priority:** recommended · ~30 min · **Applies when:** all of region:us, data:personal
- **Why:** California residents have the right to know and delete, and to opt out of data sales.
- **Steps:**
  1. Add a California section to your privacy policy.
  2. Add 'Do not sell or share' if you share data for ads.

## legal.dpdp: India DPDP Act notice and grievance contact

- **Priority:** recommended · ~30 min · **Applies when:** all of region:india, data:personal
- **Why:** Required when you process personal data of users in India.
- **Steps:**
  1. Add a consent notice and a named grievance contact to your policy.

## legal.coppa: COPPA: verifiable parental consent

- **Priority:** blocker · ~90 min · **Applies when:** any of data:kids
- **Why:** Collecting data from children under 13 without parental consent brings heavy fines and store removal.
- **Steps:**
  1. Get verifiable parental consent before collecting data from children.
  2. (any of mobile) Apple Kids category and Google Play Families have extra rules on ads and analytics SDKs.

## legal.deletion: Account deletion in-app and via the web

- **Priority:** blocker · ~120 min · **Applies when:** any of data:accounts
- **Why:** Apple and Google require it for any app that offers accounts, and GDPR requires it everywhere.
- **Steps:**
  1. Add a delete-account action in settings.
  2. (any of platform:android) Publish a web URL explaining how to delete. Google Play requires it in the listing.

## legal.ai: AI disclosure

- **Priority:** recommended · ~20 min · **Applies when:** any of ai:any
- **Why:** Users must know when they talk to AI and which providers see their data.
- **Steps:**
  1. Name your AI providers in the privacy policy.
  2. Label AI-generated output in the product.
  3. (any of ai:user_content) State whether user content is used for model training.

## legal.subprocessors: Sub-processor list matches the services you use

- **Priority:** recommended · ~20 min · **Applies when:** any of svc:supabase, svc:firebase, svc:clerk, svc:stripe, svc:sentry, svc:posthog; all of data:personal
- **Why:** Your privacy policy must name every service that handles user data.
- **Steps:**
  1. (any of svc:supabase) Supabase (database and auth)
  2. (any of svc:firebase) Firebase (Google)
  3. (any of svc:clerk) Clerk or Auth0 (authentication)
  4. (any of svc:stripe) Stripe (payments)
  5. (any of svc:sentry) Sentry (error reports can contain personal data)
  6. (any of svc:posthog) PostHog or Mixpanel (product analytics)

## legal.eula: EULA for the downloadable app

- **Priority:** recommended · ~30 min · **Applies when:** any of platform:desktop
- **Why:** Outside app stores, your installer needs its own license agreement.
- **Steps:**
  1. Show the EULA in the installer or on first launch.
  2. Link it from your download page.

## legal.oss-notices: Third-party license notices bundled

- **Priority:** nice · ~30 min · **Applies when:** any of platform:desktop, mobile, platform:extension
- **Why:** Most open-source licenses require attribution in what you distribute.
- **Steps:**
  1. (any of lang:rust) Rust: generate notices with cargo-about or cargo-deny.
  2. (any of bundle:js) JavaScript: generate notices with license-checker or rollup-plugin-license.
  3. (any of fw:flutter) Flutter: showLicensePage() lists package licenses automatically.
  4. Show them in an About or Licenses screen.
