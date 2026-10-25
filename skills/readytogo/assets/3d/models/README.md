# 3D device models

Generic, original phone and laptop models in glTF binary, used by `templates/3d/scene.html`. List them with `readytogo models`; copy some into a project with `readytogo scaffold 3d --model phone-island --model laptop-notch`.

They are **generated** by `scripts/build-models.mjs` (`npm run build:models`) and described in `manifest.json`. Edit the script, not the `.glb` files. License CC0-1.0; they imitate no manufacturer's design.

| id | kind | look |
|---|---|---|
| `phone-island` | phone | modern flagship, dynamic-island style cutout, triple-camera plate |
| `phone-punchhole` | phone | tall 20:9, punch-hole camera |
| `phone-notch` | phone | older notch phone |
| `phone-flat` | phone | flat-edge phone |
| `laptop-notch` | laptop | thin bezel with webcam notch |
| `laptop-slim` | laptop | slim, minimal bezel |
| `laptop-classic` | laptop | classic thicker bezel |

## Contract (follow it when adding a model)

| Rule | Why |
|---|---|
| glTF 2.0 binary, one scene, Y up, front faces **+z**, units 1 = 10 cm | The scene assumes it. |
| A mesh named **`Screen`** with its own material, UVs spanning 0 to 1, image upright | The screen image or video is mapped onto it. |
| Laptops: a node named **`LidPivot`** that the lid hangs from, hinge on its origin | The scene opens and closes the lid by rotating it. |
| A material named **`Body`** | The scene recolours the body from `defaultColor` or the director's `color`. |
| `screenAspect` (width ÷ height) in `manifest.json` | Crop the screenshot to this aspect before rendering. |
| No embedded lights or cameras; PBR materials; small file | The scene owns lighting; fast, deterministic headless rendering. |

To add a model: put the `.glb` here, add an entry to `manifest.json` (`id`, `kind`, `file`, `screenMesh`, `screenAspect`, `hinge` for laptops, `defaultColor`, `license`, `author`), and check it with a render of `templates/3d/scene.html`. Only add models you may redistribute (CC0 or CC-BY with attribution recorded), named generically.
