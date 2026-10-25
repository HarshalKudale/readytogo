// Automatic checks, keyed by catalog item id. Each returns { pass: true|false|null, detail }.
// null means "can't tell from the repo": the agent decides, using the item's checklist.
import { statSync } from "node:fs";
import { join } from "node:path";
import { parsePage } from "./seo.js";
import { readJson, readText } from "./util.js";

const SOURCE = /\.(html?|[cm]?[jt]sx?|vue|svelte|astro|json|ya?ml|toml|xml|md|mdx|swift|kt|kts|gradle|plist|rs|py|dart|cs)$|(^|\/)\.env/i;
const MIN_TARGET_SDK = 35; // Play requires new apps to target a recent API level; confirm the current number in Play Console policy.

export function context(root, files, tags) {
  const cache = new Map();
  const read = (rel) => {
    if (!cache.has(rel)) cache.set(rel, readText(join(root, rel)));
    return cache.get(rel);
  };
  const small = (rel) => {
    try {
      return statSync(join(root, rel)).size < 300_000;
    } catch {
      return false;
    }
  };
  const grep = (re, filter = () => true) => files.filter((f) => SOURCE.test(f) && filter(f) && small(f)).filter((f) => re.test(read(f)));
  const pkgs = files.filter((f) => /(^|\/)package\.json$/.test(f)).slice(0, 12).map((f) => readJson(join(root, f), {}));
  const deps = new Set(pkgs.flatMap((p) => Object.keys({ ...p.dependencies, ...p.devDependencies })));
  const manifestPath = files.find((f) => /(^|\/)manifest\.json$/.test(f) && /"manifest_version"/.test(read(f)));
  return {
    root,
    files,
    tags,
    read,
    grep,
    deps,
    pkgs,
    manifestPath,
    manifest: manifestPath ? readJson(join(root, manifestPath), {}) : null,
    has: (re) => files.some((f) => re.test(f)),
    find: (re) => files.filter((f) => re.test(f)),
  };
}

const ok = (detail) => ({ pass: true, detail });
const bad = (detail) => ({ pass: false, detail });
const unknown = (detail) => ({ pass: null, detail });
const flag = (cond, yes, no) => (cond ? ok(yes) : bad(no));

const htmlPages = (c) => c.files.filter((f) => /(^|\/)index\.html$/.test(f));
const layoutFiles = (c) => c.files.filter((f) => /(^|\/)(layout|root|\+layout|_app|_document|nuxt\.config|astro\.config|Layout|BaseHead|Head)\.[\w.]+$/.test(f) || /(^|\/)(layouts|components)\/.*(Head|Layout|Seo)/i.test(f));

async function iconCandidates(c, sharp, minSize) {
  const pngs = c.find(/\.png$/i).filter((f) => /icon|logo|appstore|ios/i.test(f)).slice(0, 80);
  const out = [];
  for (const f of pngs) {
    try {
      const m = await sharp(join(c.root, f)).metadata();
      if (m.width === m.height && m.width >= minSize) out.push({ f, w: m.width, alpha: m.hasAlpha });
    } catch {
      // unreadable image: not a candidate
    }
  }
  return out;
}

