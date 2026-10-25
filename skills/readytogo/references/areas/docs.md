# Area: Documentation

README, quickstart, API reference, env docs, security policy, support

Start: `readytogo analyze --area docs` (profiles if needed, runs this area's checks, saves the before-snapshot, lists what is not ready and the decisions to ask the user). Then `readytogo branch --area docs` before touching files, `readytogo check --area docs` after, `readytogo diff --area docs` to show the result.

## Checklists (read only those `analyze` shows open items for)

- [Documentation](../checklists/documentation.md): README, quickstart, API docs, contributing, security and support pages.

## Tools

- `readytogo links <page|url>`

## Decisions to put to the user (after analysis, in one message)

- **README work?** (`docs.quickstart`)
  - Rewrite README quickstart from the code and test it on the branch
  - I will write it, just check it
  - Skip
- **Support page?** (`docs.support`)
  - Draft the help page from the app's features for my review
  - I already have one: here is the URL
  - Skip
