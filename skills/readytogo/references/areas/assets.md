# Area: Store assets and mockups

Icons, screenshots, promo art, 2D and 3D mockups, demo video

Start: `readytogo analyze --area assets` (profiles if needed, runs this area's checks, saves the before-snapshot, lists what is not ready and the decisions to ask the user). Then `readytogo branch --area assets` before touching files, `readytogo check --area assets` after, `readytogo diff --area assets` to show the result.

## Checklists (read only those `analyze` shows open items for)

- [Launch visuals](../checklists/launch-assets.md): Mockups, demos and images for your listings and posts.

## Tools

- `readytogo icons <master> --for <set>`
- `readytogo shot <img...> --target <id>`
- `readytogo verify <img...> --target <id|WxH>`
- `readytogo video <in> --out <file>`
- `readytogo annotate <img> --box x,y,w,h --mode redact|highlight`
- `readytogo listing <fields.json>`
- `readytogo render <page> --size WxH --out <file>`

## Guidelines

- [capture.md](../capture.md)
- [mockups.md](../mockups.md)
- [mockups-3d.md](../mockups-3d.md)
- [assets.md](../assets.md)
- [store-specs.md](../store-specs.md)

## Decisions to put to the user (after analysis, in one message)

- **Mockup media?** (`assets.mockups`)
  - Use my screenshots or recordings (give paths)
  - Capture fresh ones from the running app with demo data