export const CHECKS = {
  "brand.app-icon": async (c, sharp) => {
    const hit = await iconCandidates(c, sharp, 1024);
    if (hit.length) return ok(`${hit[0].f} (${hit[0].w}px square)`);
    const svg = c.find(/(^|\/)(app-?icon|icon|logo)[\w-]*\.svg$/i)[0];
    return svg ? ok(`${svg} is a vector master; icons are rasterised from it at every size`) : bad("No square PNG of at least 1024px or SVG named like an icon or logo. Provide a master icon, then run `readytogo icons`.");
  },
  "appstore.icon": async (c, sharp) => {
    const hit = await iconCandidates(c, sharp, 1024);
    if (!hit.length) return bad("No 1024×1024 icon found.");
    const clean = hit.find((h) => !h.alpha);
    return clean ? ok(`${clean.f} has no alpha channel`) : bad(`${hit[0].f} has an alpha channel; App Store Connect rejects it. Run \`readytogo icons ${hit[0].f} --for app_store\`.`);
  },
  "brand.favicon": (c) => {
    const files = c.find(/(^|\/)(favicon\.(ico|svg|png)|icon\.(svg|png|ico))$/i);
    const linked = c.grep(/rel=["'](shortcut )?icon["']/i, (f) => /\.(html?|[jt]sx|vue|svelte|astro)$/.test(f));
    return flag(files.length || linked.length, `favicon: ${files[0] ?? linked[0]}`, "No favicon file or <link rel=icon>. Run `readytogo icons <logo> --for favicon`.");
  },
  "legal.privacy": (c) => {
    const hit = c.find(/privacy/i).filter((f) => !/node_modules|\.(png|jpe?g)$/.test(f));
    return flag(hit.length, `privacy page/source: ${hit[0]}`, "No privacy policy page or file found in the repo. It may live on an external site; confirm the public URL.");
  },
  "legal.terms": (c) => {
    const hit = c.find(/(^|\/)(terms|tos|eula)[\w-]*\.|\/terms\//i);
    return flag(hit.length, `terms: ${hit[0]}`, "No terms page or file found in the repo.");
  },
  "legal.license": (c) => {
    const hit = c.find(/(^|\/)(LICENSE|LICENCE|COPYING)(\.\w+)?$/i);
    return flag(hit.length, hit[0], "No LICENSE file.");
  },
  "build.secrets-repo": (c) => {
    const re = /AKIA[0-9A-Z]{16}|-----BEGIN (RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----|sk_live_[0-9a-zA-Z]{20,}|ghp_[A-Za-z0-9]{36}|xox[bp]-[0-9A-Za-z-]{20,}|AIza[0-9A-Za-z_-]{35}|sk-ant-[A-Za-z0-9_-]{20,}/;
    const hits = c.grep(re, (f) => !/\.lock$|\.min\.js$|package-lock/.test(f));
    const envFiles = c.find(/(^|\/)\.env(\.\w+)?$/).filter((f) => !/example|sample|template/.test(f));
    const ignored = /\.env/.test(c.read(".gitignore"));
    const problems = [...hits.map((f) => `secret-like string in ${f}`), ...(envFiles.length && !ignored ? [`${envFiles[0]} present and .env is not in .gitignore`] : [])];
    return problems.length ? bad(problems.slice(0, 5).join("; ") + ". Also scan git history (e.g. gitleaks).") : ok("No secret patterns in working tree. Git history not scanned.");
  },
  "build.public-env": (c) => {
    const hits = c.grep(/(NEXT_PUBLIC|VITE|PUBLIC|EXPO_PUBLIC|NUXT_PUBLIC)_\w*(SECRET|PRIVATE|SERVICE_ROLE|PASSWORD)/i);
    return hits.length ? bad(`Secret-looking client-exposed env var in ${hits.slice(0, 3).join(", ")}`) : ok("No secret-named public env vars.");
  },
  "build.electron-security": (c) => {
    const hits = c.grep(/nodeIntegration\s*:\s*true|contextIsolation\s*:\s*false|webSecurity\s*:\s*false/, (f) => /\.[cm]?[jt]s$/.test(f));
    if (hits.length) return bad(`Unsafe BrowserWindow option in ${hits[0]}`);
    return c.grep(/new BrowserWindow/).length ? ok("No nodeIntegration/contextIsolation/webSecurity overrides.") : unknown("No BrowserWindow found.");
  },
  "qa.ci": (c) => {
    const hit = c.find(/^\.github\/workflows\/.+\.ya?ml$|^\.gitlab-ci\.yml$|^\.circleci\/config\.yml$|^azure-pipelines\.yml$|^bitrise\.yml$/);
    return flag(hit.length, hit[0], "No CI config found (.github/workflows, .gitlab-ci.yml, …).");
  },
  "qa.crash-reporting": (c) => {
    const dep = [...c.deps].find((d) => /sentry|bugsnag|rollbar|datadog|honeybadger|crashlytics/i.test(d));
    const native = c.grep(/Sentry|Crashlytics|Bugsnag|sentry_flutter|firebase_crashlytics/, (f) => /(Podfile|\.gradle(\.kts)?|pubspec\.yaml|Cargo\.toml|requirements\.txt|pyproject\.toml)$/.test(f));
    return flag(dep || native.length, `reporter: ${dep ?? native[0]}`, "No error/crash reporting dependency found.");
  },
  "seo.sitemap": (c) => {
    const robots = c.has(/(^|\/)(robots\.txt|robots\.[jt]s)$/);
    const sitemap = c.has(/(^|\/)(sitemap[\w-]*\.xml|sitemap\.[jt]s|sitemap\.xml\.[jt]s)$/) || c.deps.has("next-sitemap") || c.deps.has("@astrojs/sitemap");
    return robots && sitemap ? ok("robots and sitemap present") : bad(`Missing: ${[!robots && "robots.txt", !sitemap && "sitemap.xml"].filter(Boolean).join(", ")}`);
  },
  "seo.title-meta": (c) => {
    const pages = htmlPages(c);
    if (pages.length) {
      const p = parsePage(c.read(pages[0]));
      const issues = [];
      if (p.title.length < 30 || p.title.length > 60) issues.push(`title is ${p.title.length} chars (want 30–60)`);
      if (p.description.length < 70 || p.description.length > 160) issues.push(`description is ${p.description.length} chars (want 70–160)`);
      return issues.length ? bad(`${pages[0]}: ${issues.join("; ")}`) : ok(`${pages[0]} title and description lengths are fine`);
    }
    const lay = layoutFiles(c).filter((f) => /<title|metadata|useHead|<svelte:head|<Head/.test(c.read(f)));
    return lay.length ? unknown(`Meta is set in ${lay[0]}; check lengths against 30–60 / 70–160 (or run \`readytogo seo <built page>\`).`) : bad("No <title> or metadata found.");
  },
  "seo.og": (c) => {
    const pages = htmlPages(c);
    if (pages.length) {
      const p = parsePage(c.read(pages[0]));
      const missing = ["title", "description", "image"].filter((k) => !p.og[k]).map((k) => "og:" + k).concat(p.twitter.card ? [] : ["twitter:card"]);
      return missing.length ? bad(`${pages[0]} is missing: ${missing.join(", ")}`) : ok(`${pages[0]} has OG + twitter:card`);
    }
    const hit = c.grep(/og:image|openGraph|property=["']og:/);
    return hit.length ? unknown(`OG tags appear in ${hit[0]}; verify title, description, image and twitter:card.`) : bad("No Open Graph tags found.");
  },
  "seo.noindex": (c) => {
    const hits = c.grep(/noindex/i, (f) => !/node_modules|\.md$/.test(f));
    const robots = c.find(/(^|\/)robots\.txt$/).filter((f) => /Disallow:\s*\/\s*$/m.test(c.read(f)));
    const found = [...hits.map((f) => `noindex in ${f}`), ...robots.map((f) => `Disallow: / in ${f}`)];
    return found.length ? bad(found.slice(0, 4).join("; ") + ". Fine for staging, fatal for production.") : ok("No noindex or blanket Disallow found.");
  },
  "seo.software-schema": (c) => flag(c.grep(/SoftwareApplication|MobileApplication/).length, "SoftwareApplication JSON-LD present", "No SoftwareApplication structured data."),
  "assets.og-image": (c) => {
    const f = c.find(/(^|\/)(og|opengraph|open-graph|social|twitter)[\w-]*\.(png|jpe?g)$/i);
    return flag(f.length || c.grep(/og:image/).length, f[0] ?? "og:image set", "No share image found. Design a 1200×630 image (references/mockups.md), render it, and check with `readytogo verify <file> --target og`.");
  },
  "domain.deeplinks-ios": (c) => flag(c.has(/apple-app-site-association/), "AASA file present", "No apple-app-site-association file."),
  "domain.deeplinks-android": (c) => flag(c.has(/assetlinks\.json$/), "assetlinks.json present", "No assetlinks.json."),
  "appstore.privacy-manifest": (c) => flag(c.has(/PrivacyInfo\.xcprivacy$/), "PrivacyInfo.xcprivacy present", "No PrivacyInfo.xcprivacy."),
  "play.target-api": (c) => {
    const g = c.find(/build\.gradle(\.kts)?$/).map((f) => c.read(f).match(/targetSdk(?:Version)?\s*[=( ]\s*(\d+)/)?.[1]).find(Boolean);
    if (!g) return unknown("No targetSdk found in Gradle files (Expo/Flutter set it via config).");
    return +g >= MIN_TARGET_SDK ? ok(`targetSdk ${g}`) : bad(`targetSdk ${g}; Play requires at least ${MIN_TARGET_SDK}. Confirm the current minimum in Play Console.`);
  },
  "cws.mv3": (c) => {
    if (!c.manifest) return unknown("No manifest.json with manifest_version found (WXT/Plasmo generate it at build; check the build output).");
    return flag(c.manifest.manifest_version === 3, `${c.manifestPath}: manifest_version 3`, `${c.manifestPath}: manifest_version is ${c.manifest.manifest_version}; stores require 3.`);
  },
  "build.ext-package": (c) => {
    if (!c.manifest) return unknown("No manifest.json to inspect.");
    const hosts = [...(c.manifest.host_permissions ?? []), ...(c.manifest.permissions ?? [])];
    const dev = hosts.filter((h) => /localhost|127\.0\.0\.1/.test(h));
    return dev.length ? bad(`Dev host permissions in ${c.manifestPath}: ${dev.join(", ")}`) : ok(`${hosts.length} permission entries, none for localhost. Justify each in the listing.`);
  },
  "cws.assets": async (c, sharp) => {
    if (!c.manifest) return unknown("No manifest.json to inspect.");
    const icons = c.manifest.icons ?? {};
    const need = ["16", "48", "128"].filter((s) => !icons[s]);
    if (need.length) return bad(`manifest icons missing sizes: ${need.join(", ")}`);
    const dir = c.manifestPath.replace(/[^/]+$/, "");
    const wrong = [];
    for (const [s, p] of Object.entries(icons)) {
      try {
        const m = await sharp(join(c.root, dir, p)).metadata();
        if (m.width !== +s || m.height !== +s) wrong.push(`${p} is ${m.width}×${m.height}, declared ${s}`);
      } catch {
        wrong.push(`${p} missing`);
      }
    }
    return wrong.length ? bad(wrong.join("; ")) : ok("manifest icons 16/48/128 exist at the right sizes. Screenshots and promo tiles are separate: `readytogo specs --store chrome_web_store`.");
  },
  "pkg.readme": (c) => {
    const f = c.find(/^README(\.\w+)?$/i)[0];
    return f && c.read(f).length > 300 ? ok(f) : bad(f ? "README is almost empty" : "No README.");
  },
  "pkg.semver": (c) => {
    const v = c.pkgs[0]?.version;
    const log = c.find(/^CHANGELOG(\.\w+)?$/i)[0];
    const semver = !v || /^\d+\.\d+\.\d+/.test(v);
    if (log && semver) return ok(`${log}${v ? `, version ${v}` : ""}`);
    return bad([!log && "No CHANGELOG.", !semver && `Version "${v}" is not semver.`].filter(Boolean).join(" "));
  },
  "pkg.repo-meta": (c) => {
    const miss = [["LICENSE", /^LICENSE/i], ["README", /^README/i], ["CONTRIBUTING", /^(\.github\/)?CONTRIBUTING/i]].filter(([, re]) => !c.has(re)).map(([n]) => n);
    return miss.length ? bad(`Missing: ${miss.join(", ")}`) : ok("LICENSE, README, CONTRIBUTING present");
  },
};

export async function runChecks(ctx, ids, sharp) {
  const results = {};
  for (const id of ids) {
    const fn = CHECKS[id];
    if (!fn) continue;
    try {
      results[id] = await fn(ctx, sharp);
    } catch (e) {
      results[id] = { pass: null, detail: `check crashed: ${e.message}` };
    }
  }
  return results;
}
