# Snap and Flathub

Store metadata and sandboxing for Linux app stores.

Phase: Pre-launch · Last verified: 2026-10-24 · Checklist applies when: any of store:snap_flathub

## linux.flathub: Flatpak manifest and AppStream metainfo

- **Priority:** blocker · ~120 min · **Applies when:** the checklist applies
- **Why:** Flathub requires a reproducible manifest and complete AppStream metadata.
- **Steps:**
  1. Write a Flatpak manifest with minimal finish-args permissions.
  2. (any of lang:rust) Rust: vendor crates with flatpak-cargo-generator so the build runs offline.
  3. Add a .metainfo.xml with screenshots, release notes and OARS content rating, and validate it with appstreamcli.

## linux.snap: snapcraft.yaml with strict confinement

- **Priority:** recommended · ~90 min · **Applies when:** the checklist applies
- **Why:** Strict confinement avoids a manual review and builds trust.
- **Steps:**
  1. Declare only the plugs you need (network, home, desktop).
  2. Publish to the edge channel first, then stable.
