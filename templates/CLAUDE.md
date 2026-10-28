<!--
  AGENT GOVERNANCE TEMPLATE. Copy to the root of the design workspace as CLAUDE.md
  (or AGENTS.md), replace every <placeholder>, delete what does not apply.
  The rules below come from a real enterprise back-office build. The "why" under a
  rule is the failure that produced it. Keep the why: an agent follows a rule it
  understands more reliably than one it was only told.
-->

# `<PROJECT>`: guide for the agent

Read this first in every session.

## Active work

| Track | Spec (read this) | Figma target | State |
|---|---|---|---|
| `<track>` | `<path/to/spec.md>` | file `<TARGET_FILE>`, page `<TARGET_PAGE>` | *what is built, what is next* |

- **Design system:** library `<DS_LIBRARY_FILE>`, local cache in `<DS_DIR>/` (keys, inventory, tokens, gap log). Owner: the design-system lead.
- **Module registry:** `<REGISTRY>`. Read before any build (Standing rule 5).
- **Never touch:** `<frozen pages, archives, the DS playground>`.
- **Never mix tracks.** If a request is ambiguous about the module or version, ask.

**The standing handoff sentence** is *"re-read the spec, work the open build points."* Each spec carries an **Open build points** block at the top. That block is the living anchor of the iteration: update it (done, new, blocked) at the end of every round.

## Working from a spec

The spec is the single source and doubles as the build prompt (`templates/screen-spec.md`). It has already made the design decisions, so on an execution task **do not ask "replicate or enhance?"** and do not re-open settled questions.

1. Read the spec named in *Active work*, plus its companions.
2. Work the **Open build points** in the stated order. Stop at the stated review gates.
3. Build natively in Figma through the non-negotiable cycle below.
4. Report what was built, what deviated and why, what is still open. Update the Open build points block.

**When the spec is thin on a point, ask the designer. Never invent.** A field, a state, a rule or a copy line that is not in the spec or the research is a question, not a gap to fill with a plausible guess.

Tag every claim:

| Tag | Meaning |
|---|---|
| `✓` validated | confirmed by research, the data contract or a ruling |
| `~` assumed | plausible, built, still needs validation |
| `?` open | unknown; blocks the build or is waived explicitly |
| `⚠` conflict | two sources disagree; do not pick one silently |
| `◆ GAP` | the screen needs it, the data contract does not have it |

**Every `◆ GAP` gets a dev box** next to the frame (see Annotation policy). Those boxes are the developer handover: they list what the backend has to add.

## Building natively in Figma

### Non-negotiable: preflight → build → QA

For any work through the Figma MCP (`use_figma`), run the three skills in order, every time, even when a skill did not trigger on its own:

1. **figma-ds-preflight**: load the DS cache, confirm the target, check library drift and fonts. Never call `use_figma` to build without it.
2. **figma-ds-build**: library first, variables bound, text styles by key, `[local]` gap governance.
3. **figma-ds-qa**: audit every built or touched frame. **A build is not done until QA reports 0 errors on a run that is not suspicious.** Warnings and info are fine.

If the skills are not registered in this session, follow their `SKILL.md` by hand: same steps, same order.

**Run QA inline, in the same session. Never delegate the build or the QA to a subagent.** Subagents do not share the Figma session state and have discarded unsaved work. Keep the file open for the whole build (autosave).

### Session-start check (first Figma request of a session)

1. **MCP connection.** Confirm the write tools respond (`use_figma`, `search_design_system`). Servers disconnect mid-session; if one is down, say so instead of failing silently.
2. **DS freshness.** If the DS lead published, or the cache is old, offer a delta check against `$last-delta` in the keys file. Known dead keys: `<list or none>`.
3. **Font reality.** Probe the brand font (listed and loadable). Expected: `<available | fallback>`. If the probe fails, use the fallback strategy and say so once.

### Hard hazards

The full list with fixes is in `skills/figma-ds-build/HAZARDS.md`. The ones that cost the most:

1. Never clone bound elements across files; instantiate fresh by key.
2. A throw rolls back the whole `use_figma` call. Small blocks, screenshot after each.
3. Never create top-level nodes on `figma.currentPage`; resolve the page by id.
4. Resizing a section releases the children it no longer covers. Resize, place, verify.
5. Prototype links cannot cross pages.
6. After a DS sync, untouched instances stay on the old version until a human clicks *Update all* in the Assets panel. Remind the designer.

