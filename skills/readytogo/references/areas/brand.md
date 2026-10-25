# Area: Brand and identity

Name, logo, icon master, favicon, tagline

Start: `readytogo analyze --area brand` (profiles if needed, runs this area's checks, saves the before-snapshot, lists what is not ready and the decisions to ask the user). Then `readytogo branch --area brand` before touching files, `readytogo check --area brand` after, `readytogo diff --area brand` to show the result.

## Checklists (read only those `analyze` shows open items for)

- [Brand and identity](../checklists/brand-identity.md): Name, logo, icons and the copy every listing reuses.

## Tools

- `readytogo icons <master> --for <set>`
- `readytogo domains <name...> [--tlds com,io]`
- `readytogo listing <fields.json>`

## Guidelines

- [assets.md](../assets.md)

## Decisions to put to the user (after analysis, in one message)

- **Should I check which domains and social handles are free for this name?** (`brand.name`)
  - Yes, run `readytogo domains <name>` and show me the free ones
  - No, I will pick and register them myself
