// Maintainer-only: refreshes data/*.json from the original web app's catalog, if you have it checked out
// next to this repo (../sass). Contributors normally edit data/*.json directly and run `npm run build:docs`.
import { mkdirSync, writeFileSync } from "node:fs";
import { CHECKS } from "../src/checks.js";

const app = new URL("../../sass/app/", import.meta.url);
const write = (name, v) => (mkdirSync(new URL("../data/", import.meta.url), { recursive: true }), writeFileSync(new URL(`../data/${name}.json`, import.meta.url), JSON.stringify(v, null, 1) + "\n"));

const { ITEMS, CHECKLISTS, PHASES, CATALOG_VERSION, TAGS } = await import(new URL("catalog/index.ts", app));
const { KIT_ASSETS, LISTING_FIELDS, APP_ICON_FORMATS } = await import(new URL("tools/specs.ts", app));
const { ICON_SETS } = await import(new URL("tools/icon-sets.ts", app));
const { TOOLS } = await import(new URL("tools/registry.ts", app));
const { QUESTIONS, STEPS } = await import(new URL("lib/profile.ts", app));

write("catalog", { version: CATALOG_VERSION, phases: PHASES, checklists: CHECKLISTS, items: ITEMS.map((i) => ({ ...i, autoCheck: i.id in CHECKS || undefined })) });
write("specs", { assets: KIT_ASSETS, listing: LISTING_FIELDS, appIcons: APP_ICON_FORMATS });
write("icon-sets", { ...ICON_SETS, favicon: { label: "Web favicon set", folder: "favicon", when: { any: ["store:website"] }, icons: [] } });
write("tools", TOOLS.map(({ slug, component, scope }) => ({ slug, component, scope })));
write("tags", TAGS);
write("questions", { steps: STEPS, questions: QUESTIONS });
console.log(`exported ${ITEMS.length} items, ${CHECKLISTS.length} checklists, ${KIT_ASSETS.length} asset specs. Now run: npm run build:docs`);
