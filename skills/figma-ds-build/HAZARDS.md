# Figma build hazards

What broke while an agent built a few hundred back-office screens natively in Figma through the MCP (`use_figma`, Figma Plugin API). Every entry cost at least one round, and most produced a state that looked right in the call log and was wrong on the canvas.

Read the first seven before any build. The rest are lookup material: when something behaves strangely, search this file first.

## The hard seven

### 1. Never clone bound elements across files

Copying a status badge or any variable-bound instance from one Figma file to another **breaks its variable bindings**. It renders black, or in a colour that no longer follows the DS.

- DS components: always a **fresh instance by key** from the published library, in the target file.
- `[local]` components: rebuilding fresh is cheaper than debugging bindings.
- Frames may be cloned; bound elements may not.

### 2. `use_figma` calls are transactional

An exception anywhere in a call **rolls back the entire call**. Everything before the throw is silently undone, and the log of what ran before the throw is not evidence of anything.

Seen: a chained `.layoutSizingHorizontal` on the return value of `appendChild` threw and reverted a whole correction block.

- Split risky writes into separate calls.
- **Screenshot-verify after every block.** Trust the canvas, not the call log.
- Resolve every target first, mutate last (see 11).

### 3. Never create top-level nodes on `figma.currentPage`

The MCP runs inside the designer's live Figma session. `figma.currentPage` is whatever page **they** have open, and it can change while the build runs. A section created with `figma.currentPage.appendChild(...)` landed on the cover page and stayed invisible on the working page for an entire review round.

```js
const page = await figma.getNodeByIdAsync("<TARGET_PAGE>");
await figma.setCurrentPageAsync(page);
page.appendChild(node);
if (node.parent.id !== page.id) throw new Error("landed on " + node.parent.name);
```

### 4. Resizing a section releases its children

Appending to a section is safe. **Shrinking a section re-parents the children it no longer covers** into whatever section lies underneath, keeping their relative coordinates (a row ended up 9,000 px further down, inside the archive section). A section grown too tall swallows the area its neighbour sits in.

- Resize to cover first, then move, then verify `parent.name` and the child count of every section involved.
- After a section grows, restack the sections below it.

### 5. Prototype links cannot cross pages

A navigate or overlay target must sit on the same page as its trigger. **Moving a frame to another page silently kills every reaction pointing at it.** Figma also rejects a reaction whose destination is the node's own frame (an active nav item linking to itself).

- Keep a click path on one page. Document links that would cross pages in a dev note instead.
- Before moving a frame, list the reactions that point at it.

### 6. Subagents must not build or QA

Subagents do not share the Figma session state, and one has discarded unsaved work. Build and QA run **inline in the main session**, with the file open the whole time (autosave). Delegate reading and research, never canvas writes or the QA verdict.

### 7. Cached masters need a manual library update

After the DS lead publishes, instances whose masters were not touched stay on the previous library version until **a human clicks Update** in the Assets panel (Assets, notification icon, *Update all*). The agent cannot do it. Remind the designer after every DS sync, before trusting a QA run against the new version.

## Traversal and slots

### 8. `findAll` does not see inside instances

