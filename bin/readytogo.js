#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join, relative, resolve, sep } from "node:path";
import { parseArgs } from "node:util";
import { itemsOf, areas as allAreas, pickAreas, scopePlan } from "../src/areas.js";
import { compare, loadBaseline, recordBaseline } from "../src/baseline.js";
import { runChecks, context } from "../src/checks.js";
import { branchInfo, changesSince, currentBranch, isRepo, startBranch } from "../src/git.js";
import { buildPlan, isClosed, summarize } from "../src/plan.js";
import { scan } from "../src/scan.js";
import { parsePage, scorePage } from "../src/seo.js";
import { load, save } from "../src/state.js";
import { data, readJson, walk } from "../src/util.js";

const HELP = `readytogo (alias: rtg): audit a repo for launch readiness, work on it safely, and generate store assets.

Areas: ${allAreas().map((a) => a.slug).join(", ")}. Commands that take --area load and check only that slice: use it.

Workflow: analyze (what is not ready, "before" snapshot, decisions) -> ask the user -> branch (safe work branch) -> fix -> check -> diff (what changed)
  analyze [--area a,b|all] [--rebaseline] [--json]   profile if needed, run the area's checks, save the "before" snapshot, list what is not ready + decisions
  branch [--area a,b] [--name s] [--allow-dirty]     create readytogo/<area>-<date> from the current commit; refuses over uncommitted work
  diff [--area a,b]                                  before vs now per area, plus commits and files changed since the baseline
  areas                                              list areas with their checklists

Readiness
  scan [--write]                        detect stack/platform tags from the repo
  profile [--add t,t] [--remove t,t] [--name s] [--tagline s] [--confirm] [--tags]
  plan [--area a,b] [--open] [--priority blocker] [--checklist slug] [--json]
  check [--area a,b] [--only id,id]     run automatic checks, store results
  mark <item-id> <done|skipped|na|open> [--note "…"]
  report [--area a,b] [--out READYTOGO.md] [--no-fail]   includes before/after when a baseline exists

Converters, resizers, analysers (exact and deterministic; they never design anything)
  specs [--store chrome_web_store] [--json]
  icons <src.png|svg> --for <set> [--out dir] [--bg #hex] [--padding 0.1] [--round] [--mac-grid] [--name App]
  shot <screenshot...> --target <id> [--fit cover|contain] [--bg #hex] [--out dir]
  verify <image...> --target <id|WxH>     does the file meet the store spec (size, format, alpha, bytes)?
  video <in> [--out file.webm|mp4|gif] [--width 1280] [--fps 30] [--start s] [--duration s] [--crf n]   (no --out: probe only)
  annotate <image> --box x,y,w,h [--box …] [--mode highlight|redact] [--out file]
  listing <fields.json>                 check store listing text against character limits
  seo <page.html|https://url>           on-page SEO score and link-preview tags
  links <page.html|https://url> [--no-check] [--limit 150] [--allow-local]   broken/redirecting/unsafe links on a page
  backlinks <export.csv|urls.txt> --target example.com [--verify] [--limit 100] [--json]   who links to you, and do they still?
  domains <name...> [--tlds com,io,app]  which domains look free (RDAP lookup; never registers anything)
  deadcode [dir] [--lang ts,py] [--ignore glob,glob] [--min high|medium|low] [--max 200] [--strict] [--json]   unused code via tree-sitter

Setup: tools that are downloaded, never bundled, so they stay current
  setup [deadcode] [render] [--update]   installs tree-sitter + grammars / Playwright + Chromium into ~/.readytogo/tools

Mockup base assets and rendering (needs: readytogo setup render)
  scaffold <3d|frames|promo> [--dir path] [--model id]   copy the scene / frames / starter into the project to edit
  models                                list the bundled 3D phone and laptop models
  render <page.html[?query]> --size 1600x1200 --out file.png [--transparent] [--scale 2] [--at 2.0]
         [--video out.webm|mp4|gif [--duration s] [--fps 30] | --frames N --out dir]   (scene pages report their own duration)

  doctor                                check Node, sharp, setup tools, ffmpeg
Global: --root <dir> (default: current directory)`;

