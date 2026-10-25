// Image converters, resizers and analysers. Everything is exact-pixel and deterministic.
// Creative work (mockups, promo art, 3D scenes) is NOT done here: the agent authors it from the assets
// in skills/readytogo/assets and checks the result with verifyImage().
import { mkdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import sharp from "sharp";
import { buildIco, buildIcns, ICNS_TYPES } from "./containers.js";
import { data } from "./util.js";

const write = (path, buf) => (mkdirSync(dirname(path), { recursive: true }), writeFileSync(path, buf));
const svg = (w, h, body) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`);
const roundedMask = (w, h, r) => svg(w, h, `<rect width="${w}" height="${h}" rx="${r}" fill="#fff"/>`);

// ---- icons ------------------------------------------------------------------

// Square 1024 master: art fitted inside, optionally on the macOS rounded-square grid or a rounded mask.
async function master(src, { padding = 0, bg, round, macGrid }) {
  const art = macGrid ? 824 : Math.round(1024 * (1 - padding * 2));
  let layer = await sharp(src, { density: 512 }).resize(art, art, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).ensureAlpha().png().toBuffer();
  if (bg && bg !== "transparent") {
    layer = await sharp({ create: { width: art, height: art, channels: 4, background: bg } }).composite([{ input: layer }]).png().toBuffer();
  }
  if (macGrid) layer = await sharp(layer).composite([{ input: roundedMask(art, art, 185), blend: "dest-in" }]).png().toBuffer();
  else if (round) layer = await sharp(layer).composite([{ input: roundedMask(art, art, Math.round(art * 0.2237)), blend: "dest-in" }]).png().toBuffer();
  const off = Math.round((1024 - art) / 2);
  return sharp({ create: { width: 1024, height: 1024, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).composite([{ input: layer, left: off, top: off }]).png().toBuffer();
}

export async function makeIcons(src, key, outDir, opts = {}) {
  key = key.replace(/-/g, "_");
  const sets = data("icon-sets");
  const m = await sharp(src).metadata();
  const warnings = [];
  if (m.width !== m.height) warnings.push(`Source is ${m.width}×${m.height}, not square; it was fitted with transparent padding.`);
  if (m.format !== "svg" && Math.max(m.width, m.height) < 1024) warnings.push(`Source is ${Math.max(m.width, m.height)}px; sizes above that are upscaled and will look soft. Use a 1024px+ PNG or an SVG.`);
  const art = await master(src, opts);
  const at = (size, opaque) => {
    let s = sharp(art).resize(size, size, { kernel: "lanczos3" });
    if (opaque) s = s.flatten({ background: opts.bg && opts.bg !== "transparent" ? opts.bg : "#ffffff" });
    return s.png().toBuffer();
  };
  const files = [];
  const emit = async (rel, buf) => {
    const path = join(outDir, rel);
    write(path, buf);
    files.push(path);
  };

  if (key === "favicon") {
    await emit("favicon.ico", buildIco(await Promise.all([16, 32, 48].map(async (size) => ({ size, png: await at(size) })))));
    await emit("favicon-16x16.png", await at(16));
    await emit("favicon-32x32.png", await at(32));
    await emit("apple-touch-icon.png", await at(180, true));
    await emit("icon-192.png", await at(192));
    await emit("icon-512.png", await at(512));
    const name = opts.name ?? "App";
    await emit("site.webmanifest", Buffer.from(JSON.stringify({ name, short_name: name, icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }, { src: "/icon-512.png", sizes: "512x512", type: "image/png" }], theme_color: opts.bg ?? "#ffffff", background_color: opts.bg ?? "#ffffff", display: "standalone" }, null, 2)));
    return { files, warnings, snippet: ['<link rel="icon" href="/favicon.ico" sizes="48x48">', '<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">', '<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">', '<link rel="apple-touch-icon" href="/apple-touch-icon.png">', '<link rel="manifest" href="/site.webmanifest">'].join("\n") };
  }
  if (key === "icns") {
    const entries = await Promise.all(ICNS_TYPES.map(async ([type, size]) => ({ type, png: await at(size) })));
    await emit("icon.icns", buildIcns(entries));
    return { files, warnings: [...warnings, ...(opts.macGrid ? [] : ["Tip: --mac-grid fits the art to the macOS rounded-square grid (824px inside 1024); without it the icon looks oversized next to other Dock icons."])] };
  }
  if (key === "ico") {
    await emit("icon.ico", buildIco(await Promise.all([16, 24, 32, 48, 64, 128, 256].map(async (size) => ({ size, png: await at(size) })))));
    return { files, warnings };
  }
  const set = sets[key];
  if (!set) throw new Error(`Unknown icon set "${key}". Available: ${[...Object.keys(sets), "icns", "ico"].join(", ")}`);
  for (const i of set.icons) await emit(`${set.folder}/${i.file}`, await at(i.size, i.opaque));
  return { files, warnings };
}

// ---- screenshots (resize) -------------------------------------------------------

export function findAsset(id) {
  const a = data("specs").assets.find((x) => x.id === id);
  if (!a) throw new Error(`Unknown asset id "${id}". List them with \`readytogo specs\`.`);
  return a;
}

