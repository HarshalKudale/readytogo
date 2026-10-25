# Workflow details

## State lives in the repo

```
.readytogo/
  profile.json   tags, product name/tagline/description, which tags were assumed, confirmed flag
  state.json     manual marks: { "<item-id>": { status, note, at } }   status: done | skipped | na
  checks.json    last automatic check results: { "<item-id>": { pass: true|false|null, detail } }
  baseline.json  the "before" snapshot per area (first `analyze`); compared by `diff` and `report`
  branch.json    the readytogo/* branch and the commit it started from
  assets/        generated output (icons, screenshots, mockups, promo)
  mockups/       scaffolded 3d / frames / promo starters you are editing
READYTOGO.md     the report (commit it, or regenerate in CI)
```

Commit `profile.json` and `state.json`; they are the project's launch memory. `checks.json` and `assets/` can be ignored or committed, the user's call.

An item's status resolves in this order: a manual mark, then the latest automatic check (`verified` / `failing`), then `preTickIf` (e.g. the profile already has `has:logo`), else `open`.
Open and failing items are not closed. A `pass: null` check result means "the repo cannot tell": decide it yourself.

## Branches and the before-snapshot

- `analyze` never edits project files. The first `analyze` of an area records its item statuses (after running its automatic checks) as the baseline.
- Any change to code, config or content happens on a `readytogo/<area>-<date>` branch (`readytogo branch`). If the user has uncommitted work, ask them to commit or stash first. Without git there is no safe undo: ask them to `git init` and commit.
- Commit small on that branch; the user reviews with `readytogo diff` or `git diff <base>..HEAD`, and merges or deletes the branch themselves.
- `readytogo diff` and `report` compare against the baseline; use `analyze --rebaseline` only if the user wants to start the comparison over.

## Only the requested area

Pass `--area` everywhere. A request about SEO means `analyze --area seo` and `references/areas/seo.md`: do not run, read or mention packaging, docs or other areas. The profile (what the product is) is shared and asked once.

## Profiling well

- `scan` is evidence-based. Trust `found` lines; treat `(assumed)` tags as questions.
- Stores are the main thing to ask. A web app is not necessarily on a store; an Expo app may ship to only one platform. Wrong store tags generate wrong work.
- Ask in **one** message with concrete options, e.g. "Where will this ship? website, App Store, Google Play, Chrome Web Store, Firefox, Edge, Microsoft Store, npm, GitHub releases." Also: free or paid (and how), what user data it collects, which regions, any AI features, what already exists (domain, logo, landing page, analytics), and the goal.
- Map answers to tags with `readytogo profile --tags` (`store:*`, `pricing:*`, `data:*`, `region:*`, `ai:*`, `has:*`, `goal:*`, `os:*`).
- Always set `--name` and `--tagline`. They feed listing copy and promo art.
- Change of mind later is cheap: `profile --add/--remove`, then `plan` reflects it.

## Monorepos

`scan` merges every `package.json` it finds (to depth 7, skipping `node_modules` and build output) into one profile. If the repo ships several products (a web app and a mobile app, say), tag the union, then run the plan once; items carry their own `Applies when` lines so you can see which product each one is about. For truly separate launches, run with `--root apps/<name>`; each root keeps its own `.readytogo/`.

## Setup of external tools

Tool commands need nothing extra except these, which are downloaded on demand (never bundled) into `~/.readytogo/tools`:

| Needed for | Run | Size |
|---|---|---|
| `deadcode` | `readytogo setup deadcode` | ~55 MB |
| `render`, frames, 3D mockups, fresh screenshots | `readytogo setup render` | ~250 MB |
| `video`, video output | install `ffmpeg` yourself | |

`readytogo doctor` shows what is missing. Tell the user the size and ask before downloading.

## Working a checklist

1. Read the checklist file once; it lists, per item: priority, why, steps (with platform-specific variants), the command to generate assets, and whether `check` verifies it.
2. Do blockers first, then recommended, then nice. Items cost minutes, shown in `plan`; use that to propose an order.
3. For each item decide: **fix** (you can write the code/config/content), **generate** (an asset command), **verify** (look at the repo and mark), or **hand off** (human-only).
4. After a batch, `readytogo check` then `readytogo plan --open`.

## What counts as evidence for `mark … done`

| Item kind | Evidence to put in `--note` |
|---|---|
| File or config you created or found | the path |
| Asset generated | the output folder and that `check`/dimensions passed |
| External account or setting (domain, DNS, store account) | the user said so, or a command output you ran (e.g. `dig`, `curl -I`) |
| Legal page | the URL or path, and that the owner reviewed it |

If you cannot show evidence, leave it open and put it under "needs you" in your summary.

## CI gate

`readytogo report` exits 1 while blockers are open. In CI:

```yaml
- run: npx -y readytogo@latest check
- run: npx -y readytogo@latest report --out READYTOGO.md
```

Use `--no-fail` for a non-blocking report. Because `check` only knows what is in the repo, expect human-only blockers to stay open until someone marks them.

## Re-runs and drift

Re-run `scan` after big changes (new platform, new store). `profile --add` is additive and keeps your confirmed answers. The catalog has a version (`plan --json` → `version`); if it changed since the last run, read the checklists you touched again, store requirements may have moved.

## Output to the user

Keep it short and ordered: **Open blockers** (id, one line, who must act) → **Done this session** (what changed, where) → **Needs you** (exact next steps, with links from the checklist) → **Suggested next** (top three by priority/minutes).