### Missing DS components

Use real DS instances for everything that is published, even inside a gap-filler. Build the missing piece token-faithfully, name it `[local] <name>`, inline first, log it in `<GAP_LOG>` with its domain, never publish to the DS. **Reconcile before building:** compare the spec's `[local]` list with the gap log and the registry, and report mismatches instead of inventing components.

## Annotation policy

- **Dev boxes never sit inside a screen frame.** Put numbered pins (①②③, numbered per screen) on the affected regions, and one `<Screen>, dev notes` frame to the right of the screen holding the boxes.
- **Product warnings are UI, not annotation.** Banners and badges that the user would see stay in the frame.
- **Tooltips are hover states.** Never statically visible on a default frame; show them only on zoomed detail frames.
- Annotations are exempt from DS styling. Product UI is not.

## Standing rules: apply to every artifact

### 1. No em dashes

Not in UI copy, not in specs, not in dev notes. Use a comma, a colon, a full stop or a new sentence. Real people do not type them, and a screen full of them reads as generated.

### 2. No middle dots as separators

Not in UI copy, not in specs, never in an input field (nobody searches with middle dots). Use commas ("Registered office, Berlin, Active"). One date and time format per language, for example EN `24/07/2026 at 9 AM`, DE `24.07.2026 um 09 Uhr`. *Fill in the project's format.*

### 3. A technical spec is never only a data spec

Think the UI through from the flow and the process. Meeting the field list is not the job. Before building, answer: where does the user come from, what are they trying to finish, what is the next step, where does this screen hand off to. A screen that satisfies the data model and leaves the user stranded is a failed screen.

Concretely: reuse existing modules instead of inventing parallel ones, keep the context visible while a decision is made, put results inline where the work happens, and never add a step that only restates what the user can already see.

**Why:** an intake flow first shipped as a parallel world: its own table, its own shell, one card per result. It satisfied the spec and still read as a foreign body inside the product. It was rebuilt on the existing board modules with a workspace flow. Cost: a full extra round.

### 4. A cloned state frame is guilty until proven consistent

State screens are made by cloning, so every clone silently inherits the source state everywhere you did not touch. Changing the one thing the new state is about is never enough. Before calling a state frame done, make all of this agree:

| Check | Typical inherited lie |
|---|---|
| Page-header status badge | a decided case still reads `In review` |
| Header chip and its action | `Approval blocked, 5 items need review` on a case that is cleared |
| Status tile, value and next-step line | `Next: review the 5 items` on a finished case |
| Section aggregate and count badge | `Clear, 4 items` while a sibling group still reads `1 of 1 open` |
| Every row in every panel | rows on `Pending` after the step they wait for has finished |
| Sibling groups you did not edit | one group left open while the headline says all assessed |
| Related panels | `Document missing` on a row while the files panel lists the document |
| Enabled actions | `Approve` clickable on a blocked case, or a button labelled *Approve* wired to decline |
| Counts vs visible seed | totals not updated after a row was added |
| `Updated by` lines | the same timestamp on every state, including decided ones |

Colour law while checking: verdicts carry colour, processing states (`Open`, `Escalated`, `Decided`) stay neutral, origin chips stay grey, red only where the case is actually blocked or declined.

**Why:** this failure hit four times in one session. Each time the screen looked finished and told two different stories. A human reviewer caught all four, not the build.

### 5. Module registry before canvas

`<REGISTRY>` is the reuse layer between the DS and the domain specs (`templates/module-registry.md`).

- **(a)** Every build session reads it first and applies its decision guide: DS key → registry clone → new `[local]` (register it) → domain-only. No element is framed from scratch if its module exists, whatever domain it came from.
- **(b)** Every session report names modules created, changed or found broken. New reusable modules get a registry entry in the same round.
- **(c)** Layout is not a default. Classify the screen's work mode and take the layout from the registry (triage → list with side panel, compare → split view, dossier → long page with anchor nav, secondary → drawer or tab). Card stacking is one pattern with defined territory, not the fallback.

**Why:** the parallel-world rebuild (rule 3) and a layout audit that found every screen had converged on stacked cards share one root: the build loop started from the requirement, not from the inventory. Per-prompt module lists fixed single sessions; the registry fixes the project.

### 6. Alignment is built in and measured, never eyeballed

Applies to Figma frames and HTML prototypes alike. A change is not done until the geometry of every touched component is measured and the numbers are in the report.

**Build it right:**

