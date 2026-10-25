---
description: Make product mockups (2D framed or 3D three.js, still or animated) for a launch surface
argument-hint: "[surface and style, e.g. 'landing hero, laptop, 6s loop' | 'product hunt gallery' | 'og image']"
---

Use the `readytogo` skill to make mockups for: $ARGUMENTS.

Read `references/mockups.md` (composition) and, for 3D or motion, `references/mockups-3d.md`.
First ask me: use my own screenshots/recordings, or capture fresh (`references/capture.md`)? Then choose the device from the product's platform and compose it yourself from the shipped parts: OS frames (`assets/frames/compose.html`) for 2D, or the 3D scene with a director script (`templates/3d`) for stills and WebM/MP4/GIF. If `readytogo doctor` says Playwright is missing, ask me, then run `readytogo setup render`. Render with `readytogo render`.
Show me the result paths, state the exact size and format of each file, and check each with `readytogo verify`, and note any file that exceeds common upload limits.
