---
description: Make the legal, privacy and payments area ship-ready (analyse, ask, fix on a branch)
argument-hint: "e.g. privacy | terms | payments"
---

Use the `readytogo` skill for the **legal** area only (Privacy policy, terms, consent, regional law, payments and tax). Focus: $ARGUMENTS (empty = the whole area). Do not look at other areas.

1. Read `references/areas/legal.md`. Run `readytogo analyze --area legal`.
2. Show me what is not ready (blockers first) and ask me the listed decisions in one message. Wait for my answers.
3. `readytogo branch --area legal`, then fix only what I approved, in small commits on that branch. Never push, merge, publish or pay.
4. `readytogo check --area legal`, `readytogo diff --area legal`, and finish with: fixed, still open, needs me.