`frame.findAll(...)` and `findOne` never reach slot content of library instances (an accordion's content slot, a card body). A reaction sweep, a style pass or a QA count from the frame root reports clean while the real content is untouched. Collapsed accordions expose only their title, so their slot content is invisible even to a deep walk: expand, edit, collapse (the slot content survives the round trip).

```js
function deepAll(root) {
  const seen = new Map();
  const add = n => { if (!seen.has(n.id)) seen.set(n.id, n); };
  [root, ...root.findAll(() => true)].forEach(add);
  for (const n of [...seen.values()]) if (n.type === "INSTANCE") n.findAll(() => true).forEach(add);
  return [...seen.values()];   // de-duplicated by id: findAll can return the same instance many times after slot edits
}
```

### 9. A clone made in a call is blind in that call

`findOne` on a frame cloned **in the same call** returns `null` for nodes inside instance slots. Clone in one call, edit in the next, or re-fetch with `getNodeByIdAsync(clone.id)`.

- `clone()` of a node inside a slot lands on the page root, not beside the original. Keep the returned id and re-parent on purpose.
- Instance names inside slot content do not survive a clone (frame names do). Find slot content by component set and text, never by a custom instance name.

### 10. Moving a node out of a slot gives it a new id

After `appendChild`, the old reference is dead and the next call on it throws (and rolls back the call). Take `newParent.children[newParent.children.length - 1]`. Moved slot nodes can also read back empty in later calls while the canvas renders them correctly: collect names and ids before the move and verify by screenshot.

### 11. References go stale under you

- `setProperties` on an instance, and `swapComponent` on a nested icon, **re-key the node ids below it**. Collect target ids first, then process one at a time with a fresh `getNodeByIdAsync`.
- A precomputed list goes stale after `remove()`. Resolve everything first, mutate last, or guard with `n.removed`.
- `parent.children.indexOf(node)` can return -1 for slot content. Use `findIndex(c => c.id === node.id)`.
- Text nodes rename themselves to their content after `characters` is set. Find text by `characters`, not by the old name.
- On slot-based cards: edit or remove slot content first, toggle booleans and variants after, re-fetch in between.

## Layout and geometry

### 12. `createAutoLayout()` frames are not neutral

They ship with a **raw white fill** (QA reports raw fills, the page shows white bands) and **`clipsContent = true`** (a 24 px fixed cell notches a 28 px badge top and bottom; overview screenshots hide it). Empty auto-layout frames used as spacers or fillers keep a height of 100.

```js
const f = figma.createAutoLayout();
f.fills = []; f.clipsContent = false;
```

Cells that hold instances HUG their height instead of fixing it. Empty fillers: FIXED and resized to 1.

### 13. Geometry is stale in the call that creates it

`absoluteBoundingBox` of an instance created in the same call is not computed yet. Position overlays, tooltips and connectors **in a second call**. A node appended to an auto-layout frame ignores `x` / `y` until `layoutPositioning = "ABSOLUTE"`.

### 14. HUG keeps stale heights

After a text style change, a master that grew, or a `resize()`, HUG frames can keep the old height and clip their content. Toggling to HUG is not enough:

```js
n.layoutSizingVertical = "FIXED";
n.resize(n.width, tallestChildHeight);
n.layoutSizingVertical = "HUG";
```

The same applies to width: widening a pane does not relayout slot content inside accordion instances. Set the card FIXED, resize, set it back to FILL; the next call reads the new width.

### 15. Hiding an auto-layout child releases its space

Hiding an 8 px element shifted the whole column 12 px (element plus gap). To keep reference geometry with nothing rendered, keep the node visible and set `fills = []`. Hidden subtrees also keep stale layout: a measured offset inside a hidden state frame does not re-layout and is not worth chasing until it is visible.

### 16. Booleans can hide slots

A component boolean such as `CTA = false` can hide the **whole slot**, content included; the content returns when set back to true. To put one custom action in a banner: keep the boolean on, clear the slot children, append the fresh instance. Fresh instances can also ship a slot visible that cloned ones had hidden (an empty banner bar under every new card title): hide it on every new instance.

### 17. Per-instance geometry on local components is unreliable

Resizing parts inside an instance of a local component stopped persisting (readback stayed at the master's values). Prefer variants, or a detached copy when the bound fills survive the detach.

## Fonts and text

### 18. Load every font before touching pasted or cloned text

`appendChild` of a pasted screen frame throws "unloaded font" for every family in its subtree, and the call rolls back. Collect fonts with `getStyledTextSegments(["fontName"])` over all text nodes and `loadFontAsync` each one first. `getRangeAllFontNames(0, 0)` throws on empty text: filter `characters.length > 0`.

### 19. A fresh call can see only part of a page

`page.findAll` in a fresh call returned 40 of 337 texts. Before any bulk pass, preload the masters, then re-run until the count is stable, and return the total so it can be compared with a known count. A pass that reports a small number on a big page is blind, not done.

```js
await Promise.all(page.findAll(n => n.type === "INSTANCE").map(i => i.getMainComponentAsync()));
```

### 20. DS masters carry their own drift

Components can ship unstyled text, raw fills on icon glyphs or unbound strokes. That belongs to the DS lead: do not restyle DS internals in instances. Override only what is visibly broken (for example `fills = []` on a glyph's white box), and add a gap-log row.

## Reactions and references

### 21. Reaction sweeps need the async setter and a second call

- `node.reactions = []` does not persist on nodes inside library instances. `await node.setReactionsAsync([])` does.
- Cloning a frame with DS instances can bring back the masters' hover and collapse reactions.
- A sweep verified **in the same call** reports clean and is wrong on the next read. Always verify in a separate call, with the deep walk from 8.
- Reactions can be set directly on nested instance children; no hotspot frames needed.

### 22. Transform in place to keep links

To change a state frame's shell (a list becomes a split view), append the new parts to the **existing** frame and move its content into them, instead of building a new frame. The frame id survives, so every reaction that points at it stays valid.

### 23. Import by key can fail, clone can work

Components from a library that is not enabled in the target file throw "not found" on `importComponentByKeyAsync`. Cloning an existing instance from the same file keeps the remote link and its bindings. A reference pasted from another file arrives with raw paints: bind them in a pass afterwards, using the tokens the nearest DS instance uses.

### 24. Trust keys, not names

A DS restructure renamed tokens (`Text/primary` became `Text/default`, `spacing/300` became `spacing/24`) while the keys stayed the same. Skills and notes written before the rename name the old tokens. Resolve by key, and refresh names in the cache after every delta check.

## Working practice

### 25. Parallel calls are fine on different frames

Several `use_figma` calls in one message landed cleanly when each touched a different frame. Calls that mutate the same node stay sequential.

### 26. Metadata hides local internals

`get_metadata` omits the internals of local instances and table rows. Read those with a `use_figma` `findAll` plus `absoluteBoundingBox` before placing anything relative to them.

### 27. Screenshots lie at overview scale

A 2 px notch, a clipped badge or a misaligned value does not show on a whole-frame screenshot. Zoom onto each touched component at full resolution, and measure (`absoluteBoundingBox`, tolerance 0.5 px) instead of eyeballing.
