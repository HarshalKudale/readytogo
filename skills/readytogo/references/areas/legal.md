# Area: Legal, privacy and payments

Privacy policy, terms, consent, regional law, payments and tax

Start: `readytogo analyze --area legal` (profiles if needed, runs this area's checks, saves the before-snapshot, lists what is not ready and the decisions to ask the user). Then `readytogo branch --area legal` before touching files, `readytogo check --area legal` after, `readytogo diff --area legal` to show the result.

## Checklists (read only those `analyze` shows open items for)

- [Legal and compliance](../checklists/legal-compliance.md): The policies stores and users require. Templates are not legal advice.
- [Payments and tax](../checklists/payments-tax.md): Get paid, stay compliant, follow store billing rules.

## Decisions to put to the user (after analysis, in one message)

- **Privacy policy: who writes it?** (`legal.privacy`)
  - Draft it from what the code actually collects, for my review
  - I already have one: here is the URL or file
  - Skip for now
