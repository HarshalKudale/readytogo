// Finds loose, unused code with tree-sitter: unused imports, unused local variables, unreachable statements,
// private declarations nothing references, exported symbols nothing imports, and (JS/TS) files nothing imports.
// It is name-based and conservative (a name that appears anywhere counts as used), so expect few false alarms but
// check anything marked "low" before deleting: dynamic access, reflection, and framework conventions are invisible to it.
// Grammars and the runtime come from `readytogo setup deadcode`; nothing is bundled so they stay current.
import { readFileSync, statSync } from "node:fs";
import { dirname, extname, join, relative, resolve } from "node:path";
import { importTool, resolveFrom } from "./tools.js";
import { readJson, walk } from "./util.js";

// ext -> [grammar, family]. "js" and "py" get import/local/unreachable analysis; "generic" gets unreferenced private declarations.
const LANG = {
  ".js": ["javascript", "js"], ".mjs": ["javascript", "js"], ".cjs": ["javascript", "js"], ".jsx": ["javascript", "js"],
  ".ts": ["typescript", "js"], ".mts": ["typescript", "js"], ".cts": ["typescript", "js"], ".tsx": ["tsx", "js"],
  ".py": ["python", "py"], ".go": ["go", "generic"], ".rs": ["rust", "generic"], ".java": ["java", "generic"], ".kt": ["kotlin", "generic"],
  ".swift": ["swift", "generic"], ".cs": ["c_sharp", "generic"], ".rb": ["ruby", "generic"], ".php": ["php", "generic"], ".dart": ["dart", "generic"],
};
const IDENT = new Set(["identifier", "type_identifier", "property_identifier", "shorthand_property_identifier", "shorthand_property_identifier_pattern", "field_identifier", "simple_identifier", "constant"]);
const TERMINATORS = new Set(["return_statement", "throw_statement", "break_statement", "continue_statement", "raise_statement"]);
const FN = new Set(["function_declaration", "generator_function_declaration", "function_expression", "function", "arrow_function", "method_definition", "function_definition", "generator_function"]);
const GENERIC_DECL = /^(function_declaration|function_definition|function_item|method_declaration|func_declaration|class_declaration|class_definition|struct_item|enum_item|trait_item|type_declaration|interface_declaration|enum_declaration|const_item|static_item|constructor_declaration)$/;
const ENTRY_NAME = /^(main|init|new|default|setUp|tearDown|setup|teardown|constructor|toString|__\w+__|test_?\w*|Test\w*|Benchmark\w*|Example\w*|Fuzz\w*)$/;
const ENTRY_FILE = /(^|\/)(index|main|app|root|entry|server|worker|cli|setup|bin|routes?|pages?|api|functions|scripts|migrations|e2e|tests?|__tests__|stories|mocks?|fixtures?|public|static|\.storybook|\+(page|layout|server))(\/|\.|$)|\.(config|test|spec|stories|d)\.[cm]?[jt]sx?$|(^|\/)(page|layout|route|loading|error|not-found|middleware|instrumentation|template|default)\.[jt]sx?$/;
const TEST_FILE = /(^|\/)(__tests__|tests?|spec|e2e)(\/)|\.(test|spec)\.[cm]?[jt]sx?$|(^|\/)test_[^/]*\.py$|_test\.(go|py)$/;

const nodes = function* (root) {
  const stack = [root];
  while (stack.length) {
    const n = stack.pop();
    yield n;
    for (let i = n.children.length - 1; i >= 0; i--) stack.push(n.children[i]);
  }
};
const nameOf = (n) => n.childForFieldName("name")?.text;
const line = (n) => n.startPosition.row + 1;

export async function loadParser(grammar) {
  const mod = await importTool("web-tree-sitter");
  if (!mod) throw new Error("tree-sitter is not set up. Run: readytogo setup deadcode");
  const Parser = mod.default ?? mod;
  await Parser.init();
  const wasm = resolveFrom(`tree-sitter-wasms/out/tree-sitter-${grammar}.wasm`);
  if (!wasm) throw new Error(`No grammar for "${grammar}". Run: readytogo setup deadcode   (installs tree-sitter-wasms)`);
  const p = new Parser();
  p.setLanguage(await Parser.Language.load(wasm));
  return p;
}

// ---- per-file extraction ------------------------------------------------------------------------------------

