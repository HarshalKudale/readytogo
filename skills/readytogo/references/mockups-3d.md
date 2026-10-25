# 3D phone and laptop shots

You are the **director**. The skill supplies the stage (lighting, shadows, deterministic timeline), the **models** (phones and laptops), and a rendering command. You supply the shot: which device, what is on its screen (screenshot or recording), the camera moves, the background and any cosmetics. Nothing here generates a shot for you, so two products never get the same video.

Use 3D for marketing surfaces: landing hero, Product Hunt gallery/loop, social posts, README banner, launch video. Not for store screenshot slots (those want plain screenshots).

Settle the media first with the user (`references/capture.md`). Needs `readytogo setup render`.

## Pieces

| File | Role |
|---|---|
| `assets/3d/models/*.glb` + `manifest.json` | The devices. `readytogo models` lists them. |
| `templates/3d/scene.html` | The stage. Loads a **director script** (`?config=/path/director.js`), builds the shot, exposes `window.__seek(t)`. |
| `templates/3d/examples/*.js` | Director scripts to copy: `laptop-hero`, `phone-turntable`, `phone-pair`, `laptop-video`, `phone-laptop-combo`. |
| `readytogo render` | Steps the scene frame by frame and writes PNG / WebM / MP4 / GIF. |
| `readytogo scaffold 3d --model <id>` | Copies scene, examples and chosen models into `.readytogo/mockups/3d/` so you can edit them. |

Workflow: pick an example → copy it into the project as `shot.js` → edit → render a **still** (`--at 2.5`) to check composition → render the video.

```bash
readytogo render "/__skill/templates/3d/scene.html?config=/shot.js&capture=1" --size 1920x1080 --at 3 --out check.png
readytogo render "/__skill/templates/3d/scene.html?config=/shot.js&capture=1" --size 1920x1080 --video hero.webm      # duration/fps come from the script
readytogo render "...&capture=1" --size 1920x1080 --video hero.mp4 --fps 30
readytogo render "...&capture=1" --size 1280x720 --transparent --video hero-alpha.webm   # background: "transparent" in the script
```

Paths like `/shot.js` and `/capture/home.png` are relative to the project root. Always pass `capture=1` to `render`; open the page without it in a normal browser for a live preview of the same shot.

## Models

| id | kind | screen aspect (w÷h) | Look |
|---|---|---|---|
| `phone-island` | phone | 0.466 | modern flagship, titanium edge, island cutout, square triple camera |
| `phone-punchhole` | phone | 0.449 | Android-style tall screen, punch-hole camera, camera bar |
| `phone-notch` | phone | 0.461 | earlier generation: top notch, light glossy edge, dual lens |
| `phone-flat` | phone | 0.458 | flat-edge slab, thin bezels, large square camera plate |
| `laptop-notch` | laptop | 1.6 (16:10) | premium thin-bezel, notch, dark aluminium |
| `laptop-slim` | laptop | 1.6 | silver ultrabook, tiny bezels, webcam dot |
| `laptop-classic` | laptop | 1.778 (16:9) | black plastic, thick bezel and chin |

Choose the model to match the audience and the screenshot: a 16:10 capture fits `laptop-notch`/`laptop-slim` exactly; a 16:9 capture fits `laptop-classic`; phone captures should be about 9:19.5. Different aspect → `fit` crops (cover) or letterboxes (`fit: "contain"`), so prefer recapturing to the right aspect. Tint any part named "Body" with `color`, and `finish: "titanium" | "matte" | "gloss"`.

Add your own models: `assets/3d/models/README.md` has the contract.

## The director script

An ES module whose default export is the shot. Units: 1 = 10 cm. Angles in degrees. Times in seconds.