const OPTIONS = {
  root: { type: "string" }, json: { type: "boolean" }, write: { type: "boolean" }, add: { type: "string" }, remove: { type: "string" },
  name: { type: "string" }, tagline: { type: "string" }, confirm: { type: "boolean" }, tags: { type: "boolean" }, open: { type: "boolean" },
  priority: { type: "string" }, checklist: { type: "string" }, only: { type: "string" }, note: { type: "string" }, out: { type: "string" },
  "no-fail": { type: "boolean" }, store: { type: "string" }, for: { type: "string" }, bg: { type: "string" }, padding: { type: "string" },
  round: { type: "boolean" }, "mac-grid": { type: "boolean" }, target: { type: "string" }, fit: { type: "string" }, width: { type: "string" }, limit: { type: "string" }, verify: { type: "boolean" }, "no-check": { type: "boolean" }, "allow-local": { type: "boolean" }, lang: { type: "string" }, ignore: { type: "string" }, min: { type: "string" }, max: { type: "string" }, strict: { type: "boolean" }, update: { type: "boolean" }, start: { type: "string" }, crf: { type: "string" },
  area: { type: "string" }, tlds: { type: "string" }, "allow-dirty": { type: "boolean" }, rebaseline: { type: "boolean" }, size: { type: "string" }, color: { type: "string" }, mode: { type: "string" },
  box: { type: "string", multiple: true }, scale: { type: "string" }, transparent: { type: "boolean" }, wait: { type: "string" },
  frames: { type: "string" }, at: { type: "string" }, fps: { type: "string" }, duration: { type: "string" }, video: { type: "string" }, dir: { type: "string" },
  model: { type: "string", multiple: true }, help: { type: "boolean", short: "h" },
};

const list = (s) => (s ? s.split(",").map((x) => x.trim()).filter(Boolean) : []);
const log = console.log;
const MARK = { open: "[ ]", failing: "[!]", verified: "[v]", done: "[x]", skipped: "[-]", na: "[-]" };

function needProfile(root) {
  const s = load(root);
  if (!s.profile.tags.length) throw new Error("No profile yet. Run `readytogo scan --write`, confirm unknowns, then `readytogo profile --confirm`.");
  return s;
}

function planLines(plan, { onlyOpen, priority, checklist } = {}) {
  const out = [];
  for (const c of plan.checklists) {
    if (checklist && c.slug !== checklist) continue;
    const items = c.items.filter((i) => (!onlyOpen || !isClosed(i)) && (!priority || i.priority === priority));
    if (!items.length) continue;
    out.push(`\n## ${c.title} (${c.slug}) · ${c.phase}`);
    for (const i of items) out.push(`${MARK[i.status] ?? "[ ]"} ${i.id} · ${i.priority} · ~${i.minutes}m · ${i.title}${i.note ? `\n      ↳ ${i.note}` : ""}`);
  }
  return out.join("\n");
}

// The plan for the requested areas only (all areas when --area is absent).
function scoped(s, v) {
  const selected = pickAreas(v.area);
  const plan = scopePlan(buildPlan(s.profile.tags, { state: s.state, checks: s.checks }), selected);
  return { selected, plan };
}

const CAP = (t, n = 150) => (t.length > n ? t.slice(0, n - 1) + "…" : t);
const itemLine = (i) => `[${i.priority}] ${MARK[i.status] ?? "[ ]"} ${i.id} · ~${i.minutes}m · ${i.title}${i.note ? `\n      ↳ ${CAP(i.note.replace(/\s+/g, " "))}` : ""}`;

function comparisonLines(root, plan, selected) {
  const rows = compare(root, plan, selected).filter((r) => r.baseline);
  const lines = [];
  for (const r of rows) {
    lines.push(`${r.area}: ${r.baseline.closed}/${r.baseline.total} ready before (${r.baseline.at.slice(0, 10)}) → ${r.closedNow}/${r.total} now`);
    for (const c of r.changes) lines.push(`  + ${c.id}  ${c.from} → ${c.to}`);
    for (const c of r.regressions) lines.push(`  ! ${c.id}  ${c.from} → ${c.to}  (regression)`);
  }
  return { rows, lines };
}

