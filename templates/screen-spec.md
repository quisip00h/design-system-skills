<!--
  SCREEN SPEC TEMPLATE. Copy it next to the build, one file per screen or use case
  (for example specs/uc01-<name>.spec.md), then fill it WITH the designer.

  THE ONE RULE: NEVER INVENT. If the research does not cover a point, ASK the designer
  and fill it in together. A spec built on silent guesses produces the wrong screen.
  When unsure, add it to §10 and ask. Always.

  Tag every claim, the same tags as templates/CLAUDE.md:
    ✓ validated (research, the data contract or a ruling)   ~ assumed (needs validation)
    ? open (blocks the build, must ask)                      ⚠ conflict (two sources disagree)

  Weigh it to the screen: a substantial screen gets the full spec; a simple confirm or empty
  screen needs five lines, not this ceremony.
  Precision core: §2, §3, §5, §8, §9 (where builds go wrong). Quick checks against the live DS: §6, §7.
  Framing: §1, §4, §10.
-->

# Spec: `<Screen name>`

| | |
|---|---|
| **Module** | e.g. onboarding, invoicing, case workspace |
| **Source frame** | Figma frame link, if replicating, or "from research, no frame yet" |
| **Mode** | replicate or enhance |
| **Research refs** | e.g. `research/<area>-synthesis.md`, or "none, assumptions flagged" |
| **Status** | draft, ready to build, built |
| **Date** | YYYY-MM-DD |

---

## §1 User and job to be done *(framing, keep it short)*
<!-- Who uses this, what job they are trying to get done here, in what context. From the research. -->
- **User**:
- **Job to be done**:
- **Context** (where in the flow, how often, how urgent):

## §2 Data model *(precision core)*
<!-- Every field and entity on the screen. If a field is not in the research or the data contract, ASK: do not assume it exists or what shape it has. Labels are the exact UI copy, in the UI language, or the copy key. -->

| Field label (exact copy) | Type | Optional? | Source or computed | Example value | Tag |
|---|---|---|---|---|---|
| | | | | | ✓ ~ ? ⚠ |

## §3 States *(the heart of the spec: QA checks that every row was built)*
<!-- Every state the screen can be in. A missing state is an incomplete build and means rework. If the research does not say which states exist, ASK. -->

| State | Trigger | What is visible or changes | Components | Copy | Tag |
|---|---|---|---|---|---|
| Default or empty | | | | | |
| Loading | | | | | |
| Filled | | | | | |
| Partial | | | | | |
| Error | | | | | |
| Disabled or read-only | | | | | |
<!-- Add or remove rows to match the real screen. Each row becomes a QA check. -->

## §4 Flow *(framing, keep it short)*
<!-- Entry point, steps on this screen, exit. Where each primary action leads. -->
- **Entry**:
- **Primary action**, leads to:
- **Exit or cancel**, leads to:

## §5 Business rules and downstream effects *(precision core)*
<!-- The logic that is invisible but decides the build: validation, when things disable, defaults, what happens on submit, what this screen changes elsewhere. Almost always from the research; if it is not there, ASK. -->
- **Validation**:
- **Disable and enable conditions**:
- **Defaults and pre-fills**:
- **On submit or confirm**:
- **Downstream effects** (what changes elsewhere in the product):
- Tags: ✓ ~ ? ⚠

## §6 Components *(quick check against the DS inventory, do not guess)*
<!-- Map each UI element to a DS component. Published: name plus variant and props. Not in the inventory: mark it [local], and it goes into the DS gap log. -->

| Element | DS component (or [local]) | Variant and props | In the inventory? |
|---|---|---|---|
| | | | ✅ or [local], logged in the gap log |

## §7 Tokens *(quick check, only where it matters)*
<!-- Colours bind to variables. Spacing binds to spacing variables; radius stays raw px on the token scale until the DS publishes radius variables. Only note choices that are not obvious. -->
- Notable colours:
- Notable spacing and layout values (on the scale, e.g. 2, 4, 8, 12, 16, 24, 32, 40):

## §8 Edge cases *(precision core)*
<!-- Long names, zero items, maximum items, permissions, missing data, very long text. From the research where possible; otherwise ASK or mark it assumed. -->
-

## §9 Layout and structure *(precision core: the spatial contract)*
<!-- Regions from top to bottom, primary and secondary, alignment, behaviour at 1024 px and wider. "Right components, wrong arrangement" is the classic wrong build: pin it down here. -->
- **Work mode and layout** (triage, compare, dossier, secondary; see the module registry):
- **Module chrome**: e.g. sidebar and top bar, full width, detail layout
- **Regions** (top to bottom):
- **Hierarchy** (primary, secondary, tertiary):
- **Responsive** (1024 px and wider):

## §10 Open questions: does it block the build? *(the honesty gate)*
<!-- Anything the research cannot answer goes here. Mark whether it BLOCKS the build or can be a labelled assumption. Resolve or explicitly waive it before the build starts. -->

| Question | Blocks the build? | Status |
|---|---|---|
| | yes, or no (assumption is fine) | open (ask the designer), waived, resolved |

---
<!-- Build only after every blocking item in §10 is resolved or explicitly waived. The spec is the build prompt AND the QA checklist. One file, no drift. -->
