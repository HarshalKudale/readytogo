# Area: Launch and after

Launch sites, communities, reviews, backlinks, second wave

Start: `readytogo analyze --area launch` (profiles if needed, runs this area's checks, saves the before-snapshot, lists what is not ready and the decisions to ask the user). Then `readytogo branch --area launch` before touching files, `readytogo check --area launch` after, `readytogo diff --area launch` to show the result.

## Checklists (read only those `analyze` shows open items for)

- [Launchpad](../checklists/launchpad.md): Where you launch. Each platform is one item with its own steps.
- [Communities and outreach](../checklists/communities.md): Subreddits, newsletters and lists where your users already are.
- [After launch](../checklists/post-launch.md): Reviews, iteration and the second wave.

## Tools

- `readytogo backlinks <export> --target <domain> --verify`
- `readytogo listing <fields.json>`

## Decisions to put to the user (after analysis, in one message)

- **Launch posts?** (`launch.product-hunt`)
  - Draft the copy for me to post
  - Skip directories and launch sites
