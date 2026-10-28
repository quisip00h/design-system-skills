<!--
  SCREEN SPEC TEMPLATE — copy to pilot-<name>/spec.md, then fill WITH the designer.

  ╔══════════════════════════════════════════════════════════════════════╗
  ║ THE ONE RULE: NEVER INVENT. If research/ doesn't cover a point, ASK    ║
  ║ the designer and fill it together. A spec built on silent guesses        ║
  ║ produces the wrong screen. When unsure → §10 + ask. Always. No excuses.║
  ╚══════════════════════════════════════════════════════════════════════╝

  Tag every claim:  [researched] fact from research/  ·  [assumed] needs validation  ·  [open] blocks build, must ask
  Weight to complexity: substantial screen → fill fully. Simple confirm/empty screen → a 5-line spec in the pilot README is enough (don't make this ceremony).
  Precision core = §2 §3 §5 §8 §9 (the ambiguity zones). §6 §7 = quick verify vs the live DS. §1 §4 §10 = framing.
-->

# Spec — `<Screen name>`

| | |
|---|---|
| **Module** | e.g. Onboarding / Invoicing / Case workspace |
| **Source frame** | Figma URL + node-id (if replicating) — or "from research, no frame yet" |
| **Mode** | Replicate / Enhance |
| **Research refs** | e.g. `research/<area>-synthesis.md §…` (or "none — flag assumptions") |
| **Status** | draft / ready-to-build / built |
| **Date** | YYYY-MM-DD |

---

## §1 · User & JTBD *(framing — keep short)*
<!-- Who uses this, what job are they trying to get done here, in what context. From research §User. -->
- **User**:
- **Job-to-be-done**:
- **Context** (where in the flow, frequency, urgency):

## §2 · Data model *(precision core)*
<!-- Every field/entity on the screen. If a field isn't in research/data, ASK — don't assume it exists or its shape. Labels = exact German copy inline. -->

| Field (DE label) | Type | Optional? | Source / computed | Example value | Tag |
|---|---|---|---|---|---|
| | | | | | [researched/assumed/open] |

## §3 · States *(❤ HEARTPIECE — the state matrix. QA verifies every row was built.)*
<!-- Enumerate EVERY state the screen can be in. Missing a state = incomplete build = rework. If research doesn't say which states exist, ASK. -->

| State | Trigger | What's visible / changes | Components | Copy (DE) | Tag |
|---|---|---|---|---|---|
| Default / empty | | | | | |
| Loading | | | | | |
| Filled | | | | | |
| Partial | | | | | |
| Error | | | | | |
| Disabled / read-only | | | | | |
<!-- Add/remove rows to match the real screen. Each row here becomes a QA check. -->

## §4 · Flow *(framing — keep short)*
<!-- Entry point → steps on this screen → exit/next. What each primary action leads to. -->
- **Entry**:
- **Primary action(s)** → leads to:
- **Exit / cancel** → leads to:

## §5 · Business rules + downstream *(precision core)*
<!-- The logic that's invisible but determines the build: validation, when things disable, defaults, what happens on submit, what this screen affects elsewhere. Almost always from research — if not there, ASK. -->
- **Validation**:
- **Disable / enable conditions**:
- **Defaults / pre-fills**:
- **On submit / confirm**:
- **Downstream effects** (what changes elsewhere in the product):
- Tags: [researched/assumed/open]

## §6 · Components *(verify stub — check against design-system/components/inventory.md, do NOT guess)*
<!-- Map each UI element to a DS component. If published → name + variant/props. If NOT in inventory → mark [local] and it auto-becomes a ds-gap-candidate. -->

| Element | DS component (or [local]) | Variant / props | In inventory? |
|---|---|---|---|
| | | | ✅ / [local] → ds-gap-candidates.md |

## §7 · Tokens *(verify stub — only where it matters; check tokens/)*
<!-- Colours bind to Variables. Spacing binds to spacing variables where the DS publishes them; radius stays raw px on the token scale. Only note non-obvious token choices. -->
- Notable colours:
- Notable spacing/layout values (on scale 2/4/8/12/16/24/32/40):

## §8 · Edge cases *(precision core)*
<!-- Long names, zero items, max items, permissions, missing data, very-long text. From research where possible; otherwise ASK or mark assumed. -->
-

## §9 · Layout & structure *(precision core — the spatial contract)*
<!-- Regions top→bottom, what's primary vs secondary, alignment, responsive ≥1024px. "Right components, wrong arrangement" is a classic wrong-build — pin it here. -->
- **Module chrome**: e.g. sidebar + top bar / full-width / detail layout
- **Regions** (top → bottom):
- **Hierarchy** (primary / secondary / tertiary):
- **Responsive** (≥1024px behaviour):

## §10 · Open questions — blocks build? *(the honesty gate)*
<!-- Anything not resolvable from research = listed here. Mark whether it BLOCKS the build or can be a labelled assumption. Resolve or explicitly waive before Phase 2. -->

| Question | Blocks build? | Status |
|---|---|---|
| | yes / no (assumption OK) | open → ask the designer / waived / resolved |

---
<!-- Build only after §10's "blocks build?" items are resolved or explicitly waived. The spec is the brief (Phase 2) AND the QA checklist (Phase 3). One file, no drift. -->
