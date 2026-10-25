// Maintainer script: rebuilds the bundled device models (skills/readytogo/assets/3d/models/*.glb + manifest.json)
// from scripts/models/builder.html. Needs Playwright + Chromium and network access for three.js.
// Run: npm run build:models
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { loadPlaywright } from "../src/render.js";

const html = readFileSync(new URL("./models/builder.html", import.meta.url));
const outDir = new URL("../skills/readytogo/assets/3d/models/", import.meta.url);
mkdirSync(outDir, { recursive: true });

const server = createServer((_, res) => (res.writeHead(200, { "content-type": "text/html" }), res.end(html)));
await new Promise((ok) => server.listen(0, "127.0.0.1", ok));
const pw = await loadPlaywright(process.cwd());
const browser = await pw.chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
try {
  const page = await browser.newPage();
  page.on("pageerror", (e) => console.error("page error:", e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/`, { waitUntil: "load" });
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 });
  const models = await page.evaluate(() => window.buildAll());
  const manifest = [];
  for (const m of models) {
    const file = `${m.id}.glb`;
    writeFileSync(new URL(file, outDir), Buffer.from(m.b64, "base64"));
    manifest.push({ id: m.id, kind: m.kind, file, screenMesh: "Screen", screenAspect: m.screenAspect, hinge: m.kind === "laptop" ? "LidPivot" : undefined, defaultColor: m.defaultColor, description: m.description, license: "CC0-1.0", author: "ReadyToGo (procedurally generated, generic design)" });
    console.log(`${file}  ${(Buffer.from(m.b64, "base64").length / 1024).toFixed(0)} KB  screen ${m.screenAspect}`);
  }
  writeFileSync(new URL("manifest.json", outDir), JSON.stringify({ units: "1 = 10 cm", frontAxis: "+z", models: manifest }, null, 2) + "\n");
} finally {
  await browser.close();
  server.close();
}
