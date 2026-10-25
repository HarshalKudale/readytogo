import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { areas, pickAreas } from "../src/areas.js";
import { CHECKS } from "../src/checks.js";
import { checkDomains } from "../src/domains.js";
import { data } from "../src/util.js";

const CLI = new URL("../bin/readytogo.js", import.meta.url).pathname.replace(/^\/(\w:)/, "$1");
const run = (cwd, ...args) => spawnSync(process.execPath, [CLI, ...args], { cwd, encoding: "utf8" });
const git = (cwd, ...args) => spawnSync("git", ["-c", "user.name=t", "-c", "user.email=t@t", ...args], { cwd, encoding: "utf8" });

test("every checklist belongs to exactly one area, and every area command exists", () => {
  const owners = new Map();
  for (const a of areas()) for (const c of a.checklists) owners.set(c, [...(owners.get(c) ?? []), a.slug]);
  for (const c of data("catalog").checklists) assert.equal(owners.get(c.slug)?.length, 1, c.slug);
  assert.throws(() => pickAreas("seo,nope"), /Unknown area/);
  assert.deepEqual(pickAreas("docs").map((a) => a.slug), ["docs"]);
});

test("every autoCheck item has a check and every check has an autoCheck item", () => {
  const flagged = new Set(data("catalog").items.filter((i) => i.autoCheck).map((i) => i.id));
  assert.deepEqual([...flagged].filter((id) => !(id in CHECKS)), []);
  assert.deepEqual(Object.keys(CHECKS).filter((id) => !flagged.has(id)), []);
});

test("decisions are well formed", () => {
  for (const i of data("catalog").items.filter((x) => x.decide)) {
    assert.ok(i.decide.question.endsWith("?"), i.id);
    assert.ok(i.decide.options.length >= 2, i.id);
  }
});

test("domains: maps RDAP answers to taken, likely-free and unknown", async () => {
  const fake = async (url) => {
    if (String(url).includes("dns.json")) return new Response(JSON.stringify({ services: [[["com"], ["https://rdap.test/"]]] }));
    return new Response("{}", { status: String(url).includes("taken.com") ? 200 : 404 });
  };
  const rows = await checkDomains(["Taken", "free"], ["com", "io"], { fetchImpl: fake, bootstrap: "https://x/dns.json" });
  const by = Object.fromEntries(rows.map((r) => [r.domain, r.status]));
  assert.deepEqual(by, { "taken.com": "taken", "taken.io": "unknown", "free.com": "likely-free", "free.io": "unknown" });
});

test("analyze -> branch -> fix -> check -> diff on a real git repo", () => {
  const dir = mkdtempSync(join(tmpdir(), "rtg-flow-"));
  mkdirSync(join(dir, "src"));
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "demo", version: "1.0.0", dependencies: { react: "18", vite: "5", moment: "2" } }));
  writeFileSync(join(dir, "vite.config.js"), "export default { build: { sourcemap: true } }\n");
  writeFileSync(join(dir, "index.html"), "<html><head><title>x</title></head><body></body></html>");
  writeFileSync(join(dir, "src", "a.js"), "debugger;\n");
  git(dir, "init", "-q");
  git(dir, "add", "-A");
  git(dir, "commit", "-qm", "init");

  const a = run(dir, "analyze", "--area", "packaging");
  assert.equal(a.status, 0, a.stderr);
  assert.match(a.stdout, /## packaging/);
  assert.match(a.stdout, /build\.web-sourcemaps/);
  assert.match(a.stdout, /Source maps enabled in vite\.config\.js/);
  assert.match(a.stdout, /Ask the user/);
  assert.ok(!/## seo|## docs/.test(a.stdout), "only the requested area is analysed");
  assert.deepEqual(Object.keys(JSON.parse(readFileSync(join(dir, ".readytogo", "baseline.json"), "utf8")).areas), ["packaging"]);

  writeFileSync(join(dir, "src", "dirty.js"), "x\n");
  git(dir, "add", "src/dirty.js");
  const refused = run(dir, "branch", "--area", "packaging");
  assert.equal(refused.status, 2);
  assert.match(refused.stderr, /Uncommitted changes/);
  git(dir, "commit", "-qm", "wip");

  const b = run(dir, "branch", "--area", "packaging");
  assert.equal(b.status, 0, b.stderr);
  assert.match(git(dir, "rev-parse", "--abbrev-ref", "HEAD").stdout, /^readytogo\/packaging-\d{8}/);

  writeFileSync(join(dir, "vite.config.js"), "export default { build: { sourcemap: false } }\n");
  writeFileSync(join(dir, "src", "a.js"), "export {};\n");
  git(dir, "commit", "-qam", "disable source maps, drop debugger");
  assert.equal(run(dir, "check", "--area", "packaging").status, 0);

  const d = run(dir, "diff", "--area", "packaging");
  assert.equal(d.status, 0, d.stderr);
  assert.match(d.stdout, /pack\.strip-debug\s+failing → verified/);
  assert.match(d.stdout, /commit\(s\)/);
  assert.match(run(dir, "report", "--area", "packaging", "--no-fail").stdout, /Wrote/);
  assert.match(readFileSync(join(dir, "READYTOGO.md"), "utf8"), /Before \/ after/);

  assert.equal(run(dir, "analyze", "--area", "seo").status, 0);
  assert.deepEqual(Object.keys(JSON.parse(readFileSync(join(dir, ".readytogo", "baseline.json"), "utf8")).areas).sort(), ["packaging", "seo"]);
});

test("branch refuses outside a git repository", () => {
  const dir = mkdtempSync(join(tmpdir(), "rtg-nogit-"));
  const r = run(dir, "branch");
  assert.equal(r.status, 2);
  assert.match(r.stderr, /Not a git repository/);
});
