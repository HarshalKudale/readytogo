# Area: SEO and links

Titles, meta, Open Graph, sitemap, structured data, broken links, backlinks

Start: `readytogo analyze --area seo` (profiles if needed, runs this area's checks, saves the before-snapshot, lists what is not ready and the decisions to ask the user). Then `readytogo branch --area seo` before touching files, `readytogo check --area seo` after, `readytogo diff --area seo` to show the result.

## Checklists (read only those `analyze` shows open items for)

- [Technical SEO](../checklists/technical-seo.md): Indexable pages that look good when shared.

## Tools

- `readytogo seo <page|url>`
- `readytogo links <page|url>`
- `readytogo backlinks <export> --target <domain> --verify`

## Decisions to put to the user (after analysis, in one message)

- **Search Console and Bing verification?** (`seo.search-console`)
  - I verify; give me the steps
  - I will paste the verification token and you add the tag or file
