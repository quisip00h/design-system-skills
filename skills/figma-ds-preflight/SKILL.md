---
name: figma-ds-preflight
description: Run before any native Figma build through the Figma MCP (use_figma). Loads the local design-system cache, confirms the target file and page by reading them, checks that the library is reachable and whether it drifted since the cache was written, and probes fonts to pick a text strategy. Triggers on "build X in Figma", the first Figma write request of a session, or whenever figma-ds-build is about to run without a preflight.
---

# Figma design-system preflight

An agent that starts a Figma build blind builds the average of the internet: guessed components, raw hex, whatever font loads. Preflight makes the build start from the team's own system. It reads the local cache first, then checks reality against it, and hands figma-ds-build a short "ready" report.

Order of the cycle: **figma-ds-preflight → figma-ds-build → figma-ds-qa.** Never skip a step.

## Configure once per project

Fill these in the project's `CLAUDE.md` (see `templates/CLAUDE.md`) or at the top of this file:

| Placeholder | What it is |
|---|---|
| `<DS_DIR>` | local folder that caches the design system, e.g. `design-system/` |
| `<KEYS_FILE>` | component, style and variable keys, e.g. `<DS_DIR>/figma-keys.json` |
| `<INVENTORY>` | variant matrices, per-state token maps, known patterns, e.g. `<DS_DIR>/components/inventory.md` |
| `<TOKENS>` | token values (colour, spacing, radius, effects, type), e.g. `<DS_DIR>/tokens/*.json` |
| `<GAP_LOG>` | what the DS does not publish yet, e.g. `<DS_DIR>/ds-gap-log.md` (template: `templates/ds-gap-log.md`) |
| `<REGISTRY>` | the module registry between DS and domain specs (template: `templates/module-registry.md`) |
| `<DS_LIBRARY_FILE>` | file key of the published library |
| `<PROBE_COMPONENT>` | one component that always exists, e.g. `primary-button` |
| `<TARGET_FILE>` / `<TARGET_PAGE>` | default build file key and page id |
| `<BRAND_FONT>` / `<FALLBACK_FONT>` | the DS font family and the agreed fallback |
| `<EXCLUDED_PAGES>` | DS pages that are not canonical (playgrounds, test grounds) |

A minimal `<KEYS_FILE>`:

```json
{
  "$library": "<DS_LIBRARY_FILE>",
  "$last-delta": "YYYY-MM-DD",
  "components": {
    "primary-button": { "set": "<component-set-key>", "props": ["size", "state", "icon-left#<id>"] },
    "toast": { "set": "<component-set-key>", "variants": ["Default", "Success", "Warning", "Danger"] }
  },
  "styles": { "Heading/H1": "<text-style-key>", "Body/Default": "<text-style-key>" },
  "variables": { "spacing/100": "<variable-key>", "Text/primary": "<variable-key>" },
  "$not-published": ["modal", "datepicker", "tabs"]
}
```

## Steps

Run 1 and 2 in parallel, then 3 and 4.

### 1. Load the cache (read local files, do not crawl Figma)

- `<KEYS_FILE>`: the source of truth for "what can I instantiate by key".
- `<INVENTORY>`: how the components are meant to be used, not just that they exist.
- `<TOKENS>`: values to map against when a spec names a size or a colour.
- `<GAP_LOG>` and `<KEYS_FILE>` `$not-published`: what will have to be a `[local]` gap-filler.
- `<REGISTRY>`: composed modules that already exist in the project. A module found here is cloned, not rebuilt.

**Reconcile before building.** If the spec names `[local]` components, compare that list with the gap log and the registry. Report mismatches ("spec expects `[local] tabs`, gap log says the DS published tabs in March") instead of silently inventing or duplicating a component.

### 2. Confirm the target file and page by reading them

- Default `<TARGET_FILE>` / `<TARGET_PAGE>`, unless the user named another.
- Read once with `use_figma` (or `get_metadata`). A file key copied from an older prompt can point at the wrong file; reading it is the only proof.

```js
const page = await figma.getNodeByIdAsync("<TARGET_PAGE>");
if (!page || page.type !== "PAGE") throw new Error("target page not found: <TARGET_PAGE>");
return { file: figma.root.name, page: page.name, topLevel: page.children.length };
```

If the file is not writable or the page does not resolve, stop. Do not build somewhere else instead.

### 3. Library reachability and drift

- `search_design_system` for `<PROBE_COMPONENT>` against `<DS_LIBRARY_FILE>`.
- The returned key must match `<KEYS_FILE>`. A different key means the DS lead republished: refresh the cache before building.
- **Drift signal:** results carry `updatedAt`. If any result is newer than `$last-delta`, a DS update landed since the cache was written. Offer a delta check (pull the DS changelog page, diff against the cache, update the keys file and `$last-delta`).
- Keys that no longer resolve (`importComponentSetByKeyAsync` throws) are drift too. Note them, import fresh individual keys meanwhile, and log the regression in the gap log.
- Never crawl `<EXCLUDED_PAGES>`. Canonical is the published library, the named component pages and the DS changelog.

### 4. Font probe (decides the text strategy)

```js
const BRAND = "<BRAND_FONT>", FALLBACK = "<FALLBACK_FONT>";
const fonts = await figma.listAvailableFontsAsync();
const styles = fam => fonts.filter(f => f.fontName.family === fam).map(f => f.fontName.style);
let loads = false;
try { await figma.loadFontAsync({ family: BRAND, style: "Regular" }); loads = true; } catch (e) {}
return { brand: { listed: styles(BRAND), loads }, fallback: styles(FALLBACK) };
```

Pick one strategy and state it:

| Probe | Strategy |
|---|---|
| Brand font listed **and** loads | Build in the brand font. Text styles by key carry it. |
| Brand font missing or `loadFontAsync` fails | Fallback strategy from figma-ds-build: leave untouched component labels alone, swap to `<FALLBACK_FONT>` only where characters change. Say so once to the user, with the fix (upload the font to the Figma organisation as a shared font). |

Listed is not loaded. Probe both: a font can appear in the list and still fail to load in the plugin sandbox.

## Output

A short "ready" summary, then hand off to figma-ds-build:

```
Ready: <file> / <page> (read OK, <count> top-level nodes)
Library: reachable, probe key matches, <count> instantiable components
Drift: none | <count> components updated after $last-delta (offer delta check) | dead keys: <list>
Fonts: brand font loads | fallback to <FALLBACK_FONT> (reason)
Gaps expected for this spec: <[local] list>, mismatches: <list or none>
```

## Don't

- Don't re-crawl the whole DS through metadata. The local files are the cache; refresh only on drift or when the DS lead says they published.
- Don't build if the target file is not writable or the page does not resolve.
- Don't report "ready" on a probe you did not run.
