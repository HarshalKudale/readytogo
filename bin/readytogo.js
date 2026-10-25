#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { runChecks, context } from "../src/checks.js";
import { buildPlan, isClosed, summarize } from "../src/plan.js";
import { scan } from "../src/scan.js";
import { parsePage, scorePage } from "../src/seo.js";
import { load, save } from "../src/state.js";
import { data, readJson, walk } from "../src/util.js";

const HELP = `readytogo (alias: rtg): audit a repo for launch readiness and generate store assets.

Readiness
  scan [--write]                        detect stack/platform tags from the repo
  profile [--add t,t] [--remove t,t] [--name s] [--tagline s] [--confirm] [--tags]
  plan [--open] [--priority blocker] [--checklist slug] [--json]
  check [--only id,id]                  run automatic checks, store results
  mark <item-id> <done|skipped|na|open> [--note "…"]
  report [--out READYTOGO.md] [--no-fail]

Assets (exact pixels, no AI)
  specs [--store chrome_web_store] [--json]
  icons <src.png|svg> --for <set> [--out dir] [--bg #hex] [--padding 0.1] [--round] [--mac-grid] [--name App]
  shot <screenshot...> --target <id> [--fit cover|contain] [--bg #hex] [--out dir]
  frame <screenshot> --frame phone|tablet|browser|window|laptop [--size landscape|og|square|hero|none|WxH]
        [--bg "#hex|grad:#a,#b,135|transparent"] [--url example.com] [--dark] [--out file]
  promo --target <id> --title "…" [--subtitle "…"] [--logo file] [--bg …] [--fg #fff] [--out file]
  annotate <image> --box x,y,w,h [--box …] [--mode highlight|redact] [--out file]
  listing <fields.json>                 check store listing text against character limits
  seo <page.html|https://url>           on-page SEO score and link-preview tags

Rendering / 3D (needs: npm i -D playwright && npx playwright install chromium)
  scaffold <3d|promo> [--dir .readytogo/mockups] [--model name]
  models                                list bundled 3D device models
  render <page.html[?query]> --size 1600x1200 --out file.png [--transparent] [--scale 2]
         [--at 2.0] [--duration 4 --fps 30 --video out.mp4|webm|gif | --frames N --out dir]

  doctor                                check Node, sharp, Playwright, ffmpeg
Global: --root <dir> (default: current directory)`;

