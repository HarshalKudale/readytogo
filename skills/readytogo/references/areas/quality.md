# Area: Testing, analytics and monitoring

CI, tests, crash reporting, analytics, uptime

Start: `readytogo analyze --area quality` (profiles if needed, runs this area's checks, saves the before-snapshot, lists what is not ready and the decisions to ask the user). Then `readytogo branch --area quality` before touching files, `readytogo check --area quality` after, `readytogo diff --area quality` to show the result.

## Checklists (read only those `analyze` shows open items for)

- [Testing and QA](../checklists/testing-qa.md): Automated checks on the flows that matter.
- [Analytics and monitoring](../checklists/analytics-monitoring.md): Know what launch day did, and when something breaks.

## Tools

- `readytogo deadcode [dir]`
