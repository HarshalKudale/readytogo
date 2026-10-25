// Guarded HTTP for the analysers that fetch live pages (seo, links, backlinks).
// shortcut: the guard checks the hostname and every redirect hop, but resolves no DNS, so a public name that
// points at a private address is not caught; run these tools on your own machine, not as a public service.

const PRIVATE_V4 = /^(10\.|127\.|0\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/;

export function publicUrl(raw, { allowLocal = false } = {}) {
  let u;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  if (u.username || u.password) return null;
  if (allowLocal) return u;
  const host = u.hostname.toLowerCase();
  if (host.startsWith("[") || /^[\d.]+$/.test(host) && PRIVATE_V4.test(host)) return null;
  if (!host.includes(".") || /(^|\.)(localhost|local|internal|lan|home|corp)$/.test(host)) return null;
  return u;
}

// GET (or HEAD) following up to `maxRedirects` hops, each hop re-checked. Body capped at maxBytes.
export async function fetchPage(raw, { method = "GET", timeout = 12000, maxBytes = 2_000_000, maxRedirects = 5, allowLocal = false } = {}) {
  let url = publicUrl(raw, { allowLocal });
  if (!url) throw new Error(`refusing to fetch "${raw}" (only public http(s) URLs; use --allow-local for localhost)`);
  const chain = [];
  for (let hop = 0; hop <= maxRedirects; hop++) {
    const res = await fetch(url, { method, redirect: "manual", signal: AbortSignal.timeout(timeout), headers: { "user-agent": "readytogo/0.1 (+https://github.com/HarshalKudale/readytogo)", accept: "text/html,*/*;q=0.8" } });
    chain.push({ url: url.href, status: res.status });
    const loc = res.headers.get("location");
    if (res.status >= 300 && res.status < 400 && loc) {
      const next = publicUrl(new URL(loc, url).href, { allowLocal });
      if (!next) throw new Error(`redirect to a non-public address from ${url.href}`);
      url = next;
      continue;
    }
    let text = "";
    if (method === "GET") {
      const buf = Buffer.from(await res.arrayBuffer());
      text = buf.subarray(0, maxBytes).toString("utf8");
    } else await res.body?.cancel();
    return { status: res.status, finalUrl: url.href, chain, headers: Object.fromEntries(res.headers), text };
  }
  throw new Error(`too many redirects from ${raw}`);
}

// Run `fn` over items with at most `n` in flight.
export async function pool(items, n, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    while (i < items.length) {
      const k = i++;
      out[k] = await fn(items[k], k);
    }
  }));
  return out;
}