| Rule | What broke without it |
|---|---|
| **One axis per row.** Elements of different sizes in one row sit in one group (auto layout or flex, align centre) on the line of the text they belong to. | Key cap and radio 2 px apart, both off the title line |
| **One edge per column.** Values in a list start at the same x. Rows without an icon get an empty icon slot of the same width. | Values with and without a check mark started at different x |
| **Reserve space for anything absolute.** Padding on that side = its width plus at least 8. | A key cap covered the card title |
| **Equal siblings get equal tracks.** Stats, cards and tiles in a row use equal fixed or `fr` tracks. | Three numbers unevenly spaced because their labels differ in length |
| **One type scale per row.** Labels, values and links in one row share size and colour with the reference. | Header meta values in three sizes (11, 14, 16) |
| **Styles hit only what they mean.** HTML: style by own class, never by descendant tag selectors; prefix a new feature's classes. Figma: set FILL or HUG explicitly inside instances. | A `.card span` rule turned values grey; a select box stayed 486 px inside 524 |

**Check it before reporting done:**

1. Measure every touched component in every instance and state (Figma `absoluteBoundingBox`, HTML `getBoundingClientRect`).
2. Compare left and right edges per column, vertical centres per row, gaps between siblings. Tolerance 0.5 px.
3. Zoom a full-resolution screenshot onto each touched component. Overview screenshots do not show 2 px.
4. Put the numbers in the report in one line, e.g. "centres 519, 519, 519; value x 141 in all 8 rows".
5. One defect found means checking its siblings: the same cause usually sits elsewhere too.
6. Measure between visible edges (text, border, filled background), never between invisible boxes.

**Composition** (IDs from `spec-to-ship/docs/ux-rules.md`): outer padding at least the inner spacing (UX-27), never two hard divides next to each other (UX-28), one depth style (UX-29), inner radius = outer radius minus the gap (UX-30), heaviest action on the outer edge (UX-31), running text below about 70 characters (UX-32), icons on DS icon tokens (UX-33).

**Why:** one prototype session spent four rounds on alignment fixes, after four similar rounds in an earlier build. A human caught every one. Each had a structural cause from the table above, and none was visible in an overview screenshot.

### 7. Only what the DS defines: typography and spacing

Every text uses a published DS text style, unchanged. No custom size, weight or line height, no override on top of a style, no styles from another scale. Exempt: annotations, canvas captions, mock documents.

*Fill in the role table: which style for page title, card title, field label, field value, table cell, helper text, figures. Example in `skills/figma-ds-build/SKILL.md`, Rule 4.*

- Sizes outside the scale do not exist. Map to the nearest role; if none fits, ask.
- A bold variant of a regular style is a different style, never an override.
- Text inside DS component internals belongs to the DS: report it, do not restyle it.
- **Spacing is a DS variable too.** Every gap and padding binds to a spacing variable. *Fill in the scale, e.g. 2, 4, 8, 12, 16, 24, 32, 40, 48, 64, and the fixed rhythm, e.g. label to value 4, field rows 16, field columns 24, card padding 32, page sections 32.*
- **DS rulings from review:** *fill in the project's versions: form labels, icon tokens, field grids as rows, titles as headings, toast placement.*

**Why:** an audit found about 1,880 of 3,250 texts in one handover file and about 3,900 of 4,760 on one master page without a DS style, plus 11 and 13 px labels the DS does not have. Both files used the same library, so the drift came from the build, not the DS. The same audit found 219 of about 3,400 gaps and paddings bound to a variable. After this rule and the matching QA checks: 97.8 % of new text on DS styles, 92.6 % of spacing on the scale.

## Conventions

- `<DS_DIR>/` is a read source, edited only when the DS lead publishes.
- Only status is colour-coded. Origin, provenance and type chips are neutral.
- *Language governance: which language for UI chrome, specs, domain prose, data.*
- *Scope: prototype, not production. No production error handling, no real APIs.*

## Quick commands

| When the user says | Do this |
|---|---|
| "work the open build points" | read the spec in *Active work*, work its Open build points in order |
| "build `<screen>`" | spec → preflight → build → QA |
| "is this on-system?" | figma-ds-qa on the frame |
| "does a module for X exist?" | registry decision guide: DS key → registry clone → new `[local]` → domain-only |
| "what's the token for X?" | `<DS_DIR>/tokens/` first |
| "update the DS" | delta check: DS changelog vs `$last-delta`, then refresh what changed |
