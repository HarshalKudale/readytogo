// Link analysers: `links` audits the links ON a page (broken, redirecting, unsafe, nofollow); `backlinks` analyses
// links pointing AT your site from an export (Search Console, Ahrefs, Semrush, Moz, or a plain URL list) and can
// verify that each referring page still links to you.
import { fetchPage, pool, publicUrl } from "./net.js";

const ENT = { "&amp;": "&", "&quot;": '"', "&#39;": "'", "&lt;": "<", "&gt;": ">" };
const decode = (s) => s.replace(/&(amp|quot|#39|lt|gt);/g, (m) => ENT[m]);
const attrs = (tag) => Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*("([^"]*)"|'([^']*)')/g)].map((m) => [m[1].toLowerCase(), decode(m[3] ?? m[4] ?? "")]));
const text = (html) => decode(html.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();

// Every <a href> in a document: href (absolute), anchor text, rel flags.
export function extractLinks(html, base) {
  const out = [];
  for (const m of html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
    const a = attrs(m[1]);
    if (!a.href || /^(#|javascript:|mailto:|tel:|data:)/i.test(a.href)) continue;
    let href;
    try {
      href = new URL(a.href, base).href;
    } catch {
      continue;
    }
    const rel = (a.rel ?? "").toLowerCase().split(/\s+/);
    const img = /<img\b[^>]*alt=["']([^"']*)/i.exec(m[2]);
    out.push({ href, anchor: text(m[2]) || (img ? `[image: ${img[1]}]` : ""), nofollow: rel.includes("nofollow"), sponsored: rel.includes("sponsored"), ugc: rel.includes("ugc"), noopener: rel.includes("noopener") || rel.includes("noreferrer"), blank: a.target === "_blank" });
  }
  return out;
}

// ---- links on a page -----------------------------------------------------------------

export async function auditPageLinks(pageUrl, html, { check = true, limit = 150, allowLocal = false } = {}) {
  const base = new URL(pageUrl);
  const links = extractLinks(html, base);
  const unique = [...new Map(links.map((l) => [l.href.split("#")[0], l])).values()];
  const findings = [];
  for (const l of links) {
    const external = new URL(l.href).host !== base.host;
    if (external && l.blank && !l.noopener) findings.push({ level: "warn", href: l.href, problem: 'target="_blank" without rel="noopener" (add noopener noreferrer)' });
    if (!l.anchor) findings.push({ level: "warn", href: l.href, problem: "empty anchor text (bad for accessibility and SEO)" });
    if (/^(click here|here|read more|link|more)$/i.test(l.anchor)) findings.push({ level: "info", href: l.href, problem: `generic anchor text "${l.anchor}"` });
    if (l.href.startsWith("http://") && base.protocol === "https:") findings.push({ level: "warn", href: l.href, problem: "insecure http link on an https page" });
  }
  let checked = [];
  if (check) {
    const targets = unique.filter((l) => publicUrl(l.href, { allowLocal })).slice(0, limit);
    checked = await pool(targets, 8, async (l) => {
      try {
        let r = await fetchPage(l.href, { method: "HEAD", timeout: 10000, allowLocal });
        if (r.status === 405 || r.status === 403 || r.status === 501) r = await fetchPage(l.href, { method: "GET", timeout: 10000, maxBytes: 1, allowLocal });
        return { href: l.href, status: r.status, hops: r.chain.length - 1, finalUrl: r.finalUrl };
      } catch (e) {
        return { href: l.href, status: 0, error: e.name === "TimeoutError" ? "timeout" : e.message };
      }
    });
    for (const c of checked) {
      if (c.status === 0) findings.push({ level: "error", href: c.href, problem: `unreachable (${c.error})` });
      else if (c.status >= 400) findings.push({ level: "error", href: c.href, problem: `HTTP ${c.status}` });
      else if (c.hops >= 2) findings.push({ level: "warn", href: c.href, problem: `redirect chain of ${c.hops} hops, ends at ${c.finalUrl}` });
      else if (c.hops === 1 && new URL(c.href).host === base.host) findings.push({ level: "info", href: c.href, problem: `internal link redirects to ${c.finalUrl}; link to the final URL` });
    }
  }
  const rank = { error: 0, warn: 1, info: 2 };
  findings.sort((a, b) => rank[a.level] - rank[b.level]);
  return { page: pageUrl, total: links.length, unique: unique.length, internal: links.filter((l) => new URL(l.href).host === base.host).length, nofollow: links.filter((l) => l.nofollow).length, checked: checked.length, truncated: check && unique.length > limit, findings };
}

// ---- backlinks ----------------------------------------------------------------------------

// Minimal RFC 4180 parser: quotes, escaped quotes, CRLF.
export function parseCsv(src) {
  const rows = [];
  let row = [], cell = "", q = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (q) {
      if (c === '"' && src[i + 1] === '"') (cell += '"', i++);
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === "," || c === "\t" || c === ";") (row.push(cell), (cell = ""));
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      if (row.some((x) => x.trim())) rows.push(row);
      row = [];
    } else cell += c;
  }
  row.push(cell);
  if (row.some((x) => x.trim())) rows.push(row);
  return rows;
}

const pick = (header, names) => header.findIndex((h) => names.some((n) => h.toLowerCase().replace(/[^a-z]/g, "") === n));
// Reads an export into [{ source, target?, anchor?, nofollow? }]. A file with no header is a plain URL list.
export function parseBacklinks(src) {
  const rows = parseCsv(src);
  if (!rows.length) return [];
  const header = rows[0];
  const hasHeader = !/^https?:\/\//i.test(header[0].trim()) && header.length > 0 && !/^[\w.-]+\.[a-z]{2,}(\/|$)/i.test(header[0].trim());
  if (!hasHeader) return rows.map((r) => ({ source: r[0].trim() })).filter((r) => r.source);
  const iSrc = pick(header, ["sourceurl", "linkingpage", "referringpageurl", "referringpage", "urlfrom", "from", "toplinkingpages", "source", "linkingurl", "referringurl", "toplinkingsites", "linkingdomain", "referringdomain", "domain", "sourcepage"]);
  const iTgt = pick(header, ["targeturl", "urlto", "to", "target", "targetpage", "linkedpage"]);
  const iAnc = pick(header, ["anchor", "anchortext", "linkanchor", "text"]);
  const iNf = pick(header, ["nofollow", "isnofollow"]);
  const iType = pick(header, ["type", "linktype", "rel"]);
  const iDf = pick(header, ["dofollow", "isdofollow", "follow"]);
  if (iSrc < 0) throw new Error(`Cannot find a source URL column in: ${header.join(" | ")}`);
  const truthy = (v) => /^(true|yes|1|nofollow)$/i.test((v ?? "").trim());
  return rows.slice(1).map((r) => ({
    source: (r[iSrc] ?? "").trim(),
    target: iTgt >= 0 ? (r[iTgt] ?? "").trim() : undefined,
    anchor: iAnc >= 0 ? (r[iAnc] ?? "").trim() : undefined,
    nofollow: iNf >= 0 ? truthy(r[iNf]) : iDf >= 0 ? !truthy(r[iDf]) : iType >= 0 ? /nofollow|ugc|sponsored/i.test(r[iType] ?? "") : undefined,
  })).filter((r) => r.source);
}

const host = (u) => {
  try {
    return new URL(/^https?:\/\//i.test(u) ? u : `https://${u}`).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
};
const SPAMMY_TLD = /\.(xyz|top|click|loan|win|bid|work|gq|ml|cf|tk|ga|icu|buzz|cyou|rest|monster)$/;
const SPAMMY_WORDS = /(casino|poker|viagra|porn|escort|payday|replica|seo-?links?|backlink|link-?farm|directory-?submit)/i;

export function analyseBacklinks(rows, targetDomain) {
  const t = host(targetDomain);
  const byDomain = new Map();
  for (const r of rows) {
    const d = host(r.source);
    if (!d || d === t) continue;
    (byDomain.get(d) ?? byDomain.set(d, []).get(d)).push(r);
  }
  const anchors = { branded: 0, naked: 0, generic: 0, exact: 0, other: 0, empty: 0 };
  const brand = t.split(".")[0];
  for (const r of rows) {
    const a = (r.anchor ?? "").trim().toLowerCase();
    if (r.anchor === undefined) continue;
    if (!a) anchors.empty++;
    else if (/^(https?:\/\/|www\.)/.test(a) || a.includes(t)) anchors.naked++;
    else if (a.includes(brand)) anchors.branded++;
    else if (/^(click here|here|read more|website|link|this|source|visit|more|this site|check it out)$/.test(a)) anchors.generic++;
    else if (a.split(/\s+/).length <= 4) anchors.exact++;
    else anchors.other++;
  }
  const tlds = {};
  const domains = [...byDomain.entries()].map(([d, list]) => {
    const tld = d.split(".").slice(-1)[0];
    tlds[tld] = (tlds[tld] ?? 0) + 1;
    const risk = [];
    if (SPAMMY_TLD.test(d)) risk.push("low-trust TLD");
    if (SPAMMY_WORDS.test(d)) risk.push("spam-like domain name");
    if (list.length >= 50) risk.push(`${list.length} links from one domain (site-wide/footer?)`);
    return { domain: d, links: list.length, nofollow: list.filter((x) => x.nofollow).length, risk };
  }).sort((a, b) => b.links - a.links);
  const known = rows.filter((r) => r.nofollow !== undefined);
  return {
    target: t, rows: rows.length, referringDomains: domains.length,
    nofollowShare: known.length ? +(known.filter((r) => r.nofollow).length / known.length).toFixed(2) : null,
    tlds: Object.fromEntries(Object.entries(tlds).sort((a, b) => b[1] - a[1]).slice(0, 8)),
    anchors, topDomains: domains.slice(0, 15), risky: domains.filter((d) => d.risk.length), concentration: domains.length ? +(domains[0].links / rows.length).toFixed(2) : 0,
  };
}

// Fetch each referring page and confirm it still links to the target; report rel flags and anchor text.
export async function verifyBacklinks(rows, targetDomain, { limit = 100, allowLocal = false } = {}) {
  const t = host(targetDomain);
  const sample = [...new Map(rows.filter((r) => publicUrl(/^https?:/i.test(r.source) ? r.source : `https://${r.source}`, { allowLocal })).map((r) => [r.source, r])).values()].slice(0, limit);
  const results = await pool(sample, 5, async (r) => {
    const src = /^https?:/i.test(r.source) ? r.source : `https://${r.source}`;
    try {
      const res = await fetchPage(src, { allowLocal });
      if (res.status >= 400) return { source: src, ok: false, problem: `HTTP ${res.status}` };
      const mine = extractLinks(res.text, res.finalUrl).filter((l) => host(l.href) === t);
      const noindex = /<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(res.text);
      if (!mine.length) return { source: src, ok: false, problem: "page no longer links to the target (link removed, or injected by JavaScript)" };
      const l = mine[0];
      return { source: src, ok: true, href: l.href, anchor: l.anchor, nofollow: l.nofollow, sponsored: l.sponsored, ugc: l.ugc, noindexPage: noindex };
    } catch (e) {
      return { source: src, ok: false, problem: e.name === "TimeoutError" ? "timeout" : e.message };
    }
  });
  return { checked: results.length, truncated: rows.length > sample.length, alive: results.filter((r) => r.ok).length, results };
}
