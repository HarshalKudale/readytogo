---
description: Make the store submissions and distribution area ship-ready (analyse, ask, fix on a branch)
argument-hint: "e.g. app store | play | chrome | npm"
---

Use the `readytogo` skill for the **stores** area only (App Store, Google Play, extension stores, Microsoft Store, desktop signing, registries). Focus: $ARGUMENTS (empty = the whole area). Do not look at other areas.

1. Read `references/areas/stores.md`. Run `readytogo analyze --area stores`.
2. Show me what is not ready (blockers first) and ask me the listed decisions in one message. Wait for my answers.
3. `readytogo branch --area stores`, then fix only what I approved, in small commits on that branch. Never push, merge, publish or pay.
4. `readytogo check --area stores`, `readytogo diff --area stores`, and finish with: fixed, still open, needs me.
