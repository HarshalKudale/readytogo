# Documentation

README, quickstart, API docs, contributing, security and support pages.

Phase: Pre-launch · Last verified: 2026-10-26 · Checklist applies when: always

## pkg.readme: README with install, quickstart and a demo

- **Priority:** blocker · ~45 min · **Applies when:** the checklist applies
- **Why:** The README is your landing page on every registry.
- **Auto-check:** `readytogo check` verifies this one.
- **Generate:** `readytogo annotate <image> --mode highlight --box x,y,w,h`
- **Steps:**
  1. Install command first, then a 10-line example, then a GIF or screenshot.
  2. Add badges for version, CI and license.

## docs.quickstart: Quickstart that works from a clean machine

- **Priority:** blocker · ~30 min · **Applies when:** the checklist applies
- **Why:** Most visitors decide in the first five minutes whether your product is usable.
- **Steps:**
  1. Write the install and first-run commands in the README, copy-pasteable, with the expected output.
  2. Test them in a fresh clone or container; fix every step that fails.
  3. Add one screenshot, GIF or terminal recording of the product working.

## docs.env-example: Environment variables documented in .env.example

- **Priority:** recommended · ~15 min · **Applies when:** none of fw:nocode
- **Why:** Contributors and deployers should not have to read the source to learn what to configure.
- **Auto-check:** `readytogo check` verifies this one.
- **Steps:**
  1. Create .env.example listing every variable with a safe placeholder and a one-line comment.
  2. Make sure .env is in .gitignore.
  3. Describe required versus optional variables in the README.

## docs.api: API or SDK reference generated from the source

- **Priority:** recommended · ~90 min · **Applies when:** any of platform:api, platform:library, platform:cli
- **Why:** A reference that is generated from code stays correct.
- **Steps:**
  1. (any of platform:api) REST/GraphQL API: publish an OpenAPI or GraphQL schema and render it (Scalar, Redoc, Swagger UI).
  2. (any of platform:library; all of lang:js) TypeScript library: generate with TypeDoc and host it; add TSDoc to public exports.
  3. (any of platform:library; all of lang:rust) Rust: document public items and publish on docs.rs; run `cargo doc` with warnings denied.
  4. (any of platform:library; all of lang:python) Python: docstrings plus Sphinx or MkDocs with mkdocstrings.
  5. (any of platform:cli) CLI: `--help` for every command and a command reference page.
  6. Add a runnable example for each major feature.

## docs.security-policy: SECURITY.md with a private way to report vulnerabilities

- **Priority:** recommended · ~10 min · **Applies when:** any of store:github, store:npm, store:pypi, store:crates_io, platform:library, platform:cli
- **Why:** Researchers who cannot find a private channel post publicly or stay silent.
- **Auto-check:** `readytogo check` verifies this one.
- **Steps:**
  1. Add SECURITY.md: supported versions, the contact address or GitHub private vulnerability reporting, and the response time you commit to.
  2. Enable private vulnerability reporting in the GitHub repo settings.

## docs.support: Help and support page users can find

- **Priority:** recommended · ~45 min · **Applies when:** any of store:website, mobile, platform:desktop, platform:extension
- **Why:** Users who cannot find help leave bad reviews instead of emails.
- **Steps:**
  1. Create a help page or FAQ covering install, sign-in, billing and data deletion.
  2. Put a support email or form on it, and link it from the app, the website footer and each store listing.
  3. Store listings need a working support URL.

## pkg.semver: Semver and a CHANGELOG

- **Priority:** recommended · ~20 min · **Applies when:** any of platform:library, platform:cli
- **Why:** Users need to know when an upgrade will break them.
- **Auto-check:** `readytogo check` verifies this one.
- **Steps:**
  1. Keep a CHANGELOG.md in Keep a Changelog format.
  2. (any of lang:rust) Rust: run cargo-semver-checks before each release.
  3. (any of lang:js) JavaScript: use changesets to version and write release notes.

## pkg.repo-meta: Repo description, topics, license and contributing guide

- **Priority:** recommended · ~20 min · **Applies when:** any of store:github
- **Why:** GitHub search and topic pages drive discovery for developer tools.
- **Auto-check:** `readytogo check` verifies this one.
- **Generate:** design it as HTML at the exact size (references/mockups.md), `readytogo render` it, then `readytogo verify <file> --target <id>` (ids: github_social)
- **Steps:**
  1. Add a one-line description, website link and 5–10 topics.
  2. Add CONTRIBUTING.md and issue templates.
