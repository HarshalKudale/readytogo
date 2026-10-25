# Mockups and store screenshots: composition guidelines

Use this when you are choosing *what* to make and *how it should look*. Commands are in `commands.md`; pixel sizes in `store-specs.md`.
Principles first, then recipes by destination. These are design guidelines, not store rules; where a store has a hard rule it is in the checklist, and stores change them, so verify before relying on a rule.

## Principles

1. **One message per image.** A user scans the gallery in seconds. Each image answers one question: what is it, what is the main benefit, what is the best feature, why trust it.
2. **Order tells a story.** 1 hero benefit → 2–3 core features/workflows → proof or integrations → call to action (if the store allows text overlays). The first two images do most of the work; many surfaces show only those.
3. **Show the real product, framed well.** Real UI, believable data, a clean state. A device frame adds polish on social and web; **store listings often look better with edge-to-edge or lightly framed screenshots** because the store UI already frames them. Default: store screenshots plain (via `shot`), web/social/launch art framed (via `frame`).
4. **Headline copy ≤ 6 words**, ≥ 4% of the image height in size, high contrast, same font family and position on every image in the set. Verbs over nouns ("Plan your week in seconds").
5. **Consistency across the set**: one background style, one frame style, one type system, one accent colour taken from the logo.
6. **Margins**: keep important content 8% from the edges; stores crop and round corners.
7. **Light and dark**: pick one for the gallery. Use the product's most flattering default, not the one with empty states.
8. **Accessibility of the art**: text contrast ≥ 4.5:1; never rely on colour alone; keep alt text for any image you also place on a web page (describe the content, not "screenshot").

## Choosing the mockup

| Destination | Product | Recommended |
|---|---|---|
| App Store / Play screenshots | mobile | `shot` at the target id; optional caption band at the top added in HTML (`templates/promo/tile.html` pattern) for story-style sets |
| Mac App Store, Microsoft Store, desktop site | desktop | `shot` for the listing; `frame --frame window` (dark or light to match the app) or `laptop` for site/launch art |
| Chrome / Edge / Firefox gallery | extension | `shot` at 1280×800, **the extension on a realistic page** (popup open, side panel, content-script UI visible); crop to show the value, not the toolbar clutter |
| Landing page hero | web | `frame --frame browser --size hero --url yourdomain.com`; or a 3D hero (`mockups-3d.md`) |
| OG / link preview | any | `promo --target og` (text + logo) or `frame --frame browser --size og` for a product shot |
| Product Hunt gallery (1270×760) and thumbnail | any | `shot --target product_hunt` for stills; a short 3D loop or GIF as the first item draws the eye; thumbnail via `promo --target ph_thumb` (logo only) |
| Social cards / banners | any | `promo --target x_card|linkedin_card|x_header|linkedin_banner|yt_thumb`; keep the logo and title in the centre 70% |
| README / docs | CLI, library | `annotate --mode highlight` on a real screenshot; terminal recordings; a diagram beats a mockup |
| GitHub social preview | repo | `promo --target github_social` (1280×640) |

## Frame choices

- **phone**: modern rounded-rect with island; for iOS and Android alike. Use `--color` to match a dark/light finish. Landscape canvas (`--size landscape`) with a gradient `--bg`; or `--size none` and composite several phones yourself.
- **tablet**: iPad-style; use for tablet listings or showing responsive layouts.
- **browser** with `--url`: web apps; use your real domain, never `localhost` or a placeholder.
- **window** (`--dark` optional): desktop apps without a browser bar.
- **laptop**: marketing hero for web/desktop; give it a **landscape screenshot** (≈ 16:10), a portrait one will be cropped to its top.

Backgrounds: a soft two-colour gradient from the logo colours (`grad:#hex,#hex,135`) or a flat tint of the brand colour. Avoid busy photos and pure white behind white UIs (no separation).

## Building multi-image sets

1. Decide the story (3–5 images) and write one headline each.
2. Capture one clean screenshot per headline, at the target aspect (`assets.md` §3).
3. For plain sets: `shot` each. For captioned sets: build a small HTML (copy `templates/promo/tile.html` or write your own with a fixed `--size`) containing headline + screenshot, render each at the store's exact pixels.
4. Check the set side by side: read headlines in order, confirm the same positions, run `readytogo specs --store <store>` to be sure of count and sizes.
5. Name files so the order is obvious: `01-hero.png`, `02-search.png`…

## Common mistakes

- Screenshots with the OS status bar showing a low battery, real name, or random notifications.
- Marketing text that promises something the app does not do (a common rejection reason).
- Using the same screenshot at different sizes with heavy cropping (key UI cut off).
- Dark text on a mid-tone gradient; thin fonts at thumbnail size.
- Tiny phones in a big empty canvas. Scale the device to fill 60–80% of the height.
- Mixing frame styles (some images framed, some not) in one gallery.
