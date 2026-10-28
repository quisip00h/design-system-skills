---
name: figma-ds-qa
description: Prove that an agent-built Figma frame is actually on the design system, not just visually right. Traverses every node and flags raw fills, unstyled or overridden text, off-scale or unbound spacing, unexpected fonts and local instances that should come from the library. Run after every agent build, or on demand ("QA this frame", "is this on-system?").
---

# Figma design-system QA

Agents can build screens that look right and are disconnected from the design system underneath: raw hex instead of variables, a 13 px text with no style, a hand-drawn button next to the real one. This skill checks the build after the fact, through the Figma MCP (`use_figma`), and returns a compliance report.

## Configure once per design system

Set these at the top of the script:

- `SCALE`: the spacing scale of the design system
- `BRAND_FONTS`: font families that count as on-system
- `FALLBACK_FONTS`: families tolerated as a known fallback (reported as info, not error)
- `EXEMPT_FONTS`: families for annotations and dev notes, never audited
- `LOCAL_PREFIX`: the name prefix for deliberate gap-fillers that are not in the library yet (default `[local]`)

## Read this before trusting any number

**A plain `frame.findAll(...)` does not descend into library instances, and neither does a recursion that stops at `remote === true`.** That sounds harmless until the content lives inside an instance. On a detail page where every section is an accordion instance, the whole panel body sits in the instance's **slot**, so a root-level traversal never sees a single row.

Measured on a real screen set: the naive traversal reported **292 instances and a clean bill**. The corrected one found **1,162 instances** on the same 15 frames. The clean bill had audited the page chrome and nothing else.

Two rules follow, and the code implements both:

1. **Descend into `SLOT` children of library instances.** Slot content is authored by you and the agent, so it is exactly what QA exists to check. The master's own internals stay trusted and unvisited.
2. **A count of 0 is a bug signal, not a pass.** If a selector returned nothing, or the instance count looks low for the screen set, the traversal is blind. Fix it and re-run instead of reporting PASS.

