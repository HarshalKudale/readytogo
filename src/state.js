// Profile (what the product is) and state (what's done) live in .readytogo/ so they travel with the repo.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { readJson } from "./util.js";

const dir = (root) => join(root, ".readytogo");
const file = (root, name) => join(dir(root), name);

export function load(root) {
  return {
    profile: readJson(file(root, "profile.json"), { tags: [], product: {}, confirmed: false }),
    state: readJson(file(root, "state.json"), { items: {} }),
    checks: readJson(file(root, "checks.json"), { results: {} }),
  };
}

export function save(root, name, value) {
  mkdirSync(dir(root), { recursive: true });
  writeFileSync(file(root, name), JSON.stringify(value, null, 2) + "\n");
}
