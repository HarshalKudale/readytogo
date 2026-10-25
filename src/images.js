// Deterministic image tools: icons, screenshots, device frames, promo tiles, annotation. Everything is exact-pixel; no AI involved.
import { mkdirSync, writeFileSync } from "node:fs";
import { basename, dirname, extname, join } from "node:path";
import sharp from "sharp";
import { buildIco, buildIcns, ICNS_TYPES } from "./containers.js";
import { data } from "./util.js";

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const write = (path, buf) => (mkdirSync(dirname(path), { recursive: true }), writeFileSync(path, buf), path);
const svg = (w, h, body, defs = "") => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs>${defs}</defs>${body}</svg>`);
const roundedMask = (w, h, r) => svg(w, h, `<rect width="${w}" height="${h}" rx="${r}" fill="#fff"/>`);
const bottomRoundedMask = (w, h, r) => svg(w, h, `<path d="M0 0H${w}V${h - r}Q${w} ${h} ${w - r} ${h}H${r}Q0 ${h} 0 ${h - r}Z" fill="#fff"/>`);
const ratio = (w, h) => w / h;

// "#hex" | "grad:#a,#b[,angleDeg]" | "transparent" -> svg rect fill + defs
function paint(bg = "#ffffff", id = "bg") {
  if (bg === "transparent") return { fill: "none", defs: "" };
  if (bg.startsWith("grad:")) {
    const [a, b, angle = "135"] = bg.slice(5).split(",");
    const rad = (+angle * Math.PI) / 180;
    const [x, y] = [Math.cos(rad) / 2, Math.sin(rad) / 2];
    return { fill: `url(#${id})`, defs: `<linearGradient id="${id}" x1="${0.5 - x}" y1="${0.5 - y}" x2="${0.5 + x}" y2="${0.5 + y}"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>` };
  }
  return { fill: bg, defs: "" };
}
const background = (w, h, bg) => {
  const p = paint(bg);
  return sharp(svg(w, h, `<rect width="${w}" height="${h}" fill="${p.fill}"/>`, p.defs));
};

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
  const emit = async (rel, buf) => files.push(write(join(outDir, rel), buf));

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

// ---- screenshots -------------------------------------------------------------

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
  const drift = Math.abs(ratio(m.width, m.height) / ratio(t.w, t.h) - 1);
  if (fit === "cover" && drift > 0.15) warnings.push(`Input ${m.width}×${m.height} has a different aspect than ${t.w}×${t.h}; cover crops ${Math.round(drift * 100)}% of it. Recapture at the right aspect or use --fit contain.`);
  if (m.width < t.w * 0.6) warnings.push(`Input is much smaller than ${t.w}px wide; the result will be soft. Recapture at higher resolution.`);
  const buf = await sharp(src).resize(t.w, t.h, { fit, position, background: bg }).flatten({ background: bg }).png().toBuffer();
  return { file: write(out, buf), width: t.w, height: t.h, warnings };
}

// ---- device frames -------------------------------------------------------------

async function screenFor(shot, w, h, mask) {
  return sharp(shot).resize(w, h, { fit: "cover", position: "top" }).ensureAlpha().composite([{ input: mask(w, h), blend: "dest-in" }]).png().toBuffer();
}

