<!--
  MODULE REGISTRY TEMPLATE. Copy next to the domain specs, e.g. shared/module-registry.md.
  Every build prompt reads it before the canvas is touched (CLAUDE.md Standing rule 5).
  The tables are empty on purpose: a module enters when it has a canonical source.
-->

# Module registry: the reuse layer between design system and domain specs

**Version:** v0.1, YYYY-MM-DD. **Scope:** the whole project. Every domain spec references this file; every build reads it first.

**Companions:** `<DS_DIR>/figma-keys.json` (DS keys), `<GAP_LOG>` (what the DS does not publish), the domain specs.

## 1. Why this file exists

Two failures, one lesson:

- **The parallel world.** An intake flow was built as its own table, its own shell, one card per result. It satisfied the field list, read as a foreign body inside the product, and was rebuilt from scratch on the existing board modules. Cost: a full round.
- **The card-stacking default.** A layout audit found that every screen had converged on "append another card to a longer page". Nobody chose that. The toolchain did.

Same root: **the build loop starts from the requirement, not from the inventory.** A per-prompt "find the existing module and clone it" fixes one session. This registry fixes the project: one place that answers *does this already exist, where, and how do I use it correctly*, across domains, so the second domain reuses the first and the third reuses both.

### Layer model

| Layer | Owner | Contains | Source of truth |
|---|---|---|---|
| **Design system** | the design-system lead | tokens, published components | the library + the keys file |
| **Module registry** *(this file)* | the product designer | composed, reusable page modules, interaction patterns, conventions, `[local]` components awaiting promotion | this file |
| **Domain specs** | per domain | screens, states, domain rules, data contracts | `<spec files>` |

Rule of thumb: **if a second domain could need it, it is registry material.** Domain-only logic stays in the domain spec.

## 2. Governance: five standing rules

1. **Registry before canvas.** Every build prompt starts with: *"Read the module registry. For every element you are about to create, check it first. Clone or instantiate what exists, build new only for what does not, and flag it."* No screen is framed from scratch if its module exists.
2. **Registry after build.** Every session report names modules created, changed or found broken. New reusable modules get an entry in the same round. An unregistered module does not exist for the next session.
3. **One canonical source per module.** Each module has exactly one master node or DS key. Clones inherit from it; parallel re-implementations are bugs, not variants. When a module improves, the entry points at the newest canonical node and notes the old one as superseded.
4. **Promotion path `[local]` → DS.** Local components are a loan, not a home. Every `[local]` entry carries a promotion status (`candidate`, `raised`, `declined, stays local`). Section 6 is the standing agenda for the DS sync.
5. **Cross-domain naming.** A module keeps its name in every domain. Domain prefixes name screens, never modules.

## 3. Modules

Origin legend: **DS** = published component. **<domain>** = domain build where the canonical instance lives. **[local]** = local component, promotion status in section 6.

Column guide: *Canonical source* is a node link or DS key, never a description. *Reuse rule* says how to use it correctly. *Pitfalls* is what went wrong last time.

### 3.1 Shell and navigation

| Module | Canonical source | Origin | Reuse rule | Pitfalls |
|---|---|---|---|---|
| | | | | |

### 3.2 Page modules

| Module | Canonical source | Origin | Reuse rule | Pitfalls |
|---|---|---|---|---|
| | | | | |

### 3.3 Tables and lists

| Module | Canonical source | Origin | Reuse rule | Pitfalls |
|---|---|---|---|---|
| | | | | |

### 3.4 Panels, sections and editing

| Module | Canonical source | Origin | Reuse rule | Pitfalls |
|---|---|---|---|---|
| | | | | |

### 3.5 Decision and comparison surfaces

| Module | Canonical source | Origin | Reuse rule | Pitfalls |
|---|---|---|---|---|
| | | | | |

### 3.6 Status, feedback and files

| Module | Canonical source | Origin | Reuse rule | Pitfalls |
|---|---|---|---|---|
| | | | | |