```js
export default {
  duration: 6, fps: 30, loop: false,          // loop: true wraps time, so first and last keys must match for a seamless loop
  background: "linear-gradient(135deg,#e0e7ff,#fce7f3)",   // any CSS background, an image url(...), or "transparent"
  shadow: true,                                // soft contact shadow; floor: "#e5e7eb" adds a visible studio floor
  exposure: 1,
  environment: { intensity: 0.9 },             // studio reflections on the body
  lights: { key: { intensity: 2.2, color: "#fff", position: [1.5, 6, 2.5] }, rim: { intensity: 1.1, color: "#bfd4ff", position: [-3, 2, -2] } },

  devices: [{
    model: "laptop-notch",                     // id from `readytogo models`, or a url to your own .glb
    color: "#2d2d32", finish: "titanium",      // optional tint of every "Body" material
    anchor: "bottom",                          // "bottom": pos y=0 stands on the floor (default for laptops); "center" (default for phones)
    pos: [0, 0, 0], rot: [0, 0, 0], scale: 1, open: 105,       // starting pose; open = laptop lid angle
    screen: { src: "/shot.png", fit: "cover", align: "top" },  // image or .webm recording. fit: cover|contain. align: top|center|bottom
    // screen: { src: "/rec.webm", start: 0, rate: 1, loop: true }     video options
    // screens: [{ at: 0, src: "/a.png" }, { at: 4, src: "/b.png" }]  swap content at times
    keys: [                                    // keyframes; each prop animates independently, hold otherwise
      { t: 0,   open: 0, rot: [0, -20, 0] },
      { t: 1.8, open: 105, ease: "outCubic" },                 // `ease` shapes the move INTO this key
      { t: 6,   rot: [0, 15, 0], ease: "inOutSine" },
    ],
  }],

  camera: {
    fov: 30,
    keys: [                                    // spherical orbit around the devices' centre
      { t: 0, az: -35, el: 20, zoom: 0.95 },   // az: 0 = front, + = to the viewer's right; el: degrees above horizon; zoom 1 = fits everything
      { t: 6, az: -10, el: 10, zoom: 1.25, target: [0, 0.2, 0], ease: "inOutSine" },   // target: offset from the centre; also dist, roll, fov
    ],
  },

  overlay: `<div id="h" style="position:absolute;left:6%;top:8%;font:800 5vmin/1.1 Inter,sans-serif;opacity:0">Headline</div>`,
  update(t, { overlay, scene, devices, THREE }) { overlay.querySelector("#h").style.opacity = Math.min(1, Math.max(0, (t - 0.8) / 0.6)); },
  async setup({ THREE, scene, devices }) { /* add meshes, particles, extra lights once */ },
};
```

Keyframe props for devices: `pos`, `rot`, `scale`, `open`. For the camera: `az`, `el`, `zoom`, `dist`, `target`, `roll`, `fov`. Arrays interpolate per component. Eases: `linear smooth hold inSine outSine inOutSine inCubic outCubic inOutCubic outQuart inOutQuart outExpo outBack`.

`setup` and `update` are your cosmetic hooks: extra geometry (floating shapes, a podium, particles), light changes, DOM overlays (headlines, badges, a logo). Keep `update` a **pure function of `t`**: no `Math.random`, `Date.now` or `performance.now`, or frames will not repeat between renders.

## Camera craft

- **FOV 24–35°** gives a product-photo look; above ~45° warps phones. Move the camera (zoom/dist/az/el), not the FOV, for most shots; animate `fov` only for a deliberate dolly-zoom.
- **Three-quarter** views read as 3D: `az` ±20–35°, `el` 8–20° for phones, 15–28° for laptops (to see the keyboard deck). Straight-on (`az: 0, el: 0`) makes the frame a flat picture.
- **Compose, don't just fit**: `zoom` 1.0 fits everything with a small margin; 1.15–1.35 is a confident crop. Leave a third of the canvas empty on the side where a headline will go and shift with `target: [x, y, 0]`.
- **Hero moves** (pick one per shot): slow push-in (zoom +15–25% over the shot), orbit (az sweep ±15–30°), crane (el 25° → 10° while pushing in), push-to-screen (zoom 2–3 near the end to read the UI). Combine at most two.
- **Hold readable frames.** If the screen content matters, the camera should be nearly still for at least 1.5 s while it can be read.
- Floor shadow anchors a device; `shadow: false` for floating/transparent composites.

## Motion craft

