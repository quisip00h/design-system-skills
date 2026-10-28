# `<feature>`

One folder per feature. `tools/library.py update <feature>` publishes it to the library's current.

| Folder | Holds | Published as |
|---|---|---|
| `prototype/` | the click-dummy; `index.html` is the built, self-contained file the library shows | `current/prototype/index.html` |
| `specs/` | one screen spec per use case, `uc<nn>-<name>.spec.md`, from `templates/screen-spec.md (repo root)` | `current/spec/` |
| `copy/` | `<area>.en.json`, `<area>.de.json` | `current/copy/` |
| `inventory/` | components used and fields shown, input for the design system owner and the backend owner | not published |

Open points live in each spec's open-points section with the owning role. Nothing here names a person.
