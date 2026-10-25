// HTML -> PNG / frame sequence / video through Playwright, for promo art and three.js mockups.
// Playwright is optional: it's resolved from the user's project, so the CLI stays light when only image tools are used.
import { spawnSync } from "node:child_process";
import { createReadStream, cpSync, existsSync, mkdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, extname, join, normalize, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { importTool } from "./tools.js";

export const SKILL_DIR = fileURLToPath(new URL("../skills/readytogo/", import.meta.url));

const MIME = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".svg": "image/svg+xml", ".glb": "model/gltf-binary", ".gltf": "model/gltf+json", ".bin": "application/octet-stream", ".hdr": "application/octet-stream", ".woff2": "font/woff2", ".ttf": "font/ttf", ".mp4": "video/mp4" };

export async function loadPlaywright(cwd) {
  const mod = await importTool("playwright", [cwd]);
  if (!mod) throw new Error("Playwright is not set up. Run: readytogo setup render");
  return mod.chromium ? mod : mod.default;
}

// Serves `root` (the project) and `/__skill/` (templates and models that ship with this skill) on localhost only.
function serve(root) {
  const inside = (base, p) => {
    const abs = resolve(base, "." + normalize("/" + p));
    return abs === base || abs.startsWith(base + sep) ? abs : null;
  };
  const server = createServer((req, res) => {
    const path = decodeURIComponent(new URL(req.url, "http://x").pathname);
    const file = path.startsWith("/__skill/") ? inside(SKILL_DIR.replace(/[\\/]$/, ""), path.slice(9)) : inside(root, path);
    if (!file || !existsSync(file) || !statSync(file).isFile()) return (res.writeHead(404), res.end("not found"));
    res.writeHead(200, { "content-type": MIME[extname(file).toLowerCase()] ?? "application/octet-stream", "cache-control": "no-store" });
    createReadStream(file).pipe(res);
  });
  return new Promise((ok) => server.listen(0, "127.0.0.1", () => ok(server)));
}

export async function render({ html, size = "1280x800", out, scale = 1, transparent = false, wait = 0, frames, fps, duration, video, at, root = process.cwd() }) {
  const [width, height] = size.split("x").map(Number);
  if (!width || !height) throw new Error(`Bad --size "${size}", want WxH`);
  const pw = await loadPlaywright(root);
  const server = await serve(root);
  let browser;
  try {
    browser = await pw.chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--hide-scrollbars"] });
    const page = await (await browser.newContext({ viewport: { width, height }, deviceScaleFactor: scale })).newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => m.type() === "error" && !/.glb/.test(m.location().url) && errors.push(m.text())); // model path probes 404 by design
    const rel = html.startsWith("/__skill/") ? html : "/" + relative(root, resolve(root, html.split("?")[0])).split(sep).join("/") + (html.includes("?") ? "?" + html.split("?")[1] : "");
    await page.goto(`http://127.0.0.1:${server.address().port}${rel}`, { waitUntil: "networkidle" });
    // Pages that load assets asynchronously set window.__ready = true when the first frame is final.
    if (await page.evaluate(() => "__ready" in window)) await page.waitForFunction(() => window.__ready === true, null, { timeout: 30000 });
    if (at != null) await page.evaluate((t) => window.__seek(t), at);
    if (wait) await page.waitForTimeout(wait);
    const shot = (path) => page.screenshot({ path, omitBackground: transparent });

    // Scene pages declare their own length (window.__duration) and frame rate (window.__fps).
    const pageDuration = video || frames || duration ? await page.evaluate(() => window.__duration) : undefined;
    duration ??= video && !frames ? pageDuration : duration;
    fps ??= (await page.evaluate(() => window.__fps)) ?? 30;
    if (!frames && !duration) {
      mkdirSync(dirname(resolve(out)), { recursive: true });
      await shot(out);
      return { files: [out], errors };
    }
    if (!(await page.evaluate(() => typeof window.__seek === "function"))) throw new Error("Page has no window.__seek(seconds); animated capture needs a deterministic timeline.");
    const total = frames ?? Math.round(duration * fps);
    const dir = video ? join(dirname(resolve(video)), ".frames") : resolve(out);
    mkdirSync(dir, { recursive: true });
    for (let i = 0; i < total; i++) {
      await page.evaluate((t) => window.__seek(t), i / fps);
      await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
      await shot(join(dir, `frame-${String(i + 1).padStart(4, "0")}.png`));
    }
    const pattern = join(dir, "frame-%04d.png");
    const ext = video ? extname(video).toLowerCase() : "";
    const args = ext === ".webm" ? ["-c:v", "libvpx-vp9", "-pix_fmt", transparent ? "yuva420p" : "yuv420p", "-b:v", "0", "-crf", "28"] : ext === ".gif" ? ["-vf", `fps=${Math.min(fps, 20)},split[a][b];[a]palettegen[p];[b][p]paletteuse`] : ["-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-movflags", "+faststart"];
    const cmd = ["ffmpeg", "-y", "-framerate", String(fps), "-i", pattern, ...args, video ?? "out.mp4"];
    if (video) {
      const r = spawnSync(cmd[0], cmd.slice(1), { stdio: "ignore" });
      if (r.error || r.status !== 0) return { files: [dir], errors, note: `Frames written to ${dir}. ffmpeg ${r.error ? "not found" : "failed"}; encode with:\n${cmd.join(" ")}` };
      rmSync(dir, { recursive: true, force: true });
      return { files: [video], errors };
    }
    return { files: [dir], errors, note: `${total} frames in ${dir}. Encode with:\n${cmd.join(" ")}` };
  } finally {
    await browser?.close();
    server.close();
  }
}

// Copies a starter folder (and optionally bundled models) into the project so the agent can edit it.
const STARTERS = { "3d": ["templates", "3d"], frames: ["assets", "frames"], promo: ["templates", "promo"] };
export function scaffold(kind, dir, models = []) {
  if (!STARTERS[kind]) throw new Error(`Unknown starter "${kind}". Available: ${Object.keys(STARTERS).join(", ")}`);
  const from = join(SKILL_DIR, ...STARTERS[kind]);
  cpSync(from, dir, { recursive: true });
  const copied = [];
  for (const id of models) {
    const m = listModels().find((x) => x.id === id);
    if (!m) throw new Error(`Model "${id}" not found. List them with \`readytogo models\`.`);
    mkdirSync(join(dir, "models"), { recursive: true });
    cpSync(join(SKILL_DIR, "assets", "3d", "models", m.file), join(dir, "models", m.file));
    copied.push(id);
  }
  return { dir, copied };
}

export function listModels() {
  try {
    return JSON.parse(readFileSync(join(SKILL_DIR, "assets", "3d", "models", "manifest.json"), "utf8")).models;
  } catch {
    return [];
  }
}