function reportMarkdown(plan, name, before) {
  const s = summarize(plan);
  const lines = [`# Ship readiness${name ? `: ${name}` : ""}`, "", `Generated ${new Date().toISOString().slice(0, 10)} · catalog ${plan.version} · ${s.closed}/${s.total} items closed · **${s.openBlockers.length} open blockers**`, "", "> Automated checks read the repo only. Items marked verified passed a check; done/skipped were marked by a person or agent. This is not legal advice and not a guarantee of store approval.", ""];
  if (s.openBlockers.length) {
    lines.push("## Open blockers", "", ...s.openBlockers.map((i) => `- \`${i.id}\` ${i.title}${i.note ? ` — ${i.note}` : ""}`), "");
  }
  if (before?.lines.length) lines.push("## Before / after", "", "```", ...before.lines, "```", "");
  for (const c of plan.checklists) {
    lines.push(`## ${c.title}`, "", "| Status | Item | Priority | Note |", "|---|---|---|---|");
    for (const i of c.items) lines.push(`| ${MARK[i.status]} ${i.status} | \`${i.id}\` ${i.title.replace(/\|/g, "/")} | ${i.priority} | ${(i.note ?? "").replace(/\|/g, "/").replace(/\n/g, " ")} |`);
    lines.push("");
  }
  return lines.join("\n");
}

async function sharpLib() {
  return (await import("sharp")).default;
}

