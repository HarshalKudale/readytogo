// Domain availability through RDAP, asking each TLD's own registry (found via the IANA bootstrap file).
// Read-only: it never registers anything. A 404 from a registry means "no registration record" (likely free, but
// premium/reserved names exist), so the answer is "likely-free": confirm at a registrar before relying on it.
export const DEFAULT_TLDS = ["com", "io", "app", "dev", "co", "ai", "net", "org"];
const BOOTSTRAP = "https://data.iana.org/rdap/dns.json";
const HEADERS = { accept: "application/rdap+json, application/json", "user-agent": "readytogo/0.1 (+https://github.com/HarshalKudale/readytogo)" };

export const cleanName = (s) => String(s).toLowerCase().replace(/^https?:\/\//, "").replace(/\..*$/, "").replace(/[^a-z0-9-]/g, "").replace(/^-+|-+$/g, "");

async function servers(fetchImpl, timeout, url) {
  const res = await fetchImpl(url, { signal: AbortSignal.timeout(timeout), headers: HEADERS });
  if (!res.ok) throw new Error(`RDAP bootstrap HTTP ${res.status}`);
  const map = new Map();
  for (const [tlds, urls] of (await res.json()).services) for (const t of tlds) map.set(t, urls.find((u) => u.startsWith("https")) ?? urls[0]);
  return map;
}

export async function checkDomains(names, tlds = DEFAULT_TLDS, { fetchImpl = fetch, timeout = 8000, bootstrap = BOOTSTRAP } = {}) {
  const jobs = [...new Set(names.map(cleanName).filter(Boolean))].flatMap((n) => tlds.map((t) => [`${n}.${t.replace(/^\./, "")}`, t.replace(/^\./, "")]));
  let map;
  try {
    map = await servers(fetchImpl, timeout, bootstrap);
  } catch (e) {
    return jobs.map(([domain]) => ({ domain, status: "unknown", detail: e.message }));
  }
  const results = [];
  for (let i = 0; i < jobs.length; i += 6) {
    results.push(...(await Promise.all(jobs.slice(i, i + 6).map(async ([domain, tld]) => {
      const base = map.get(tld);
      if (!base) return { domain, status: "unknown", detail: `.${tld} has no RDAP service; check a registrar` };
      try {
        const res = await fetchImpl(new URL(`domain/${domain}`, base.endsWith("/") ? base : base + "/").href, { signal: AbortSignal.timeout(timeout), headers: HEADERS });
        if (res.status === 404) return { domain, status: "likely-free" };
        if (res.ok) return { domain, status: "taken" };
        return { domain, status: "unknown", detail: `HTTP ${res.status}` };
      } catch (e) {
        return { domain, status: "unknown", detail: e.name === "TimeoutError" ? "timeout" : e.message };
      }
    }))));
  }
  return results;
}
