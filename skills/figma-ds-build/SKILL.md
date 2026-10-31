---
name: figma-ds-build
description: Build or edit screens and components natively in Figma through the Figma MCP (use_figma) so the result is on the design system, not just visually close. Real library instances by key, colours and spacing bound to variables, text on library styles with no overrides, and clearly marked [local] gap-fillers for what the DS does not publish yet. Runs after figma-ds-preflight and always finishes with figma-ds-qa.
---

# Figma design-system build

Build discipline for an agent working in a real Figma file with a real library. Assumes figma-ds-preflight ran: cache loaded, target page resolved, font strategy known. Read [`HAZARDS.md`](HAZARDS.md) once per session; each item there cost a round.

Keys below are placeholders (`<...>`). They come from the project's keys file (`<KEYS_FILE>`), never from memory.

## Rule 1: Library first

For every element, check in this order (the full decision guide lives in `templates/module-registry.md`):

1. **The DS has it** → instantiate by key.
2. **The module registry has it** → clone the canonical node or apply the pattern.
3. **Neither** → build a `[local]` gap-filler (Rule 2).

```js
const set = await figma.importComponentSetByKeyAsync("<component-set-key>");
const inst = set.defaultVariant.createInstance();
inst.setProperties({ size: "Medium", state: "Default" });   // variant props use clean names
inst.setProperties({ "icon-left#<id>": false });            // TEXT, BOOLEAN, INSTANCE_SWAP props carry a #id suffix
parent.appendChild(inst);
```

- The result is `remote = true`: linked, updates with the master. Read `inst.componentProperties` to get the exact property keys; suffixes differ per component.
- **Default icons are placeholders.** Buttons and badges often ship a default icon (a heart, a star). Turn the boolean off unless the spec wants an icon, and when it does, swap the nested icon instance to the real glyph. An unswapped icon-only button ships as a heart.
- **Status elements and bound components are instantiated fresh, never cloned** from another file or an older frame. Frames may be cloned; bound elements may not (HAZARDS 1).

## Rule 2: Gap governance

When the DS does not publish what the screen needs (`$not-published` in the keys file, rows in the gap log):

1. **Build it token-faithfully** from the DS lead's documented intent: the work-in-progress page, the inventory notes, the nearest published sibling.
2. **Use real DS instances inside the gap-filler.** A `[local] modal` still holds real button instances; a `[local] table` still uses the DS badge in its status column.
3. **Name it `[local] <name>`** so everyone, including QA, sees it is provisional. QA accepts an instance whose own name or whose component set name starts with `[local]`.
4. **Inline first.** An auto-layout frame in the screen. Promote it to a reusable local component only when it recurs across screens.
5. **Log it** in the gap log with the domain it came from. A component two domains need is the strongest case for promotion.
6. **Never publish to the DS.** The library belongs to the DS lead. Gap-fillers are a loan, not a home; the module registry's promotion agenda is where they get decided.

## Rule 3: Bind colour and spacing to variables

- **Colour:** every fill and stroke you create binds to a DS colour variable. Never raw hex.
- **Spacing:** every `itemSpacing`, `counterAxisSpacing` and padding binds to a spacing variable. Only the DS steps exist. Values in between (5, 6, 10, 14, 18, 20) are mapped to the nearest step; if unsure, follow the scale and ask.
- **Zero stays raw.** There is no `spacing/0`.
- **Radius:** raw px on the token scale until the DS publishes radius variables.
- **Centring is a fixed-width content frame,** never a large padding such as 216.
- **Library instances inherit their bindings** from the master. Do not re-bind their internals.

```js
// keys from <KEYS_FILE>; importVariableByKeyAsync works even when
// getAvailableLibraryVariableCollectionsAsync() returns nothing
const v = k => figma.variables.importVariableByKeyAsync(k);

// colour
const surface = await v("<BG/surface/default>");
frame.fills = [figma.variables.setBoundVariableForPaint(
  { type: "SOLID", color: { r: 0, g: 0, b: 0 } }, "color", surface)];

// spacing
const s8 = await v("<spacing/100>"), s24 = await v("<spacing/300>"), s32 = await v("<spacing/400>");
frame.setBoundVariable("itemSpacing", s24);
for (const p of ["paddingLeft", "paddingRight", "paddingTop", "paddingBottom"]) frame.setBoundVariable(p, s32);

frame.cornerRadius = 12;   // raw, on the radius token scale
```

`figma.createAutoLayout()` frames ship with a raw white fill and `clipsContent = true`. Set `fills = []` and `clipsContent = false` on every container you create, then give cards their bound surface fill explicitly (HAZARDS 12).

## Rule 4: Text styles by key, no overrides

