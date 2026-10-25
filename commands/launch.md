---
description: Make the launch and after area ship-ready (analyse, ask, fix on a branch)
argument-hint: "e.g. product hunt | communities | post-launch"
---

Use the `readytogo` skill for the **launch** area only (Launch sites, communities, reviews, backlinks, second wave). Focus: $ARGUMENTS (empty = the whole area). Do not look at other areas.

1. Read `references/areas/launch.md`. Run `readytogo analyze --area launch`.
2. Show me what is not ready (blockers first) and ask me the listed decisions in one message. Wait for my answers.
3. `readytogo branch --area launch`, then fix only what I approved, in small commits on that branch. Never push, merge, publish or pay.
4. `readytogo check --area launch`, `readytogo diff --area launch`, and finish with: fixed, still open, needs me.