```js
// ---- configure ----
const ROOT_ID = "<frame-id>";
const SCALE = [2, 4, 8, 12, 16, 24, 32, 40, 48, 64, 80, 96, 128, 160];
const BRAND_FONTS = ["<Brand font>"];
const FALLBACK_FONTS = ["Inter"];
const EXEMPT_FONTS = ["IBM Plex Mono"];
const LOCAL_PREFIX = "[local]";
// -------------------

const root = await figma.getNodeByIdAsync(ROOT_ID);
const issues = [];
const ok = { libraryInstances: 0, boundFills: 0, brandText: 0, fallbackText: 0, styledText: 0 };
const textStyleChecks = [];
const add = (n, level, issue) => issues.push({ id: n.id, name: n.name, level, issue });

function isBound(node, prop) {
  const b = node.boundVariables && node.boundVariables[prop];
  return !!b && (Array.isArray(b) ? b.length > 0 : true);
}

function check(n) {
  if (n.type === "INSTANCE") {
    const mc = n.mainComponent;
    if (mc && mc.remote) ok.libraryInstances++;
    // A local instance keeps whatever name it was given; the [local] mark can sit on its component set instead.
    else if (![n.name, mc && mc.name, mc && mc.parent && mc.parent.name].some(s => s && s.startsWith(LOCAL_PREFIX)))
      add(n, "error", "local instance, not from the library and not marked " + LOCAL_PREFIX);
    // Slot content is ours, not the master's. Without this the audit is blind.
    if ("children" in n) n.children.filter(c => c.type === "SLOT").forEach(s => (s.children || []).forEach(check));
    return;
  }

  if ("fills" in n && Array.isArray(n.fills) && n.fills.some(f => f.visible !== false && f.type === "SOLID")) {
    if (isBound(n, "fills")) ok.boundFills++;
    else add(n, "error", "raw fill, not bound to a variable");
  }
  if ("strokes" in n && Array.isArray(n.strokes) && n.strokes.length && !isBound(n, "strokes")) {
    add(n, "warn", "raw stroke, not bound");
  }

  if (n.type === "TEXT" && n.fontName !== figma.mixed) {
    const fam = n.fontName.family;
    if (EXEMPT_FONTS.includes(fam)) { /* annotation, skip */ }
    else {
      if (BRAND_FONTS.includes(fam)) ok.brandText++;
      else if (FALLBACK_FONTS.includes(fam)) { ok.fallbackText++; add(n, "info", "fallback font " + fam); }
      else add(n, "error", "unexpected font: " + fam);

      const sid = n.textStyleId;
      if (!sid) add(n, "error", "text without a design-system text style: " + n.fontSize + "px");
      else if (sid === figma.mixed) add(n, "error", "mixed text styles in one node");
      else textStyleChecks.push(n);
    }
  }

  if (n.type === "FRAME" && n.layoutMode && n.layoutMode !== "NONE") {
    const fields = ["paddingLeft", "paddingRight", "paddingTop", "paddingBottom"];
    if (n.primaryAxisAlignItems !== "SPACE_BETWEEN") fields.push("itemSpacing");
    if (n.layoutWrap === "WRAP") fields.push("counterAxisSpacing");
    for (const k of fields) {
      const v = n[k];
      if (typeof v !== "number" || v <= 0) continue;
      if (!SCALE.includes(v)) add(n, "error", `${k} ${v}px is off the spacing scale`);
      else if (!isBound(n, k)) add(n, "error", `${k} ${v}px not bound to a spacing variable`);
    }
  }

  if ("children" in n) n.children.forEach(check);
}

check(root);

// Text must use a library style, unchanged
const styleCache = {};
for (const t of textStyleChecks) {
  const sid = t.textStyleId;
  if (!(sid in styleCache)) styleCache[sid] = await figma.getStyleByIdAsync(sid);
  const st = styleCache[sid];
  if (!st || !st.remote) { add(t, "error", "text style is not a library style"); continue; }
  const sameFont = t.fontName !== figma.mixed && t.fontName.style === st.fontName.style;
  if (t.fontSize !== st.fontSize || !sameFont) add(t, "error", `override on ${st.name}: ${t.fontSize}px ${t.fontName.style || "mixed"}`);
  else ok.styledText++;
}

const errors = issues.filter(i => i.level === "error").length;
const suspicious = ok.libraryInstances === 0 || (ok.libraryInstances + ok.styledText) < 20;
return { ok, errors, warnings: issues.filter(i => i.level === "warn").length, suspicious, issues };
```

## Report

- **PASS** = 0 errors **and** `suspicious` is false. Warnings and info are acceptable.
- **Errors**: raw fills, local instances that should be library components, unexpected fonts, text without a library style or with an override on top of one, spacing off the scale or unbound.
- **Warnings**: raw strokes.
- **Info**: fallback fonts.
- **Suspicious**: the traversal probably did not reach the content. Fix the selector or the slot descent and re-run. Never report PASS on a suspicious run.

For each error, offer a fix: bind the fill to the matching variable, apply the closest library text style, snap spacing to the scale and bind it, or swap the hand-built element for a real library instance.

## Rules worth keeping

- **Library instances are trusted, their slots are not.** Never flag a master's internals; always audit what was put into its slots.
- **Gap-fillers are allowed, raw values are not.** A `[local]` component may exist because the library lacks one, but its fills, text and spacing still bind to the system. Log every `[local]` component so the design-system owner can decide whether it becomes a real one.
- **Zero stays raw.** A 0 px gap is not a token. Radius may stay raw if it sits on the token scale.
- **Measure, don't eyeball.** If a review keeps finding the same defect by eye (contradicting states in cloned frames, misaligned columns), turn it into a check here or a rule in the agent's instructions.
