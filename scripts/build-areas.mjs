// Builds one reference file and one slash command per area from data/areas.json, so an agent loads only the area it
// was asked to do. Run by `npm run build:docs` after build-references.mjs. Areas with `command: false` have a hand-written command.
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";

const root = new URL("../", import.meta.url);
const data = (name) => JSON.parse(readFileSync(new URL(`data/${name}.json`, root), "utf8"));
const out = (rel, text) => {
  const url = new URL(rel, root);
  mkdirSync(new URL(".", url), { recursive: true });
  writeFileSync(url, text);
};

const AREAS = data("areas");
const { checklists: CHECKLISTS, items: ITEMS } = data("catalog");
const TOOL_LINES = {
  icons: "`readytogo icons <master> --for <set>`",
  shot: "`readytogo shot <img...> --target <id>`",
  verify: "`readytogo verify <img...> --target <id|WxH>`",
  video: "`readytogo video <in> --out <file>`",
  annotate: "`readytogo annotate <img> --box x,y,w,h --mode redact|highlight`",
  listing: "`readytogo listing <fields.json>`",
  seo: "`readytogo seo <page|url>`",
  links: "`readytogo links <page|url>`",
  backlinks: "`readytogo backlinks <export> --target <domain> --verify`",
  deadcode: "`readytogo deadcode [dir]`",
  domains: "`readytogo domains <name...> [--tlds com,io]`",
  specs: "`readytogo specs --store <store>`",
  render: "`readytogo render <page> --size WxH --out <file>`",
};

const known = new Set(CHECKLISTS.map((c) => c.slug));
const owned = new Set(AREAS.flatMap((a) => a.checklists));
for (const slug of owned) if (!known.has(slug)) throw new Error(`areas.json names unknown checklist "${slug}"`);
for (const c of CHECKLISTS) if (!owned.has(c.slug)) throw new Error(`checklist "${c.slug}" belongs to no area in data/areas.json`);

rmSync(new URL("skills/readytogo/references/areas/", root), { recursive: true, force: true });
const index = ["# Areas", "", "Each area is a slice of the checklist. Work only the area you were asked for: read its file, run `readytogo analyze --area <slug>`, and ignore the rest.", ""];

for (const a of AREAS) {
  const items = ITEMS.filter((i) => a.checklists.includes(i.checklist));
  index.push(`- [\`${a.slug}\`](areas/${a.slug}.md): ${a.summary} (${items.length} items)`);
  const md = [
    `# Area: ${a.title}`,
    "",
    a.summary,
    "",
    `Start: \`readytogo analyze --area ${a.slug}\` (profiles if needed, runs this area's checks, saves the before-snapshot, lists what is not ready and the decisions to ask the user). Then \`readytogo branch --area ${a.slug}\` before touching files, \`readytogo check --area ${a.slug}\` after, \`readytogo diff --area ${a.slug}\` to show the result.`,
    "",
    "## Checklists (read only those `analyze` shows open items for)",
    "",
    ...a.checklists.map((slug) => CHECKLISTS.find((c) => c.slug === slug)).map((c) => `- [${c.title}](../checklists/${c.slug}.md): ${c.description}`),
  ];
  if (a.tools.length) md.push("", "## Tools", "", ...a.tools.map((t) => `- ${TOOL_LINES[t] ?? t}`));
  if (a.guides.length) md.push("", "## Guidelines", "", ...a.guides.map((g) => `- [${g}](../${g})`));
  const dec = items.filter((i) => i.decide);
  if (dec.length) {
    md.push("", "## Decisions to put to the user (after analysis, in one message)", "");
    for (const i of dec) md.push(`- **${i.decide.question}** (\`${i.id}\`)`, ...i.decide.options.map((o) => `  - ${o}`));
  }
  out(`skills/readytogo/references/areas/${a.slug}.md`, md.join("\n") + "\n");

  if (a.command === false) continue;
  out(`commands/${a.slug}.md`, `---
description: Make the ${a.title.toLowerCase()} area ship-ready (analyse, ask, fix on a branch)
argument-hint: "${a.args ?? "focus"}"
---

Use the \`readytogo\` skill for the **${a.slug}** area only (${a.summary}). Focus: $ARGUMENTS (empty = the whole area). Do not look at other areas.

1. Read \`references/areas/${a.slug}.md\`. Run \`readytogo analyze --area ${a.slug}\`.
2. Show me what is not ready (blockers first) and ask me the listed decisions in one message. Wait for my answers.
3. \`readytogo branch --area ${a.slug}\`, then fix only what I approved, in small commits on that branch. Never push, merge, publish or pay.
4. \`readytogo check --area ${a.slug}\`, \`readytogo diff --area ${a.slug}\`, and finish with: fixed, still open, needs me.
`);
}
index.push("");
out("skills/readytogo/references/areas.md", index.join("\n"));
console.log(`built ${AREAS.length} area files and ${AREAS.filter((a) => a.command !== false).length} commands`);
