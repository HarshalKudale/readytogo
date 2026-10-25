// External tools (tree-sitter + grammars, Playwright + Chromium) are never bundled: `readytogo setup` downloads the
// current versions into a per-user folder, so they cannot go stale inside the skill. `setup --update` refreshes them.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";

export const TOOLS_DIR = process.env.READYTOGO_HOME ? join(process.env.READYTOGO_HOME, "tools") : join(homedir(), ".readytogo", "tools");

// web-tree-sitter is pinned to the runtime generation the published grammars (tree-sitter-wasms) are built for;
// bump both together when tree-sitter-wasms moves to a newer ABI.
export const GROUPS = {
  deadcode: { what: "tree-sitter runtime + language grammars (for `deadcode`)", packages: () => ["web-tree-sitter@0.22.6", "tree-sitter-wasms@latest"], sizeMB: 55 },
  render: { what: "Playwright + Chromium (for `render`, screenshots, 3D and frame mockups)", packages: () => ["playwright@latest"], browser: true, sizeMB: 250 },
};

export function resolveFrom(name, bases = []) {
  for (const base of [join(TOOLS_DIR, "noop.js"), ...bases.map((b) => join(b, "noop.js")), import.meta.url]) {
    try {
      return createRequire(base).resolve(name);
    } catch {
      // try the next place
    }
  }
  return null;
}
export const packageDir = (name, bases) => {
  const main = resolveFrom(`${name}/package.json`, bases);
  return main && dirname(main);
};
export const installedVersion = (name, bases) => {
  const p = resolveFrom(`${name}/package.json`, bases);
  return p ? JSON.parse(readFileSync(p, "utf8")).version : null;
};
export async function importTool(name, bases) {
  const p = resolveFrom(name, bases);
  if (!p) return null;
  return import(pathToFileURL(p).href); // CJS packages expose their API on .default
}

// Runs npm without a shell when its CLI script can be found (avoids shell-escaping pitfalls on Windows).
function npmCli() {
  const here = dirname(process.execPath);
  for (const p of [process.env.npm_execpath, join(here, "node_modules", "npm", "bin", "npm-cli.js"), join(here, "..", "lib", "node_modules", "npm", "bin", "npm-cli.js")]) if (p && /npm-cli.js$/.test(p) && existsSync(p)) return p;
  return null;
}
const run = (cmd, args) => {
  if (cmd === "npm") {
    const cli = npmCli();
    return cli ? spawnSync(process.execPath, [cli, ...args], { stdio: "inherit" }) : spawnSync("npm", args, { stdio: "inherit", shell: process.platform === "win32" });
  }
  return spawnSync(cmd, args, { stdio: "inherit" });
};

export function status(bases = []) {
  return {
    dir: TOOLS_DIR,
    deadcode: { "web-tree-sitter": installedVersion("web-tree-sitter", bases), "tree-sitter-wasms": installedVersion("tree-sitter-wasms", bases) },
    render: { playwright: installedVersion("playwright", bases) },
    ffmpeg: !spawnSync("ffmpeg", ["-version"], { stdio: "ignore" }).error,
  };
}

// Installs a group into TOOLS_DIR with npm. Returns after printing what it did.
export function setup(group) {
  const g = GROUPS[group];
  if (!g) throw new Error(`Unknown tool group "${group}". Available: ${Object.keys(GROUPS).join(", ")}`);
  mkdirSync(TOOLS_DIR, { recursive: true });
  const pkg = join(TOOLS_DIR, "package.json");
  if (!existsSync(pkg)) writeFileSync(pkg, JSON.stringify({ name: "readytogo-tools", private: true }, null, 2));
  console.log(`Installing ${g.what} into ${TOOLS_DIR} (about ${g.sizeMB} MB)…`);
  const r = run("npm", ["install", "--prefix", TOOLS_DIR, "--no-audit", "--no-fund", "--loglevel=error", ...g.packages()]);
  if (r.status !== 0) throw new Error(`npm install failed (exit ${r.status}). Check your network and retry \`readytogo setup ${group}\`.`);
  if (g.browser) {
    const cli = join(TOOLS_DIR, "node_modules", "playwright", "cli.js");
    const b = run(process.execPath, [cli, "install", "chromium"]);
    if (b.status !== 0) throw new Error("Chromium download failed. Retry, or run `npx playwright install chromium` yourself.");
  }
}
