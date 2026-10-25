// Safety net for changes the agent makes: all work happens on a branch, the base state is recorded, nothing is pushed.
import { spawnSync } from "node:child_process";
import { readJson } from "./util.js";
import { save } from "./state.js";

const git = (root, args) => {
  const r = spawnSync("git", ["-C", root, ...args], { encoding: "utf8" });
  if (r.error) throw new Error("git not found. Install git so changes can be made on a safe branch.");
  return r;
};
const out = (root, args) => {
  const r = git(root, args);
  return r.status === 0 ? r.stdout.trim() : null;
};

export const isRepo = (root) => out(root, ["rev-parse", "--is-inside-work-tree"]) === "true";
export const head = (root) => out(root, ["rev-parse", "HEAD"]);
export const currentBranch = (root) => out(root, ["rev-parse", "--abbrev-ref", "HEAD"]);

// Uncommitted files, ignoring ReadyToGo's own state folder.
export const dirty = (root) =>
  (out(root, ["status", "--porcelain", "--", ".", ":(exclude).readytogo"]) ?? "").split("\n").filter(Boolean);

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// Creates readytogo/<scope>-<date> from the current commit. Refuses when there are uncommitted changes unless allowDirty
// (they then travel with you onto the branch). Records the base so `diff` can show exactly what the agent changed.
export function startBranch(root, { scope = "all", name, allowDirty = false } = {}) {
  if (!isRepo(root)) throw new Error("Not a git repository, so there is no safe way to undo changes. Ask the user to run `git init` and commit first.");
  const state = readJson(`${root}/.readytogo/branch.json`, null);
  const cur = currentBranch(root);
  if (cur?.startsWith("readytogo/")) return { branch: cur, base: state?.base ?? null, created: false };
  const changed = dirty(root);
  if (changed.length && !allowDirty) {
    throw new Error(`Uncommitted changes (${changed.length} files, e.g. ${changed.slice(0, 3).map((l) => l.slice(3)).join(", ")}). Ask the user to commit or stash them first, or pass --allow-dirty to carry them onto the new branch.`);
  }
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const base = name ?? `readytogo/${slug(scope)}-${date}`;
  let branch = base;
  for (let n = 2; out(root, ["rev-parse", "--verify", "--quiet", branch]); n++) branch = `${base}-${n}`;
  const r = git(root, ["checkout", "-b", branch]);
  if (r.status !== 0) throw new Error(`git checkout -b failed: ${r.stderr.trim()}`);
  const info = { branch, base: { branch: cur, sha: head(root) }, at: new Date().toISOString(), carriedDirty: changed.length };
  save(root, "branch.json", info);
  return { ...info, created: true };
}

// Commits and files that changed since a recorded sha, plus anything not committed yet.
export function changesSince(root, sha) {
  if (!isRepo(root) || !sha) return null;
  const stat = out(root, ["diff", "--stat", "--no-color", sha, "--", ".", ":(exclude).readytogo"]) ?? "";
  const commits = (out(root, ["log", "--oneline", `${sha}..HEAD`]) ?? "").split("\n").filter(Boolean);
  return { commits, stat, uncommitted: dirty(root).length };
}

export const branchInfo = (root) => readJson(`${root}/.readytogo/branch.json`, null);
