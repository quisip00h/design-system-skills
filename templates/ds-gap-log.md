<!--
  DS GAP LOG TEMPLATE. Copy to <DS_DIR>/ds-gap-log.md.
  Written by the agent during builds (figma-ds-build, Rule 2), read by figma-ds-preflight,
  and taken into the DS sync through the module registry's promotion agenda.
-->

# DS gap candidates

Running list of components and patterns that screens needed and the design system does not publish yet. Each one is built as a token-faithful `[local]` provisional and listed here as a roadmap candidate for the design-system lead.

**Convention:** when the agent builds a gap-filler, it adds a row here in the same round. When the DS publishes the canonical version, the row moves to *Resolved* and the `[local]` instances get swapped for the real one. A component needed by two domains is the strongest case for promotion: always name the domain.

## Open: needed, not yet in the DS

| Component | Needed for | Evidence | Provisional built? | Notes |
|---|---|---|---|---|
| | | | | |

<!--
  Column guide, with an example row:

  | **Tabs** | <domain>: record sections; <domain>: activity filters | two tab patterns on DS work-in-progress pages, neither published | ✅ `[local] tabs` (<node link>) | Token-bound underline; uses the published `badge-counter` inside the tab label, as the DS notes intend. Candidate: publish one tab set with a counter slot. |

  Component     bold name, as the DS would call it
  Needed for    which screens, and which domain(s)
  Evidence      why it counts as missing: search result, unpublished page, dead key
  Provisional   "not yet" / "✅ [local] <name>" with a node link / "partial"
  Notes         how it was built, which DS parts are inside, what to ask the DS lead for

  Regressions belong here too: a component that WAS published and whose key stopped
  resolving gets a row ("REGRESSION <date>"), with the dead key and the workaround.
-->

## New gaps surfaced by a build

<!-- One block per build round, newest first. Short numbered findings that are not
     whole components: a missing token family, a missing glyph, a DS master defect. -->

### `<Build or screen>`, YYYY-MM-DD

1. **`<Finding>`.** What the screen needed, what the DS has instead, what was built meanwhile (`[local]` or flagged raw value), what to ask the DS lead for.

## Resolved

| Component | Published | Swapped in | Note |
|---|---|---|---|
| | | | |
