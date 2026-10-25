// "Before" snapshot per area, taken the first time an area is analysed, so the work an agent does can be compared later.
import { readJson } from "./util.js";
import { itemsOf } from "./areas.js";
import { head, currentBranch, isRepo } from "./git.js";
import { isClosed } from "./plan.js";
import { save } from "./state.js";

const CLOSED = ["done", "verified", "skipped", "na"];
const file = (root) => `${root}/.readytogo/baseline.json`;
export const loadBaseline = (root) => readJson(file(root), { areas: {} });

// Records every selected area that has no baseline yet (all of them with force). Returns the slugs it wrote.
export function recordBaseline(root, plan, selected, { force = false } = {}) {
  const b = loadBaseline(root);
  const all = itemsOf(plan);
  const wrote = [];
  for (const a of selected) {
    if (b.areas[a.slug] && !force) continue;
    b.areas[a.slug] = {
      at: new Date().toISOString(),
      sha: isRepo(root) ? head(root) : null,
      branch: isRepo(root) ? currentBranch(root) : null,
      items: Object.fromEntries(all.filter((i) => i.area === a.slug).map((i) => [i.id, i.status])),
    };
    wrote.push(a.slug);
  }
  if (wrote.length) save(root, "baseline.json", b);
  return wrote;
}

// Per area: how many items were closed before and now, and every item whose status moved.
export function compare(root, plan, selected) {
  const b = loadBaseline(root);
  const now = itemsOf(plan);
  return selected.map((a) => {
    const before = b.areas[a.slug];
    const cur = now.filter((i) => i.area === a.slug);
    if (!before) return { area: a.slug, baseline: null, total: cur.length, closedNow: cur.filter(isClosed).length, changes: [], regressions: [] };
    const ids = Object.keys(before.items);
    const closedBefore = ids.filter((id) => CLOSED.includes(before.items[id])).length;
    const changes = [], regressions = [];
    for (const i of cur) {
      const was = before.items[i.id] ?? "new";
      if (was === i.status) continue;
      const row = { id: i.id, title: i.title, from: was, to: i.status };
      (CLOSED.includes(was) && !isClosed(i) ? regressions : changes).push(row);
    }
    return { area: a.slug, baseline: { at: before.at, sha: before.sha, branch: before.branch, total: ids.length, closed: closedBefore }, total: cur.length, closedNow: cur.filter(isClosed).length, changes, regressions };
  });
}
