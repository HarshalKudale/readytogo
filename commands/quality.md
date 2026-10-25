---
description: Make the testing, analytics and monitoring area ship-ready (analyse, ask, fix on a branch)
argument-hint: "e.g. ci | crash reporting | analytics"
---

Use the `readytogo` skill for the **quality** area only (CI, tests, crash reporting, analytics, uptime). Focus: $ARGUMENTS (empty = the whole area). Do not look at other areas.

1. Read `references/areas/quality.md`. Run `readytogo analyze --area quality`.
2. Show me what is not ready (blockers first) and ask me the listed decisions in one message. Wait for my answers.
3. `readytogo branch --area quality`, then fix only what I approved, in small commits on that branch. Never push, merge, publish or pay.
4. `readytogo check --area quality`, `readytogo diff --area quality`, and finish with: fixed, still open, needs me.
