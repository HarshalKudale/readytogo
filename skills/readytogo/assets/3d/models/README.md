# 3D device models

Drop-in `.glb` device models for `templates/3d/device-scene.html` (`?device=model&model=<url>`).
**None are bundled yet.** The template builds a procedural phone, tablet and laptop with no files at all,
so mockups work today; add models here when you want a specific real-world device.

## Adding a model

1. Put `<id>.glb` in this folder.
2. Add an entry to `manifest.json`:

   ```json
   { "id": "phone-generic-1", "kind": "phone", "file": "phone-generic-1.glb", "screenMesh": "Screen",
     "screenAspect": 0.4875, "license": "CC0", "source": "https://…", "author": "…" }
   ```
3. Check it against the contract below with a render:
   `readytogo scaffold 3d --model phone-generic-1`, then
   `readytogo render ".readytogo/mockups/3d/device-scene.html?device=model&model=/.readytogo/mockups/3d/models/phone-generic-1.glb&screen=/shot.png&capture=1" --size 1200x1200 --out check.png`

## Model contract

| Rule | Why |
|---|---|
| glTF 2.0 binary (`.glb`), one scene, Y up, front facing +Z | The scene template assumes it. |
| Real-world scale in metres is fine; the template normalises the longest side to 1.6 units | Any scale works, but keep proportions true. |
| Origin near the centre of the device | The template re-centres anyway; a far-off origin breaks pivots. |
| **A mesh named `Screen`** (or set `screenMesh` in the manifest) with one material | The screenshot replaces this mesh's material. |
| `Screen` UVs span exactly 0–1 with the image upright (U right, V up) | Otherwise the screenshot is rotated or stretched. Use `?flipY=1` if it only appears upside down. |
| Screen aspect recorded in `screenAspect` (width ÷ height) | The agent crops the screenshot to this aspect before rendering. |
| No embedded lights or cameras | The template owns lighting. |
| Under ~3 MB; meshes merged where possible; textures ≤ 2048px, no Draco unless you also add a decoder | Fast loads, deterministic headless rendering. |
| PBR materials (metal-rough); no unlit tricks on the body | The environment map gives believable reflections. |

## Licensing

Only add models you may redistribute. CC0 or CC-BY with attribution recorded in `manifest.json`.
Never add models traced from, or named for, trademarked device designs you do not have rights to; name them
generically (`phone-generic-*`, `laptop-generic-*`). The agent must carry the `license`/`author` into the
project's third-party notices when it uses a model.

## Naming

`<kind>-<variant>-<n>.glb` where kind is `phone`, `tablet`, `laptop`, `watch`, `desktop`, `tv`, `browser`.
