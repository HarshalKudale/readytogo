# 2D mockups, store screenshots and promo art

You **author** these. No command generates a mockup; the skill gives you OS frames, an HTML composer, a promo starter and guidelines, and the CLI converts and checks what you make. That is deliberate: a tool would give every product the same picture.

Before starting, settle the media with the user (`references/capture.md`): their files, or fresh captures.

## What you start from

| Asset | What it is |
|---|---|
| `assets/frames/frames.css` + `frames.js` | 7 original OS window frames as HTML/CSS, light and dark: **browser** `browser-macos-tabs`, `browser-macos-compact`, `browser-windows-tabs`, `browser-linux`; **desktop app** `app-macos`, `app-windows`, `app-linux`. Scale to any width (`--fw`), no vendor logos. |
| `assets/frames/compose.html` | A ready composer: `?frame=…&theme=…&screen=/shot.png|/rec.webm&url=…&tab=…&bg=…&pad=…`. Render it directly, or copy it as the base of your own page. |
| `templates/promo/tile.html` | Starter for text + logo + screenshot art. Copy and restyle. |
| `readytogo scaffold frames\|promo` | Copies these into the project (`.readytogo/mockups/…`) so you can edit freely. |

Render any page to an exact size with `readytogo render <page> --size WxH --out file.png` (WebM/MP4/GIF with `--video`). Serve root is the project; the skill's own files are under `/__skill/…`.

## The core loop

1. **Decide** the surface, size, story and copy (below).
2. **Compose** in HTML: frame + screenshot or recording + background + headline. Start from `compose.html` for a single framed shot, or write your own page that imports `frames.js` for sets with captions.
3. **Render** at the exact pixel size.
4. **Verify** against the spec: `readytogo verify out.png --target <id>` (size, format, alpha, bytes).
5. **Look at it** (open the PNG). Check text legibility at 25% zoom, cropping, contrast, and that nothing in the UI is wrong or personal.

```bash
# a framed hero on a gradient, 1920x1080
readytogo render "/__skill/assets/frames/compose.html?frame=browser-macos-tabs&theme=dark&screen=/capture/home-dark.png&url=acme.com/app&tab=Dashboard&bg=linear-gradient(135deg,%23e0e7ff,%23fce7f3)" --size 1920x1080 --out hero.png
# a desktop app on Windows
readytogo render "/__skill/assets/frames/compose.html?frame=app-windows&theme=light&screen=/capture/main.png&title=Acme&bg=%230f172a" --size 1600x1000 --out win.png
# a 8 s framed screen recording as a WebM (compose.html plays the recording frame-exactly)
readytogo render "/__skill/assets/frames/compose.html?frame=browser-windows-tabs&screen=/capture/flow.webm&url=acme.com" --size 1280x720 --video flow-framed.webm
```

## Choose the frame

| Product / surface | Frame | Notes |
|---|---|---|
| Web app on a landing hero or Product Hunt | `browser-macos-tabs` or `browser-windows-tabs` | Use the real domain in `url=`; never `localhost`. Match theme to the app so the chrome does not clash. |
| Mac/Windows/Linux desktop app | `app-macos`, `app-windows`, `app-linux` | Match the OS the user's customers use most; show the app's own title. Do **not** frame an app that has a custom title bar; capture the window as it is. |
| Linux audience | `browser-linux`, `app-linux` | |
| Extension popup / panel | none: use a rounded card on a background | Crop the popup tight, round the corners (CSS `border-radius`), add a soft shadow. A popup inside a browser frame is tiny and unreadable. Best: the extension **acting on a real page** in `browser-*`. |
| Phone UI | 3D phone scene (`mockups-3d.md`), or the plain screenshot with rounded corners | Store phone screenshots are plain (`readytogo shot`). |
| Store screenshots | **plain screenshot**, optionally with a caption band | The store already frames them. Use `readytogo shot`, or compose caption + screenshot at the exact size and `verify`. |

## Composition guidelines

1. **One message per image.** Each image answers one question: what is it, what is the main benefit, what is the best feature, why trust it. First two images do most of the work; many surfaces show only those.
2. **Order tells a story.** hero benefit → 2–3 core workflows → proof or integrations → call to action (if the store allows text overlays).
3. **Headline ≤ 6 words**, verb-led ("Plan your week in seconds"), same font, size and position on every image in a set. Text height ≥ 4% of image height, contrast ≥ 4.5:1.
4. **Frame scale**: the frame should fill 60–85% of the canvas width. Tiny devices in a big empty canvas read as unfinished.
5. **Background**: a soft two-colour gradient from the logo colours, or a flat tint; never a busy photo. Ensure separation: white UI on a white background needs a shadow or tint.
6. **Consistency across a set**: one background style, one frame style, one type system, one accent colour. Do not mix framed and unframed images in one gallery.
7. **Margins**: keep important content 8% from edges; stores crop and round corners.
8. **Light vs dark**: pick the product's most flattering default, not the one with empty states. Dark frames pair with dark apps.
9. **Honesty**: only what the product does today. No pricing, "#1", awards, competitor names, or vendor badges (unless the vendor's official badge is supplied by the user under its guidelines).
10. **Accessibility**: real text, not text in images where a page can carry it; alt text for any image placed on a web page (describe the content, not "screenshot").

## Promo tiles, feature graphics, OG and social images

Sizes and requirements: `readytogo specs --store <store>` (ids like `cws_small`, `cws_marquee`, `play_feature`, `ms_*`, `og`, `x_card`, `linkedin_card`, `github_social`, `yt_thumb`, `ph_thumb`).

- Design as HTML at the exact size (copy `templates/promo/tile.html`; use `vmin` units so it scales), include logo, product name, one benefit line, and optionally a framed screenshot on the right.
- Small tiles (440×280, 240×240) are read as thumbnails: one short line, big logo; if you cannot read it at 25% zoom, cut words.
- Keep key content in the centre 80% (marquees and feature graphics get cropped differently by each surface).
- Flatten for store uploads (no alpha): `render` without `--transparent` gives an opaque PNG; `readytogo verify` flags alpha for store targets.
- OG/social: logo + title + one line, no tiny text; test the unfurl with `readytogo seo <url>` after deploying.

## Multi-image sets (store galleries)

1. Write the story (3–5 images) and one headline each.
2. Capture one clean screenshot per headline at the target aspect.
3. Plain set: `readytogo shot` each. Captioned set: one HTML per image at the store's exact size (caption + screenshot), render, `verify`.
4. Review the set side by side: read headlines in order, check positions and styles are identical.
5. Name files in order: `01-hero.png`, `02-search.png`…

## Common mistakes

- Status bars with low battery, a real name, or notifications; localhost URLs; debug banners; lorem ipsum.
- Marketing text promising something the app does not do (a common rejection reason).
- The same screenshot at different sizes with heavy cropping (key UI cut off).
- Thin fonts or mid-tone-on-gradient text at thumbnail size.
- A popup squeezed into a browser frame; a portrait screenshot on a laptop screen (it will be cropped).
