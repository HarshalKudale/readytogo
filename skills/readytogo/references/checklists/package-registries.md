# Registries and releases

Registries, package managers and release downloads.

Phase: Pre-launch · Last verified: 2026-10-24 · Checklist applies when: any of store:npm, store:pypi, store:crates_io, store:homebrew, store:github

## pkg.readme: README with install, quickstart and a demo

- **Priority:** blocker · ~45 min · **Applies when:** the checklist applies
- **Why:** The README is your landing page on every registry.
- **Auto-check:** `readytogo check` verifies this one.
- **Generate:** `readytogo annotate <image> --mode highlight --box x,y,w,h`
- **Steps:**
  1. Install command first, then a 10-line example, then a GIF or screenshot.
  2. Add badges for version, CI and license.

## pkg.crates: crates.io metadata complete, dry run passes

- **Priority:** blocker · ~30 min · **Applies when:** any of store:crates_io
- **Why:** Missing metadata hurts discoverability, and a publish can't be undone.
- **Steps:**
  1. Set description, license, repository, keywords (max 5) and categories in Cargo.toml.
  2. Exclude large assets with include/exclude, then run cargo publish --dry-run.
  3. Publish from CI using trusted publishing or a scoped token.

## pkg.npm: npm package published from CI with provenance

- **Priority:** blocker · ~30 min · **Applies when:** any of store:npm
- **Why:** Provenance shows users the package was built from your repo.
- **Steps:**
  1. Set files, exports, types and engines in package.json; check the tarball with npm pack --dry-run.
  2. Publish from GitHub Actions with npm publish --provenance (or trusted publishing).

## pkg.pypi: PyPI trusted publishing from GitHub Actions

- **Priority:** blocker · ~30 min · **Applies when:** any of store:pypi
- **Why:** No long-lived tokens, and every release is tied to a workflow run.
- **Steps:**
  1. Configure the trusted publisher on PyPI.
  2. Build sdist and wheel with python -m build and publish with pypa/gh-action-pypi-publish.

## pkg.homebrew: Homebrew tap formula or cask

- **Priority:** recommended · ~45 min · **Applies when:** any of store:homebrew
- **Why:** brew install is how most Mac developers expect to install tools.
- **Steps:**
  1. (any of platform:cli) CLI: publish a formula in your own tap (yourname/homebrew-tap).
  2. (any of platform:desktop) Desktop: publish a cask pointing at your signed, notarized .dmg.
  3. (any of lang:rust) Rust: cargo-dist can generate the Homebrew formula and installers for you.

## pkg.github-release: GitHub Releases with binaries for every target and checksums

- **Priority:** recommended · ~60 min · **Applies when:** any of platform:cli, platform:desktop; all of store:github
- **Why:** Users and package managers download from here.
- **Steps:**
  1. (any of lang:rust) Rust: build all targets in CI with cargo-dist or a matrix (x86_64 and aarch64 for each OS).
  2. (any of lang:go) Go: use GoReleaser.
  3. Attach SHA-256 checksums and release notes generated from your changelog.

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
