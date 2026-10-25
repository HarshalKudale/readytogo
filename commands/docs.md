---
description: Make the documentation area ship-ready (analyse, ask, fix on a branch)
argument-hint: "e.g. readme | api reference | support page"
---

Use the `readytogo` skill for the **docs** area only (README, quickstart, API reference, env docs, security policy, support). Focus: $ARGUMENTS (empty = the whole area). Do not look at other areas.

1. Read `references/areas/docs.md`. Run `readytogo analyze --area docs`.
2. Show me what is not ready (blockers first) and ask me the listed decisions in one message. Wait for my answers.
3. `readytogo branch --area docs`, then fix only what I approved, in small commits on that branch. Never push, merge, publish or pay.
4. `readytogo check --area docs`, `readytogo diff --area docs`, and finish with: fixed, still open, needs me.
