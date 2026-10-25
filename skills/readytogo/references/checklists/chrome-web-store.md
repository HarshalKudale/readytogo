# Browser extension stores

Manifest, permissions and listings for Chrome, Firefox and Edge.

Phase: Pre-launch · Last verified: 2026-10-24 · Checklist applies when: any of store:chrome_web_store, store:firefox_addons, store:edge_addons

## cws.mv3: Manifest V3 build

- **Priority:** blocker · ~60 min · **Applies when:** the checklist applies
- **Why:** Chrome no longer accepts Manifest V2 extensions.
- **Auto-check:** `readytogo check` verifies this one.
- **Steps:**
  1. Migrate background pages to service workers.
  2. (any of fw:wxt, fw:plasmo) WXT and Plasmo output MV3 by default; check manifest_version in the build.

## cws.purpose: Single, clearly described purpose

- **Priority:** blocker · ~15 min · **Applies when:** the checklist applies
- **Why:** Multi-purpose extensions are rejected under the single-purpose policy.
- **Needs product copy:** tagline
- **Steps:**
  1. Describe the one thing your extension does in the listing.

## cws.permissions: Justification for every permission

- **Priority:** blocker · ~20 min · **Applies when:** the checklist applies
- **Why:** Broad permissions slow review or cause rejection.
- **Steps:**
  1. Request the minimum permissions; prefer activeTab over broad host permissions.
  2. Justify each one in the privacy practices tab.

## cws.assets: 128×128 icon, 1280×800 screenshots, 440×280 promo tile

- **Priority:** recommended · ~45 min · **Applies when:** any of store:chrome_web_store
- **Why:** Required listing assets; the promo tile helps you get featured.
- **Auto-check:** `readytogo check` verifies this one.
- **Generate:** `readytogo icons <master-icon.png|svg> --for chrome_web_store` · `readytogo shot <screenshot> --target <id>` · `readytogo promo --target <id> --title "…"` (ids: chrome, cws_small, cws_marquee)
- **Steps:**
  1. Generate the icon set.
  2. Make 1–5 screenshots at 1280×800.

## cws.firefox: Firefox Add-ons listing (AMO)

- **Priority:** blocker · ~45 min · **Applies when:** any of store:firefox_addons
- **Why:** AMO reviews separately and may ask for your source code if the build is bundled.
- **Generate:** `readytogo icons <master-icon.png|svg> --for firefox_addons` · `readytogo shot <screenshot> --target <id>` (ids: firefox) · `readytogo listing <fields.json>` (field ids: amo_name, amo_summary)
- **Steps:**
  1. Add browser_specific_settings.gecko.id to the manifest.
  2. (any of fw:wxt) WXT: wxt zip -b firefox also produces the sources zip AMO asks for.
  3. Upload source code and build instructions if your code is bundled or minified.

## cws.edge: Edge Add-ons listing

- **Priority:** recommended · ~30 min · **Applies when:** any of store:edge_addons
- **Why:** Edge has its own Partner Center review; the Chrome package usually works as-is.
- **Generate:** `readytogo icons <master-icon.png|svg> --for edge_addons` · `readytogo shot <screenshot> --target <id>` · `readytogo promo --target <id> --title "…"` (ids: edge, edge_logo, edge_small, edge_large)
- **Steps:**
  1. Register in Partner Center for Microsoft Edge.
  2. Upload the same zip and reuse your Chrome listing copy.
