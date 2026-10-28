# Components in `<feature>`

Every UI component the prototype uses, checked against the component library (the source of truth for components) before a release.

- **Component library (code):** the exact name there, so developers and coding agents find it without guessing. `? verify` until checked.
- Not in the library: write `gap` and add a row under Gaps. The build uses the closest existing component.
- `library.py release` refuses while any `? verify` is left.

| Component | Where used | Design tool library | Component library (code) |
|---|---|---|---|
| | | | ? verify |

## Gaps for the design system owner
| # | Gap | Needed by | Note |
|---|---|---|---|
