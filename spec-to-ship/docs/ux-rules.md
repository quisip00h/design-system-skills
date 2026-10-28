# UX rules for every screen

These rules apply to every screen, whatever the spec says about the feature. Cite them by ID in reviews and merge requests ("deviation from UX-07").

## Flow
- **UX-01 Start from the user's job.** Before building, know where the user comes from, what they want to finish and where the screen hands off. A screen that shows every field and leaves the user stuck is wrong.
- **UX-02 Results appear where the work happens.** No extra screen or step that only repeats what the user can already see.
- **UX-03 Keep the context visible while the user decides.** The facts behind a decision stay on screen next to it, with their source.
- **UX-04 Steps show result and source, not mechanics.** "Credit check: no findings, Risk assessment", never "ruleset triggered".
- **UX-05 Lean screens, every element deliberate.** Every element has a reason you can name; if you cannot, remove it. No helper texts or sublines that do not change a decision. Depth comes on demand (open a step, open a record), not via an advanced mode.

## Layout
- **UX-06 The layout follows the work mode.** Triage: list plus side panel. Compare: split view. Dossier: long page with collapsible sections. Secondary task: drawer or modal. Stacked cards are not the default.
- **UX-07 One field grid.** Label and value fields sit on one grid of at most 4 equal columns, gap 24, rows 16 apart, label to value 4. Built as rows of fields, never as columns, so the reading order runs left to right. Fill all 4 columns before wrapping; only the last row may have empty columns. The page header meta row uses the same columns.
- **UX-08 One vertical rhythm.** 32 px between page header, banner and cards.
- **UX-09 Titles stay on one line.** A long title truncates with an ellipsis and a tooltip. Markers go on a second row below it; the primary button keeps its place.
- **UX-10 Alignment is measured, not eyeballed.** One axis per row (mixed sizes centre on the text line), one left edge per column (empty icon slot where a row has no icon), equal tracks for equal siblings, one type scale per row. Measure between visible edges (text, border, filled background), never between invisible boxes or padding. Check with `getBoundingClientRect` before calling it done. Optical correction is allowed only for asymmetric shapes (a chevron or play glyph in a round button) and is noted in the merge request.

## Composition
- **UX-27 Outer padding is at least the inner spacing.** A card, modal or panel never has less space around its content than between its content (card padding 32, field gap 24).
- **UX-28 No two hard divides next to each other.** A border, a divider line and a background change are each a divide; use one. A table inside a card sits directly in the card without its own border; no divider where a card edge already separates.
- **UX-29 One depth style.** Elevation only from the DS tokens. Overlays (modal, drawer, popover, toast) are the only raised layer; an element inside a card never gets its own shadow.
- **UX-30 Nested corners fit.** Inner radius = outer radius minus the gap between them. With a gap at least as large as the outer radius, the inner element keeps its DS radius.
- **UX-31 Heaviest action on the outer edge.** In a button group the primary sits on the outer edge (right), secondary actions inward, tertiary actions such as Undo furthest away.
- **UX-32 Readable line length.** Running text (banner body, decision question, description, empty state) stays below about 70 characters per line (`max-width: 70ch`). Tables and field grids are exempt.
- **UX-33 Icons use the DS icon tokens.** Primary icon colour by default (field, copy, file and navigation icons), the status colour only when the icon is the status. Never a raw colour or reduced opacity.

## State
- **UX-11 One state, one story.** Status badge, header chip, tiles, counts, section badges, row states and enabled actions all come from the same state and never contradict each other.
- **UX-12 Every section owns its states.** Loading (skeleton in the real layout), empty, failed and partial. Retry reloads only that section.
- **UX-13 Empty is not failed.** Empty states a fact about the record and keeps its count (0). Failed states a fact about the request, drops the count and offers Retry. Different copy keys.
- **UX-14 Missing values stay visible.** Show an en dash, never hide the field.
- **UX-15 Controls match the state.** An action that is not allowed in a state is disabled with a tooltip that says why, or not shown. Never clickable and then failing.

## Actions
- **UX-16 One primary action per state, with the highest contrast.** The primary action is the strongest element on the screen; structure (borders, dividers, shadows) stays low contrast. Secondary actions go next to it or into an overflow.
- **UX-17 Actions stay in place.** The primary action sits in the same spot in every case of the same kind.
- **UX-18 Every change can be traced.** Show source, before and after, and who made it. Undo is its own logged step, never a silent deletion.
- **UX-19 Build only what is in scope.** No edit, delete or bulk affordances the spec does not list, not even disabled ones, unless the spec asks for a placeholder.

## Colour
- **UX-20 Only status carries colour.** Origin, type and provenance chips are neutral grey.
- **UX-21 Red only where something is actually blocked or declined.** Warning (amber) for "needs you" and missed deadlines.
- **UX-22 Processing states are DS active blue.** Waiting, pending steps, phase and progress bars use the `active` family; Scheduled stays grey, Done is success, Needs you is warning.

## Copy
- **UX-23 Business language.** Button labels say what happens ("Record the cancellation"), never API constants or internal codes.
- **UX-24 Punctuation.** No em dashes and no middle dots as separators, in UI copy or in specs. Use commas, colons or a new sentence.
- **UX-25 Formats.** British English (-ise). English number format in the English UI (1,250.50). Date `13/03/2026`, date with time `13/03/2026 at 2:30 PM`; German UI `13.03.2026`, `13.03.2026 um 14:30`. German copy uses "Sie".
- **UX-26 Empty and error copy is specific.** Say what is missing and what to do next, in one sentence.

## Design system
- **UX-34 Only what the design system defines.** Every text uses a DS typography style unchanged (Heading H1 to H4, Body Large/Default/Small, Label Large/Default, Numeric Small/Default/Large): no own font size, weight or line height and no override on top of a style. Label and value fields use Label Large (label colour) over Body Large; page title = Heading H1, card title = Heading H3, table cells Body Default. Every gap and padding is a DS spacing token (2, 4, 8, 12, 16, 24, 32, 40, 48, 64 …); values in between (6, 10, 20) do not exist. Colours only from DS tokens, components only from the DS. Form labels look like field labels (Label Large, label colour); every title uses a heading style. If nothing fits, use the closest DS style and list the gap; never invent a size.
- **UX-35 Toasts confirm a finished action.** DS toast only, one at a time, bottom centre of the viewport 24 px above the edge, one short sentence ("Cancellation recorded."). Errors that need action stay on the screen as a banner, not in a toast.

## Where these come from
Lessons from enterprise back-office modules: flow and state rules from case pages, the field grid and rhythm from detail pages, alignment from repeated review rounds. Composition rules UX-27 to UX-33 and the additions to UX-05, UX-10 and UX-16 are adapted from Anthony Hobday's "Visual design rules you can safely follow every time" (anthonyhobday.com/sideprojects/saferules). IDs are never renumbered. Changes go through a merge request, with a line in the repository changelog.