// Resize/crop to the store's exact pixels; opaque PNG (stores reject alpha on screenshots).
export async function makeShot(src, targetId, out, { fit = "cover", bg = "#ffffff", position = "top" } = {}) {
  const t = findAsset(targetId);
  const m = await sharp(src).metadata();
  const warnings = [];
  const drift = Math.abs(m.width / m.height / (t.w / t.h) - 1);
  if (fit === "cover" && drift > 0.15) warnings.push(`Input ${m.width}×${m.height} has a different aspect than ${t.w}×${t.h}; cover crops ${Math.round(drift * 100)}% of it. Recapture at the right aspect or use --fit contain.`);
  if (m.width < t.w * 0.6) warnings.push(`Input is much smaller than ${t.w}px wide; the result will be soft. Recapture at higher resolution.`);
  write(out, await sharp(src).resize(t.w, t.h, { fit, position, background: bg }).flatten({ background: bg }).png().toBuffer());
  return { file: out, width: t.w, height: t.h, warnings };
}

// ---- analyser: does this file meet the spec? -----------------------------------------

// target: an asset id from `specs`, or "WxH".
export async function verifyImage(file, target) {
  const m = await sharp(file).metadata();
  const bytes = statSync(file).size;
  const problems = [];
  const notes = [];
  let spec = null;
  if (/^\d+x\d+$/i.test(target)) {
    const [w, h] = target.split(/x/i).map(Number);
    spec = { id: target, w, h };
  } else spec = findAsset(target);
  if (m.width !== spec.w || m.height !== spec.h) problems.push(`size is ${m.width}×${m.height}, want ${spec.w}×${spec.h}`);
  if (!["png", "jpeg"].includes(m.format)) problems.push(`format is ${m.format}; stores expect PNG or JPEG`);
  const storeAsset = spec.when?.any?.some((t) => t.startsWith("store:") && t !== "store:website" && t !== "store:github");
  if (m.hasAlpha && storeAsset) problems.push("has an alpha channel; stores usually reject it (flatten onto a background)");
  else if (m.hasAlpha) notes.push("has an alpha channel (fine for web/social, flatten for store uploads)");
  if (bytes > 8 * 1024 * 1024) problems.push(`file is ${(bytes / 1048576).toFixed(1)} MB; most stores cap uploads near 8 MB`);
  if (spec.note) notes.push(`spec note: ${spec.note}`);
  return { file, width: m.width, height: m.height, format: m.format, alpha: Boolean(m.hasAlpha), bytes, spec: spec.id, ok: problems.length === 0, problems, notes };
}

// ---- annotation -------------------------------------------------------------------

export async function annotate(src, out, boxes, { mode = "highlight", color = "#ef4444", block = 14 } = {}) {
  const m = await sharp(src).metadata();
  const regions = boxes.map((b) => {
    const [x, y, w, h] = b.split(",").map((n) => Math.round(+n));
    if ([x, y, w, h].some((n) => !Number.isFinite(n)) || w <= 0 || h <= 0) throw new Error(`Bad --box "${b}", want x,y,w,h in pixels`);
    return { left: Math.max(0, x), top: Math.max(0, y), width: Math.min(w, m.width - x), height: Math.min(h, m.height - y) };
  });
  let layers;
  if (mode === "redact") {
    layers = await Promise.all(regions.map(async (r) => {
      const small = await sharp(src).extract(r).resize(Math.max(1, Math.round(r.width / block)), Math.max(1, Math.round(r.height / block)), { kernel: "nearest" }).toBuffer();
      return { input: await sharp(small).resize(r.width, r.height, { kernel: "nearest" }).png().toBuffer(), left: r.left, top: r.top };
    }));
  } else {
    const sw = Math.max(3, Math.round(m.width * 0.004));
    layers = [{ input: svg(m.width, m.height, regions.map((r) => `<rect x="${r.left}" y="${r.top}" width="${r.width}" height="${r.height}" rx="${sw * 2}" fill="none" stroke="${color}" stroke-width="${sw}"/>`).join("")) }];
  }
  write(out, await sharp(src).composite(layers).png().toBuffer());
  return { file: out };
}

// ---- listing text ------------------------------------------------------------------

export function checkListing(fields) {
  const limits = Object.fromEntries(data("specs").listing.map((f) => [f.id, f]));
  return Object.entries(fields).map(([id, text]) => {
    const spec = limits[id];
    if (!spec) return { id, ok: false, note: `unknown field id; known: ${Object.keys(limits).join(", ")}` };
    const len = [...String(text)].length;
    return { id, label: spec.label, length: len, max: spec.max, ok: len <= spec.max, note: len <= spec.max ? `${spec.max - len} left` : `${len - spec.max} over` };
  });
}