const FRAMES = {
  async phone(shot, { color = "#111114", height = 2000 }) {
    const W = Math.round(height / 2.05), H = height, b = W * 0.04, r = W * 0.16;
    const sw = Math.round(W - 2 * b), sh = Math.round(H - 2 * b);
    const screen = await screenFor(shot, sw, sh, (w, h) => roundedMask(w, h, r - b));
    const body = svg(W, H, `<rect width="${W}" height="${H}" rx="${r}" fill="${color}"/><rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="${r}" fill="none" stroke="rgba(255,255,255,.14)" stroke-width="2"/>`);
    const island = svg(W, H, `<rect x="${W * 0.36}" y="${b * 2.2}" width="${W * 0.28}" height="${W * 0.08}" rx="${W * 0.04}" fill="#000"/>`);
    return sharp(body).composite([{ input: screen, left: Math.round(b), top: Math.round(b) }, { input: island }]).png().toBuffer();
  },
  async tablet(shot, { color = "#111114", height = 2000 }) {
    const W = Math.round(height * 0.75), H = height, b = W * 0.035, r = W * 0.06;
    const sw = Math.round(W - 2 * b), sh = Math.round(H - 2 * b);
    const screen = await screenFor(shot, sw, sh, (w, h) => roundedMask(w, h, r * 0.6));
    const body = svg(W, H, `<rect width="${W}" height="${H}" rx="${r}" fill="${color}"/>`);
    return sharp(body).composite([{ input: screen, left: Math.round(b), top: Math.round(b) }]).png().toBuffer();
  },
  async window(shot, { width = 2000, dark = false, url }) {
    // Height follows the screenshot (so nothing is cropped) within a sensible window range.
    const m = await sharp(shot).metadata();
    const W = width, contentH = Math.round(W * Math.min(1.1, Math.max(0.45, m.height / m.width))), bar = Math.round(W * 0.046), H = contentH + bar, r = W * 0.0165;
    const lights = ["#ff5f57", "#febc2e", "#28c840"].map((c, i) => `<circle cx="${bar * (0.7 + i * 0.6)}" cy="${bar / 2}" r="${bar * 0.18}" fill="${c}"/>`).join("");
    const pill = url === undefined ? "" : `<rect x="${W * 0.25}" y="${bar * 0.2}" width="${W * 0.5}" height="${bar * 0.6}" rx="${bar * 0.3}" fill="${dark ? "#3a3a42" : "#fff"}"/><text x="${W / 2}" y="${bar * 0.5}" dominant-baseline="central" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="${bar * 0.32}" fill="${dark ? "#b4b4be" : "#6b6b76"}">${esc(url.replace(/^https?:\/\//, "").slice(0, 60))}</text>`;
    const body = svg(W, H, `<rect width="${W}" height="${H}" rx="${r}" fill="${dark ? "#2a2a30" : "#e9e9ee"}"/>${lights}${pill}`);
    const screen = await screenFor(shot, W, contentH, (w, h) => bottomRoundedMask(w, h, r));
    return sharp(body).composite([{ input: screen, left: 0, top: bar }]).png().toBuffer();
  },
  // Rounded card with no chrome, at the screenshot's own size: extension popups, widgets, panels.
  async card(shot) {
    const m = await sharp(shot).metadata();
    return sharp(shot).ensureAlpha().composite([{ input: roundedMask(m.width, m.height, Math.round(m.width * 0.03)), blend: "dest-in" }]).png().toBuffer();
  },
  async laptop(shot, { color = "#0f0f12", width = 2000 }) {
    const lidW = Math.round(width * 0.9), lidH = Math.round(lidW * 0.63), b = Math.round(lidW * 0.02), baseH = Math.round(width * 0.035);
    const W = width, H = lidH + baseH, x0 = Math.round((W - lidW) / 2);
    const screen = await screenFor(shot, lidW - 2 * b, lidH - 2 * b, (w, h) => roundedMask(w, h, b));
    const base = `<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d4d5db"/><stop offset="1" stop-color="#9b9ca5"/></linearGradient></defs><path d="M0 ${lidH}H${W}L${W - baseH * 0.4} ${H}H${baseH * 0.4}Z" fill="url(#g)"/><rect x="${W * 0.42}" y="${lidH}" width="${W * 0.16}" height="${baseH * 0.35}" rx="${baseH * 0.17}" fill="#8a8b94"/>`;
    const body = svg(W, H, `<rect x="${x0}" y="0" width="${lidW}" height="${lidH}" rx="${lidW * 0.025}" fill="${color}"/>${base}`);
    return sharp(body).composite([{ input: screen, left: x0 + b, top: b }]).png().toBuffer();
  },
};
FRAMES.browser = (shot, o) => FRAMES.window(shot, { ...o, url: o.url ?? "example.com" });

export const FRAME_NAMES = Object.keys(FRAMES);
export const CANVAS_SIZES = { landscape: [1600, 1200], og: [1200, 630], square: [1080, 1080], hero: [1920, 1080] };

export async function makeFrame(src, kind, out, { size = "landscape", bg = "#f4f4f6", url, dark, color, margin = 0.08, shadow = true } = {}) {
  if (!FRAMES[kind]) throw new Error(`Unknown frame "${kind}". Use: ${FRAME_NAMES.join(", ")}`);
  const framed = await FRAMES[kind](src, { url, dark, color });
  if (size === "none") return { file: write(out, framed) };
  const [cw, ch] = CANVAS_SIZES[size] ?? size.split("x").map(Number);
  if (!cw || !ch) throw new Error(`Bad --size "${size}". Use ${Object.keys(CANVAS_SIZES).join("|")}|none|WxH`);
  const fm = await sharp(framed).metadata();
  const s = Math.min((cw * (1 - 2 * margin)) / fm.width, (ch * (1 - 2 * margin)) / fm.height);
  const fw = Math.round(fm.width * s), fh = Math.round(fm.height * s);
  const scaled = await sharp(framed).resize(fw, fh).png().toBuffer();
  const left = Math.round((cw - fw) / 2), top = Math.round((ch - fh) / 2);
  const layers = [];
  if (shadow) {
    const blur = Math.max(fw, fh) * 0.03;
    layers.push({ input: svg(cw, ch, `<rect x="${left + fw * 0.03}" y="${top + fh * 0.05}" width="${fw * 0.94}" height="${fh * 0.94}" rx="${fw * 0.05}" fill="rgba(0,0,0,.35)" filter="url(#b)"/>`, `<filter id="b" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${blur}"/></filter>`) });
  }
  layers.push({ input: scaled, left, top });
  const buf = await background(cw, ch, bg).composite(layers).png().toBuffer();
  return { file: write(out, buf), width: cw, height: ch };
}

