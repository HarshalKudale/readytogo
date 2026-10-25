---
description: Make the domain, dns and email area ship-ready (analyse, ask, fix on a branch)
argument-hint: "e.g. domains | email | dns"
---

Use the `readytogo` skill for the **domain** area only (Domain, HTTPS, DNS records, email deliverability). Focus: $ARGUMENTS (empty = the whole area). Do not look at other areas.

1. Read `references/areas/domain.md`. Run `readytogo analyze --area domain`.
2. Show me what is not ready (blockers first) and ask me the listed decisions in one message. Wait for my answers.
3. `readytogo branch --area domain`, then fix only what I approved, in small commits on that branch. Never push, merge, publish or pay.
4. `readytogo check --area domain`, `readytogo diff --area domain`, and finish with: fixed, still open, needs me.
