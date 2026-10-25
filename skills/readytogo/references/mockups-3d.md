# 3D mockups and motion (three.js)

Use 3D for **marketing surfaces**: landing-page hero, Product Hunt gallery/loop, social posts, README banner, launch video. Do not use it for the store's own screenshot slots; those want plain screenshots (`readytogo shot`).

Everything here is built and verified: `templates/3d/device-scene.html` renders a procedural phone, tablet, laptop, phone pair, or your own GLB, and `readytogo render` turns it into PNG, transparent PNG, WebM/MP4/GIF. No model files are required.

## How it works

```
screenshot.png ─▶ device-scene.html?…  ─▶ readytogo render ─▶ hero.png | loop.mp4 | loop.webm (alpha) | loop.gif
                   (three.js, pure function of time)         (headless Chromium, steps window.__seek(t))
```

- The page exposes `window.__seek(seconds)` which renders exactly that moment, `window.__duration`, and sets `window.__ready = true` when textures/models are loaded. The renderer steps through time frame by frame, so output never drops or repeats frames.
- Pass `capture=1` when rendering (turns off the live animation loop). Open the page in a browser **without** `capture` for a live preview of the same animation.
- Needs `npm i -D playwright && npx playwright install chromium` (`readytogo doctor`). three.js loads from a pinned CDN URL; for offline/CI see "Offline" below.

## Quick recipes

```bash
T="/__skill/templates/3d/device-scene.html"

# Hero still, transparent background, three-quarter angle
readytogo render "$T?device=phone&screen=/shots/home.png&anim=none&angle=-28&capture=1" \
  --size 2400x1800 --transparent --out hero.png

# Laptop opening, held, closing: a seamless 6 s loop on a gradient
readytogo render "$T?device=laptop&screen=/shots/dashboard-16x10.png&anim=open&duration=6&capture=1&bg=linear-gradient(135deg,%23eef2ff,%23c7d2fe)" \
  --size 1920x1080 --duration 6 --fps 30 --video loop.mp4

# Two phones drifting in opposite phase, transparent WebM for the website
readytogo render "$T?device=phone-pair&screen=/shots/a.png&screen2=/shots/b.png&anim=hero-pair&duration=6&capture=1" \
  --size 1600x1000 --transparent --duration 6 --fps 30 --video pair.webm

# Turntable GIF for the Product Hunt gallery (keep it small)
readytogo render "$T?device=phone&screen=/shots/home.png&anim=turntable&duration=4&capture=1&bg=%230f172a" \
  --size 800x800 --duration 4 --fps 15 --video turn.gif

# Single frame of an animation (check the laptop when fully open)
readytogo render "$T?device=laptop&screen=/s.png&anim=open&capture=1" --size 1600x1000 --at 2.4 --out check.png
```

Paths like `/shots/home.png` are relative to `--root` (default: the current project). URL-encode `#` as `%23` and spaces/commas in CSS values.

## Parameters

| Param | Values | Default | Notes |
|---|---|---|---|
| `device` | `phone` `tablet` `laptop` `phone-pair` `model` | `phone` | `model` loads `model=<glb url>` |
| `screen`, `screen2` | image URL | placeholder gradient | `screen2` is the second phone of a pair |
| `anim` | `none` `float` `turntable` `orbit` `reveal` `open` `hero-pair` | `float` | see motion table |
| `duration` | seconds | `6` | loop length; periodic motion repeats exactly once per duration |
| `angle` | degrees yaw | `-26` | negative turns the device's left side toward the camera |
| `pitch` | degrees | `-5`, laptop `18` | positive looks down on it (needed to see a laptop keyboard) |
| `color`, `finish` | hex, `titanium` `matte` `gloss` | `#2b2b30`, `titanium` | body colour and material |
| `bg` | `transparent` or CSS background | `transparent` | CSS gradients/colours; **URL-encode** |
| `shadow` | `0` | on | ground contact shadow |
| `zoom`, `fov` | number | `1`, `30` | `zoom` 1.2 crops tighter; keep fov 25–35 |
| `model`, `screenMesh`, `screenAspect`, `flipY` | url, mesh name, number, `1` | –, `Screen`, `0.5`, – | GLB path, its screen mesh, that mesh's width ÷ height, flip; see contract |
| `capture` | `1` | – | for `readytogo render` |

The scene auto-frames the device (measured fully open, unrotated) for the canvas size, so changing `--size` or aspect never clips it.

## Choosing device, screen and framing from the product