1. **Purpose first.** Motion either shows form (turntable, tilt), reveals (lid opens, device rises), or draws attention (push to the screen). Otherwise stay still.
2. **Durations.** Entrance 1.0–1.8 s; lid open 1.4–2.0 s; full shot 5–10 s; social loops ≤ 6 s; turntable 6–10 s per revolution.
3. **Easing.** Entrances and arrivals `outCubic`/`outQuart`/`outBack` (settle); anything symmetrical `inOutSine`/`inOutCubic`; `linear` only for turntables; `hold` for steps.
4. **Overlap and offset.** Start the camera move 0.3 s before the device finishes settling; offset multiple devices by 0.15–0.3 s so they do not move as one slab.
5. **Amplitude.** Ambient motion ≤ 4% of device height and ±16° yaw; larger sweeps compete with the screen content.
6. **Seamless loops.** `loop: true`, and every animated prop ends where it began (turntable: last `rot` y = first + 360). Entrances like a lid opening are not loops: use `loop: false` and either freeze on the last frame or close it again.
7. **Frame rate.** 30 fps for web/social, 15–20 fps for GIFs, 60 only on request (twice the render time and size).
8. **Budgets.** Landing-page hero ≤ 1.5 MB WebM/MP4 at 1280–1600 px, muted, `playsinline`, with a still poster; GIFs ≤ 800 px and ≤ 4 s. Check the destination's current upload limits.
9. **Motion sensitivity.** In a web embed honour `prefers-reduced-motion` by showing the still; avoid flashing and fast rotation.

## Screens: stills and recordings

- Stills: capture at the model's screen aspect (table above). `align: "top"` keeps headers when cropping.
- **Recordings** play on the screen frame-exactly (the page seeks the video to each timeline time, so there is no drift). Use **WebM**: headless Chromium has no H.264. Convert: `readytogo video rec.mp4 --out rec.webm --width 1280 --fps 30`. Options: `start` (offset into the shot), `rate`, `loop`.
- Sync a recording to a camera move by choosing `start` so the interesting moment lands when the camera arrives.
- Several screens: `screens: [{ at, src }, …]` swaps content at times (hard cut; do it while the camera moves, or add a quick overlay flash).

## Backgrounds and cosmetics

- CSS gradients from the logo colours, a flat tint, a subtle `url(...)` texture. Keep strong contrast between device body and background (dark device on light bg or vice versa).
- Transparent composites: `background: "transparent"`, render with `--transparent` (PNG or WebM alpha), then place on a web page or another video.
- A visible floor: `floor: "#f1f5f9"` with a matching background colour gives a seamless studio.
- Extras via `setup`: a rounded podium (`THREE.CylinderGeometry`), soft coloured lights, floating shapes. Cosmetics support the product; if you cannot see the screen, remove them.

## Quality checklist before delivering

- [ ] The right model for the audience; screen aspect matches the capture (no accidental crop).
- [ ] The frame reads at thumbnail size; the headline (if any) is legible.
- [ ] Screen content is real, current and free of personal data.
- [ ] Loop shots loop; one-shot shots end on a hold, not mid-move.
- [ ] `readytogo verify out.png --target WxH` / `readytogo video out.webm` (size, fps, seconds, KB) match what the surface needs.
- [ ] Told the user the exact files, sizes, formats and any that exceed common upload limits.

## Troubleshooting

| Symptom | Fix |
|---|---|
| Blank or transparent output | Read the `page error:` lines. Run `readytogo doctor`; `readytogo setup render` if Playwright is missing. |
| Screen shows a purple placeholder | `screen.src` is wrong (must be reachable from the project root with a leading `/`) |
| Video on the screen is black | Not WebM/VP9. Convert with `readytogo video`. |
| Screen content cropped | Aspect mismatch: recapture at the model's aspect or use `fit: "contain"` (images) |
| Laptop looks closed | Keys start at `open: 0`; check `open` at the time you render (`--at`) |
| Device clipped | Lower `zoom`; the fit uses the full open pose, so only a very large `scale`/`pos` can leave frame |
| Frames not repeating run to run | Something in `update`/`setup` uses time or randomness |
| Looks plasticky | Lower `environment.intensity`, change `finish`, soften `lights.key.intensity` |
| Offline/CI | three.js is imported from a pinned CDN URL; for air-gapped runs `npm i -D three@0.170.0` and point the import map in your copy of `scene.html` to `/node_modules/three/…` |
