// Builds the agent-facing Markdown (skills/readytogo/references/checklists/*.md, checklists.md, store-specs.md)
// from data/*.json. Edit the JSON, run `npm run build:docs`, commit both.
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { CHECKS } from "../src/checks.js";

const skill = new URL("../skills/readytogo/", import.meta.url);
const data = (name) => JSON.parse(readFileSync(new URL(`../data/${name}.json`, import.meta.url), "utf8"));
const out = (url, text) => (mkdirSync(new URL(".", url), { recursive: true }), writeFileSync(url, text));

const { phases: PHASES, checklists: CHECKLISTS, items: ITEMS } = data("catalog");
const { assets: KIT_ASSETS, listing: LISTING_FIELDS } = data("specs");
const ICON_SETS = data("icon-sets");
const TOOLS = data("tools");

const expr = (e) => (!e ? "always" : [e.any && `any of ${e.any.join(", ")}`, e.all && `all of ${e.all.join(", ")}`, e.none && `none of ${e.none.join(", ")}`].filter(Boolean).join("; "));

// What command produces the output an item's tool slug stands for.
function toolHint(slug) {
  const t = TOOLS.find((x) => x.slug === slug);
  if (!t) return null;
  const ids = (t.scope ?? []).join(", ");
  switch (t.component) {
    case "store-kit": {
      const kinds = new Set((t.scope ?? []).map((s) => KIT_ASSETS.find((a) => a.id === s)?.kind));
      return [kinds.has("shot") && "`readytogo shot <screenshot> --target <id>`", kinds.has("promo") && '`readytogo promo --target <id> --title "…"`'].filter(Boolean).join(" · ") + ` (ids: ${ids})`;
    }
    case "icon-pack":
    case "app-icon-file":
      return `\`readytogo icons <master-icon.png|svg> --for ${t.scope.join("|")}\``;
    case "favicon":
      return "`readytogo icons <logo> --for favicon`";
    case "device-mockup":
      return t.scope?.some((s) => s.includes("3d")) ? "3D: see `references/mockups-3d.md`" : `\`readytogo frame <screenshot> --frame ${t.scope?.[0] ?? "phone"}\``;
    case "listing-copy":
      return `\`readytogo listing <fields.json>\` (field ids: ${ids})`;
    case "meta-tags":
    case "link-preview":
    case "seo-score":
      return "`readytogo seo <page.html|url>`";
    case "annotate":
      return `\`readytogo annotate <image> --mode ${t.scope?.[0] ?? "highlight"} --box x,y,w,h\``;
    default:
      return null;
  }
}

rmSync(new URL("references/checklists/", skill), { recursive: true, force: true });
const index = ["# Checklists", "", "Generated from `data/catalog.json`. Run `readytogo plan` to see which apply to this repo, then read only those files.", ""];
for (const phase of PHASES) {
  index.push(`## ${phase.title}`, "", `_${phase.description}_`, "");
  for (const c of CHECKLISTS.filter((x) => x.phase === phase.id).sort((a, b) => a.order - b.order)) {
    const list = ITEMS.filter((i) => i.checklist === c.slug).sort((a, b) => a.order - b.order);
    index.push(`- [${c.title}](checklists/${c.slug}.md) — ${c.description} (${list.length} items; applies: ${expr(c.appliesTo)})`);
    const md = [`# ${c.title}`, "", c.description, "", `Phase: ${phase.title} · Last verified: ${c.lastVerified} · Checklist applies when: ${expr(c.appliesTo)}`, ""];
    for (const i of list) {
      md.push(`## ${i.id}: ${i.title}`, "", `- **Priority:** ${i.priority} · ~${i.minutes} min · **Applies when:** ${i.appliesTo ? expr(i.appliesTo) : "the checklist applies"}`, `- **Why:** ${i.why}`);
      if (i.id in CHECKS) md.push("- **Auto-check:** `readytogo check` verifies this one.");
      if (i.kit?.length) md.push(`- **Needs product copy:** ${i.kit.join(", ")}`);
      const hints = (i.tools ?? []).map(toolHint).filter(Boolean);
      if (hints.length) md.push(`- **Generate:** ${[...new Set(hints)].join(" · ")}`);
      if (i.toolOptions?.length) md.push(`- **Asset ids needed:** ${i.toolOptions.join(", ")}`);
      md.push("- **Steps:**", ...i.steps.map((s, n) => (typeof s === "string" ? `  ${n + 1}. ${s}` : `  ${n + 1}. (${expr(s.appliesTo)}) ${s.text}`)), "");
    }
    out(new URL(`references/checklists/${c.slug}.md`, skill), md.join("\n"));
  }
  index.push("");
}
out(new URL("references/checklists.md", skill), index.join("\n"));

const storeOf = (a) => (a.when?.any?.[0] ?? "any").replace("store:", "");
const rows = KIT_ASSETS.map((a) => `| \`${a.id}\` | ${a.kind === "shot" ? "screenshot" : "graphic"} | ${storeOf(a)} | ${a.label} | ${a.w}×${a.h} | ${a.req ? "**required**" : "optional"} | ${a.max ? `up to ${a.max}` : "1"} | ${a.note ?? ""} |`);
out(new URL("references/store-specs.md", skill), [
  "# Store asset specs",
  "",
  "Generated from `data/specs.json`. Stores change these; if `Last verified` on the relevant checklist is old, confirm against the store's live docs before generating in bulk.",
  "",
  "Use the id with `readytogo shot --target <id>` (screenshots) or `readytogo promo --target <id>` (graphics).",
  "",
  "| id | type | store | label | size | status | count | note |",
  "|---|---|---|---|---|---|---|---|",
  ...rows,
  "",
  "## Icon sets (`readytogo icons <src> --for <key>`)",
  "",
  ...Object.entries(ICON_SETS).filter(([k]) => k !== "favicon").flatMap(([k, s]) => [`### \`${k}\` — ${s.label}`, "", ...s.icons.map((i) => `- ${i.size}×${i.size} → \`${s.folder}/${i.file}\`${i.opaque ? " (no alpha channel)" : ""}`), ""]),
  "### `favicon` — Web favicon set",
  "",
  "- `favicon.ico` (16, 32, 48), `favicon-16x16.png`, `favicon-32x32.png`, `apple-touch-icon.png` (180, opaque), `icon-192.png`, `icon-512.png`, `site.webmanifest` + HTML snippet",
  "",
  "### `icns` / `ico` — desktop app icon files",
  "",
  "- `icns`: macOS .icns with 16–1024 (use `--mac-grid` to fit the rounded-square grid) · `ico`: Windows .ico with 16–256",
  "",
  "## Listing text limits (`readytogo listing <fields.json>`)",
  "",
  "| id | label | max chars |",
  "|---|---|---|",
  ...LISTING_FIELDS.map((f) => `| \`${f.id}\` | ${f.label} | ${f.max} |`),
  "",
].join("\n"));
console.log(`built ${CHECKLISTS.length} checklists (${ITEMS.length} items) and store-specs.md`);
