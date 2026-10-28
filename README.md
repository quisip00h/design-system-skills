# design-system-skills

Skills and process for making coding agents build on a team's **own** design system instead of the average of the internet.

Extracted from real enterprise work, with every client detail removed. Use it, fork it, steal from it.

## Contents

**Who**

| | What | Use it when |
|---|---|---|
| [`kristoffer/SKILL.md`](kristoffer/SKILL.md) | The person behind this, written as a skill | you're wondering who built it |

**Skills: the Figma build cycle, in order**

| | What | Use it when |
|---|---|---|
| [`skills/figma-ds-preflight`](skills/figma-ds-preflight/SKILL.md) | Loads the local DS cache, confirms the target file by reading it, checks library drift and probes fonts before anything is built | before the agent touches the canvas |
| [`skills/figma-ds-build`](skills/figma-ds-build/SKILL.md) | Library-first instancing by key, colours and spacing bound to variables, text styles with no overrides, `[local]` gap governance | the agent builds or edits a screen in Figma |
| [`skills/figma-ds-build/HAZARDS.md`](skills/figma-ds-build/HAZARDS.md) | 27 Figma Plugin API hazards that each cost a round, with the fix | something on the canvas does not match the call log |
| [`skills/figma-ds-qa`](skills/figma-ds-qa/SKILL.md) | Audits an agent-built frame against the design system, including the slot content most traversals miss | your agent says the screen is done |

**Templates**

| | What | Use it when |
|---|---|---|
| [`templates/CLAUDE.md`](templates/CLAUDE.md) | Agent governance: preflight → build → QA as a non-negotiable, spec-as-prompt mode, annotation policy, seven standing rules with the failure behind each | you set up a design workspace for an agent |
| [`templates/screen-spec.md`](templates/screen-spec.md) | Screen spec that doubles as the build prompt: state matrix, data model, evidence tags | before the agent builds anything |
| [`templates/module-registry.md`](templates/module-registry.md) | The reuse layer between DS and domain specs: decision guide, layout by work mode, promotion agenda | the second domain starts, or every screen looks like a card stack |
| [`templates/ds-gap-log.md`](templates/ds-gap-log.md) | Log of what the DS does not publish yet, fed by the build, read by preflight | the agent needs a component the library does not have |

**Handover and review**

| | What | Use it when |
|---|---|---|
| [`spec-to-ship/`](spec-to-ship/) | Handover blueprint: versioned click-dummy, short spec, EN/DE copy keys, a prototype library and a CLI that guards releases | design has to reach development without losing the truth |
| [`spec-to-ship/docs/ux-rules.md`](spec-to-ship/docs/ux-rules.md) | 35 UX rules with stable IDs, citable in reviews ("deviation from UX-07") | you want taste the agent can be held to |

## How the pieces fit

`templates/CLAUDE.md` makes the cycle binding: **preflight → build → QA**, every time, inline, never delegated. Preflight reads the DS cache and the gap log, build reads the module registry before it frames anything, QA proves the result. The screen spec is the prompt; review decisions go back into the spec, never only into a meeting note.

## The loop behind it

1. **Spec is the prompt.** One page, every state listed, every claim tagged researched, assumed or open. When the spec is thin, ask. Never invent.
2. **Taste becomes rules.** Every defect a reviewer catches twice becomes a rule with an ID.
3. **Rules become checks.** If a rule can be measured, a script measures it.
4. **Checks get tested.** A QA that reports zero problems might just be blind. Prove it isn't.

## License

MIT
