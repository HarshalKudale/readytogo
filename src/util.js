import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

// any: at least one tag present · all: every tag present · none: no tag present. All parts must hold.
export const applies = (e, tags) =>
  !e || ((!e.any || e.any.some((t) => tags.has(t))) && (!e.all || e.all.every((t) => tags.has(t))) && (!e.none || !e.none.some((t) => tags.has(t))));

export const data = (name) => JSON.parse(readFileSync(new URL(`../data/${name}.json`, import.meta.url), "utf8"));
export const readJson = (p, fallback) => {
  try {
    return JSON.parse(readFileSync(p, "utf8"));
  } catch {
    return fallback;
  }
};
export const readText = (p) => {
  try {
    return readFileSync(p, "utf8");
  } catch {
    return "";
  }
};

const SKIP = new Set(["node_modules", ".git", "dist", "build", ".next", ".nuxt", ".output", "target", "Pods", ".gradle", ".readytogo", ".venv", "venv", "__pycache__", ".svelte-kit", ".turbo", "coverage", "DerivedData", ".dart_tool", ".react-router", ".wrangler", ".idea", ".vscode"]);

// Project files as posix paths relative to root; skips dependency and build folders.
export function walk(root, { max = 8000, depth = 7 } = {}) {
  const out = [];
  const visit = (dir, rel, d) => {
    if (out.length >= max || d > depth) return;
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      if (e.isDirectory()) {
        if (!SKIP.has(e.name)) visit(join(dir, e.name), rel + e.name + "/", d + 1);
      } else out.push(rel + e.name);
    }
  };
  visit(root, "", 0);
  return out;
}

export const exists = (root, rel) => existsSync(join(root, rel));
export const num = (v) => (Number.isFinite(+v) ? +v : undefined);
