---
description: Make the packaging and size area ship-ready (analyse, ask, fix on a branch)
argument-hint: "e.g. sourcemaps | bundle size | images | docker"
---

Use the `readytogo` skill for the **packaging** area only (Source maps, minification, bundle size, images, dependencies, installers, release hygiene). Focus: $ARGUMENTS (empty = the whole area). Do not look at other areas.

1. Read `references/areas/packaging.md`. Run `readytogo analyze --area packaging`.
2. Show me what is not ready (blockers first) and ask me the listed decisions in one message. Wait for my answers.
3. `readytogo branch --area packaging`, then fix only what I approved, in small commits on that branch. Never push, merge, publish or pay.
4. `readytogo check --area packaging`, `readytogo diff --area packaging`, and finish with: fixed, still open, needs me.
