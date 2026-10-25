# OS window frames

Plain HTML + CSS frames (original, generic designs; no vendor logos). Everything scales from one width, so a frame fits any canvas.

| Frame | Looks like |
|---|---|
| `browser-macos-tabs`, `browser-macos-compact` | browser window with traffic lights |
| `browser-windows-tabs` | browser window with Windows caption buttons |
| `browser-linux` | browser window with round caption buttons |
| `app-macos`, `app-windows`, `app-linux` | native app window, title bar only |

Each takes `theme` (`light` or `dark`); browsers take `url` and `tab`, apps take `title`.

## Use

Fastest, for a still or a recording in a frame on a background:

```bash
npx readytogo render "/__skill/assets/frames/compose.html?frame=browser-macos-tabs&theme=dark&screen=/shot.png&url=acme.com&tab=Dashboard&bg=linear-gradient(135deg,%23e0e7ff,%23fce7f3)" --size 1920x1080 --out hero.png
```

`compose.html` documents every parameter in its header comment. Its `screen` may be a `.webm` recording (convert with `readytogo video`).

To build something custom (a frame inside your own layout, several frames, text beside it), copy the folder with `readytogo scaffold frames`, then:

```js
import { frameHTML, fitWidth, FRAMES } from "./frames.js";
el.innerHTML = frameHTML("browser-macos-tabs", { theme: "dark", url: "acme.com/app", tab: "Dashboard" });
el.querySelector(".rtg-screen").append(imgOrVideo);
```

`frames.css` sizes everything in `--u` (1% of the frame width). Set `--fw` on `.rtg-frame` and the whole frame follows. Add a frame by adding an entry to `FRAMES` in `frames.js` and its styles to `frames.css`.

Layout, background and copy choices are yours: see `references/mockups.md`.