function analyseJs(root, rel) {
  const f = { idents: new Map(), strings: new Set(), decls: [], imports: [], exportedLocals: new Map(), reexports: [], deps: [], unreachable: [], locals: [], hasJsx: false, exportAll: false };
  const bump = (m, k) => m.set(k, (m.get(k) ?? 0) + 1);
  const importNodes = new Set();
  const top = root.namedChildren;

  for (const n of top) {
    let d = n, exported = false;
    if (n.type === "export_statement") {
      exported = true;
      const src = n.childForFieldName("source");
      if (src) { f.deps.push(src.text.slice(1, -1)); if (n.children.some((c) => c.type === "*")) f.exportAll = true; }
      const clause = n.namedChildren.find((c) => c.type === "export_clause");
      for (const s of clause?.namedChildren ?? []) {
        const local = s.childForFieldName("name")?.text, as = s.childForFieldName("alias")?.text ?? local;
        if (!src && local) f.exportedLocals.set(local, as);
        if (src) f.reexports.push(as);
      }
      d = n.childForFieldName("declaration");
      const val = n.childForFieldName("value");
      if (val?.type === "identifier") f.exportedLocals.set(val.text, "default");
      if (!d) continue;
    }
    const add = (name, kind, node) => name && f.decls.push({ name, kind, line: line(node), exported, file: rel });
    if (/^(function|generator_function|class|abstract_class|interface|type_alias|enum)_declaration$/.test(d.type)) add(nameOf(d), d.type.replace("_declaration", ""), d);
    else if (d.type === "lexical_declaration" || d.type === "variable_declaration") {
      for (const v of d.namedChildren.filter((c) => c.type === "variable_declarator")) {
        const nm = v.childForFieldName("name");
        if (nm?.type === "identifier") add(nm.text, /function|arrow/.test(v.childForFieldName("value")?.type ?? "") ? "function" : "constant", v);
      }
    } else if (n.type === "expression_statement") { // CommonJS: module.exports = { a, b } / exports.a = ...
      const e = n.namedChildren[0];
      if (e?.type === "assignment_expression") {
        const left = e.childForFieldName("left")?.text ?? "";
        if (/^(module\.)?exports(\.|$)/.test(left)) {
          for (const c of nodes(e.childForFieldName("right"))) if (c.type === "identifier" || c.type === "shorthand_property_identifier") f.exportedLocals.set(c.text, c.text);
          const m = /^(?:module\.)?exports\.(\w+)/.exec(left);
          if (m) f.exportedLocals.set(m[1], m[1]);
        }
      }
    }
  }

  for (const n of nodes(root)) {
    if (IDENT.has(n.type)) bump(f.idents, n.text);
    else if (n.type === "string_fragment" && n.text.length <= 60) f.strings.add(n.text);
    else if (n.type === "jsx_opening_element" || n.type === "jsx_self_closing_element") f.hasJsx = true;
    else if (n.type === "import_statement") {
      importNodes.add(n.id);
      const src = n.childForFieldName("source")?.text.slice(1, -1);
      if (src) f.deps.push(src);
      const clause = n.namedChildren.find((c) => c.type === "import_clause");
      const names = [];
      for (const c of clause?.namedChildren ?? []) {
        if (c.type === "identifier") names.push(c.text);
        else if (c.type === "namespace_import") names.push(c.namedChildren.find((x) => x.type === "identifier")?.text);
        else if (c.type === "named_imports") for (const s of c.namedChildren) names.push(s.childForFieldName("alias")?.text ?? s.childForFieldName("name")?.text);
      }
      if (names.length) f.imports.push({ names: names.filter(Boolean), source: src, line: line(n), id: n.id, range: [n.startIndex, n.endIndex] });
    } else if (n.type === "call_expression") {
      const fn = n.childForFieldName("function")?.text, arg = n.childForFieldName("arguments")?.namedChildren[0];
      if ((fn === "require" || fn === "import") && arg?.type === "string") f.deps.push(arg.text.slice(1, -1));
    } else if (n.type === "statement_block") {
      const kids = n.namedChildren;
      const i = kids.findIndex((k) => TERMINATORS.has(k.type));
      const after = i >= 0 ? kids.slice(i + 1).find((k) => !/^(comment|function_declaration|lexical_declaration|variable_declaration|class_declaration|empty_statement)$/.test(k.type) || (k.type === "lexical_declaration" && /=/.test(k.text))) : null;
      if (after) f.unreachable.push({ line: line(after), after: kids[i].type.replace("_statement", "") });
    }
    if (FN.has(n.type)) {
      const body = n.childForFieldName("body");
      if (!body || body.type !== "statement_block") continue;
      const counts = new Map();
      for (const c of nodes(n)) if (IDENT.has(c.type)) bump(counts, c.text);
      for (const c of nodes(body)) {
        if (c.type !== "variable_declarator") continue;
        const nm = c.childForFieldName("name");
        const ids = nm?.type === "identifier" ? [nm] : nm?.type === "object_pattern" ? nm.namedChildren.filter((x) => x.type === "shorthand_property_identifier_pattern") : [];
        for (const id of ids) if (counts.get(id.text) === 1 && !id.text.startsWith("_")) f.locals.push({ name: id.text, line: line(id) });
      }
    }
  }
  f.importNodes = importNodes;
  return f;
}

