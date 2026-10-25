# Area: Packaging and size

Source maps, minification, bundle size, images, dependencies, installers, release hygiene

Start: `readytogo analyze --area packaging` (profiles if needed, runs this area's checks, saves the before-snapshot, lists what is not ready and the decisions to ask the user). Then `readytogo branch --area packaging` before touching files, `readytogo check --area packaging` after, `readytogo diff --area packaging` to show the result.

## Checklists (read only those `analyze` shows open items for)

- [Packaging and size](../checklists/app-packaging.md): What goes into the shipped artifact: bundles, source maps, assets, dependencies, installers. Smaller and safer builds.
- [Release build hygiene](../checklists/release-build.md): What ships in your production build, and what must not.

## Tools

- `readytogo deadcode [dir]`
- `readytogo verify <img...> --target <id|WxH>`

## Decisions to put to the user (after analysis, in one message)

- **Production source maps?** (`build.web-sourcemaps`)
  - Remove them from the production build
  - Keep them hidden and upload to my error tracker (name it)
- **Unused code found by `readytogo deadcode`?** (`build.dead-code`)
  - Delete the high-confidence findings on the branch
  - List them only, I will review
  - Skip
- **Compress images?** (`pack.images`)
  - Convert and replace them on the branch (originals stay in git history)
  - Only list the offenders, I will handle them
