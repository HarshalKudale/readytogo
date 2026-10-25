// Reads the SEO-relevant parts of an HTML document with regexes (ported from the web app).
// shortcut: regex parsing handles real-world <head> markup, not malformed HTML; swap for a DOM parser if that bites.
const ENTITIES = { "&amp;": "&", "&quot;": '"', "&#39;": "'", "&lt;": "<", "&gt;": ">" };
const decode = (s) => s.replace(/&(amp|quot|#39|lt|gt);/g, (m) => ENTITIES[m]).trim();

function attrs(tag) {
  const out = {};
  for (const m of tag.matchAll(/([\w:-]+)\s*=\s*("([^"]*)"|'([^']*)')/g)) out[m[1].toLowerCase()] = decode(m[3] ?? m[4] ?? "");
  return out;
}

export function parsePage(html) {
  const meta = {};
  for (const m of html.matchAll(/<meta\b[^>]*>/gi)) {
    const a = attrs(m[0]);
    const key = (a.property ?? a.name ?? "").toLowerCase();
    if (key && a.content !== undefined && !(key in meta)) meta[key] = a.content;
  }
  const withPrefix = (p) => Object.fromEntries(Object.entries(meta).filter(([k]) => k.startsWith(p)).map(([k, v]) => [k.slice(p.length), v]));
  const links = [...html.matchAll(/<link\b[^>]*>/gi)].map((m) => attrs(m[0]));
  const imgs = [...html.matchAll(/<img\b[^>]*>/gi)].map((m) => attrs(m[0]));
  const body = html.replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, " ").replace(/<head\b[\s\S]*?<\/head>/i, " ");
  const text = decode(body.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ");
  return {
    title: decode(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? ""),
    description: meta.description ?? "",
    canonical: links.find((l) => l.rel?.toLowerCase() === "canonical")?.href ?? "",
    robots: meta.robots ?? "",
    viewport: "viewport" in meta,
    lang: attrs(html.match(/<html\b[^>]*>/i)?.[0] ?? "").lang ?? "",
    favicon: links.some((l) => /\bicon\b/i.test(l.rel ?? "")),
    h1: [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) => decode(m[1].replace(/<[^>]+>/g, ""))),
    og: withPrefix("og:"),
    twitter: withPrefix("twitter:"),
    jsonLd: (html.match(/<script\b[^>]*application\/ld\+json/gi) ?? []).length,
    images: imgs.length,
    imagesNoAlt: imgs.filter((i) => !i.alt?.trim()).length,
    words: text ? text.split(" ").length : 0,
  };
}

export function scorePage(p) {
  const t = p.title.length, d = p.description.length;
  const c = (id, label, pass, weight, tip) => ({ id, label, pass, weight, tip });
  const checks = [
    c("title", "Title is 30–60 characters", t >= 30 && t <= 60, 12, t ? `Title is ${t} characters. Aim for 30–60 so it is not cut off.` : "Add a <title> that says what the page is."),
    c("description", "Description is 70–160 characters", d >= 70 && d <= 160, 12, d ? `Description is ${d} characters. Aim for 70–160.` : 'Add <meta name="description">.'),
    c("h1", "Exactly one <h1>", p.h1.length === 1, 10, p.h1.length ? `Found ${p.h1.length} <h1> headings. Use one.` : "Add one <h1> that matches the page's topic."),
    c("canonical", "Canonical URL set", Boolean(p.canonical), 8, 'Add <link rel="canonical"> so duplicate URLs consolidate.'),
    c("indexable", "Not blocked by robots", !/noindex/i.test(p.robots), 14, "robots contains noindex: search engines will drop this page."),
    c("viewport", "Mobile viewport set", p.viewport, 8, 'Add <meta name="viewport" content="width=device-width, initial-scale=1">.'),
    c("lang", "Language declared", Boolean(p.lang), 4, "Add lang to <html>."),
    c("og", "Open Graph title, description and image", Boolean(p.og.title && p.og.description && p.og.image), 10, "Add og:title, og:description and og:image for link previews."),
    c("twitter", "Twitter card type set", Boolean(p.twitter.card), 4, "Add twitter:card = summary_large_image."),
    c("alt", "Images have alt text", p.imagesNoAlt === 0, 6, `${p.imagesNoAlt} of ${p.images} images have no alt text.`),
    c("schema", "Structured data (JSON-LD)", p.jsonLd > 0, 6, "Add JSON-LD (SoftwareApplication, Organization or FAQ) to qualify for rich results."),
    c("favicon", "Favicon linked", p.favicon, 3, 'Add <link rel="icon">.'),
    c("content", "At least 300 words of body text", p.words >= 300, 3, `${p.words} words found. Thin pages rank poorly; use the full page HTML, not a snippet.`),
  ];
  const total = checks.reduce((n, x) => n + x.weight, 0);
  return { score: Math.round((checks.filter((x) => x.pass).reduce((n, x) => n + x.weight, 0) / total) * 100), checks };
}