| Profile tags | Device | Screenshot to feed it | Why |
|---|---|---|---|
| `platform:ios` / `platform:android` | `phone` (single feature) or `phone-pair` (two screens, before/after) | portrait capture at the phone's native aspect (≈ 9:19.5) | matches the frame; no cropping |
| tablet app | `tablet` | 3:4 capture | |
| `platform:web`, `platform:desktop` | `laptop` with `anim=open` or `none` | **landscape 16:10** capture | portrait images are cropped to the top |
| `platform:extension` | flat `frame --frame browser` usually; `laptop` for hero | a full page with the extension active | extensions are about the page they act on |
| CLI / library | not 3D; use terminal recordings | – | 3D devices mislead |

Colour: take `color` from the logo's darkest tone or keep graphite; take `bg` from the brand gradient. Keep one background across a set.

## Camera and composition guidelines

- **FOV 25–35°** for a product-photo look. Wider than ~45° makes phones look warped. Do not push `zoom` above ~1.4; the shadow and edges get clipped.
- **Three-quarter view** (`angle` −20…−32°, `pitch` −5…+5° for phones, +15…+22° for laptops) shows thickness and depth. Straight-on (`angle=0`) reads as a flat screenshot with a frame; use it only for UI-focused shots.
- **Fill 60–80% of the canvas height**; the framing code leaves ~2% margin, so the canvas aspect decides emptiness: use 1:1 or 4:3 for single phones, 16:9 for laptops and pairs.
- **Reserve space for text** if the image will carry a headline: render with `--transparent` and compose in HTML/Figma, or use `bg` plus an overlay (see "Extending").
- **Shadows** are a contact shadow only; keep them subtle (the default). `shadow=0` for devices floating on a flat colour you will composite later.
- Screens are unlit (`toneMapped:false`), so screenshot colours stay exact. Reflections on the body come from the built-in studio environment; don't add more lights unless you need a coloured rim.

## Motion design guidelines

Principles for any animation the agent adds or tunes:

1. **Purpose.** Motion shows form (turntable, tilt) or reveals (device appears, laptop opens). If it does neither, make it `none`.
2. **Durations.** Reveal/entrance 1.0–1.6 s. Hero ambient loops 4–8 s. Turntable 4–8 s per rotation (shorter is dizzying). Social loops ≤ 6 s; they get watched muted and on repeat.
3. **Easing.** Entrances: ease-out (`1-(1-x)^3`). Open/close and anything that settles: ease-in-out (cubic). Ambient float/orbit: sine (smooth, naturally periodic). Linear only for the turntable.
4. **Amplitude.** Ambient motion should be barely noticeable: float ≤ 4% of device height, yaw sway ≤ ±16°, pitch sway ≤ ±3°. Large sweeping motion competes with the screenshot, which is the actual content.
5. **Seamless loops.** Every periodic term is `sin/cos(u · 2π · k)` with integer `k`, where `u = (t mod duration)/duration`. `float`, `turntable`, `orbit`, `open` and `hero-pair` obey this; `reveal` plays once and is **not** a loop (use it for a first-view animation, then freeze or fade).
6. **Hold the money frame.** For `open`, the device is fully open for ~55% of the loop; viewers read the screenshot then. Do not move fast while text must be read.
7. **Parallax in pairs.** Two devices move in opposite phase (`phase: π`) with slightly different depth; it adds depth without extra animation.
8. **Frame rate.** 30 fps for web/social video; 15–20 fps for GIFs; 60 only when the user insists (double the render time and file size).
9. **File budgets.** Hero video on a landing page: ≤ 1.5 MB WebM/MP4 at 1280–1600 px wide, muted, `playsinline`, with a still poster. GIFs are large: keep ≤ 800 px and ≤ 4 s, or ship MP4/WebM and a GIF only where required. Check each destination's current upload limit before you render.
10. **Motion sensitivity.** In a web embed, honour `prefers-reduced-motion` by showing the still. Avoid flashing or fast rotation.

Presets in the template (all pure functions of time in `pose(t)`):

| `anim` | Motion | Loops seamlessly |
|---|---|---|
| `none` | static pose at `angle`/`pitch` | n/a |
| `float` | slow bob, ±16° yaw sway, slight pitch breathing | yes |
| `turntable` | one full rotation per `duration` | yes |
| `orbit` | camera sweeps ±40° around a fixed device | yes |
| `reveal` | scale 0.7→1, rises, spins in over 1.4 s, then drifts | no |
| `open` | laptop: closed → open (30%) → hold (55%) → close (15%) | yes |
| `hero-pair` | pair drifts in opposite phase, small yaw sway | yes |

## Render pipeline details

