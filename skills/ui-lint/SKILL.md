---
name: ui-lint
description: Lint agent-written HTML, CSS and JSX against the design system's tokens. Flags raw colour literals, custom properties that define colours the DS does not have, spacing off the scale, font sizes and weights outside the type scale, unsized small/sub/sup, transition all, Title Case in buttons and headings, and words on a forbidden list. Zero dependencies. Run it after an agent writes or changes UI code, in CI, or on demand ("is this on-system?", "lint the UI").
---

# UI lint

The code-side twin of [`figma-ds-qa`](../figma-ds-qa/SKILL.md). Agents write UI that renders fine and drifts off the system underneath: `#333` instead of a token, `padding: 13px`, a 15 px label, `transition: all`, a button that says "Save Changes". This script reads the code and reports each case with file, line and a suggested fix.

It is regex-based on purpose. It reads the kind of code an agent writes (plain CSS, `<style>` blocks, `style` attributes, JSX style objects, utility classes with arbitrary values), not every corner of each language. Anything it cannot read, it does not judge, which is why the report counts what it checked and flags a run that saw nothing.

## Run

```bash
node skills/ui-lint/ui-lint.mjs --tokens skills/ui-lint/tokens.json src/
```

- Paths are files or folders; `.html`, `.htm`, `.css`, `.jsx`, `.tsx` are read, `node_modules`, `dist`, `build` and `.git` are skipped.
- `--json` prints the full report for tools and CI. `--min-lines 300` sets the size above which an empty result counts as suspicious.
- Exit code: `0` pass, `1` errors, `3` suspicious without errors, `2` usage.
- Node 18 or newer. No install step.

Prove the linter before trusting it:

```bash
node skills/ui-lint/test/selftest.mjs
```

Every file in `fixtures/fail` declares what it must find (`expect: raw-colour 2, title-case 1`), every file in `fixtures/pass` must come back clean, and the suspicious flag must fire on a large clean input and clear once one real finding is planted in it. Change a rule, run the self-test.

## Configure: `tokens.json`

| Key | What it is |
|---|---|
| `$source` | where the tokens came from and when: `{ "from": "Figma variables export", "exported": "2026-10-20" }`. The report prints the age |
| `colour` | token name to hex. Used to suggest the token when a raw value matches one: `#1e2328` suggests `var(--text-primary)` |
| `spacing` | the spacing scale in px, `0` included |
| `type.sizes`, `type.weights` | the type scale; `type.rootPx` converts `rem` |
| `lint.forbiddenWords` | words and phrases that never ship, each with an optional `reason` and `instead` |
| `lint.titleCaseAllow` | names that keep their capital (product names, brands) |
| `lint.levels` | per rule `error`, `warn` or `off` |
| `lint.ignore` | globs to skip, e.g. the file that defines the tokens |
| `lint.suspicious.minLines` | input size above which zero findings is reported as suspicious |
| `lint.maxTokenAgeDays` | age in days after which the report calls the tokens stale, 30 by default |

Replace the sample values with the design system's. Generate the file from the token source if there is one, and set `$source.exported` when you do; a hand-copied scale drifts, and an old export drifts too.

## Rules

| Rule | Default | Flags | Does not flag |
|---|---|---|---|
| `raw-colour` | error | hex, `rgb()`, `hsl()`, `oklch()` and friends, named colours, in CSS, style attributes, JSX style objects, SVG `fill` / `stroke`, arbitrary utility values like `bg-[#fff]` | `var()`, `currentColor`, `transparent`, custom property definitions (`--x: #fff`, see the next rule), `content` |
| `off-token-definition` | error | a custom property that defines a raw colour the `colour` map does not have: `--danger: #c9302c`. Suggests the nearest token | definitions whose value is a token colour or a `var()`. Off when `colour` is empty |
| `off-scale-spacing` | error | `margin`, `padding`, `gap` in px or rem that are not on the scale, JSX numbers, `p-[13px]` | `auto`, `%`, values inside `calc()` / `var()`, positions (`top`, `left`), borders |
| `off-scale-font-size` | error | `font-size` outside the type scale, `fontSize: 15`, `text-[13px]` | keywords, `var()` |
| `off-scale-font-weight` | error | weights outside the scale, `font-[600]` | descriptors inside `@font-face` (they describe the font file, not its use) |
| `no-declared-size` | warn | `<small>`, `<sub>`, `<sup>` with no font-size: the browser renders them at `smaller`, 83 % of the parent, so 11.67 px under a 14 px paragraph | a rule that sets a size and reaches the element (`small { … }` everywhere, `.note small { … }` only inside `.note`), from any linted file, a `text-xs`-style utility, an inline `font-size` |
| `transition-all` | warn | `transition: all`, `transition-property: all`, the `transition-all` class | named properties |
| `title-case` | warn | buttons (also `<Button>`) and headings where every word after the first is capitalised | sentence case, acronyms (`PDF`), small words, names in `titleCaseAllow`, a name behind its avatar initials (`AM Alex Morgan`) |
| `forbidden-word` | error | listed words in visible text and in `placeholder`, `title`, `alt`, `aria-label`, `label` | code, class names, comments |

