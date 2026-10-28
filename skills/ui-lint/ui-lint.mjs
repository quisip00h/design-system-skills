#!/usr/bin/env node
// ui-lint: lint HTML, CSS and JSX against a design-system tokens file.
// Zero dependencies, Node 18+. Regex-based on purpose: it reads the code an agent
// writes, not every edge of the language. Usage: node ui-lint.mjs --tokens tokens.json <paths...>
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const LEVELS = {
  "raw-colour": "error",
  "off-scale-spacing": "error",
  "off-scale-font-size": "error",
  "off-scale-font-weight": "error",
  "transition-all": "warn",
  "title-case": "warn",
  "forbidden-word": "error",
  "off-token-definition": "error",
  "no-declared-size": "warn",
};
const EXTS = new Set([".html", ".htm", ".css", ".jsx", ".tsx"]);
const SKIP_DIRS = new Set(["node_modules", ".git", "dist", "build", ".next", "coverage"]);

const SPACING_PROP = /^(margin|padding)(-(top|right|bottom|left|inline|block)(-(start|end))?)?$|^(gap|row-gap|column-gap)$/;
const COLOUR_PROP = /^(color|background(-color)?|border(-(top|right|bottom|left))?(-color)?|outline(-color)?|fill|stroke|box-shadow|text-decoration(-color)?|caret-color|accent-color|stop-color)$/;
const NAMED = new Set("white black red green blue gray grey orange yellow purple pink brown navy silver teal maroon olive lime aqua fuchsia".split(" "));
const HEX = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})(?![0-9a-zA-Z])/g;
const COLOUR_FN = /\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch)\([^)]*\)/g;
const WEIGHT_WORDS = { normal: 400, bold: 700 };
const SMALL_WORDS = new Set("a an and as at but by for from in into nor of on onto or over per the to vs via with".split(" "));
// opening tag whose attributes may hold {expressions}, including arrow functions
const OPEN = "(?:[^>{}]|\\{(?:[^{}]|\\{[^{}]*\\})*\\})*";
// elements the browser shrinks to `smaller` unless the code sets a size
const SHRUNK = ["small", "sub", "sup"];
const VOID = new Set("area base br col embed hr img input link meta source track wbr".split(" "));
const blank = s => s.replace(/[^\n]/g, " ");

// ---------------------------------------------------------------- config
export function loadConfig(path) {
  const t = JSON.parse(readFileSync(path, "utf-8"));
  const lint = t.lint || {};
  const colours = new Map();
  for (const [name, value] of Object.entries(t.colour || {})) colours.set(normHex(value), name);
  return {
    colours,
    spacing: t.spacing || [],
    sizes: (t.type && t.type.sizes) || [],
    weights: (t.type && t.type.weights) || [],
    rootPx: (t.type && t.type.rootPx) || 16,
    forbidden: (lint.forbiddenWords || []).map(f => (typeof f === "string" ? { word: f } : f)),
    allow: new Set(lint.titleCaseAllow || []),
    levels: { ...LEVELS, ...(lint.levels || {}) },
    ignore: (lint.ignore || []).map(globToRegex),
    minLines: (lint.suspicious && lint.suspicious.minLines) || 300,
  };
}

function globToRegex(g) {
  const s = g.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*\*/g, "\u0000").replace(/\*/g, "[^/]*").replace(/\u0000/g, ".*");
  return new RegExp("(^|/)" + s + "$");
}