const main = async () => {
  const { positionals, values: v } = parseArgs({ options: OPTIONS, allowPositionals: true, strict: true });
  const [cmd, ...args] = positionals;
  if (!cmd || v.help || cmd === "help") return log(HELP);
  const root = resolve(v.root ?? ".");
  const assetsDir = (...p) => join(root, ".readytogo", "assets", ...p);

  switch (cmd) {
    case "scan": {
      const r = scan(root);
      if (v.write) {
        const prev = load(root).profile;
        save(root, "profile.json", { ...prev, tags: r.tags, assumed: r.assumed, product: { ...r.product, ...prev.product }, confirmed: prev.confirmed ?? false });
      }
      if (v.json) return log(JSON.stringify(r, null, 2));
      log(`Scanned ${r.fileCount} files in ${root}\n\nTags (${r.tags.length}):\n  ${r.tags.join("\n  ")}\n\nEvidence:\n  ${r.found.join("\n  ")}`);
      log(`\nProduct: ${JSON.stringify(r.product)}\n\nAssumed (confirm with the user): ${r.assumed.join(", ") || "none"}\nCannot be read from the repo, ask the user: ${r.ask.join(", ")}\n(see data/questions.json for the options; record answers with \`readytogo profile --add tag,tag --confirm\`)`);
      if (v.write) log("\nWrote .readytogo/profile.json");
      return;
    }
    case "profile": {
      const s = load(root);
      const known = data("tags");
      const p = s.profile;
      const bad = [...list(v.add), ...list(v.remove)].filter((t) => !(t in known));
      if (bad.length) throw new Error(`Unknown tag(s): ${bad.join(", ")}. Run \`readytogo profile --tags\` for the list.`);
      if (v.tags) return log(Object.entries(known).map(([t, d]) => `${t}\t${d}`).join("\n"));
      const tags = new Set(p.tags);
      list(v.add).forEach((t) => tags.add(t));
      list(v.remove).forEach((t) => tags.delete(t));
      const next = { ...p, tags: [...tags].sort(), assumed: (p.assumed ?? []).filter((t) => tags.has(t) && !list(v.add).includes(t)), product: { ...p.product, ...(v.name && { name: v.name }), ...(v.tagline && { tagline: v.tagline }) }, confirmed: v.confirm ? true : p.confirmed };
      if (v.add || v.remove || v.name || v.tagline || v.confirm) save(root, "profile.json", next);
      return log(JSON.stringify(next, null, 2));
    }
    case "plan": {
      const s = needProfile(root);
      const { plan } = scoped(s, v);
      if (v.json) return log(JSON.stringify(plan, null, 2));
      const sum = summarize(plan);
      log(`${plan.checklists.length} checklists, ${sum.total} items, ${sum.closed} closed, ${sum.openBlockers.length} open blockers${s.profile.confirmed ? "" : "  (profile NOT confirmed yet)"}`);
      log(planLines(plan, { onlyOpen: v.open, priority: v.priority, checklist: v.checklist }));
      return log("\nDetails for an item: references/checklists/<checklist>.md");
    }
    case "check": {
      const s = needProfile(root);
      const { plan } = scoped({ ...s, checks: undefined }, v);
      const ids = plan.checklists.flatMap((c) => c.items).filter((i) => i.autoCheck && (!v.only || list(v.only).includes(i.id))).map((i) => i.id);
      const ctx = context(root, walk(root), new Set(s.profile.tags));
      const results = await runChecks(ctx, ids, await sharpLib());
      save(root, "checks.json", { at: new Date().toISOString(), results: { ...s.checks.results, ...results } });
      for (const [id, r] of Object.entries(results)) log(`${r.pass === true ? "PASS" : r.pass === false ? "FAIL" : "????"}  ${id}  ${r.detail}`);
      const n = (x) => Object.values(results).filter((r) => r.pass === x).length;
      return log(`\n${ids.length} checks: ${n(true)} pass, ${n(false)} fail, ${n(null)} need judgement. Results saved to .readytogo/checks.json`);
    }
    case "mark": {
      const [id, status] = args;
      if (!data("catalog").items.some((i) => i.id === id)) throw new Error(`Unknown item id "${id}".`);
      if (!["done", "skipped", "na", "open"].includes(status)) throw new Error("Status must be done, skipped, na or open.");
      const s = load(root);
      if (status === "open") delete s.state.items[id];
      else s.state.items[id] = { status, note: v.note, at: new Date().toISOString() };
      save(root, "state.json", s.state);
      return log(`${id} → ${status}`);
    }
    case "report": {
      const s = needProfile(root);
      const { plan, selected } = scoped(s, v);
      const file = resolve(root, v.out ?? "READYTOGO.md");
      writeFileSync(file, reportMarkdown(plan, s.profile.product?.name, comparisonLines(root, plan, selected)) + "\n");
      const sum = summarize(plan);
      log(`Wrote ${file}: ${sum.closed}/${sum.total} closed, ${sum.openBlockers.length} open blockers`);
      if (sum.openBlockers.length && !v["no-fail"]) {
        log(sum.openBlockers.map((i) => `  blocker: ${i.id} ${i.title}`).join("\n"));
        process.exitCode = 1;
      }
      return;
    }
    case "areas": {
      return log(allAreas().map((a) => `${a.slug.padEnd(10)} ${a.title} · ${a.checklists.join(", ")}\n           ${a.summary}`).join("\n"));
    }
    case "analyze": {
      const selected = pickAreas(v.area);
      let s = load(root);
      const notes = [];
      if (!s.profile.tags.length) {
        const r = scan(root);
        save(root, "profile.json", { ...s.profile, tags: r.tags, assumed: r.assumed, product: { ...r.product, ...s.profile.product }, confirmed: false });
        s = load(root);
        notes.push(`Scanned ${r.fileCount} files: ${r.tags.length} tags. Assumed (confirm): ${r.assumed.join(", ") || "none"}. Only the user knows: ${r.ask.join(", ")} (options: data/questions.json).`);
      } else if (!s.profile.confirmed) notes.push("Profile is not confirmed yet: confirm stores, pricing and data with the user, then `readytogo profile --confirm`.");
      const fresh = scopePlan(buildPlan(s.profile.tags, { state: s.state }), selected);
      const ids = itemsOf(fresh).filter((i) => i.autoCheck).map((i) => i.id);
      const results = await runChecks(context(root, walk(root), new Set(s.profile.tags)), ids, await sharpLib());
      save(root, "checks.json", { at: new Date().toISOString(), results: { ...s.checks.results, ...results } });
      s = load(root);
      const plan = scopePlan(buildPlan(s.profile.tags, { state: s.state, checks: s.checks }), selected);
      const wrote = recordBaseline(root, plan, selected, { force: v.rebaseline });
      const open = itemsOf(plan).filter((i) => !isClosed(i));
      const decisions = open.filter((i) => i.decide);
      if (v.json) return log(JSON.stringify({ areas: selected.map((a) => a.slug), notes, baselineWritten: wrote, open: open.map(({ steps, why, ...i }) => i), decisions: decisions.map((i) => ({ id: i.id, ...i.decide })) }, null, 2));
      log(`ReadyToGo analysis · ${selected.map((a) => a.slug).join(", ")} · ${s.profile.tags.length} tags${s.profile.confirmed ? "" : " (profile not confirmed)"}`);
      notes.forEach((n) => log(n));
      log(wrote.length ? `Baseline ("before") saved for: ${wrote.join(", ")}` : "Baseline kept from an earlier analysis (use --rebaseline to reset).");
      const rank = (p) => ["blocker", "recommended", "nice"].indexOf(p);
      for (const a of selected) {
        const items = itemsOf(plan).filter((i) => i.area === a.slug);
        if (!items.length) { log(`\n## ${a.slug}: nothing applies to this product`); continue; }
        const rest = items.filter((i) => !isClosed(i)).sort((x, y) => rank(x.priority) - rank(y.priority));
        log(`\n## ${a.slug} · ${items.length - rest.length}/${items.length} ready`);
        rest.forEach((i) => log(itemLine(i)));
      }
      if (decisions.length) {
        log("\n## Ask the user (one message, then act on the answers)");
        decisions.forEach((i, n) => log(`${n + 1}. ${i.decide.question}  [${i.id}]\n${i.decide.options.map((o, k) => `     ${String.fromCharCode(97 + k)}) ${o}`).join("\n")}`));
      }
      return log(`\nNext: ask the user which items to work on and how, then \`readytogo branch --area ${v.area ?? "all"}\` before changing any file. Item details: references/checklists/<checklist>.md`);
    }
    case "branch": {
      const r = startBranch(root, { scope: v.area ?? "all", name: v.name, allowDirty: v["allow-dirty"] });
      return log(r.created ? `On new branch ${r.branch} (from ${r.base.branch} @ ${r.base.sha?.slice(0, 7)}${r.carriedDirty ? `; ${r.carriedDirty} uncommitted file(s) carried over` : ""}). Commit small; never push or merge. \`readytogo diff\` shows the result.` : `Already on ${r.branch}.`);
    }
    case "diff": {
      const s = load(root);
      const base = loadBaseline(root);
      if (!Object.keys(base.areas).length) throw new Error("No baseline yet. Run `readytogo analyze` before making changes.");
      const { plan, selected } = scoped(s, v);
      const { lines, rows } = comparisonLines(root, plan, selected.filter((a) => base.areas[a.slug]));
      const sha = branchInfo(root)?.base?.sha ?? rows.find((r) => r.baseline?.sha)?.baseline.sha;
      log(lines.length ? lines.join("\n") : "No baseline for those areas.");
      const git = isRepo(root) ? changesSince(root, sha) : null;
      if (git) log(`\nGit (${currentBranch(root)}): ${git.commits.length} commit(s), ${git.uncommitted} uncommitted file(s)\n${git.commits.slice(0, 20).map((c) => "  " + c).join("\n")}${git.stat ? "\n" + git.stat : ""}`);
      return;
    }
    case "domains": {
      if (!args.length) throw new Error("Usage: readytogo domains <name...> [--tlds com,io,app]");
      const { checkDomains, DEFAULT_TLDS } = await import("../src/domains.js");
      const rows = await checkDomains(args, v.tlds ? list(v.tlds) : DEFAULT_TLDS);
      log(rows.map((r) => `${r.status.padEnd(11)} ${r.domain}${r.detail ? `  (${r.detail})` : ""}`).join("\n"));
      return log("\nlikely-free = no registry record. Confirm and buy at a registrar; premium-priced names can still show as free.");
    }
    case "specs": {
      const { assets, listing } = data("specs");
      const rows = assets.filter((a) => !v.store || a.id === v.store || (a.when?.any ?? []).includes(`store:${v.store}`));
      if (v.json) return log(JSON.stringify({ assets: rows, listing: v.store ? [] : listing }, null, 2));
      log(rows.map((a) => `${a.id.padEnd(14)} ${String(a.w).padStart(4)}×${String(a.h).padEnd(4)} ${a.req ? "required" : "optional"}  ${a.max ? `≤${a.max}` : ""}  ${a.label}${a.note ? ` (${a.note})` : ""}`).join("\n"));
      return;
    }
    case "icons": {
      const [src] = args;
      if (!src || !v.for) throw new Error("Usage: readytogo icons <src> --for <app_store|play_store|chrome_web_store|firefox_addons|edge_addons|favicon|icns|ico>");
      const { makeIcons } = await import("../src/images.js");
      const r = await makeIcons(resolve(src), v.for, resolve(v.out ?? assetsDir("icons", v.for.replace(/-/g, "_"))), { bg: v.bg, padding: v.padding ? +v.padding : 0, round: v.round, macGrid: v["mac-grid"], name: v.name });
      log(r.files.map((f) => `wrote ${f}`).join("\n"));
      if (r.snippet) log(`\nAdd to <head>:\n${r.snippet}`);
      return r.warnings.forEach((w) => log(`warning: ${w}`));
    }
    case "shot": {
      if (!args.length || !v.target) throw new Error("Usage: readytogo shot <screenshot...> --target <asset-id>   (ids: readytogo specs)");
      const { makeShot } = await import("../src/images.js");
      const dir = resolve(v.out ?? assetsDir("screenshots", v.target));
      for (const [n, src] of args.entries()) {
        const r = await makeShot(resolve(src), v.target, join(dir, `${v.target}-${String(n + 1).padStart(2, "0")}.png`), { fit: v.fit, bg: v.bg });
        log(`wrote ${r.file} (${r.width}×${r.height})`);
        r.warnings.forEach((w) => log(`warning: ${basename(src)}: ${w}`));
      }
      return;
    }
    case "verify": {
      if (!args.length || !v.target) throw new Error("Usage: readytogo verify <image...> --target <asset-id|WxH>   (ids: readytogo specs)");
      const { verifyImage } = await import("../src/images.js");
      for (const file of args) {
        const r = await verifyImage(resolve(file), v.target);
        log(`${r.ok ? "OK  " : "FAIL"} ${basename(file)}  ${r.width}×${r.height} ${r.format}${r.alpha ? " +alpha" : ""} ${(r.bytes / 1024).toFixed(0)} KB  vs ${r.spec}`);
        r.problems.forEach((p) => log(`      problem: ${p}`));
        r.notes.forEach((n) => log(`      note: ${n}`));
        if (!r.ok) process.exitCode = 1;
      }
      return;
    }
    case "video": {
      const [input] = args;
      if (!input) throw new Error("Usage: readytogo video <in> [--out file.webm|mp4|gif] [--width 1280] [--fps 30] [--start s] [--duration s]");
      const { convertVideo, probeVideo } = await import("../src/video.js");
      if (!v.out) return log(JSON.stringify(probeVideo(resolve(input)), null, 2));
      const r = convertVideo(resolve(input), resolve(v.out), { width: v.width ? +v.width : undefined, fps: v.fps ? +v.fps : undefined, start: v.start != null ? +v.start : undefined, duration: v.duration ? +v.duration : undefined, crf: v.crf ? +v.crf : undefined, alpha: v.transparent });
      return log(`wrote ${v.out}: ${r.width}×${r.height} ${r.fps} fps ${r.seconds.toFixed(1)}s ${(r.bytes / 1024).toFixed(0)} KB`);
    }
    case "annotate": {
      const [src] = args;
      if (!src || !v.box?.length) throw new Error("Usage: readytogo annotate <image> --box x,y,w,h [--mode highlight|redact]");
      const { annotate } = await import("../src/images.js");
      const r = await annotate(resolve(src), resolve(v.out ?? assetsDir("annotated", `${v.mode ?? "highlight"}-${basename(src).replace(/\.\w+$/, "")}.png`)), v.box, { mode: v.mode, color: v.color });
      return log(`wrote ${r.file}`);
    }
    case "listing": {
      const [file] = args;
      if (!file) throw new Error('Usage: readytogo listing <fields.json>   e.g. {"gp_title":"My App","gp_short":"…"}');
      const { checkListing } = await import("../src/images.js");
      const rows = checkListing(readJson(resolve(file), {}));
      log(rows.map((r) => `${r.ok ? "ok  " : "OVER"} ${r.id.padEnd(16)} ${r.length ?? "-"}/${r.max ?? "-"}  ${r.note}`).join("\n"));
      if (rows.some((r) => !r.ok)) process.exitCode = 1;
      return;
    }
    case "seo": {
      const [target] = args;
      if (!target) throw new Error("Usage: readytogo seo <page.html|https://url>");
      let html;
      if (/^https?:\/\//i.test(target)) {
        const { fetchPage } = await import("../src/net.js");
        html = (await fetchPage(target, { allowLocal: v["allow-local"] })).text;
      } else html = readFileSync(resolve(target), "utf8");
      const page = parsePage(html);
      const { score, checks } = scorePage(page);
      log(`SEO score: ${score}/100\n`);
      log(checks.map((c) => `${c.pass ? "PASS" : "FAIL"}  ${c.label}${c.pass ? "" : `\n      → ${c.tip}`}`).join("\n"));
      return log(`\nog: ${JSON.stringify(page.og)}\ntwitter: ${JSON.stringify(page.twitter)}`);
    }
    case "links": {
      const [target] = args;
      if (!target) throw new Error("Usage: readytogo links <page.html|https://url> [--no-check] [--limit 150]");
      const { auditPageLinks } = await import("../src/links.js");
      let html, url = target;
      if (/^https?:\/\//i.test(target)) {
        const { fetchPage } = await import("../src/net.js");
        const r = await fetchPage(target, { allowLocal: v["allow-local"] });
        html = r.text; url = r.finalUrl;
      } else {
        html = readFileSync(resolve(target), "utf8");
        url = v.url ?? "https://example.invalid/"; // relative links in a local file need a base: pass --url https://yoursite.com/page
      }
      const r = await auditPageLinks(url, html, { check: !v["no-check"], limit: v.limit ? +v.limit : 150, allowLocal: v["allow-local"] });
      if (v.json) return log(JSON.stringify(r, null, 2));
      log(`${r.total} links (${r.unique} unique, ${r.internal} internal, ${r.nofollow} nofollow); ${r.checked} checked${r.truncated ? " (truncated by --limit)" : ""}`);
      for (const x of r.findings) log(`${x.level.toUpperCase().padEnd(5)} ${x.href}\n      ${x.problem}`);
      if (r.findings.some((x) => x.level === "error")) process.exitCode = 1;
      return;
    }
    case "backlinks": {
      const [file] = args;
      if (!file || !v.target) throw new Error("Usage: readytogo backlinks <export.csv|urls.txt> --target example.com [--verify]");
      const { parseBacklinks, analyseBacklinks, verifyBacklinks } = await import("../src/links.js");
      const rows = parseBacklinks(readFileSync(resolve(file), "utf8"));
      const a = analyseBacklinks(rows, v.target);
      const ver = v.verify ? await verifyBacklinks(rows, v.target, { limit: v.limit ? +v.limit : 100, allowLocal: v["allow-local"] }) : null;
      if (v.json) return log(JSON.stringify({ analysis: a, verification: ver }, null, 2));
      log(`${a.rows} links from ${a.referringDomains} referring domains to ${a.target}${a.nofollowShare != null ? `; ${Math.round(a.nofollowShare * 100)}% nofollow` : ""}; top domain holds ${Math.round(a.concentration * 100)}% of links`);
      log(`TLDs: ${Object.entries(a.tlds).map(([k, n]) => `.${k} ${n}`).join(", ")}`);
      log(`Anchors: ${Object.entries(a.anchors).filter(([, n]) => n).map(([k, n]) => `${k} ${n}`).join(", ") || "not in export"}`);
      log("\nTop referring domains:\n" + a.topDomains.map((d) => `  ${String(d.links).padStart(4)}  ${d.domain}${d.risk.length ? `   ⚠ ${d.risk.join("; ")}` : ""}`).join("\n"));
      if (a.risky.length) log(`\n${a.risky.length} domain(s) look risky; review before disavowing anything (this is a heuristic, not a verdict).`);
      if (ver) {
        log(`\nVerified ${ver.checked} referring pages: ${ver.alive} still link to you${ver.truncated ? " (sample, see --limit)" : ""}`);
        for (const r of ver.results.filter((x) => !x.ok)) log(`  GONE  ${r.source}  ${r.problem}`);
        for (const r of ver.results.filter((x) => x.ok && (x.nofollow || x.sponsored || x.ugc || x.noindexPage))) log(`  WEAK  ${r.source}  ${[r.nofollow && "nofollow", r.sponsored && "sponsored", r.ugc && "ugc", r.noindexPage && "page is noindex"].filter(Boolean).join(", ")}`);
      }
      return;
    }
    case "deadcode": {
      const { analyseDeadCode } = await import("../src/deadcode.js");
      const dir = args[0] ? resolve(args[0]) : root;
      const r = await analyseDeadCode(dir, { langs: v.lang ? list(v.lang) : undefined, ignore: list(v.ignore), strict: v.strict });
      const order = ["high", "medium", "low"], minRank = order.indexOf(v.min ?? "low");
      const shown = r.findings.filter((x) => order.indexOf(x.confidence) <= minRank).slice(0, v.max ? +v.max : 200);
      if (v.json) return log(JSON.stringify({ ...r, findings: shown }, null, 2));
      log(`Parsed ${r.files} files (${r.languages.join(", ") || "none"}); ${r.findings.length} finding(s)${shown.length < r.findings.length ? `, showing ${shown.length}` : ""}.`);
      for (const x of shown) log(`${x.confidence.toUpperCase().padEnd(6)} ${x.kind.padEnd(17)} ${relative(dir, join(dir, x.file)).split(sep).join("/")}:${x.line}  ${x.message}`);
      if (r.skipped.length) log(`\nskipped: ${r.skipped.slice(0, 5).join(", ")}${r.skipped.length > 5 ? ` (+${r.skipped.length - 5})` : ""}`);
      return log("\nName-based and conservative: confirm 'low' and 'medium' items before deleting (dynamic access, reflection and framework conventions are invisible).");
    }
    case "setup": {
      const { setup, GROUPS } = await import("../src/tools.js");
      const groups = args.length ? args : Object.keys(GROUPS);
      for (const g of groups) setup(g);
      return log(`\nDone. Re-run \`readytogo setup\` any time (or with --update) to refresh to current versions.`);
    }
    case "scaffold": {
      const { scaffold } = await import("../src/render.js");
      const kind = args[0];
      const r = scaffold(kind, resolve(root, v.dir ?? join(".readytogo", "mockups", kind)), v.model ?? []);
      return log(`Copied ${kind} template to ${r.dir}${r.copied.length ? ` with models: ${r.copied.join(", ")}` : ""}. Edit the files, then \`readytogo render\`.`);
    }
    case "models": {
      const { listModels } = await import("../src/render.js");
      const m = listModels();
      return log(m.length ? m.map((x) => `${x.id.padEnd(18)} ${x.kind.padEnd(7)} screen ${x.screenAspect}  ${x.description}`).join("\n") : "No bundled models. See assets/3d/models/README.md.");
    }
    case "render": {
      const [html] = args;
      if (!html || (!v.out && !v.video)) throw new Error("Usage: readytogo render <page.html[?query]> --size WxH --out file.png");
      const { render } = await import("../src/render.js");
      const r = await render({ html, size: v.size, out: v.out, scale: v.scale ? +v.scale : 1, transparent: v.transparent, wait: v.wait ? +v.wait : 0, frames: v.frames ? +v.frames : undefined, fps: v.fps ? +v.fps : undefined, duration: v.duration ? +v.duration : undefined, video: v.video, at: v.at != null ? +v.at : undefined, root });
      log(r.files.map((f) => `wrote ${f}`).join("\n"));
      if (r.note) log(r.note);
      return r.errors.slice(0, 5).forEach((e) => log(`page error: ${e}`));
    }
    case "doctor": {
      const { status, TOOLS_DIR } = await import("../src/tools.js");
      const t = status([root]);
      log(`node ${process.version}\nsharp ${await sharpLib().then(() => "ok", (e) => "MISSING: " + e.message)}\ntools dir ${TOOLS_DIR}\ntree-sitter ${t.deadcode["web-tree-sitter"] ? `web-tree-sitter ${t.deadcode["web-tree-sitter"]}, grammars ${t.deadcode["tree-sitter-wasms"] ?? "missing"}` : "not set up (needed for deadcode): readytogo setup deadcode"}\nplaywright ${t.render.playwright ? t.render.playwright : "not set up (needed for render, frames, 3D): readytogo setup render"}\nffmpeg ${t.ffmpeg ? "ok" : "not found (needed for the video tool and video output): install from https://ffmpeg.org/download.html, or winget/brew/apt install ffmpeg"}\ngit repo ${existsSync(join(root, ".git")) ? "yes" : "no"}`);
      return;
    }
    default:
      throw new Error(`Unknown command "${cmd}". Run \`readytogo help\`.`);
  }
};

main().catch((e) => {
  console.error(`error: ${e.message}`);
  process.exitCode = 2;
});
