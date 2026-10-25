# Apple App Store

Listing, assets and privacy answers App Review checks.

Phase: Pre-launch · Last verified: 2026-10-24 · Checklist applies when: any of store:app_store, store:mac_app_store

## appstore.membership: Apple Developer Program membership active

- **Priority:** blocker · ~30 min · **Applies when:** the checklist applies
- **Why:** You can't submit without it, and enrollment can take days.
- **Steps:**
  1. Enroll at developer.apple.com ($99/year).
  2. Organizations need a D-U-N-S number.

## appstore.copy: Name (30), subtitle (30), keywords (100) and description

- **Priority:** blocker · ~45 min · **Applies when:** the checklist applies
- **Why:** These fields drive App Store search ranking.
- **Needs product copy:** name, tagline, description
- **Generate:** `readytogo listing <fields.json>` (field ids: as_name, as_subtitle, as_promo, as_keywords, as_description)
- **Steps:**
  1. Don't repeat words between name, subtitle and keywords.
  2. Separate keywords with commas, no spaces.

## appstore.icon: 1024×1024 app icon, no transparency

- **Priority:** blocker · ~10 min · **Applies when:** the checklist applies
- **Why:** App Store Connect rejects icons with an alpha channel.
- **Auto-check:** `readytogo check` verifies this one.
- **Generate:** `readytogo icons <master-icon.png|svg> --for app_store`
- **Steps:**
  1. Export from your logo on a solid background.

## appstore.screenshots: iPhone 6.9-inch screenshots (and iPad if supported)

- **Priority:** blocker · ~60 min · **Applies when:** any of store:app_store
- **Why:** Screenshots are the biggest factor in install conversion.
- **Generate:** capture a real screenshot (references/capture.md), then `readytogo shot <file> --target <id>` (ids: app_store, ipad)
- **Steps:**
  1. Upload 3–10 screenshots at 1320×2868.
  2. Lead with your strongest benefit.

## appstore.mac-screenshots: Mac App Store screenshots (16:10, e.g. 2880×1800)

- **Priority:** blocker · ~45 min · **Applies when:** any of store:mac_app_store
- **Why:** The Mac App Store needs its own desktop-sized screenshots.
- **Generate:** capture a real screenshot (references/capture.md), then `readytogo shot <file> --target <id>` (ids: mac_app_store)
- **Steps:**
  1. Upload 1–10 screenshots at 1280×800, 1440×900, 2560×1600 or 2880×1800.

## appstore.sandbox: App Sandbox entitlements set

- **Priority:** blocker · ~60 min · **Applies when:** any of store:mac_app_store
- **Why:** Every Mac App Store app must run sandboxed with only the entitlements it needs.
- **Steps:**
  1. (any of fw:electron) Electron: build the mas target with entitlements.mas.plist and entitlements.mas.inherit.plist.
  2. (any of fw:tauri) Tauri: add an Entitlements.plist with com.apple.security.app-sandbox and set bundle.macOS.entitlements.
  3. (any of fw:gpui, fw:egui_iced, fw:slint) Rust native: sign the .app with an entitlements file containing com.apple.security.app-sandbox and a Mac App Store provisioning profile.
  4. Request only what you use (network client, user-selected files).

## appstore.privacy-label: App Privacy nutrition label answered accurately

- **Priority:** blocker · ~30 min · **Applies when:** the checklist applies
- **Why:** Mismatches with your SDKs' behaviour are a common rejection reason.
- **Steps:**
  1. List data collected by your code and by every third-party SDK.
  2. (any of svc:firebase) Include Firebase Analytics/Crashlytics collection.
  3. (any of svc:sentry) Include crash data sent to Sentry.

## appstore.privacy-manifest: Privacy manifest and required-reason APIs declared

- **Priority:** blocker · ~30 min · **Applies when:** any of store:app_store
- **Why:** Apple rejects uploads whose SDKs use required-reason APIs without a PrivacyInfo.xcprivacy.
- **Auto-check:** `readytogo check` verifies this one.
- **Steps:**
  1. Add PrivacyInfo.xcprivacy declaring required-reason APIs (UserDefaults, file timestamps and so on).
  2. (any of fw:expo) Expo: set ios.privacyManifests in app.json.
  3. (any of fw:flutter) Flutter: update plugins to versions that ship their own privacy manifests.

## appstore.siwa: Sign in with Apple, if you offer other social logins

- **Priority:** blocker · ~60 min · **Applies when:** all of store:app_store, data:accounts
- **Why:** Guideline 4.8 requires an equivalent privacy-focused login option.
- **Steps:**
  1. (any of fw:expo) Expo: add expo-apple-authentication.
  2. (any of svc:supabase) Supabase: enable the Apple provider in Auth settings.
  3. (any of svc:clerk) Clerk: enable Apple as a social connection.

## appstore.review-notes: Demo account and review notes

- **Priority:** recommended · ~15 min · **Applies when:** any of data:accounts
- **Why:** Reviewers reject apps they can't sign into.
- **Steps:**
  1. Create a demo account with sample data.
  2. Explain any non-obvious features.

## appstore.testflight: TestFlight beta before submission

- **Priority:** recommended · ~60 min · **Applies when:** any of store:app_store
- **Why:** Catches crashes on real devices before App Review does.
- **Steps:**
  1. Invite 5–10 testers.
  2. (any of fw:expo) Expo: eas build --profile production, then eas submit -p ios sends it to TestFlight.
  3. (any of fw:flutter) Flutter: flutter build ipa, then upload with Transporter.
  4. Fix crash reports before submitting.
