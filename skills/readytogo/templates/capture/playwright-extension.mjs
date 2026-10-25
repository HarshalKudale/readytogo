// Starter: capture a Chrome extension (Manifest V3): popup, options page, and the extension acting on a page.
// Needs Playwright (readytogo setup render). Run:  EXT_DIR=./dist DEMO_URL=https://example.com node capture-extension.mjs
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { createRequire } from "node:module";
import { homedir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

// Playwright from the project if present, else from `readytogo setup render` (~/.readytogo/tools).
const pw = await import("playwright").catch(() => import(pathToFileURL(createRequire(join(process.env.READYTOGO_HOME ?? join(homedir(), ".readytogo"), "tools", "x.js")).resolve("playwright")).href));
const { chromium } = pw.chromium ? pw : pw.default;

const EXT = resolve(process.env.EXT_DIR ?? ".");          // folder containing manifest.json
const DEMO_URL = process.env.DEMO_URL ?? "https://example.com"; // a stable page you control
const OUT = "capture";
mkdirSync(OUT, { recursive: true });

const ctx = await chromium.launchPersistentContext("", {
  headless: false, // extensions need a headed (or --headless=new) Chromium
  args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`, "--headless=new"],
  viewport: { width: 1280, height: 800 },
  deviceScaleFactor: 2,
});
let [sw] = ctx.serviceWorkers();
sw ??= await ctx.waitForEvent("serviceworker");
const id = new URL(sw.url()).host;

// 1. Popup at its natural size: open it as a page and screenshot just the content.
const popup = await ctx.newPage();
await popup.setViewportSize({ width: 360, height: 600 });
await popup.goto(`chrome-extension://${id}/popup.html`);
await popup.waitForLoadState("networkidle");
await popup.locator("body").screenshot({ path: `${OUT}/popup.png` });

// 2. Options page.
const options = await ctx.newPage();
await options.goto(`chrome-extension://${id}/options.html`).catch(() => {});
await options.screenshot({ path: `${OUT}/options.png` }).catch(() => {});

// 3. The extension doing its job on a real page: usually the best store screenshot.
const page = await ctx.newPage();
await page.goto(DEMO_URL, { waitUntil: "networkidle" });
// … trigger the content script / click the page action here …
await page.waitForTimeout(800);
await page.screenshot({ path: `${OUT}/in-page.png` });

await ctx.close();
console.log(`wrote ${OUT}/popup.png, options.png, in-page.png`);
