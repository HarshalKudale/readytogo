// Starter: capture screenshots and a screen recording of a web app. Copy, edit the SHOTS and flow, run with node.
// Needs Playwright (readytogo setup render). Run:  node capture-web.mjs
import { mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { homedir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

// Playwright from the project if present, else from `readytogo setup render` (~/.readytogo/tools).
const pw = await import("playwright").catch(() => import(pathToFileURL(createRequire(join(process.env.READYTOGO_HOME ?? join(homedir(), ".readytogo"), "tools", "x.js")).resolve("playwright")).href));
const { chromium } = pw.chromium ? pw : pw.default;

const BASE = process.env.APP_URL ?? "http://localhost:3000";
const OUT = "capture";
mkdirSync(OUT, { recursive: true });

// One entry per planned shot. `prepare` gets the page after navigation: log in with a demo user, open a menu, fill demo data.
const SHOTS = [
  { name: "home-light", path: "/", viewport: { width: 1280, height: 800 }, scheme: "light", ready: "main" },
  { name: "home-dark", path: "/", viewport: { width: 1280, height: 800 }, scheme: "dark", ready: "main" },
  { name: "home-phone", path: "/", viewport: { width: 390, height: 844 }, scheme: "light", ready: "main", mobile: true },
];

const STILL_CSS = "*{animation:none!important;transition:none!important;caret-color:transparent!important}";
const browser = await chromium.launch();
for (const s of SHOTS) {
  const ctx = await browser.newContext({ viewport: s.viewport, deviceScaleFactor: 2, colorScheme: s.scheme, isMobile: s.mobile, hasTouch: s.mobile, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  await page.goto(BASE + s.path, { waitUntil: "networkidle" });
  await page.locator(s.ready).first().waitFor();
  await page.addStyleTag({ content: STILL_CSS });
  await s.prepare?.(page);
  await page.screenshot({ path: `${OUT}/${s.name}.png` });
  await ctx.close();
}

// A short recording of one flow (WebM). Pauses make it readable; close the context to flush the file.
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, recordVideo: { dir: OUT, size: { width: 1280, height: 800 } } });
const page = await ctx.newPage();
await page.goto(BASE, { waitUntil: "networkidle" });
await page.waitForTimeout(800);
await page.mouse.move(640, 400, { steps: 25 });
// … click through the flow here, with `await page.waitForTimeout(600)` between steps …
await page.waitForTimeout(1200);
await ctx.close(); // the .webm is written on close
await browser.close();
console.log(`wrote ${OUT}/ (png stills + a .webm recording)`);
