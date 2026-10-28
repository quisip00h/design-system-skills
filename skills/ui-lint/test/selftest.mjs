// Self-test for ui-lint: a linter that is never shown a failure cannot prove it sees one.
// Every fixture in fixtures/fail declares what it must find ("expect: rule n, ..."),
// every fixture in fixtures/pass must come back clean, and the suspicious flag must
// fire on a large clean input and stay quiet once one real finding is in it.
// Run: node test/selftest.mjs
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { lint, loadConfig, isTitleCase } from "../ui-lint.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const cfg = loadConfig(join(root, "tokens.json"));
let failed = 0;
const check = (ok, name, detail = "") => {
  console.log(`${ok ? "ok  " : "FAIL"}  ${name}${ok || !detail ? "" : "\n      " + detail}`);
  if (!ok) failed++;
};
const read = (dir, f) => ({ path: `fixtures/${dir}/${f}`, text: readFileSync(join(root, "fixtures", dir, f), "utf-8") });

function expected(text) {
  const m = /expect:\s*([^\n*]*?)\s*(?:-->|\*\/|$)/m.exec(text);
  const want = {};
  if (m && m[1] !== "none") for (const part of m[1].split(",")) {
    const [rule, n] = part.trim().split(/\s+/);
    want[rule] = +(n || 1);
  }
  return want;
}

for (const f of readdirSync(join(root, "fixtures", "fail")).sort()) {
  const src = read("fail", f);
  const want = expected(src.text);
  const r = lint([src], cfg);
  const rules = new Set([...Object.keys(want), ...Object.keys(r.counts)]);
  const diff = [...rules].filter(k => (want[k] || 0) !== (r.counts[k] || 0)).map(k => `${k}: want ${want[k] || 0}, got ${r.counts[k] || 0}`);
  check(Object.keys(want).length > 0 && diff.length === 0, `fail/${f} finds exactly ${JSON.stringify(want)}`,
        diff.join("; ") + "\n      " + r.findings.map(x => `${x.line}:${x.col} ${x.rule} ${x.value}`).join("\n      "));
}

for (const f of readdirSync(join(root, "fixtures", "pass")).sort()) {
  const r = lint([read("pass", f)], cfg);
  check(r.findings.length === 0 && !r.suspicious, `pass/${f} is clean`,
        r.findings.map(x => `${x.line}:${x.col} ${x.rule} ${x.value}`).join("\n      "));
}

// Positions point at the offending line, not at the top of the file.
{
  const r = lint([read("fail", "colours.css")], cfg);
  check(r.findings.every(x => x.line >= 2), "findings carry the line they sit on");
  check(r.findings.some(x => x.suggest === "var(--surface-default)"), "a raw colour that equals a token suggests the token");
}

// The suspicious flag: zero findings on a large input is a bug signal, not a pass.
{
  const clean = readFileSync(join(root, "fixtures", "pass", "clean.css"), "utf-8");
  const big = { path: "big.css", text: Array(60).fill(clean).join("\n") };
  const r = lint([big], cfg);
  check(r.lines >= cfg.minLines && r.findings.length === 0 && r.suspicious, `${r.lines} clean lines are reported as suspicious`);
  const planted = lint([{ path: "big.css", text: big.text + "\n.x { color: #123456; }" }], cfg);
  check(planted.findings.length === 1 && !planted.suspicious, "one planted raw colour is found and clears the flag");
  check(lint([], cfg).suspicious, "an empty file list is suspicious");
}

// Size declared in one file covers the element in another: the check looks across sources.
{
  const page = { path: "page.html", text: "<p>Total <small>incl. tax</small></p>" };
  check(lint([page], cfg).counts["no-declared-size"] === 1, "an unsized <small> is found");
  check(!lint([page, read("pass", "fonts.css")], cfg).counts["no-declared-size"], "a size set in another file's CSS covers it");
  const d = lint([read("fail", "definitions.css")], cfg).findings.find(x => x.value === "--muted: #5b636b");
  check(d && d.suggest === "var(--text-secondary)", "an off-token definition suggests the nearest token");
}

check(isTitleCase("Save Changes") && !isTitleCase("Save changes") && !isTitleCase("Export PDF") && !isTitleCase("Open in Figma", cfg.allow),
      "title case: flags Save Changes, passes sentence case, acronyms and allowed names");
check(!isTitleCase("A Alex Morgan") && !isTitleCase("AM Alex Morgan") && isTitleCase("A Big Deal") && isTitleCase("AB Save Changes"),
      "title case: an avatar initial in front of a name is a person, not a label");

console.log(failed ? `\n${failed} failed` : "\nall passed");
process.exit(failed ? 1 : 0);
