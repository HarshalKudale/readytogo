# Area: Domain, DNS and email

Domain, HTTPS, DNS records, email deliverability

Start: `readytogo analyze --area domain` (profiles if needed, runs this area's checks, saves the before-snapshot, lists what is not ready and the decisions to ask the user). Then `readytogo branch --area domain` before touching files, `readytogo check --area domain` after, `readytogo diff --area domain` to show the result.

## Checklists (read only those `analyze` shows open items for)

- [Domain and DNS](../checklists/domain-dns.md): Own your domain, serve it securely, wire up app links.
- [Email and deliverability](../checklists/email.md): A support inbox, and email that lands in the inbox.

## Tools

- `readytogo domains <name...> [--tlds com,io]`
- `readytogo links <page|url>`

## Decisions to put to the user (after analysis, in one message)

- **Do you already own a domain?** (`domain.registered`)
  - Yes, tell me which
  - No: find free candidates for me (`readytogo domains`), I will register one
  - No: I will handle it myself
