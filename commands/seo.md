---
description: Make the seo and links area ship-ready (analyse, ask, fix on a branch)
argument-hint: "e.g. a page URL | backlinks export | og tags"
---

Use the `readytogo` skill for the **seo** area only (Titles, meta, Open Graph, sitemap, structured data, broken links, backlinks). Focus: $ARGUMENTS (empty = the whole area). Do not look at other areas.

1. Read `references/areas/seo.md`. Run `readytogo analyze --area seo`.
2. Show me what is not ready (blockers first) and ask me the listed decisions in one message. Wait for my answers.
3. `readytogo branch --area seo`, then fix only what I approved, in small commits on that branch. Never push, merge, publish or pay.
4. `readytogo check --area seo`, `readytogo diff --area seo`, and finish with: fixed, still open, needs me.
