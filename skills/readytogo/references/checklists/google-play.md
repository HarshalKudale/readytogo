# Google Play

Console setup, listing assets and the data safety form.

Phase: Pre-launch · Last verified: 2026-10-24 · Checklist applies when: any of store:play_store

## play.account: Play Console account verified

- **Priority:** blocker · ~30 min · **Applies when:** the checklist applies
- **Why:** Identity verification can take several days.
- **Steps:**
  1. Register at play.google.com/console ($25 one-time).
  2. Complete identity verification.

## play.closed-test: Closed test with the required testers (new personal accounts)

- **Priority:** blocker · ~120 min · **Applies when:** the checklist applies
- **Why:** New personal accounts need a closed test before they get production access.
- **Steps:**
  1. Run a closed test with the required number of testers for the required days.

## play.copy: Title (30), short description (80), full description (4,000)

- **Priority:** blocker · ~45 min · **Applies when:** the checklist applies
- **Why:** Play indexes the full description for search, unlike the App Store.
- **Needs product copy:** name, tagline, description
- **Generate:** `readytogo listing <fields.json>` (field ids: gp_title, gp_short, gp_full)
- **Steps:**
  1. Front-load the short description with your main benefit.

## play.graphics: 512×512 icon and 1024×500 feature graphic

- **Priority:** blocker · ~30 min · **Applies when:** the checklist applies
- **Why:** Both are required before you can publish.
- **Generate:** `readytogo icons <master-icon.png|svg> --for play_store` · `readytogo shot <screenshot> --target <id>` · `readytogo promo --target <id> --title "…"` (ids: play_phone, play_tablet7, play_tablet, play_feature)
- **Asset ids needed:** play_feature
- **Steps:**
  1. Export the icon at 512×512 PNG.
  2. Design a 1024×500 feature graphic without small text.

## play.screenshots: Phone screenshots (2–8)

- **Priority:** blocker · ~45 min · **Applies when:** the checklist applies
- **Why:** Required, and the main driver of installs.
- **Generate:** `readytogo shot <screenshot> --target <id>` · `readytogo promo --target <id> --title "…"` (ids: play_phone, play_tablet7, play_tablet, play_feature)
- **Asset ids needed:** play_phone, play_tablet7, play_tablet
- **Steps:**
  1. Upload 1080×1920 screenshots with short captions.

## play.data-safety: Data safety form consistent with your privacy policy

- **Priority:** blocker · ~30 min · **Applies when:** the checklist applies
- **Why:** Inconsistencies get apps removed.
- **Steps:**
  1. Declare every data type your app and its SDKs collect or share.
  2. (any of svc:firebase) Firebase SDKs collect device identifiers. Declare them.

## play.target-api: Targets the currently required Android API level

- **Priority:** blocker · ~30 min · **Applies when:** the checklist applies
- **Why:** Play blocks new apps and updates that target an old API level.
- **Auto-check:** `readytogo check` verifies this one.
- **Steps:**
  1. (any of fw:expo) Expo: upgrade to a current SDK; it sets targetSdkVersion for you.
  2. (any of fw:flutter) Flutter: check targetSdkVersion in android/app/build.gradle.
  3. (any of fw:kotlin) Kotlin: set targetSdk in your module's build.gradle.kts.

## play.ratings: Content rating, target audience and ads declarations

- **Priority:** blocker · ~20 min · **Applies when:** the checklist applies
- **Why:** Required before release, and wrong answers cause takedowns.
- **Steps:**
  1. Complete the IARC questionnaire.
  2. Declare target audience and whether the app shows ads.