### 3.7 Section states (loading, empty, failed, partial)

| Module | Canonical source | Origin | Reuse rule | Pitfalls |
|---|---|---|---|---|
| | | | | |

### 3.8 Conventions (project-wide, enforce in every build)

Starting set from the source project. Keep, change or delete; each one exists because its absence cost a round.

- **The signal carries the anchor, never the row.** When a list row must reach two places (the parent record and a section inside it), the row keeps one fixed destination and the status signal in the row becomes the second, anchored affordance. A row whose destination is conditional moves hidden logic into the target instead of removing it.
- **Field grid.** Label and value fields sit on one grid of at most N columns, all FILL, one gap. Fill every column before wrapping; only the last row gets empty fillers, never a wider column. The page-header meta row uses the same columns.
- **One primary.** Exactly one enabled primary action per frame and state; secondaries retire to overflow.
- **Writing.** No em dashes, no middle dots in UI copy, one date and time format per language. Actions in business language, never API constants.
- **Annotation.** Numbered pins on the regions, dev-note frames to the right of the screens. Nothing pin-shaped inside frames, no annotation as field content.
- **State semantics.** Visible rows satisfy the frame's own filter state, counts match the seed, and no panel, tile, chip or badge contradicts another on the same frame.
- **Fresh instantiation.** Status elements and bound components are instantiated fresh by key, never cloned. Frames are cloned; bound elements are not.
- **Clone sweep.** Every cloned state frame gets a full-content sweep, not a diff-only check.
- **QA floor.** 0 binding errors, 0 raw fills in product UI, 0 pins inside frames, plus the semantics check. "0 binding errors" alone is not done.

## 4. Layout by work mode

Layout is chosen, not inherited. Classify the screen first, then take its layout from this table.

| Work mode | The user is… | Layout | Registry modules it needs |
|---|---|---|---|
| **Triage** | working down a queue, one item after another | dense list + detail side panel, list stays visible, next and previous | dense table, detail side panel |
| **Compare** | deciding between two versions or sources | split view: reference left (read-only), candidate right, verdict at the comparison | split-view scaffold, diff chips |
| **Dossier** | reading or checking one record in depth | long page with a sticky anchor nav (mandatory above about three viewports) | anchor nav rail, section cards |
| **Secondary** | doing a side task without losing the main context | drawer or tab | drawer, tabs |
| **Stacked cards** | scanning a short record with a few independent sections | card stack | section card |

Stacked cards are a pattern with this territory, not the fallback when nobody decided. If a screen does not fit a row, add a row here before building it.

## 5. Decision guide: where does a new element go?

1. **Does the DS have it?** → instantiate by key (delta check first).
2. **Does the registry have it?** → clone the canonical node or apply the pattern.
3. **Neither, but a second domain could need it** → build as `[local]`, register it (rule 2), add it to section 6.
4. **Domain-only** → build in the domain, document it in the domain spec only.

When unsure between 3 and 4: register it. An over-full registry is cheap; a re-invented module costs a round.

## 6. Promotion agenda for the DS sync (standing)

The concrete surface for the conversation with the design-system lead. Each row is decided with evidence: where it was needed, how often, in which domains.

Status vocabulary: `candidate`, `raised YYYY-MM-DD`, `blocking` (a layout or screen waits for it), `published` (move the row to the changelog), `declined, stays local`.

| Item | Status | Evidence and note |
|---|---|---|
| *Example: overlay backdrop (scrim) colour token* | *raised, blocking* | *The library has no scrim variable, so every modal and overlay in every domain keeps one raw fill. It is the only raw fill left in product UI, which makes it the cheapest DS fix outstanding. Needs one semantic token at the established opacity.* |
| | | |

**Sequencing rule:** DS sync before screen adjustment. A layout retrofit that depends on a `blocking` item does not start before it is confirmed whether the DS builds it or the project composes it. Concept frames may proceed, marked DS-pending.

## 7. Changelog

- **v0.1 (YYYY-MM-DD):** initial registry.