function analysePy(root, rel) {
  const f = { idents: new Map(), strings: new Set(), decls: [], imports: [], exportedLocals: new Map(), deps: [], unreachable: [], locals: [], allNames: new Set() };
  const bump = (m, k) => m.set(k, (m.get(k) ?? 0) + 1);
  for (const n of root.namedChildren) {
    if (n.type === "function_definition" || n.type === "class_definition") f.decls.push({ name: nameOf(n), kind: n.type === "class_definition" ? "class" : "function", line: line(n), exported: !nameOf(n).startsWith("_"), file: rel });
    else if (n.type === "expression_statement") {
      const a = n.namedChildren[0];
      if (a?.type === "assignment") {
        const left = a.childForFieldName("left");
        if (left?.type === "identifier") {
          if (left.text === "__all__") for (const c of nodes(a.childForFieldName("right"))) if (c.type === "string_content") f.allNames.add(c.text);
          else f.decls.push({ name: left.text, kind: "constant", line: line(n), exported: !left.text.startsWith("_"), file: rel });
        }
      }
    }
  }
  for (const n of nodes(root)) {
    if (n.type === "identifier") bump(f.idents, n.text);
    else if (n.type === "string_content" && n.text.length <= 60) f.strings.add(n.text);
    else if (n.type === "import_statement" || n.type === "import_from_statement") {
      const names = [];
      if (n.type === "import_statement") for (const c of n.namedChildren) names.push(c.type === "aliased_import" ? c.childForFieldName("alias")?.text : c.text.split(".")[0]);
      else {
        const mod = n.childForFieldName("module_name")?.text;
        if (mod === "__future__") continue;
        f.deps.push(mod);
        for (const c of n.namedChildren) if (c.id !== n.childForFieldName("module_name")?.id) names.push(c.type === "aliased_import" ? c.childForFieldName("alias")?.text : c.type === "dotted_name" ? c.text : null);
      }
      f.imports.push({ names: names.filter(Boolean), line: line(n), range: [n.startIndex, n.endIndex] });
    } else if (n.type === "block") {
      const kids = n.namedChildren, i = kids.findIndex((k) => TERMINATORS.has(k.type));
      const after = i >= 0 ? kids.slice(i + 1).find((k) => k.type !== "comment") : null;
      if (after) f.unreachable.push({ line: line(after), after: kids[i].type.replace("_statement", "") });
    }
    if (n.type === "function_definition") {
      const counts = new Map();
      for (const c of nodes(n)) if (c.type === "identifier") bump(counts, c.text);
      for (const c of nodes(n.childForFieldName("body"))) {
        if (c.type !== "assignment") continue;
        const l = c.childForFieldName("left");
        if (l?.type === "identifier" && counts.get(l.text) === 1 && !l.text.startsWith("_")) f.locals.push({ name: l.text, line: line(l) });
      }
    }
  }
  return f;
}

function analyseGeneric(root, rel, ext) {
  const f = { idents: new Map(), strings: new Set(), decls: [] };
  for (const n of nodes(root)) {
    if (IDENT.has(n.type) || (n.childCount === 0 && /identifier$|^name$/.test(n.type))) f.idents.set(n.text, (f.idents.get(n.text) ?? 0) + 1);
    if (GENERIC_DECL.test(n.type)) {
      const name = nameOf(n);
      if (!name) continue;
      const head = n.text.slice(0, 120);
      const priv = ext === ".go" ? /^[a-z_]/.test(name)
        : ext === ".rs" ? !n.namedChildren.some((c) => c.type === "visibility_modifier")
        : ext === ".dart" ? name.startsWith("_")
        : /\b(private|internal|fileprivate)\b/.test(head.split(name)[0]);
      if (priv) f.decls.push({ name, kind: n.type.replace(/_(declaration|definition|item)$/, ""), line: line(n), exported: false, file: rel });
    }
  }
  return f;
}

// ---- project analysis ---------------------------------------------------------------------------------------

