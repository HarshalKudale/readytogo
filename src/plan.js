import { applies, data } from "./util.js";

// An item's status: a manual mark wins; else an automatic check result; else preTickIf; else open.
export function buildPlan(tagList, { state, checks } = {}) {
  const { checklists, items, phases, version } = data("catalog");
  const tags = new Set(tagList);
  const status = (item) => {
    const mark = state?.items?.[item.id];
    if (mark) return { status: mark.status, note: mark.note };
    const r = checks?.results?.[item.id];
    if (r && r.pass === true) return { status: "verified", note: r.detail };
    if (r && r.pass === false) return { status: "failing", note: r.detail };
    if (item.preTickIf && tags.has(item.preTickIf)) return { status: "verified", note: `profile has ${item.preTickIf}` };
    return { status: "open" };
  };
  const out = [];
  for (const c of checklists) {
    if (!applies(c.appliesTo, tags)) continue;
    const list = items
      .filter((i) => i.checklist === c.slug && applies(i.appliesTo, tags))
      .sort((a, b) => a.order - b.order)
      .map((i) => ({ ...i, steps: i.steps.filter((s) => typeof s === "string" || applies(s.appliesTo, tags)).map((s) => (typeof s === "string" ? s : s.text)), ...status(i) }));
    if (list.length) out.push({ ...c, items: list });
  }
  const order = (p) => phases.findIndex((x) => x.id === p);
  out.sort((a, b) => order(a.phase) - order(b.phase) || a.order - b.order);
  return { version, checklists: out };
}

const DONE = new Set(["done", "verified", "skipped", "na"]);
export const isClosed = (i) => DONE.has(i.status);

export function summarize(plan) {
  const all = plan.checklists.flatMap((c) => c.items);
  const open = all.filter((i) => !isClosed(i));
  return {
    total: all.length,
    closed: all.length - open.length,
    openBlockers: open.filter((i) => i.priority === "blocker"),
    open,
  };
}
