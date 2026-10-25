import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { copyFileSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import sharp from "sharp";
import { runChecks, context } from "../src/checks.js";
import { annotate, checkListing, makeIcons, makeShot, verifyImage } from "../src/images.js";
import { analyseBacklinks, auditPageLinks, parseBacklinks } from "../src/links.js";
import { SKILL_DIR } from "../src/render.js";
import { status } from "../src/tools.js";
import { buildPlan } from "../src/plan.js";
import { scan } from "../src/scan.js";
import { applies, data, walk } from "../src/util.js";

// READYTOGO_TEST_OUT=dir keeps the generated images for a visual check.
const out = process.env.READYTOGO_TEST_OUT ?? mkdtempSync(join(tmpdir(), "readytogo-"));
mkdirSync(out, { recursive: true });
const dims = async (f) => {
  const m = await sharp(f).metadata();
  return [m.width, m.height, m.hasAlpha];
};

const logo = join(out, "logo.svg");
writeFileSync(logo, '<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><rect width="512" height="512" fill="#0ea5e9"/><circle cx="256" cy="256" r="150" fill="#fff"/></svg>');
const shot = join(out, "shot.png");
await sharp({ create: { width: 1170, height: 2532, channels: 3, background: "#fff" } })
  .composite([{ input: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="1170" height="2532"><rect width="1170" height="300" fill="#0ea5e9"/><rect x="60" y="400" width="1050" height="500" rx="40" fill="#e0f2fe"/><rect x="60" y="960" width="1050" height="500" rx="40" fill="#fef3c7"/></svg>') }])
  .png()
  .toFile(shot);

test("tag expressions", () => {
  const tags = new Set(["a", "b"]);
  assert.ok(applies(undefined, tags));
  assert.ok(applies({ any: ["a", "z"], all: ["b"], none: ["c"] }, tags));
  assert.ok(!applies({ none: ["a"] }, tags));
});

test("plan only includes items whose tags apply", () => {
  const web = buildPlan(["platform:web", "store:website"]).checklists.map((c) => c.slug);
  assert.ok(web.includes("technical-seo") && !web.includes("apple-app-store"));
  const ios = buildPlan(["platform:ios", "mobile", "store:app_store"]).checklists.map((c) => c.slug);
  assert.ok(ios.includes("apple-app-store") && !ios.includes("technical-seo"));
});

test("every auto-check id exists in the catalog", async () => {
  const { CHECKS } = await import("../src/checks.js");
  const ids = new Set(data("catalog").items.map((i) => i.id));
  for (const id of Object.keys(CHECKS)) assert.ok(ids.has(id), id);
});

test("icons: app store icon has no alpha, sets have the right sizes", async () => {
  const r = await makeIcons(logo, "app_store", join(out, "icons"));
  const big = r.files.find((f) => f.endsWith("AppStore-1024.png"));
  assert.deepEqual(await dims(big), [1024, 1024, false]);
  const fav = await makeIcons(logo, "favicon", join(out, "fav"));
  assert.ok(fav.files.some((f) => f.endsWith("favicon.ico")) && fav.snippet.includes("apple-touch-icon"));
  const ico = readFileSync((await makeIcons(logo, "ico", join(out, "ico"))).files[0]);
  assert.equal(ico.readUInt16LE(4), 7);
  const icns = readFileSync((await makeIcons(logo, "icns", join(out, "icns"), { macGrid: true })).files[0]);
  assert.equal(icns.toString("ascii", 0, 4), "icns");
  assert.equal(icns.readUInt32BE(4), icns.length);
});

test("shot: exact store pixels, opaque", async () => {
  const r = await makeShot(shot, "app_store", join(out, "app_store.png"));
  assert.deepEqual(await dims(r.file), [1320, 2868, false]);
  const wide = await makeShot(shot, "chrome", join(out, "chrome.png"), { fit: "contain", bg: "#eee" });
  assert.deepEqual(await dims(wide.file), [1280, 800, false]);
});

test("verify: flags wrong size and alpha, passes exact opaque PNG", async () => {
  const ok = await makeShot(shot, "chrome", join(out, "v-ok.png"));
  assert.equal((await verifyImage(ok.file, "chrome")).ok, true);
  const bad = await verifyImage(shot, "chrome");
  assert.equal(bad.ok, false);
  assert.match(bad.problems[0], /size is 1170×2532/);
  const alpha = join(out, "v-alpha.png");
  await sharp({ create: { width: 1280, height: 800, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0.5 } } }).png().toFile(alpha);
  assert.ok((await verifyImage(alpha, "cws_small")).problems.some((p) => /size/.test(p)));
  assert.ok((await verifyImage(alpha, "chrome")).problems.some((p) => /alpha/.test(p)));
});

test("bundled models: manifest matches GLB files (Screen mesh, LidPivot on laptops)", () => {
  const dir = join(SKILL_DIR, "assets", "3d", "models");
  const { models } = JSON.parse(readFileSync(join(dir, "manifest.json"), "utf8"));
  assert.ok(models.length >= 7);
  for (const m of models) {
    const glb = readFileSync(join(dir, m.file));
    assert.equal(glb.toString("ascii", 0, 4), "glTF", m.id);
    const json = JSON.parse(glb.subarray(20, 20 + glb.readUInt32LE(12)).toString());
    const names = [...(json.nodes ?? []), ...(json.meshes ?? [])].map((n) => n.name);
    assert.ok(names.includes(m.screenMesh), `${m.id} has ${m.screenMesh}`);
    assert.equal(names.includes("LidPivot"), m.kind === "laptop", `${m.id} LidPivot`);
    assert.ok(m.screenAspect > 0 && m.license, m.id);
  }
});

test("backlinks: parses exports and flags concentration and risky domains", () => {
  const csv = ["Source URL,Anchor,Nofollow", "https://blog.example.org/a,Acme,false", "https://casino-links.xyz/1,click here,true", "https://casino-links.xyz/2,acme.com,true"].join("\n");
  const rows = parseBacklinks(csv);
  assert.equal(rows.length, 3);
  const a = analyseBacklinks(rows, "https://www.acme.com");
  assert.equal(a.target, "acme.com");
  assert.equal(a.referringDomains, 2);
  assert.deepEqual(a.risky.map((d) => d.domain), ["casino-links.xyz"]);
  assert.equal(parseBacklinks("https://a.com/x\nhttps://b.com/y\n").length, 2);
});

test("links: audits a page served locally (404 and unsafe target=_blank)", async () => {
  const server = createServer((req, res) => {
    res.statusCode = req.url === "/missing" ? 404 : 200;
    res.setHeader("content-type", "text/html");
    res.end("<html><body>ok</body></html>");
  });
  await new Promise((ok) => server.listen(0, "127.0.0.1", ok));
  try {
    const base = `http://127.0.0.1:${server.address().port}/`;
    const html = `<a href="/fine">fine</a><a href="/missing">gone</a><a href="https://example.org" target="_blank">unsafe</a>`;
    const r = await auditPageLinks(base, html, { allowLocal: true, check: true });
    assert.equal(r.total, 3);
    assert.ok(r.findings.some((f) => f.level === "error" && f.href.endsWith("/missing")));
    assert.ok(!r.findings.some((f) => f.href.endsWith("/fine")));
    assert.ok(r.findings.some((f) => /noopener|opener/.test(f.problem)));
  } finally {
    server.close();
  }
});

const toolsReady = Boolean(status().deadcode["web-tree-sitter"]);
test("deadcode: finds an unused import (needs `readytogo setup deadcode`)", { skip: !toolsReady }, async () => {
  const { analyseDeadCode } = await import("../src/deadcode.js");
  const root = join(out, "dead");
  mkdirSync(root, { recursive: true });
  writeFileSync(join(root, "a.js"), ['import { used, unused } from "./b.js";', "export const main = () => used();", ""].join("\n"));
  writeFileSync(join(root, "b.js"), ["export const used = () => 1;", "export const unused = () => 2;", ""].join("\n"));
  const r = await analyseDeadCode(root);
  assert.ok(r.findings.some((f) => /unused/.test(f.message) && f.file.endsWith("a.js")), JSON.stringify(r.findings));
});

const hasFfmpeg = !spawnSync("ffmpeg", ["-version"], { stdio: "ignore" }).error;
test("video: converts and probes (needs ffmpeg)", { skip: !hasFfmpeg }, async () => {
  const { convertVideo, probeVideo } = await import("../src/video.js");
  const src = join(out, "src.mp4");
  assert.equal(spawnSync("ffmpeg", ["-y", "-v", "error", "-f", "lavfi", "-i", "testsrc=size=320x240:rate=10:duration=1", "-pix_fmt", "yuv420p", src]).status, 0);
  const r = convertVideo(src, join(out, "small.webm"), { width: 160 });
  assert.equal(r.width, 160);
  assert.equal(probeVideo(src).height, 240);
});

test("annotate keeps the image size", async () => {
  const r = await annotate(shot, join(out, "redact.png"), ["60,400,1050,500"], { mode: "redact" });
  assert.deepEqual((await dims(r.file)).slice(0, 2), [1170, 2532]);
  await annotate(shot, join(out, "hl.png"), ["60,960,1050,500"]);
});

test("listing limits", () => {
  const rows = checkListing({ gp_title: "x".repeat(31), gp_short: "ok", nope: "x" });
  assert.deepEqual(rows.map((r) => r.ok), [false, true, false]);
});

test("scan + checks on a small project", async () => {
  const root = join(out, "proj");
  mkdirSync(join(root, "public"), { recursive: true });
  writeFileSync(join(root, "package.json"), JSON.stringify({ name: "demo", dependencies: { next: "15", stripe: "1", "@sentry/nextjs": "9" } }));
  writeFileSync(join(root, "LICENSE"), "MIT");
  const s = scan(root);
  for (const t of ["fw:nextjs", "platform:web", "svc:stripe", "paid", "svc:sentry"]) assert.ok(s.tags.includes(t), t);
  const res = await runChecks(context(root, walk(root), new Set(s.tags)), ["legal.license", "qa.crash-reporting", "qa.ci"], sharp);
  assert.deepEqual([res["legal.license"].pass, res["qa.crash-reporting"].pass, res["qa.ci"].pass], [true, true, false]);
});

// Needs `readytogo setup render` (Playwright + Chromium) and network access for three.js, so it only runs on request.
const e2e = { skip: process.env.READYTOGO_E2E !== "1" };
const notBlank = async (file) => (await sharp(file).stats()).channels.some((c) => c.stdev > 1);

test("e2e: the 3D scene renders a laptop and a phone", e2e, async () => {
  const { render, scaffold } = await import("../src/render.js");
  const dir = join(out, "e2e");
  scaffold("3d", join(dir, "3d"), ["laptop-notch", "phone-island"]);
  copyFileSync(shot, join(dir, "shot.png"));
  const file = join(out, "e2e-scene.png");
  const r = await render({ html: "/3d/scene.html?config=/3d/examples/laptop-hero.js", size: "800x500", out: file, at: 2.5, root: dir });
  assert.deepEqual(r.errors, []);
  assert.deepEqual((await dims(file)).slice(0, 2), [800, 500]);
  assert.ok(await notBlank(file), "scene is blank");
});

test("e2e: compose.html puts a screenshot in an OS frame", e2e, async () => {
  const { render } = await import("../src/render.js");
  const dir = join(out, "e2e");
  mkdirSync(dir, { recursive: true });
  copyFileSync(shot, join(dir, "shot.png"));
  const file = join(out, "e2e-frame.png");
  const r = await render({ html: "/__skill/assets/frames/compose.html?frame=browser-macos-tabs&theme=dark&screen=/shot.png&url=acme.com&bg=%23e0e7ff", size: "1280x800", out: file, root: dir });
  assert.deepEqual(r.errors, []);
  assert.deepEqual((await dims(file)).slice(0, 2), [1280, 800]);
  assert.ok(await notBlank(file), "frame is blank");
});
