---
description: Audit every area of this repo for launch readiness, ask how to proceed, fix on a branch, and show what changed
argument-hint: "[areas, e.g. seo,packaging | empty = everything]"
---

Use the `readytogo` skill. Areas: $ARGUMENTS (empty = all; `readytogo areas` lists them). Work only on the areas named.

1. `readytogo analyze --area <areas>` (no `--area` for all). It saves the before-snapshot and lists what is not ready and the decisions to ask. Read `references/areas/<area>.md` only for areas you will work on.
2. Show me the result by area, blockers first, and ask me the decisions in one message (what to do, how, what I will handle). Wait for my answers.
3. `readytogo branch --area <areas>`; fix only what I approved, in small commits on that branch. Never push, merge, publish, pay or sign.
4. `readytogo check`, `readytogo diff`, `readytogo report`. Finish with: fixed, still open, what only I can do, and the branch name.
