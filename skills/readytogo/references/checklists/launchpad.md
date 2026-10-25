# Launchpad

Where you launch. Each platform is one item with its own steps.

Phase: Launch week · Last verified: 2026-10-24 · Checklist applies when: always

## launch.product-hunt: Product Hunt

- **Priority:** recommended · ~240 min · **Applies when:** the checklist applies
- **Why:** A good launch day brings thousands of early adopters and backlinks.
- **Needs product copy:** name, tagline, description, url
- **Generate:** capture a real screenshot (references/capture.md), then `readytogo shot <file> --target <id>` · design it as HTML at the exact size (references/mockups.md), `readytogo render` it, then `readytogo verify <file> --target <id>` (ids: product_hunt, ph_thumb) · `readytogo listing <fields.json>` (field ids: ph_name, ph_tagline, ph_description)
- **Run:** `readytogo backlinks <listing-urls.txt> --target yoursite.com --verify   (after you are listed)`
- **Steps:**
  1. Warm up your maker account 2–3 weeks ahead: comment and upvote genuinely.
  2. Schedule for 12:01 AM Pacific. Weekends are easier to rank.
  3. (any of platform:api, platform:cli, platform:library) Topics: Developer Tools, plus Open Source if the repo is public.
  4. Gallery: 3–5 images at 1270×760 and a 240×240 thumbnail.
  5. (any of platform:cli) Lead the gallery with your terminal demo GIF.
  6. Maker comment: why you built it, who it's for, one question.
  7. (any of paid) Add a launch-day discount to the maker comment.
  8. (all of paid, svc:stripe) Stripe: create a PH30 promo code.
  9. Tell supporters you're live (never ask for upvotes) and reply to every comment.

## launch.show-hn: Hacker News (Show HN)

- **Priority:** recommended · ~60 min · **Applies when:** any of platform:web, platform:desktop, platform:api, platform:cli, platform:library
- **Why:** Hacker News sends thousands of technical early adopters in a day.
- **Needs product copy:** name, url
- **Run:** `readytogo backlinks <listing-urls.txt> --target yoursite.com --verify   (after you are listed)`
- **Steps:**
  1. Title: 'Show HN: <Name> – <what it does>', plainly, with no superlatives.
  2. Link to something people can try without signing up, if you can.
  3. (any of store:github) Open-source? Link the repo; HN favours it.
  4. Post on a weekday morning US time, then stay in the comments for the first few hours.

## launch.peerpush: PeerPush

- **Priority:** recommended · ~30 min · **Applies when:** the checklist applies
- **Why:** A maker-focused launch platform: an extra launch day, a backlink and early users.
- **Needs product copy:** name, tagline, description, url
- **Run:** `readytogo backlinks <listing-urls.txt> --target yoursite.com --verify   (after you are listed)`
- **Steps:**
  1. Create your product page on PeerPush.
  2. Reuse the tagline, description, screenshots and links from your kit.
  3. Share the page on launch day and reply to comments.

## launch.alternativeto: AlternativeTo

- **Priority:** recommended · ~30 min · **Applies when:** any of platform:web, platform:desktop, mobile, platform:extension
- **Why:** People search 'alternative to X' at the exact moment they're ready to switch.
- **Needs product copy:** name, description, url
- **Run:** `readytogo backlinks <listing-urls.txt> --target yoursite.com --verify   (after you are listed)`
- **Steps:**
  1. Add your app with a description, screenshots and links.
  2. List it as an alternative to the 3–5 best-known tools you replace.
  3. (any of platform:desktop) Tick every platform you ship: Mac, Windows and Linux.
  4. (any of platform:ios) Tick iPhone and iPad, and link the App Store listing.
  5. (any of platform:android) Tick Android, and link the Google Play listing.
  6. (any of platform:extension) Mark it as a browser extension and link the store listing.
  7. (any of store:github) Mark the license as open source and link the repo.
  8. (any of pricing:free; none of store:github) Mark the license as free.

## launch.betalist: BetaList

- **Priority:** nice · ~20 min · **Applies when:** any of platform:web, mobile
- **Why:** Reaches early adopters who sign up for products before they launch.
- **Needs product copy:** name, tagline, url
- **Run:** `readytogo backlinks <listing-urls.txt> --target yoursite.com --verify   (after you are listed)`
- **Steps:**
  1. Submit before your public launch; the free queue takes weeks.
  2. Link to a page with a signup or waitlist.

## launch.uneed: Uneed

- **Priority:** nice · ~20 min · **Applies when:** none of platform:library
- **Why:** A daily launch board with a backlink for ranked products.
- **Needs product copy:** name, tagline, description, url
- **Run:** `readytogo backlinks <listing-urls.txt> --target yoursite.com --verify   (after you are listed)`
- **Steps:**
  1. Submit your product and pick a launch date.
  2. Share it on launch day: ranking depends on upvotes that day.

## launch.microlaunch: Microlaunch

- **Priority:** nice · ~20 min · **Applies when:** none of platform:library
- **Why:** A month-long launch window that keeps sending traffic after day one.
- **Needs product copy:** name, tagline, url
- **Run:** `readytogo backlinks <listing-urls.txt> --target yoursite.com --verify   (after you are listed)`
- **Steps:**
  1. Submit your product with screenshots.
  2. Reply to comments and feedback during your launch month.

## launch.devhunt: DevHunt

- **Priority:** recommended · ~20 min · **Applies when:** any of platform:api, platform:cli, platform:library
- **Why:** A launch board just for developer tools: the audience is exactly your users.
- **Needs product copy:** name, tagline, url
- **Run:** `readytogo backlinks <listing-urls.txt> --target yoursite.com --verify   (after you are listed)`
- **Steps:**
  1. Submit with your GitHub repo and a demo GIF.
  2. Launch on a weekday and share in your developer circles.

## launch.indie-hackers: Indie Hackers

- **Priority:** nice · ~45 min · **Applies when:** any of platform:web, mobile, platform:desktop, platform:extension
- **Why:** Founders there read launch stories and become early users and advocates.
- **Run:** `readytogo backlinks <listing-urls.txt> --target yoursite.com --verify   (after you are listed)`
- **Steps:**
  1. Write a launch post with numbers: what you built, how long it took, what's next.
  2. Add your product to the Indie Hackers product directory.

## launch.saashub: SaaSHub

- **Priority:** nice · ~20 min · **Applies when:** any of platform:web, platform:api
- **Why:** Compares you against named alternatives and ranks well for 'X alternatives'.
- **Needs product copy:** name, description, url
- **Run:** `readytogo backlinks <listing-urls.txt> --target yoursite.com --verify   (after you are listed)`
- **Steps:**
  1. Claim or add your product page.
  2. Add the alternatives you compete with.

## launch.taaft: There's An AI For That

- **Priority:** recommended · ~20 min · **Applies when:** any of ai:any
- **Why:** The biggest AI tool directory, with heavy search traffic for AI use cases.
- **Needs product copy:** name, tagline, url
- **Run:** `readytogo backlinks <listing-urls.txt> --target yoursite.com --verify   (after you are listed)`
- **Steps:**
  1. Submit with a clear use-case title (the task your AI does).
  2. Pick the task category your users search for.

## launch.futurepedia: Futurepedia

- **Priority:** nice · ~20 min · **Applies when:** any of ai:any
- **Why:** A large AI tools directory with category pages that rank in search.
- **Needs product copy:** name, description, url
- **Run:** `readytogo backlinks <listing-urls.txt> --target yoursite.com --verify   (after you are listed)`
- **Steps:**
  1. Submit your tool with pricing and category.
  2. Add screenshots of the AI feature in action.
