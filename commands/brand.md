---
description: Make the brand and identity area ship-ready (analyse, ask, fix on a branch)
argument-hint: "e.g. name | logo | icon | favicon"
---

Use the `readytogo` skill for the **brand** area only (Name, logo, icon master, favicon, tagline). Focus: $ARGUMENTS (empty = the whole area). Do not look at other areas.

1. Read `references/areas/brand.md`. Run `readytogo analyze --area brand`.
2. Show me what is not ready (blockers first) and ask me the listed decisions in one message. Wait for my answers.
3. `readytogo branch --area brand`, then fix only what I approved, in small commits on that branch. Never push, merge, publish or pay.
4. `readytogo check --area brand`, `readytogo diff --area brand`, and finish with: fixed, still open, needs me.
