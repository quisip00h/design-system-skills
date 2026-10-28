# Examples

## `qa-report.json`

What [`figma-ds-qa`](../skills/figma-ds-qa/SKILL.md) returns for a set of 15 frames. The data is invented; the shape is the real one.

- `ok` counts what passed: library instances, bound fills, text in the brand font, text on an unchanged library style.
- `errors` and `warnings` count the `issues`; each issue names the node, the level and what is wrong.
- `suspicious` says whether the run probably saw the content at all.

Verdict for this run: **FAIL**, 5 errors. A raw fill on the header, one text without a style, one override on top of a style, one gap off the scale, and a local instance that should be a library component or carry `[local]`. The two raw strokes are warnings, the fallback font on a mock document is info. Each error gets a fix: bind the fill, apply the nearest library style, snap the gap to the scale and bind it, swap in the library instance.

**PASS** needs 0 errors **and** `suspicious: false`.

## Why `suspicious` exists

The first version of the QA skill audited 15 frames of a detail page and reported this:

```
naive traversal       292 library instances   0 errors   PASS
slot-aware traversal  1,162 library instances  real errors
```

Same frames, same file. The difference is one line of traversal.

```js
// naive: stops at library instances, never sees what was put into them
frame.findAll(n => n.type === "INSTANCE");

// slot-aware: library internals stay trusted, slot content is ours and gets audited
if (n.type === "INSTANCE") {
  n.children.filter(c => c.type === "SLOT").forEach(s => s.children.forEach(check));
}
```

On that page every section was an accordion instance, and the whole body of each section sat in the accordion's content slot. The naive pass audited the page chrome, found it clean, and reported PASS on a page whose content it had never visited. Nothing in the result looked wrong; a clean bill is exactly what a blind check produces.

So the QA skill now distrusts its own good news. A run that counts no library instances, or very few for the size of the selection, is flagged `suspicious`, and a suspicious run is never reported as PASS. Fix the selector or the slot descent and run again. [`ui-lint`](../skills/ui-lint/SKILL.md) applies the same rule to code: zero findings on a large input is a bug signal, not a pass.
