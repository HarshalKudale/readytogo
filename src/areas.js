// Areas group checklists (seo, packaging, docs …). Every command that takes --area only loads and checks that slice,
// so an agent working on SEO never pays for packaging or documentation.
import { data } from "./util.js";

export const areas = () => data("areas");

// "seo,docs" -> those areas; undefined or "all" -> every area. Unknown names are an error that lists the valid ones.
export function pickAreas(arg) {
  const all = areas();
  if (!arg || arg === "all") return all;
  const want = String(arg).split(",").map((s) => s.trim()).filter(Boolean);
  const bad = want.filter((w) => !all.some((a) => a.slug === w));
  if (bad.length) throw new Error(`Unknown area(s): ${bad.join(", ")}. Areas: ${all.map((a) => a.slug).join(", ")}.`);
  return all.filter((a) => want.includes(a.slug));
}

// A plan reduced to the selected areas; each checklist is tagged with its area.
export function scopePlan(plan, selected) {
  const owner = new Map(selected.flatMap((a) => a.checklists.map((c) => [c, a.slug])));
  return { ...plan, checklists: plan.checklists.filter((c) => owner.has(c.slug)).map((c) => ({ ...c, area: owner.get(c.slug) })) };
}

export const itemsOf = (plan) => plan.checklists.flatMap((c) => c.items.map((i) => ({ ...i, area: c.area, checklist: c.slug })));
