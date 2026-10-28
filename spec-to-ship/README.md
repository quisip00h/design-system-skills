# spec-to-ship

A blueprint for handing designed features to development: a versioned click-dummy plus a short spec, instead of a design handover file, wiki pages and long ticket texts.

It is role-based and feature-agnostic. Every step names a role (product owner, design, developer, reviewer), never a person, so any team can pick it up.

## Why

- **One source per question.** Behaviour lives in the prototype, rules in the spec, texts in copy files, components in the component library. Nothing is written down twice.
- **Frozen releases.** Developers build from a release that never changes. Design keeps working in current without moving the ground under anyone.
- **Small for agents.** Coding agents read a spec of a few thousand tokens, not a prototype file of hundreds of thousands.

## The flow

| # | What happens | Who |
|---|---|---|
| 1 | Build the prototype and write one spec per use case (`../templates/screen-spec.md`) | Design |
| 2 | Publish each change to **current**, the living state, with one changelog line | Design |
| 3 | Review the prototype with the people who use the screens; decisions go into the spec | Design, product owner, domain expert |
| 4 | Check every component against the component library, plan the tickets | Design, developer |
| 5 | Freeze current as a **release** and approve it: **Ready to build** | Design, product owner |
| 6 | Build the stories from the spec, review, check the UX against `docs/ux-rules.md` | Developer, reviewer, design |

**Review rounds (step 3) end in decisions, not in another meeting.** For every open question, one board:

- the reviewer's feedback, verbatim, as the question
- two or three variants at real screen width, on sample data with one normal case and one scale case
- one variant marked as the recommendation, with a single sentence of why
- the visible cost of the others (colour budget, list length, a pattern the product does not have yet)

The decision (what, who, when) goes into the spec. The next round shows only the chosen variant and what is still open.

## Who reads what

| | Reads | Never reads |
|---|---|---|
| People | the release in the library viewer, the spec | |
| Coding agents | the spec and the copy files | the prototype HTML (one large file, fonts and data inline) |

Everything an agent needs from the prototype therefore has to be in the spec: states and routes, interactions, copy keys, field mapping. A missing piece is a gap in the spec and goes back to design.

## What's in here

```
docs/
  ux-rules.md       UX-01 to UX-35, the rules every screen follows, citable by ID
  versioning.md     current, releases, baselines, changelog
templates/feature/  skeleton of a feature folder: prototype, specs, copy (EN/DE), inventory
features/           one folder per onboarded feature
library/            prototype library: index.html, view.html, versions.js
tools/library.py    add a feature, update current, mark parts, release, set a status, keep a baseline
```

## Getting started

- **Open the library:** `python3 -m http.server` inside `library/`, then `http://localhost:8000`. It also opens straight from disk.
- **See what the tool does:** `python3 tools/library.py --help`
- **Add a feature:** `python3 tools/library.py add-feature <feature> --module "<module>" --title "<title>" --summary "<one sentence>"`

`library.py` guards the process: it refuses placeholder changelog lines, releases with open parts or unchecked components, and approvals by anyone but the product owner role. A release folder is read-only.

The library's colours are placeholders. Replace the `:root` tokens in `library/*.html` with your own design system.