// ---- promo tiles ---------------------------------------------------------------

function wrap(text, maxChars) {
  const lines = [];
  let line = "";
  for (const word of String(text).split(/\s+/)) {
    if (line && (line + " " + word).length > maxChars) (lines.push(line), (line = word));
    else line = line ? line + " " + word : word;
  }
  return line ? [...lines, line] : lines;
}

// Fit text into a box by shrinking the font until the wrapped lines fit.
function fitText(text, boxW, boxH, maxSize, weight = 1) {
  for (let size = maxSize; size >= 10; size -= 2) {
    const lines = wrap(text, Math.max(4, Math.floor(boxW / (size * 0.56 * weight))));
    if (lines.length * size * 1.18 <= boxH) return { size, lines };
  }
  return { size: 10, lines: wrap(text, Math.max(4, Math.floor(boxW / 6))) };
}

export async function makePromo(targetId, out, { title, subtitle, logo, bg = "grad:#4f46e5,#7c3aed,135", fg = "#ffffff", accent } = {}) {
  const t = findAsset(targetId);
  const { w, h } = t;
  const pad = Math.round(Math.min(w, h) * 0.09);
  const wide = w / h >= 1.6;
  const tiny = Math.min(w, h) < 320 && logo;
  const layers = [];
  const p = paint(bg);
  let body = `<rect width="${w}" height="${h}" fill="${p.fill}"/>`;
  if (accent) body += `<circle cx="${w * 0.92}" cy="${h * 0.1}" r="${Math.min(w, h) * 0.45}" fill="${accent}" opacity=".18"/>`;
  const logoSize = tiny ? Math.round(Math.min(w, h) * 0.6) : wide ? Math.round(Math.min(h - 2 * pad, w * 0.28)) : Math.round(Math.min(w, h) * 0.26);
  let logoBuf;
  if (logo) logoBuf = await sharp(logo, { density: 384 }).resize(logoSize, logoSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  const text = (lines, x, y, size, weight, anchor, opacity = 1) => lines.map((l, i) => `<text x="${x}" y="${y + i * size * 1.18}" font-family="Helvetica, Arial, sans-serif" font-weight="${weight}" font-size="${size}" fill="${fg}" opacity="${opacity}" text-anchor="${anchor}">${esc(l)}</text>`).join("");

  if (tiny) {
    layers.push({ input: logoBuf, left: Math.round((w - logoSize) / 2), top: Math.round((h - logoSize) / 2) });
  } else if (wide) {
    const tx = logo ? pad * 1.4 + logoSize : pad * 1.4;
    const tw = w - tx - pad;
    const ts = fitText(title ?? "", tw, h * (subtitle ? 0.5 : 0.7), Math.round(h * 0.2), 1.05);
    const ss = subtitle ? fitText(subtitle, tw, h * 0.28, Math.round(h * 0.09)) : null;
    const blockH = ts.lines.length * ts.size * 1.18 + (ss ? ss.lines.length * ss.size * 1.18 + ss.size * 0.6 : 0);
    const y0 = (h - blockH) / 2 + ts.size * 0.9;
    body += text(ts.lines, tx, y0, ts.size, 700, "start");
    if (ss) body += text(ss.lines, tx, y0 + ts.lines.length * ts.size * 1.18 + ss.size * 0.4, ss.size, 400, "start", 0.85);
    if (logo) layers.push({ input: logoBuf, left: Math.round(pad * 0.9), top: Math.round((h - logoSize) / 2) });
  } else {
    const tw = w - 2 * pad;
    const top = logo ? pad + logoSize + pad * 0.6 : pad;
    const ts = fitText(title ?? "", tw, (h - top - pad) * (subtitle ? 0.55 : 0.9), Math.round(Math.min(w, h) * 0.12), 1.05);
    const ss = subtitle ? fitText(subtitle, tw, (h - top - pad) * 0.35, Math.round(Math.min(w, h) * 0.055)) : null;
    body += text(ts.lines, w / 2, top + ts.size, ts.size, 700, "middle");
    if (ss) body += text(ss.lines, w / 2, top + ts.lines.length * ts.size * 1.18 + ss.size * 1.4, ss.size, 400, "middle", 0.85);
    if (logo) layers.push({ input: logoBuf, left: Math.round((w - logoSize) / 2), top: pad });
  }
  const buf = await sharp(svg(w, h, body, p.defs)).composite(layers).flatten({ background: "#ffffff" }).png().toBuffer();
  return { file: write(out, buf), width: w, height: h, warnings: tiny || title ? [] : ["No --title given; the tile has no text."] };
}

// ---- annotation ------------------------------------------------------------------

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
  return { file: write(out, await sharp(src).composite(layers).png().toBuffer()) };
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

export const outName = (src, suffix, ext = ".png") => `${basename(src, extname(src))}${suffix}${ext}`;