Title Case is a warning because it cannot tell a proper noun from a capitalised word. A person's name with no avatar in front of it still gets flagged; read those and move on. German UI capitalises nouns: set `title-case` to `off` for German-only code, or add the nouns to the allow list.

`no-declared-size` looks across every file in the run, because the rule that sizes `<small>` usually sits in a stylesheet, not in the page. Lint the page without its CSS and every `<small>` looks unsized. A contextual rule counts only where its context is: static HTML is walked with its ancestors, so `.note small` does not size a `<small>` outside `.note`. In JSX and in markup built inside a `<script>`, the context above the fragment is unknown, and a contextual rule is taken to reach it.

## Read the report

```
ui-lint: 8 files, 78 lines, 74 values and labels checked
  tokens: tokens.json, from Figma variables export, exported 2026-10-20, 8 days old
  fixtures/fail/page.html:6:11      error  off-scale-spacing      20px  20px is off the spacing scale (try 16px)
  fixtures/fail/page.html:10:3      warn   title-case             Welcome To Your Dashboard  Title Case in a label, use sentence case (try Welcome to your dashboard)
25 errors, 9 warnings. FAIL
```

- **PASS** = 0 errors **and** not suspicious. Warnings are acceptable.
- **FAIL** = at least one error. Each line gives location, rule, the value it saw, and a suggestion where one exists (nearest scale step, matching token, sentence-case version).
- **SUSPICIOUS** = the run probably did not see the code. Never report PASS on a suspicious run.
- **tokens** = where the token file came from and how old it is, read from its `$source`. Past `lint.maxTokenAgeDays` (30 by default) the line says *stale*: re-export before you trust a finding, because a snapshot that lags the design system flags correct code as wrong. A file with no `$source.exported` says *source date unknown* instead of guessing. The age does not change the exit code; it tells you how much to trust the rest of the report.

## A count of 0 is a bug signal, not a pass

The same rule as in `figma-ds-qa`, where a clean bill of 292 instances turned out to be 1,162 once the traversal reached slot content. A linter that finds nothing on a large input is more often blind than right: wrong paths, an extension it does not read, styles that live somewhere it does not look.

The report marks a run as suspicious when:

- no files were linted (paths or extensions are wrong)
- the input is at least `minLines` long and nothing was found
- nothing checkable was found at all (the parser does not understand this code)

What to do with a suspicious run: plant one known violation (a `color: #123456;`) in a file you linted and run again. If it is not found, the linter is blind on that code; fix the paths or the pattern before trusting any result. If it is found, remove it and report the clean run as confirmed, with the planted check named in the report.

## Rules worth keeping

- **Fix the cause, not the line.** Ten raw colours in one component usually mean one missing token. Ask for the token, or map to the closest one and log the gap.
- **No rule without a fixture.** Every new check gets a failing fixture that proves it fires and a passing one that proves it stays quiet.
- **Taste becomes rules, rules become checks.** When a review keeps catching the same thing by eye, add it here.
- **Let another reviewer find your blind spots.** `off-token-definition`, `no-declared-size`, the `@font-face` exemption and the avatar exemption came from running a second design reviewer over the same prototypes and reading what each one missed.