const OPTIONS = {
  root: { type: "string" }, json: { type: "boolean" }, write: { type: "boolean" }, add: { type: "string" }, remove: { type: "string" },
  name: { type: "string" }, tagline: { type: "string" }, confirm: { type: "boolean" }, tags: { type: "boolean" }, open: { type: "boolean" },
  priority: { type: "string" }, checklist: { type: "string" }, only: { type: "string" }, note: { type: "string" }, out: { type: "string" },
  "no-fail": { type: "boolean" }, store: { type: "string" }, for: { type: "string" }, bg: { type: "string" }, padding: { type: "string" },
  round: { type: "boolean" }, "mac-grid": { type: "boolean" }, target: { type: "string" }, fit: { type: "string" }, frame: { type: "string" },
  size: { type: "string" }, url: { type: "string" }, dark: { type: "boolean" }, color: { type: "string" }, title: { type: "string" },
  subtitle: { type: "string" }, logo: { type: "string" }, fg: { type: "string" }, accent: { type: "string" }, mode: { type: "string" },
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

function reportMarkdown(plan, name) {
  const s = summarize(plan);
  const lines = [`# Ship readiness${name ? `: ${name}` : ""}`, "", `Generated ${new Date().toISOString().slice(0, 10)} · catalog ${plan.version} · ${s.closed}/${s.total} items closed · **${s.openBlockers.length} open blockers**`, "", "> Automated checks read the repo only. Items marked verified passed a check; done/skipped were marked by a person or agent. This is not legal advice and not a guarantee of store approval.", ""];
  if (s.openBlockers.length) {
    lines.push("## Open blockers", "", ...s.openBlockers.map((i) => `- \`${i.id}\` ${i.title}${i.note ? ` — ${i.note}` : ""}`), "");
  }
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
      const plan = buildPlan(s.profile.tags, { state: s.state, checks: s.checks });
      if (v.json) return log(JSON.stringify(plan, null, 2));
      const sum = summarize(plan);
      log(`${plan.checklists.length} checklists, ${sum.total} items, ${sum.closed} closed, ${sum.openBlockers.length} open blockers${s.profile.confirmed ? "" : "  (profile NOT confirmed yet)"}`);
      log(planLines(plan, { onlyOpen: v.open, priority: v.priority, checklist: v.checklist }));
      return log("\nDetails for an item: references/checklists/<checklist>.md");
    }
    case "check": {
      const s = needProfile(root);
      const plan = buildPlan(s.profile.tags, { state: s.state });
      const ids = plan.checklists.flatMap((c) => c.items).filter((i) => i.autoCheck && (!v.only || list(v.only).includes(i.id))).map((i) => i.id);
      const ctx = context(root, walk(root), new Set(s.profile.tags));
      const results = await runChecks(ctx, ids, await sharpLib());
      save(root, "checks.json", { at: new Date().toISOString(), results });
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
      const plan = buildPlan(s.profile.tags, { state: s.state, checks: s.checks });
      const file = resolve(root, v.out ?? "READYTOGO.md");
      writeFileSync(file, reportMarkdown(plan, s.profile.product?.name) + "\n");
      const sum = summarize(plan);
      log(`Wrote ${file}: ${sum.closed}/${sum.total} closed, ${sum.openBlockers.length} open blockers`);
      if (sum.openBlockers.length && !v["no-fail"]) {
        log(sum.openBlockers.map((i) => `  blocker: ${i.id} ${i.title}`).join("\n"));
        process.exitCode = 1;
      }
      return;
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
    case "frame": {
      const [src] = args;
      if (!src || !v.frame) throw new Error("Usage: readytogo frame <screenshot> --frame phone|tablet|browser|window|laptop");
      const { makeFrame } = await import("../src/images.js");
      const r = await makeFrame(resolve(src), v.frame, resolve(v.out ?? assetsDir("mockups", `${basename(src).replace(/\.\w+$/, "")}-${v.frame}.png`)), { size: v.size, bg: v.bg, url: v.url, dark: v.dark, color: v.color });
      return log(`wrote ${r.file}${r.width ? ` (${r.width}×${r.height})` : ""}`);
    }
    case "promo": {
      if (!v.target) throw new Error("Usage: readytogo promo --target <asset-id> --title … [--logo file]");
      const { makePromo } = await import("../src/images.js");
      const r = await makePromo(v.target, resolve(v.out ?? assetsDir("promo", `${v.target}.png`)), { title: v.title, subtitle: v.subtitle, logo: v.logo && resolve(v.logo), bg: v.bg, fg: v.fg, accent: v.accent });
      log(`wrote ${r.file} (${r.width}×${r.height})`);
      return r.warnings.forEach((w) => log(`warning: ${w}`));
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
        const res = await fetch(target, { signal: AbortSignal.timeout(15000), headers: { "user-agent": "readytogo/0.1" } });
        html = (await res.text()).slice(0, 2_000_000);
      } else html = readFileSync(resolve(target), "utf8");
      const page = parsePage(html);
      const { score, checks } = scorePage(page);
      log(`SEO score: ${score}/100\n`);
      log(checks.map((c) => `${c.pass ? "PASS" : "FAIL"}  ${c.label}${c.pass ? "" : `\n      → ${c.tip}`}`).join("\n"));
      return log(`\nog: ${JSON.stringify(page.og)}\ntwitter: ${JSON.stringify(page.twitter)}`);
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
      return log(m.length ? m.map((x) => `${x.id}\t${x.kind}\t${x.file}\t${x.license}`).join("\n") : "No bundled models yet. The 3D template builds procedural devices; see references/mockups-3d.md to add GLB models.");
    }
    case "render": {
      const [html] = args;
      if (!html || (!v.out && !v.video)) throw new Error("Usage: readytogo render <page.html[?query]> --size WxH --out file.png");
      const { render } = await import("../src/render.js");
      const r = await render({ html, size: v.size, out: v.out, scale: v.scale ? +v.scale : 1, transparent: v.transparent, wait: v.wait ? +v.wait : 0, frames: v.frames ? +v.frames : undefined, fps: v.fps ? +v.fps : 30, duration: v.duration ? +v.duration : undefined, video: v.video, at: v.at != null ? +v.at : undefined, root });
      log(r.files.map((f) => `wrote ${f}`).join("\n"));
      if (r.note) log(r.note);
      return r.errors.slice(0, 5).forEach((e) => log(`page error: ${e}`));
    }
    case "doctor": {
      const has = (c, a = ["-version"]) => !spawnSync(c, a, { stdio: "ignore" }).error;
      log(`node ${process.version}\nsharp ${await sharpLib().then(() => "ok", (e) => "MISSING: " + e.message)}\nplaywright ${(await (await import("../src/render.js")).loadPlaywright(root).then(() => true, () => false)) ? "ok" : "not installed (needed for render/3D): npm i -D playwright && npx playwright install chromium"}\nffmpeg ${has("ffmpeg") ? "ok" : "not found (needed only for video output)"}\ngit repo ${existsSync(join(root, ".git")) ? "yes" : "no"}`);
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
