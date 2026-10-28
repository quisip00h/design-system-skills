# Prototype versions

One living prototype per feature; a frozen copy only when someone builds from it.

## Current, releases, baselines
| | What | Changes |
|---|---|---|
| **Current** | the living prototype of a feature (`library/<feature>/current/`) | overwritten with every change; each change gets one line under Unreleased in the feature changelog |
| **Release** | a frozen copy of current (`library/<feature>/releases/v<major>.<minor>/`) | made only when the product owner approves current as Ready to build; never edited afterwards (files are read-only) |
| **Baseline** | a historical state kept for reference, not a release | none |

A ticket always points to a release, never to current: developers must not build on a prototype that moves under them.

## Release numbers
- `v<major>.<minor>` per feature.
- **Minor:** a release within the agreed scope. **Major:** new scope (new screen, new case type, new user group).
- Small changes between two releases get no number. They are lines under Unreleased.

## What a release needs
All five parts done: click-dummy, spec (`templates/screen-spec.md` at the repo root), copy EN/DE with keys, field mapping (`templates/feature/inventory/fields.md`), changelog. The release command refuses otherwise.

## The changelog
One file per feature, `library/<feature>/CHANGELOG.md`, newest on top. Every line: date, kind (Added, Changed, Removed, Fixed), what, and why if it is not obvious. The author is a role.
```
## Unreleased
- 20.10.2026: Changed: uc02 AC-05, deadline check also for email (why: usability test)

## v1.1, 15.10.2026, Ready to build (set by product owner, PRJ-900)
- 20.10.2026: status Built
- 14.10.2026: Added: state "Customer unclear, no candidate"
```

## How a change gets in
1. Change the source in `features/<feature>/`: prototype, spec, copy.
2. Build the prototype, if it has a build step.
3. `library.py update <feature> "<kind>: <what> (why: <reason>)"` copies prototype, specs and copy into current and logs the line.
4. A line logged by mistake: `library.py drop <feature>` removes the newest Unreleased line. The tool refuses placeholder text and story keys that are not real tracker keys.

## How current becomes Ready to build
| Step | Role | What |
|---|---|---|
| 1 | Design | Current is complete: `library.py parts <feature> spec=done copy=done fields=done`. Send the product owner the link `view.html?v=<feature>/current` and the Unreleased lines. |
| 2 | Product owner | Reviews and decides. |
| 3 | Design | In the library: **Mark Ready to build…** on the current card. The dialog checks the five parts, proposes the next release number, asks for the design ticket and the approving role, and copies the release command (the page cannot write files). Run it at the repository root: frozen copy, Unreleased becomes the release section, index updated. Put the printed link into the design ticket. |
| 4 | Product owner | Closes the design ticket: development may start. |
| 5 | Developer | Builds from the release. Changes found during the build go into current and the next release. |
| 6 | Design | After the UX check of the last story: `library.py status <feature> v<major>.<minor> Built`. |

~ Once the design repository is hosted with its history, a release can become a Git tag set on the product owner's approval; the copy step then disappears.

## Rules
- A release is never edited. A fix is a line under Unreleased and goes out with the next release.
- Releases and baselines stay in the library. Nothing is deleted.
- `library/versions.js` is the index; `library.py` writes it.