Every text node you create or edit gets a published DS text style, applied by key, and nothing on top of it.

```js
const st = await figma.importStyleByKeyAsync("<text-style-key>");
await figma.loadFontAsync(st.fontName);
const t = figma.createText();
await t.setTextStyleIdAsync(st.id);
t.characters = "Save changes";
// never set fontSize, fontName or lineHeight afterwards
```

- **Map roles to styles once,** in the project's `CLAUDE.md`, and stick to it. Example role table:

  | Role | Style |
  |---|---|
  | page title | Heading/H1 |
  | card or panel title | Heading/H3 |
  | field label | Label/Large in the label colour |
  | field value | Body/Large |
  | table cell, list row | Body/Default |
  | "Updated by", helper text | Body/Small |
  | figures | Numeric/* |

- **Need bold?** Pick the bold style (Label, Heading, Numeric), never override the weight of a Body style.
- **Sizes outside the scale do not exist.** No style fits: ask, do not invent a size.
- **Text colour binds to a variable** like any other fill.
- **Exempt:** annotations, canvas captions, mock documents. Text inside DS component internals belongs to the DS; leave it alone and report drift to the DS lead.

## Rule 5: Fonts, when the brand font is not available

Preflight decided the strategy. If it is the fallback:

- **Don't swap gratuitously.** A component default label that is acceptable as is stays in the brand font and renders correctly. Swap only where the characters must change. Less fallback text means more fidelity.
- **Editing an instance label:** load the fallback, set `fontName`, then `characters`.
- **New text:** apply the text style first; if its font cannot load, set the fallback with the same weight and flag the node for the QA run (it reports fallback fonts as info, not as error).
- Say it once to the user, with the real fix: upload the brand font to the Figma organisation as a shared font, then re-probe.

```js
const tn = inst.findOne(n => n.type === "TEXT");
await figma.loadFontAsync({ family: "<FALLBACK_FONT>", style: "Bold" });
tn.fontName = { family: "<FALLBACK_FONT>", style: "Bold" };
tn.characters = "Preview";
```

## Rule 6: Patterns that keep coming back

Generic forms of rulings a DS lead made in review. Put the project's versions in `CLAUDE.md`.

- **Icons bind to icon tokens.** Default `Icon/primary`; status icons keep their status token. Never a base black, a raw colour or an opacity below 1 to fake a muted icon. Recolour line icons through their `strokes`; setting `fills` on the icon instance paints a filled box. Never override `strokeAlign` on line icons: `INSIDE` eats open paths.
- **Field grids are rows, never columns.** A vertical content frame (gap: the row spacing token) holds horizontal row frames (gap: the column spacing token, FILL); each row holds N fields (FILL), the last row padded with empty fillers (`fills = []`). Fill all columns before wrapping. Columns break reading order and the row gap.
- **Label over value, one pair style everywhere:** label style over value style, gap 4, in cards and in the page header alike.
- **Toasts live inside the screen frame:** DS toast instance, absolute, horizontally centred, 24 px above the bottom edge, constraints centre and bottom, pinned while scrolling. One toast at a time, one short sentence.

  ```js
  const set = await figma.importComponentSetByKeyAsync("<toast-set-key>");
  const t = set.children.find(v => v.name === "type=Success").createInstance();
  frame.appendChild(t);
  t.layoutPositioning = "ABSOLUTE";                 // the frame has auto layout
  t.x = Math.round((frame.width - t.width) / 2);
  t.y = frame.height - 24 - t.height;
  t.constraints = { horizontal: "CENTER", vertical: "MAX" };
  frame.numberOfFixedChildren = 1;                  // top layer, pinned on scroll
  ```

- **Every title is a heading style.** No light or custom title text.
- **Real chrome, never placeholder squares.** Logo, nav icons and avatar come from the library. A grey square where the logo goes is a defect, not a draft.
- **Layout follows the work mode,** not habit. Triage, compare, dossier and secondary work each have a layout (module registry, "Layout by work mode"). Stacking another card is one pattern with its own territory, not the fallback.

## Rule 7: Write in small, verified blocks

- One `use_figma` call per coherent block (shell, header, one card, annotations). A throw rolls back the whole call (HAZARDS 2).
- Resolve the target page by id in every call that creates top-level nodes (HAZARDS 3).
- After every block: screenshot the touched region and check it. The call log says what you asked for, the screenshot says what happened.
- Measure alignment with `absoluteBoundingBox` and put the numbers in the report.

## Always finish

Run **figma-ds-qa** on every built or touched frame, in the same session. Never call a build done before QA reports 0 errors and the run is not suspicious. Then report:

- what is a real library instance and what is `[local]` (and whether it was logged)
- registry modules created, changed or found broken
- deviations from the spec and why
- what is still open
