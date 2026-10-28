---
name: kristoffer-lange
description: Use when a customer's design system and an AI coding agent don't get along. Sits with the team, figures out how they actually work, then sets up the agents so what they build looks like their product, and builds the checks that prove it.
---

# Kristoffer Lange

Product designer who ships with Claude Code. I go into a team, learn the real workflow, and make their agents build on *their* system instead of the average of the internet.

## When to use

- The customer has a design system and the agents ignore it
- "Looks fine" is the only QA, and nobody can prove what's on-system
- Design-to-dev handover loses the truth somewhere along the way
- Someone needs to be in the room with the customer, then go build

## Receipts

### Enterprise back office (client under NDA)

Product designer in a programme that replaces a legacy back-office system. My part: discovery, screen specs, Figma prototypes the agent builds on the client's design system, review rounds with the product owner and domain experts, handover to development, and the list of what the design system is missing for its lead.

- Ran discovery myself: interviews and shadowing with the people doing the work
- Built three Claude Code skills: [preflight](../skills/figma-ds-preflight/SKILL.md) → [build](../skills/figma-ds-build/SKILL.md) → [QA](../skills/figma-ds-qa/SKILL.md). The agent builds natively in Figma via MCP, with the customer's real library components, not lookalikes. What broke along the way: [`HAZARDS.md`](../skills/figma-ds-build/HAZARDS.md)
- Made the cycle non-negotiable in the agent's instructions, with seven standing rules and the failure behind each: [`templates/CLAUDE.md`](../templates/CLAUDE.md)
- 70–100 screens to production. Handover takes a day, 2–3 questions come back from dev
- My first QA skill reported 292 instances, all clean. It was blind to slot content. Real number: 1,162. Rule since then: *a count of 0 is a bug signal, not a pass*
- Every screen had drifted into card stacks. Nobody chose that; the toolchain did. Now layout follows the work mode (triage, compare, dossier), and a module registry sits between the DS and the domain specs: [`templates/module-registry.md`](../templates/module-registry.md)
- New output: 97.8% of text on design-system styles, 92.6% of spacing on scale
- Handover runs on the blueprint in [`spec-to-ship`](../spec-to-ship/)

### CoachBot (AI coaching platform)

Product, design and frontend in a small team. I build the studio where organisations set up their AI coaches (editor, setup wizard, knowledge, insights, participants), its motion system and one button and table system for it, and parts of the website (pricing, funnel tracking, `llms.txt`).

- I ship the code: ~226 commits, every one co-written with Claude
- Brought the studio to WCAG 2.2 AA on primary actions, errors and the flow, and gated go-live on a quality check
- `DESIGN.md`: design law written for an LLM reader, including a refusal list (no fake progress bars, no confidence percentages, no sparkles)
- A linter for AI-written UI, with its own self-tests, gating CI. Testing the eval, not just the output
- While working on the chat UI I noticed agent internals going out to the participant's browser and patched it with a fail-closed allowlist
- Reference: Lewin Keller, CEO of CoachBot, happy to talk about my work

## How I work

1. Spec is the prompt
2. Taste becomes rules
3. Rules become checks
4. Checks get tested

## Known limitations

- Not a backend engineer. Frontend, tooling and evals for design output: yes. Your infra: no
- The client work is under NDA. Happy to walk through it live, redacted
- Open question I'd love to answer with you: what does Impeccable catch on my output that my checks miss, and the other way round?

## Invoke

contact@kristofferlange.com · [kristofferlange.com](https://kristofferlange.com)
