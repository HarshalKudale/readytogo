import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import sharp from "sharp";
import { runChecks, context } from "../src/checks.js";
import { annotate, checkListing, makeFrame, makeIcons, makePromo, makeShot } from "../src/images.js";
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

test("frames render at the requested canvas", async () => {
  for (const [kind, size] of [["phone", "landscape"], ["tablet", "square"], ["browser", "og"], ["window", "hero"], ["laptop", "hero"]]) {
    const r = await makeFrame(shot, kind, join(out, `${kind}.png`), { size, bg: kind === "phone" ? "grad:#0ea5e9,#6366f1,135" : "#eef2ff", url: "app.example.com" });
    const [w, h] = await dims(r.file);
    assert.deepEqual([w, h], size === "landscape" ? [1600, 1200] : size === "square" ? [1080, 1080] : size === "og" ? [1200, 630] : [1920, 1080]);
  }
  const bare = await makeFrame(shot, "phone", join(out, "phone-bare.png"), { size: "none" });
  assert.equal((await dims(bare.file))[2], true);
});

test("promo tiles hit the spec size, with and without a logo", async () => {
  for (const id of ["cws_small", "cws_marquee", "play_feature", "ph_thumb", "ms_poster", "og"]) {
    const r = await makePromo(id, join(out, `promo-${id}.png`), { title: "Launch faster with Demo", subtitle: "Everything you need to ship", logo });
    const spec = data("specs").assets.find((a) => a.id === id);
    assert.deepEqual((await dims(r.file)).slice(0, 2), [spec.w, spec.h]);
  }
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

// Needs Playwright, Chromium and network access for three.js, so it only runs on request.
test("3d template renders a laptop frame", { skip: process.env.READYTOGO_E2E !== "1" }, async () => {
  const { render } = await import("../src/render.js");
  const file = join(out, "e2e-laptop.png");
  const r = await render({ html: "/__skill/templates/3d/device-scene.html?device=laptop&capture=1&anim=open", size: "800x500", out: file, at: 2.4, root: out });
  assert.deepEqual(r.errors, []);
  const [w, h] = await dims(file);
  assert.deepEqual([w, h], [800, 500]);
  const { data: px } = await sharp(file).raw().toBuffer({ resolveWithObject: true });
  assert.ok(new Set(px.subarray(0, 4000).map((v) => v)).size > 1 || px.some((v, i) => i % 4 === 3 && v > 0), "page is not blank");
});