function normHex(v) {
  let h = String(v).trim().toLowerCase();
  if (/^#[0-9a-f]{3,4}$/.test(h)) h = "#" + [...h.slice(1)].map(c => c + c).join("");
  return h;
}

// ---------------------------------------------------------------- files
export function collect(paths, cfg) {
  const out = [];
  const walk = p => {
    let st;
    try { st = statSync(p); } catch { console.error(`ui-lint: not found: ${p}`); return; }
    if (st.isDirectory()) {
      for (const n of readdirSync(p)) if (!SKIP_DIRS.has(n)) walk(join(p, n));
    } else if (EXTS.has(extname(p).toLowerCase())) {
      const rel = relative(process.cwd(), p) || p;
      if (!cfg.ignore.some(r => r.test(rel))) out.push({ path: rel, text: readFileSync(p, "utf-8") });
    }
  };
  paths.forEach(p => walk(resolve(p)));
  return out;
}

// ---------------------------------------------------------------- lint
// The CSS in a source, as [css, offset] pairs: the whole file for .css, otherwise
// <style> blocks and css`` / styled.x`` templates. Comments are blanked, offsets kept.
function cssOf(src) {
  const ext = extname(src.path).toLowerCase();
  let text = src.text.replace(/\/\*[\s\S]*?\*\//g, blank);
  if (ext === ".css") return { text, css: [[text, 0]] };
  text = text.replace(/<!--[\s\S]*?-->/g, blank);
  if (ext === ".jsx" || ext === ".tsx") text = text.replace(/^[ \t]*\/\/[^\n]*/gm, blank);
  const css = [];
  for (const m of text.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) css.push([m[1], m.index + m[0].indexOf(m[1])]);
  for (const m of text.matchAll(/\b(?:css|styled(?:\.[a-zA-Z]+|\([^)]*\)))\s*`([^`]*)`/g)) css.push([m[1], m.index + m[0].indexOf(m[1])]);
  return { text, css };
}

// A compound selector as tag and classes: "p.note" is { tag: "p", classes: ["note"] }.
// Ids, attributes and pseudo-classes are ignored, which errs towards "sized".
const compound = s => ({ tag: (/^[a-z][\w-]*/i.exec(s) || [""])[0].toLowerCase(), classes: [...s.matchAll(/\.([\w-]+)/g)].map(m => m[1]) });
const anywhere = c => c.tag === "html" || c.tag === "body" || (!c.tag && !c.classes.length);
const classesOf = attrs => {
  const m = /\b(?:class|className)\s*=\s*(?:"([^"]*)"|'([^']*)'|\{`([^`]*)`\})/.exec(attrs);
  return m ? (m[1] ?? m[2] ?? m[3]).split(/\s+/).filter(Boolean) : [];
};

// Every selector whose rule sets a font-size, as a chain of compounds with the target last.
// Collected across all sources: a <small> styled in app.css is fine in page.html.
function sizedSelectors(sources) {
  const chains = [];
  for (const src of sources) for (const [css] of cssOf(src).css) {
    for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      if (!/(^|[\s;])font(-size)?\s*:/.test(m[2])) continue;
      for (const sel of m[1].split(",")) {
        if (sel.includes("::")) continue;
        const parts = sel.trim().split(/\s*[>+~]\s*|\s+/).filter(Boolean);
        if (parts.length) chains.push(parts.map(compound));
      }
    }
  }
  return chains;
}

// Does this selector chain reach this element? `.note small` sizes a <small> inside
// .note, not every <small> in the product. Combinators are read as descendant.
// In a fragment (JSX, markup built in a script) the context above the fragment's root
// is unknown, so compounds the known ancestors run out on are taken as present.
function reaches(chain, el, ancestors, fragment) {
  const target = chain[chain.length - 1];
  if (!target.tag && !target.classes.length) return false;
  if ((target.tag && target.tag !== el.tag) || !target.classes.every(k => el.classes.includes(k))) return false;
  let i = ancestors.length - 1;
  for (let j = chain.length - 2; j >= 0; j--) {
    const c = chain[j];
    if (anywhere(c)) continue;
    while (i >= 0 && !((!c.tag || c.tag === ancestors[i].tag) && c.classes.every(k => ancestors[i].classes.includes(k)))) i--;
    if (i < 0) return fragment;
    i--;
  }
  return true;
}