- Always start from a **copy** when customising: `readytogo scaffold 3d` → `.readytogo/mockups/3d/`; render your copy with `render ".readytogo/mockups/3d/device-scene.html?…"`. The bundled one under `/__skill/…` is read-only reference.
- Software WebGL (SwiftShader) in headless Chromium is slow but deterministic: expect roughly 0.2–0.5 s per 1600×1000 frame. 6 s at 30 fps = 180 frames ≈ 1–2 minutes. Prefer `--size` ≤ 1920 wide for video; use `--scale 2` only for stills.
- Transparent output: PNG (`--transparent`) and WebM (VP9 alpha). MP4/GIF cannot carry alpha: give them a `bg`.
- If `ffmpeg` is missing the frames stay in `<out dir>/.frames` and the exact encode command is printed.
- The page must not use `Math.random`, `Date.now` or `performance.now` in anything that affects the picture, or frames will not repeat between runs.

## Extending the template

Edit your scaffolded copy; the code is ~250 lines and sectioned.

- **New animation**: add a `case` in `pose(t)` that returns `yaw, pitch, roll, y, scale, az (camera orbit), open (laptop lid), bob`. Keep it a pure function of `t`; make periodic terms integer multiples of 2π over `duration`.
- **New device** (watch, desktop monitor, TV): write `async function buildX(url)` that returns `{ group, height, pivot? }` in the same units (1 = 10 cm, front facing +z), reuse `slab()` for rounded bodies and `screenGeometry()` + `loadScreen()` for the screen, then add a `case` in the device switch.
- **Headline / badge overlay**: add an absolutely-positioned HTML element over the canvas; set its `opacity`/`transform` inside `render(t)` from `t` so text animates in sync (e.g. fade in over 0.6 s at 0.8 s). It is captured by the same screenshot.
- **Brand look**: change `bodyMat()` (colour, metalness, roughness, clearcoat), `scene.environmentIntensity`, the rim light colour, `bg`.
- **Ground**: remove `ground` and `shadow` for a floating device with no contact shadow; change `box.min.y - …` to lift the shadow plane for a floating look.

## GLB models

Bundled models live in `assets/3d/models/` (none yet; the procedural devices cover phone, tablet and laptop). To use any `.glb`:

1. It must meet the contract in `assets/3d/models/README.md` (a mesh named `Screen` with 0–1 UVs, Y up, front +Z, ≤ ~3 MB, PBR, no embedded lights).
2. `readytogo scaffold 3d --model <name>` copies it next to your template, then:
   `?device=model&model=/.readytogo/mockups/3d/models/<name>.glb&screen=/shots/a.png&screenMesh=Screen&screenAspect=0.4875`
3. Crop the screenshot to the model's screen aspect first (`screenAspect` in the manifest) or the image will be cover-cropped from the top.
4. If the image is upside down, add `&flipY=1`. If it is mirrored, fix the UVs in the model.
5. Record `license` and `author` in the manifest and in the project's third-party notices.

When asked to add models to the skill: prefer CC0 models you can redistribute, name them generically (no manufacturer marks), compress textures, verify with a render, then add the manifest entry.

## Offline / CI

Template imports `three@0.170.0` from jsDelivr through an import map. For air-gapped runs:

```bash
npm i -D three@0.170.0
```

then in your scaffolded copy replace the import map with
`"three": "/node_modules/three/build/three.module.js"` and `"three/addons/": "/node_modules/three/examples/jsm/"` (the render server serves the project root).

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| Blank or transparent image | `capture=1` missing is harmless; check `page error:` lines in the output. WebGL failure → run `readytogo doctor`, reinstall Chromium (`npx playwright install chromium`). |
| Screen shows the placeholder gradient | `screen=` path wrong (must be reachable under `--root`, leading `/`). A console error "screen image failed to load" prints as `page error`. |
| Screenshot cropped | Aspect mismatch; capture at the device's aspect (phone ≈ 0.49, laptop ≈ 1.5, tablet ≈ 0.75). Crop is top-anchored. |
| Image upside-down on a GLB | `&flipY=1`. |
| Laptop looks closed | `anim=open` starts closed at t=0: use `--at 2.4` for a still, or `anim=none` (always open). |
| Video has dropped/uneven motion | Not possible with `__seek`; check the page does not animate on its own (`capture=1`). |
| Edges clipped | Lower `zoom`; make sure `--size` is not extreme in aspect. |
| Looks plasticky/dark | Raise `scene.environmentIntensity`, set `finish=gloss` or `matte`, change `color`. |
| `bg` ignored | It needs URL encoding (`%23` for `#`, `%20` for spaces). |
