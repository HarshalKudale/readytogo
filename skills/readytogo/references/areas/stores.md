# Area: Store submissions and distribution

App Store, Google Play, extension stores, Microsoft Store, desktop signing, registries

Start: `readytogo analyze --area stores` (profiles if needed, runs this area's checks, saves the before-snapshot, lists what is not ready and the decisions to ask the user). Then `readytogo branch --area stores` before touching files, `readytogo check --area stores` after, `readytogo diff --area stores` to show the result.

## Checklists (read only those `analyze` shows open items for)

- [Apple App Store](../checklists/apple-app-store.md): Listing, assets and privacy answers App Review checks.
- [Google Play](../checklists/google-play.md): Console setup, listing assets and the data safety form.
- [Browser extension stores](../checklists/chrome-web-store.md): Manifest, permissions and listings for Chrome, Firefox and Edge.
- [Microsoft Store](../checklists/microsoft-store.md): Partner Center listing and package requirements.
- [Snap and Flathub](../checklists/linux-stores.md): Store metadata and sandboxing for Linux app stores.
- [Desktop distribution](../checklists/desktop-release.md): Signing, packaging and updates for each OS.
- [Registries and releases](../checklists/package-registries.md): Registries, package managers and release downloads.

## Tools

- `readytogo specs --store <store>`
- `readytogo shot <img...> --target <id>`
- `readytogo verify <img...> --target <id|WxH>`
- `readytogo listing <fields.json>`
- `readytogo icons <master> --for <set>`

## Guidelines

- [store-specs.md](../store-specs.md)
