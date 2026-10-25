# After launch

Reviews, iteration and the second wave.

Phase: Post-launch · Last verified: 2026-10-24 · Checklist applies when: always

## post.review-prompt: In-app review prompt after a success moment

- **Priority:** recommended · ~30 min · **Applies when:** any of mobile, store:mac_app_store
- **Why:** Ratings drive store ranking, and happy users rarely rate unprompted.
- **Steps:**
  1. (any of fw:expo) Expo: expo-store-review's requestReview().
  2. (any of fw:flutter) Flutter: the in_app_review package.
  3. (any of fw:swift) Swift: SwiftUI's requestReview environment action.
  4. (any of fw:kotlin) Kotlin: the Play In-App Review API.
  5. Ask only after a success moment, never on first launch.

## post.backlinks: Launch listings and mentions actually link back

- **Priority:** recommended · ~30 min · **Applies when:** any of store:website, store:github, store:npm
- **Why:** Directory and community listings only help if the link exists, is not nofollow-only everywhere, and the page is indexable.
- **Run:** `readytogo backlinks links.csv --target yoursite.com --verify`
- **Steps:**
  1. Collect the URLs of your listings (Product Hunt, directories, posts) into a text file, or export links from Google Search Console (Links, Top linking sites) or your SEO tool.
  2. Verify each still links to you and note rel flags; follow up on missing links.
  3. Review risky domains before taking any disavow action; do not disavow on heuristics alone.

## post.reply-reviews: Reply to every store review in the first month

- **Priority:** recommended · ~15 min · **Applies when:** any of store:app_store, store:play_store, store:mac_app_store, store:microsoft_store, store:chrome_web_store
- **Why:** Replies show future users you're listening and can turn 1-star into 4-star.
- **Steps:**
  1. Check reviews daily for the first two weeks.
  2. Thank, fix, then reply that it's fixed.

## post.issues: Triage GitHub issues within 48 hours

- **Priority:** recommended · ~30 min · **Applies when:** any of store:github
- **Why:** A fast first response turns bug reporters into contributors.
- **Steps:**
  1. Label new issues, close duplicates, and thank reporters.
  2. Pin a roadmap issue.

## post.aso: ASO iteration after 2–4 weeks

- **Priority:** recommended · ~60 min · **Applies when:** any of store:app_store, store:play_store
- **Why:** Your first screenshots and keywords are a guess. Data makes them better.
- **Steps:**
  1. Test a new first screenshot and keyword set.
  2. (any of store:play_store) Play: use store listing experiments.
  3. (any of store:app_store) App Store: use product page optimization.

## post.retro: Launch retrospective

- **Priority:** recommended · ~45 min · **Applies when:** the checklist applies
- **Why:** Know which channel drove signups before you plan the next one.
- **Steps:**
  1. Compare each channel's visits, signups and activation.
  2. (any of platform:desktop, platform:cli, platform:library) Compare downloads per registry and per OS.

## post.second-wave: Second-wave plan

- **Priority:** nice · ~30 min · **Applies when:** the checklist applies
- **Why:** Most products grow through repeated launches, not one big day.
- **Steps:**
  1. Plan the next feature launch.
  2. Relaunch on Product Hunt for a major version.
  3. (any of lang:rust) Announce each release on crates.io, Reddit and This Week in Rust.