const hexRgb = h => { h = normHex(h); return /^#[0-9a-f]{6}/.test(h) ? [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)) : null; };

export function lint(sources, cfg) {
  const findings = [];
  const checked = { colour: 0, spacing: 0, fontSize: 0, fontWeight: 0, transition: 0, label: 0, text: 0, element: 0 };
  const sized = sizedSelectors(sources);
  let lines = 0;

  for (const src of sources) {
    const ext = extname(src.path).toLowerCase();
    const starts = [0];
    for (let i = 0; i < src.text.length; i++) if (src.text[i] === "\n") starts.push(i + 1);
    lines += starts.length;
    const pos = i => {
      let lo = 0, hi = starts.length - 1;
      while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (starts[mid] <= i) lo = mid; else hi = mid - 1; }
      return { line: lo + 1, col: i - starts[lo] + 1 };
    };
    const add = (rule, at, value, message, suggest) => {
      const level = cfg.levels[rule];
      if (level && level !== "off") findings.push({ file: src.path, ...pos(at), rule, level, value, message, ...(suggest ? { suggest } : {}) });
    };

    // ---- value checks shared by CSS, style attributes and JSX style objects
    const checkColour = (value, at) => {
      checked.colour++;
      for (const re of [HEX, COLOUR_FN]) {
        for (const m of value.matchAll(re)) {
          const name = cfg.colours.get(normHex(m[0]));
          add("raw-colour", at, m[0], "raw colour, use a colour token", name ? `var(--${name.replace(/[/\s]+/g, "-")})` : undefined);
        }
      }
    };
    const toPx = tok => {
      const m = /^(-?\d*\.?\d+)(px|rem)?$/.exec(tok);
      if (!m) return null;
      const n = parseFloat(m[1]);
      if (!m[2] && n !== 0) return null;          // unitless non-zero is not a length
      return m[2] === "rem" ? n * cfg.rootPx : n;
    };
    const onScale = (n, scale) => scale.some(s => Math.abs(Math.abs(n) - s) < 0.01);
    const nearest = (n, scale) => scale.reduce((a, b) => (Math.abs(b - Math.abs(n)) < Math.abs(a - Math.abs(n)) ? b : a), scale[0]);
    const stripFns = v => { let p; do { p = v; v = v.replace(/[a-z-]+\([^()]*\)/gi, " "); } while (v !== p); return v; };

    // A custom property that defines a raw colour must define one the design system has.
    // Otherwise `--danger: #c9302c` passes, and every var(--danger) after it looks on-system.
    const checkDefinition = (prop, value, at) => {
      if (!cfg.colours.size) return;
      const raw = [...value.matchAll(HEX), ...value.matchAll(COLOUR_FN)].map(m => m[0]);
      if (NAMED.has(value.toLowerCase())) raw.push(value);
      for (const c of raw) {
        checked.colour++;
        if (cfg.colours.has(normHex(c))) continue;
        const rgb = hexRgb(c);
        const near = rgb && [...cfg.colours].map(([hex, name]) => [hexRgb(hex).reduce((d, v, i) => d + (v - rgb[i]) ** 2, 0), name]).sort((a, b) => a[0] - b[0])[0];
        add("off-token-definition", at, `${prop}: ${c}`, "custom property defines a colour that is not in the design system", near ? `var(--${near[1].replace(/[/\s]+/g, "-")})` : undefined);
      }
    };

    const checkDecl = (prop, value, at) => {
      prop = prop.toLowerCase();
      value = value.trim();
      if (prop.startsWith("--")) { checkDefinition(prop, value, at); return; }
      if (prop === "content") return;
      if (/(color|background|border|outline|fill|stroke|shadow)/.test(prop) || HEX.test(value) || COLOUR_FN.test(value)) {
        HEX.lastIndex = 0; COLOUR_FN.lastIndex = 0;
        checkColour(value, at);
        if (COLOUR_PROP.test(prop)) for (const w of value.toLowerCase().split(/[\s,]+/)) if (NAMED.has(w)) add("raw-colour", at, w, "named colour, use a colour token");
      }
      if (SPACING_PROP.test(prop)) {
        for (const tok of stripFns(value).split(/[\s/]+/).filter(Boolean)) {
          const px = toPx(tok);
          if (px === null) continue;
          checked.spacing++;
          if (!onScale(px, cfg.spacing)) add("off-scale-spacing", at, tok, `${tok} is off the spacing scale`, `${nearest(px, cfg.spacing)}px`);
        }
      }
      if (prop === "font-size") {
        const px = toPx(value);
        if (px !== null) {
          checked.fontSize++;
          if (!onScale(px, cfg.sizes)) add("off-scale-font-size", at, value, `font size ${value} is not in the type scale`, `${nearest(px, cfg.sizes)}px`);
        }
      }
      if (prop === "font-weight") {
        const w = WEIGHT_WORDS[value.toLowerCase()] ?? (/^\d+$/.test(value) ? +value : null);
        if (w !== null) {
          checked.fontWeight++;
          if (!cfg.weights.includes(w)) add("off-scale-font-weight", at, value, `font weight ${value} is not in the type scale`, cfg.weights.join(" or "));
        }
      }
      if (prop === "transition" || prop === "transition-property") {
        checked.transition++;
        if (/(^|[\s,])all([\s,]|$)/.test(value)) add("transition-all", at, value, "transition: all animates layout and colour by accident, name the properties");
      }
    };

    const scanCss = (css, base) => {
      css = css.replace(/@font-face\s*\{[^}]*\}/gi, blank);   // descriptors of a font file, not usage
      for (const m of css.matchAll(/(-{0,2}[a-zA-Z][a-zA-Z-]*)\s*:\s*([^;{}]*?)\s*(?=;|\})/g)) checkDecl(m[1], m[2], base + m.index);
    };

    const { text, css } = cssOf(src);
    for (const [c, base] of css) scanCss(c, base);
    if (ext === ".css") continue;

    // style="..." attributes
    for (const m of text.matchAll(/\sstyle\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) {
      const v = m[1] ?? m[2];
      scanCss(v + ";", m.index + m[0].indexOf(v));
    }
    // JSX style={{ ... }} objects: numbers are px
    for (const m of text.matchAll(/\bstyle\s*=\s*\{\{([\s\S]*?)\}\}/g)) {
      for (const d of m[1].matchAll(/([a-zA-Z]+)\s*:\s*(-?\d+(?:\.\d+)?|'[^']*'|"[^"]*"|`[^`$]*`)/g)) {
        const prop = d[1].replace(/[A-Z]/g, c => "-" + c.toLowerCase());
        let v = d[2];
        if (/^['"`]/.test(v)) v = v.slice(1, -1);
        else if (prop !== "font-weight" && v !== "0") v += "px";
        checkDecl(prop, v, m.index + m[0].indexOf(m[1]) + d.index);
      }
    }
    // colour attributes on SVG and legacy HTML
    for (const m of text.matchAll(/\s(fill|stroke|color|bgcolor|stop-color)\s*=\s*["']([^"']+)["']/g)) {
      const v = m[2].trim();
      if (/^(none|currentcolor|inherit|transparent)$/i.test(v) || v.startsWith("var(") || v.startsWith("url(")) continue;
      checkColour(v, m.index);
      if (NAMED.has(v.toLowerCase())) add("raw-colour", m.index, v, "named colour, use a colour token");
    }
    // utility classes: transition-all and arbitrary values
    for (const m of text.matchAll(/\b(?:class|className)\s*=\s*(?:"([^"]*)"|'([^']*)'|\{`([^`]*)`\})/g)) {
      const at = m.index;
      for (const raw of (m[1] ?? m[2] ?? m[3]).split(/\s+/).filter(Boolean)) {
        const c = raw.slice(raw.lastIndexOf(":", raw.indexOf("[") < 0 ? raw.length : raw.indexOf("[")) + 1);
        let a;
        if (/^transition/.test(c)) { checked.transition++; if (c === "transition-all") add("transition-all", at, c, "transition-all animates layout and colour by accident, name the properties"); }
        if ((a = /^-?(?:p[xytrblse]?|m[xytrblse]?|gap(?:-[xy])?|space-[xy])-\[(-?[\d.]+(?:px|rem))\]$/.exec(c))) checkDecl("padding", a[1], at);
        if ((a = /^(?:bg|text|border(?:-[trblxy])?|fill|stroke|ring|outline|from|via|to|decoration|shadow|accent|caret)-\[(#[0-9a-fA-F]{3,8}|(?:rgba?|hsla?)\([^\]]*\))\]$/.exec(c))) checkColour(a[1], at);
        if ((a = /^text-\[([\d.]+(?:px|rem))\]$/.exec(c))) checkDecl("font-size", a[1], at);
        if ((a = /^font-\[(\d+)\]$/.exec(c))) checkDecl("font-weight", a[1], at);
      }
    }

    // <small>, <sub>, <sup> without a size render at `smaller`: 83 % of the parent, off any type scale.
    // Walk the tags with a stack, so a contextual rule only counts inside its context.
    // Static HTML is walked whole; each <script> is walked on its own, as a fragment.
    const walk = (markup, base, fragment) => {
      const stack = [];
      for (const m of markup.matchAll(new RegExp(`<(/?)([a-zA-Z][\\w.-]*)\\b(${OPEN})>`, "g"))) {
        const tag = m[2].toLowerCase(), attrs = m[3];
        if (m[1]) { const i = stack.map(e => e.tag).lastIndexOf(tag); if (i >= 0) stack.length = i; continue; }
        const el = { tag, classes: classesOf(attrs) };
        if (SHRUNK.includes(tag)) {
          checked.element++;
          const inline = /\bstyle\s*=\s*(?:["'][^"']*|\{\{[^}]*)font(?:-s|S)ize/.test(attrs);
          const utility = el.classes.some(c => /^(?:[\w-]+:)*text-(?:xs|sm|base|lg|[2-9]?xl|\[[\d.]+(?:px|rem)\])$/.test(c));
          if (!inline && !utility && !sized.some(chain => reaches(chain, el, stack, fragment)))
            add("no-declared-size", base + m.index, `<${tag}>`, `<${tag}> without a font-size renders at the browser's smaller size, off the type scale`, `one of ${cfg.sizes.join(", ")}px`);
        }
        if (!VOID.has(tag) && !attrs.trimEnd().endsWith("/")) stack.push(el);
      }
    };
    const jsx = ext === ".jsx" || ext === ".tsx";
    const scripts = [...text.matchAll(/(<script\b[^>]*>)([\s\S]*?)<\/script>/gi)];
    walk(text.replace(/(<script\b[^>]*>)([\s\S]*?)(?=<\/script>)/gi, (_, open, body) => open + blank(body)), 0, jsx);
    for (const m of scripts) walk(m[2], m.index + m[1].length, true);

    // ---- copy checks: labels and visible text
    const prose = text.replace(/<(style|script)\b[^>]*>[\s\S]*?<\/\1>/gi, blank);
    const clean = s => s.replace(/<[^>]+>/g, " ").replace(/\{[^{}]*\}/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();

    for (const m of prose.matchAll(new RegExp(`<(button|h[1-6])\\b${OPEN}>([\\s\\S]*?)<\\/\\1\\s*>`, "gi"))) {
      const label = clean(m[2]);
      if (!label) continue;
      checked.label++;
      if (isTitleCase(label, cfg.allow)) add("title-case", m.index, label, "Title Case in a label, use sentence case", sentenceCase(label, cfg.allow));
    }
    const texts = [];
    for (const m of prose.matchAll(/(?<![=-])>([^<>]+)</g)) {
      const t = m[1].replace(/\{(?:[^{}]|\{[^{}]*\})*\}/g, " ");   // drop {expressions}, keep the words around them
      if (/\p{L}/u.test(t)) texts.push([t, m.index + 1]);
    }
    for (const m of prose.matchAll(/\s(placeholder|title|alt|aria-label|label)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) texts.push([m[2] ?? m[3], m.index]);
    for (const [t, at] of texts) {
      checked.text++;
      for (const f of cfg.forbidden) {
        const re = new RegExp(`(^|[^\\p{L}])${f.word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\p{L}])`, "giu");
        for (const _ of t.matchAll(re)) add("forbidden-word", at, f.word, `"${f.word}" is on the forbidden list${f.reason ? ": " + f.reason : ""}`, f.instead);
      }
    }
  }

  findings.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.col - b.col);
  const counts = {};
  for (const f of findings) counts[f.rule] = (counts[f.rule] || 0) + 1;
  const total = Object.values(checked).reduce((a, b) => a + b, 0);
  const reasons = [];
  if (sources.length === 0) reasons.push("no files linted: check the paths and the file extensions");
  else if (lines >= cfg.minLines && findings.length === 0)
    reasons.push(`${lines} lines and nothing found. A clean result this large is more often a blind linter than clean code: plant one raw colour and re-run, or run the self-test`);
  if (sources.length && lines >= 50 && total === 0) reasons.push("nothing checkable was found: the parser may not understand this code");
  return {
    files: sources.length, lines, checked,
    errors: findings.filter(f => f.level === "error").length,
    warnings: findings.filter(f => f.level === "warn").length,
    counts, suspicious: reasons.length > 0, suspiciousReasons: reasons, findings,
  };
}

const words = label => label.split(" ").map(w => w.replace(/^[^\p{L}\d]+|[^\p{L}\d]+$/gu, ""));
const isPlain = (w, allow) => !SMALL_WORDS.has(w.toLowerCase()) && !allow.has(w) && !(w.length > 1 && w === w.toUpperCase()) && !/\d/.test(w);

// An avatar initial in front of a name ("A Alex Morgan", "AM Alex Morgan") marks a person, not a label.
const isAvatarName = ws => /^\p{Lu}{1,3}$/u.test(ws[0]) && ws.length > ws[0].length &&
  ws.slice(1, 1 + ws[0].length).map(w => w[0]).join("") === ws[0];

export function isTitleCase(label, allow = new Set()) {
  const ws = words(label).filter(w => /\p{L}/u.test(w));
  if (ws.length < 2 || isAvatarName(ws)) return false;
  const rest = ws.slice(1).filter(w => isPlain(w, allow));
  return rest.length > 0 && rest.every(w => /^\p{Lu}/u.test(w));
}

function sentenceCase(label, allow) {
  return label.split(" ").map((w, i) => {
    const core = words(w)[0];
    const keep = i === 0 || !core || allow.has(core) || (core.length > 1 && core === core.toUpperCase()) || /\d/.test(core);
    return keep ? w : w.replace(core, core[0].toLowerCase() + core.slice(1));
  }).join(" ");
}

// ---------------------------------------------------------------- report
export function format(r) {
  const out = [`ui-lint: ${r.files} files, ${r.lines} lines, ${Object.values(r.checked).reduce((a, b) => a + b, 0)} values and labels checked`];
  for (const f of r.findings) {
    out.push(`  ${`${f.file}:${f.line}:${f.col}`.padEnd(32)}  ${f.level.padEnd(5)}  ${f.rule.padEnd(21)}  ${f.value}  ${f.message}${f.suggest ? ` (try ${f.suggest})` : ""}`);
  }
  const verdict = r.errors ? "FAIL" : r.suspicious ? "SUSPICIOUS" : "PASS";
  out.push(`${r.errors} errors, ${r.warnings} warnings. ${verdict}`);
  for (const s of r.suspiciousReasons) out.push(`  suspicious: ${s}`);
  return out.join("\n");
}

// ---------------------------------------------------------------- cli
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const take = flag => { const i = args.indexOf(flag); return i < 0 ? null : args.splice(i, 2)[1]; };
  const json = args.includes("--json") && args.splice(args.indexOf("--json"), 1);
  const tokens = take("--tokens") || join(dirname(fileURLToPath(import.meta.url)), "tokens.json");
  const minLines = take("--min-lines");
  if (!args.length || args.includes("--help")) {
    console.log("usage: node ui-lint.mjs [--tokens tokens.json] [--json] [--min-lines 300] <files or folders...>");
    process.exit(args.length ? 0 : 2);
  }
  const cfg = loadConfig(tokens);
  if (minLines) cfg.minLines = +minLines;
  const report = lint(collect(args, cfg), cfg);
  console.log(json ? JSON.stringify(report, null, 2) : format(report));
  process.exit(report.errors ? 1 : report.suspicious ? 3 : 0);
}