const EXTS = ["", ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".mts", ".cts", "/index.ts", "/index.tsx", "/index.js", "/index.jsx"];
function resolveImport(spec, fromFile, files, aliases) {
  let base;
  if (spec.startsWith(".")) base = join(dirname(fromFile), spec).replace(/\\/g, "/");
  else {
    const a = aliases.find(([p]) => spec.startsWith(p));
    if (!a) return null;
    base = join(a[1], spec.slice(a[0].length)).replace(/\\/g, "/");
  }
  base = base.replace(/\.(js|jsx|mjs|cjs)$/, "");
  for (const e of EXTS) if (files.has(base + e)) return base + e;
  for (const e of EXTS) if (files.has(base + ".js" + e)) return base + ".js" + e;
  return null;
}

export async function analyseDeadCode(root, { ignore = [], langs, strict = false, maxFiles = 4000, onlyDirs } = {}) {
  const all = walk(root, { max: 30000 });
  const want = (e) => LANG[e] && (!langs || langs.includes(LANG[e][0]) || langs.includes(e.slice(1)));
  const ig = ignore.map((g) => new RegExp(g.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*\*/g, ".*").replace(/\*/g, "[^/]*")));
  const files = all.filter((f) => want(extname(f)) && !ig.some((r) => r.test(f)) && !/\.d\.ts$|\.min\.js$|(^|\/)(generated|__generated__|vendor|\.next|\.output)(\/|$)/.test(f) && (!onlyDirs || onlyDirs.some((d) => f.startsWith(d))));
  const skipped = [];
  const parsers = new Map();
  const records = new Map();
  for (const rel of files.slice(0, maxFiles)) {
    const abs = join(root, rel);
    try {
      if (statSync(abs).size > 800_000) { skipped.push(`${rel} (too large)`); continue; }
    } catch { continue; }
    const ext = extname(rel), [grammar, family] = LANG[ext];
    if (!parsers.has(grammar)) parsers.set(grammar, await loadParser(grammar));
    const src = readFileSync(abs, "utf8");
    if (src.split("\n").some((l) => l.length > 2000)) { skipped.push(`${rel} (minified?)`); continue; }
    const tree = parsers.get(grammar).parse(src);
    const rec = family === "js" ? analyseJs(tree.rootNode, rel) : family === "py" ? analysePy(tree.rootNode, rel) : analyseGeneric(tree.rootNode, rel, ext);
    Object.assign(rec, { rel, family, grammar, isTest: TEST_FILE.test(rel), src });
    records.set(rel, rec);
    tree.delete();
  }

  const findings = [];
  const add = (confidence, kind, rel, ln, msg) => findings.push({ confidence, kind, file: rel, line: ln, message: msg });
  const projectCount = new Map(); // name -> files that mention it, per family
  const mentions = (family) => projectCount.get(family) ?? projectCount.set(family, new Map()).get(family);
  for (const r of records.values()) {
    const m = mentions(r.family === "generic" ? r.grammar : r.family);
    for (const [name, n] of r.idents) (m.get(name) ?? m.set(name, new Map()).get(name)).set(r.rel, n);
    for (const s of r.strings) (m.get(s) ?? m.set(s, new Map()).get(s)).set(`"${r.rel}"`, 1); // string mention
  }
  const usedElsewhere = (fam, name, rel) => [...(mentions(fam).get(name)?.keys() ?? [])].some((k) => k !== rel);
  const onlyAsString = (fam, name) => [...(mentions(fam).get(name)?.keys() ?? [])].every((k) => k.startsWith('"'));

  // JS/TS
  const fileSet = new Set(records.keys());
  const tsconfig = readJson(join(root, "tsconfig.json"), readJson(join(root, "jsconfig.json"), {}));
  const co = tsconfig.compilerOptions ?? {};
  const aliases = Object.entries(co.paths ?? {}).map(([k, v]) => [k.replace(/\*$/, ""), join(co.baseUrl ?? ".", v[0].replace(/\*$/, "")).replace(/\\/g, "/")]);
  const pkg = readJson(join(root, "package.json"), {});
  const pkgEntries = new Set([pkg.main, pkg.module, pkg.types, ...(typeof pkg.bin === "string" ? [pkg.bin] : Object.values(pkg.bin ?? {})), ...JSON.stringify(pkg.exports ?? {}).match(/"\.\/[^"]+"/g)?.map((s) => s.slice(1, -1)) ?? []].filter(Boolean).map((p) => p.replace(/^\.\//, "")));
  const imported = new Map(); // file -> importers
  for (const r of records.values()) {
    if (r.family !== "js") continue;
    for (const d of r.deps) {
      const to = resolveImport(d, r.rel, fileSet, aliases);
      if (to) (imported.get(to) ?? imported.set(to, new Set()).get(to)).add(r.rel);
    }
  }
  for (const r of records.values()) {
    if (r.family === "js") {
      for (const imp of r.imports) {
        const body = r.src.slice(0, imp.range[0]) + r.src.slice(imp.range[1]);
        for (const name of imp.names) {
          if (name === "React" && r.hasJsx) continue;
          // `x.name` is a property, not a use of the import; `...name` (spread) is a use.
          if (!new RegExp(`(?<![\\w$])(?<![\\w$)\\]]\\.)${name.replace(/\$/g, "\\$")}(?![\\w$])`).test(body)) add("high", "unused-import", r.rel, imp.line, `\`${name}\` is imported from "${imp.source}" but never used`);
        }
      }
      for (const l of r.locals) add("medium", "unused-variable", r.rel, l.line, `local \`${l.name}\` is assigned but never read`);
      for (const u of r.unreachable) add("high", "unreachable-code", r.rel, u.line, `statement after \`${u.after}\` can never run`);
      for (const d of r.decls) {
        if (ENTRY_NAME.test(d.name) || r.isTest) continue;
        const own = r.idents.get(d.name) ?? 0;
        const exposed = r.exportedLocals.get(d.name);
        const isExp = d.exported || exposed !== undefined;
        if (!isExp && own <= 1) add(onlyAsString("js", d.name) ? "medium" : "high", "unused-declaration", r.rel, d.line, `${d.kind} \`${d.name}\` is declared but never referenced and not exported`);
        else if (isExp && !r.exportAll && exposed !== "default" && ![...(r.reexports)].includes(d.name) && !ENTRY_FILE.test(r.rel) && !pkgEntries.has(r.rel) && !usedElsewhere("js", exposed ?? d.name, r.rel)) add("low", "unused-export", r.rel, d.line, `exported ${d.kind} \`${exposed ?? d.name}\` is not imported anywhere in this project (fine if it is public API)`);
      }
      if (!imported.has(r.rel) && !ENTRY_FILE.test(r.rel) && !pkgEntries.has(r.rel) && !r.isTest) add("medium", "unreferenced-file", r.rel, 1, "no file in the project imports this one (check it is not an entry point, route or script)");
    } else if (r.family === "py") {
      for (const imp of r.imports) {
        const body = r.src.slice(0, imp.range[0]) + r.src.slice(imp.range[1]);
        for (const name of imp.names) {
          const base = name.split(".")[0];
          if (r.allNames.has(base) || /__init__\.py$/.test(r.rel)) continue;
          if (!new RegExp(`(?<![\\w])${base}(?![\\w])`).test(body)) add("high", "unused-import", r.rel, imp.line, `\`${name}\` is imported but never used`);
        }
      }
      for (const l of r.locals) add("medium", "unused-variable", r.rel, l.line, `local \`${l.name}\` is assigned but never read`);
      for (const u of r.unreachable) add("high", "unreachable-code", r.rel, u.line, `statement after \`${u.after}\` can never run`);
      for (const d of r.decls) {
        if (ENTRY_NAME.test(d.name) || r.isTest || r.allNames.has(d.name)) continue;
        const own = r.idents.get(d.name) ?? 0, else_ = usedElsewhere("py", d.name, r.rel);
        if (own <= 1 && !else_) {
          if (!d.exported) add("high", "unused-declaration", r.rel, d.line, `${d.kind} \`${d.name}\` is private and never referenced`);
          else if (strict) add("low", "unused-declaration", r.rel, d.line, `public ${d.kind} \`${d.name}\` is never referenced in this project (fine if it is public API)`);
        }
      }
    } else if (!r.isTest) {
      for (const d of r.decls) if (!ENTRY_NAME.test(d.name) && (r.idents.get(d.name) ?? 0) <= 1 && !usedElsewhere(r.grammar, d.name, r.rel)) add("medium", "unused-declaration", r.rel, d.line, `private ${d.kind} \`${d.name}\` is never referenced`);
    }
  }
  const rank = { high: 0, medium: 1, low: 2 };
  findings.sort((a, b) => rank[a.confidence] - rank[b.confidence] || a.file.localeCompare(b.file) || a.line - b.line);
  return { files: records.size, skipped, languages: [...new Set([...parsers.keys()])], findings };
}
