// OS window frames as plain HTML + CSS (frames.css). Original generic designs: no vendor logos or trademarks.
//   import { frameHTML, fitWidth, FRAMES } from "./frames.js";
//   el.innerHTML = frameHTML("browser-macos-tabs", { theme: "dark", url: "acme.com/app", tab: "Dashboard" });
//   el.querySelector(".rtg-screen").append(imgOrVideo);
// Every dimension in frames.css is in --u units (1% of the frame width), so a frame scales to any size.
const I = {
  back: '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>',
  fwd: '<svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>',
  reload: '<svg viewBox="0 0 24 24"><path d="M20 12a8 8 0 1 1-2.5-5.8M20 4v5h-5"/></svg>',
  lock: '<svg viewBox="0 0 24 24" class="fill"><path d="M7 10V8a5 5 0 0 1 10 0v2h1a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1zm2 0h6V8a3 3 0 0 0-6 0z"/></svg>',
  dots: '<svg viewBox="0 0 24 24" class="fill"><circle cx="12" cy="5" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/></svg>',
  share: '<svg viewBox="0 0 24 24"><path d="M12 15V3M8 7l4-4 4 4M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1"/></svg>',
  plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  min: '<svg viewBox="0 0 24 24"><path d="M5 12h14"/></svg>',
  max: '<svg viewBox="0 0 24 24"><rect x="5" y="5" width="14" height="14" rx="1"/></svg>',
  close: '<svg viewBox="0 0 24 24"><path d="M5 5l14 14M19 5L5 19"/></svg>',
  menu: '<svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
};
const lights = '<span class="lights"><i></i><i></i><i></i></span>';
const omni = (url, extra = "") => `<span class="omni ${extra}">${I.lock}<span class="txt">${url}</span></span>`;
const icon = (n, c = "") => `<span class="ic ${c}">${I[n]}</span>`;
const favicon = '<i class="fav"></i>';

// chrome: total chrome height in --u units (title/tab bar + toolbar). radius: window corner radius in --u.
export const FRAMES = {
  "browser-macos-tabs": { kind: "browser", os: "macos", chrome: 11.6, radius: 1.2, html: (o) => `<div class="bar tabs">${lights}<span class="tab">${favicon}<span class="txt">${o.tab}</span>${icon("close", "sm")}</span>${icon("plus", "sm")}</div><div class="bar tool">${icon("back")}${icon("fwd")}${icon("reload")}${omni(o.url, "wide")}${icon("share")}${icon("dots")}</div>` },
  "browser-macos-compact": { kind: "browser", os: "macos", chrome: 5.4, radius: 1.2, html: (o) => `<div class="bar tool only">${lights}${icon("menu")}${icon("back")}${icon("fwd")}${omni(o.url, "center")}${icon("share")}${icon("plus")}</div>` },
  "browser-windows-tabs": { kind: "browser", os: "windows", chrome: 11.6, radius: 0.8, html: (o) => `<div class="bar tabs"><span class="tab">${favicon}<span class="txt">${o.tab}</span>${icon("close", "sm")}</span>${icon("plus", "sm")}<span class="spacer"></span><span class="wc">${icon("min")}${icon("max")}${icon("close")}</span></div><div class="bar tool">${icon("back")}${icon("fwd")}${icon("reload")}${omni(o.url, "wide")}${icon("dots")}</div>` },
  "browser-linux": { kind: "browser", os: "linux", chrome: 5.8, radius: 1.0, html: (o) => `<div class="bar tool only">${icon("back")}${icon("fwd")}${icon("reload")}${omni(o.url, "center")}${icon("menu")}<span class="wc round">${icon("min")}${icon("max")}${icon("close")}</span></div>` },
  "app-macos": { kind: "app", os: "macos", chrome: 4.8, radius: 1.2, html: (o) => `<div class="bar title only">${lights}<span class="title center">${o.title}</span></div>` },
  "app-windows": { kind: "app", os: "windows", chrome: 4.4, radius: 0.8, html: (o) => `<div class="bar title only">${favicon}<span class="title">${o.title}</span><span class="spacer"></span><span class="wc">${icon("min")}${icon("max")}${icon("close")}</span></div>` },
  "app-linux": { kind: "app", os: "linux", chrome: 5.0, radius: 1.0, html: (o) => `<div class="bar title only"><span class="title center">${o.title}</span><span class="wc round">${icon("close")}</span></div>` },
};

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
export function frameHTML(name, { theme = "light", url = "example.com", title = "App", tab } = {}) {
  const f = FRAMES[name];
  if (!f) throw new Error(`Unknown frame "${name}". Available: ${Object.keys(FRAMES).join(", ")}`);
  const o = { url: esc(url.replace(/^https?:\/\//, "")), title: esc(title), tab: esc(tab ?? title) };
  return `<div class="rtg-frame" data-frame="${name}" data-theme="${theme}" data-os="${f.os}"><div class="rtg-chrome">${f.html(o)}</div><div class="rtg-screen"></div></div>`;
}

// Frame width in px that fits a screen of aspect ratio `ar` (w/h) inside a w x h canvas with `pad` (0-0.5) margin.
export function fitWidth(name, ar, w, h, pad = 0.08) {
  const { chrome } = FRAMES[name];
  return Math.min(w * (1 - 2 * pad), (h * (1 - 2 * pad)) / (chrome / 100 + 1 / ar));
}
