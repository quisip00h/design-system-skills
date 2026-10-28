---
name: kristoffer-lange
description: Use when a customer's design system and an AI coding agent don't get along. Sits with the team, figures out how they actually work, then sets up the agents so what they build looks like their product, and builds the checks that prove it.
---

# Kristoffer Lange

**Design engineer. I ship with Claude Code.**

100+ screens to production · handover in a day, 2–3 questions back from dev · 97.8% of new text on design-system styles

Live work: [coachbot.ai](https://coachbot.ai) (redesign and build). Client work under NDA, shown live on request.

I go into a team, learn the real workflow, and make their agents build on *their* system instead of the average of the internet.

## When to use

- The customer has a design system and the agents ignore it
- "Looks fine" is the only QA, and nobody can prove what's on-system
- Design-to-dev handover loses the truth somewhere along the way
- Someone needs to be in the room with the customer, then go build

## Receipts

Enterprise design systems live in Figma; the code follows. I work on both sides: [`figma-ds-qa`](../skills/figma-ds-qa/SKILL.md) for the canvas, [`ui-lint`](../skills/ui-lint/SKILL.md) for the code.

### Enterprise back office (client under NDA)

Product designer in a programme that replaces a legacy back-office system. My part: discovery, screen specs, prototypes the agent builds on the client's design system (first in Figma, now in code), review rounds with the product owner and domain experts, handover to development, and the list of what the design system is missing for its lead.

- Ran discovery myself: interviews and shadowing with the people doing the work
- 100+ screens to production across both phases below. Handover takes a day, 2–3 questions come back from dev

**Phase 1: the agent builds in Figma**

- Built three Claude Code skills: [preflight](../skills/figma-ds-preflight/SKILL.md) → [build](../skills/figma-ds-build/SKILL.md) → [QA](../skills/figma-ds-qa/SKILL.md). The agent builds natively in Figma via MCP, with the customer's real library components, not lookalikes. What broke along the way: [`HAZARDS.md`](../skills/figma-ds-build/HAZARDS.md)
- Made the cycle non-negotiable in the agent's instructions, with seven standing rules and the failure behind each: [`templates/CLAUDE.md`](../templates/CLAUDE.md)
- My first QA skill reported 292 instances, all clean. It was blind to slot content. Real number: 1,162. Rule since then: *a count of 0 is a bug signal, not a pass*
- Every screen had drifted into card stacks. Nobody chose that; the toolchain did. Now layout follows the work mode (triage, compare, dossier), and a module registry sits between the DS and the domain specs: [`templates/module-registry.md`](../templates/module-registry.md)
- New output: 97.8% of text on design-system styles, 92.6% of spacing on scale

**Phase 2: Figma keeps the design system, the screens move to code (running now)**

- Figma holds the design system and nothing else. Screens are coded prototypes at a versioned URL; the spec and the link sit in the wiki
- Why: faster, testing instead of long builds, evidence sooner, and no break between prototype and frontend. Developers get something to click, not a drawing to translate
- The product owner freezes a release as *Ready to build*. Tickets point to that frozen release, never to the one that keeps moving. Handover is a link and a spec, not a handover meeting
- The blueprint, with the library and the CLI that guards releases: [`spec-to-ship`](../spec-to-ship/)

### CoachBot (AI coaching platform)

Product, design and frontend in a small team. I build the studio where organisations set up their AI coaches (editor, setup wizard, knowledge, insights, participants), its motion system and one button and table system for it, and parts of the website (pricing, funnel tracking, `llms.txt`).

- I ship the code: ~226 commits, every one co-written with Claude
- Brought the studio to WCAG 2.2 AA on primary actions, errors and the flow, and gated go-live on a quality check
- `DESIGN.md`: design law written for an LLM reader, including a refusal list (no fake progress bars, no confidence percentages, no sparkles)
- A linter for AI-written UI, with its own self-tests, gating CI. Testing the eval, not just the output. A clean-room version is in this repo: [`skills/ui-lint`](../skills/ui-lint/SKILL.md)
- While working on the chat UI I noticed agent internals going out to the participant's browser and patched it with a fail-closed allowlist
- Reference: Lewin Keller, CEO of CoachBot, happy to talk about my work

## Where I come from

- UX research and service design, in agencies and as a freelancer, for Siemens, Allianz, Fjällräven and Samsung, plus user research for Toyota. That's where the habit comes from: find out how the work really happens before designing anything
- Agency pace: real deadlines, real clients, the work gets shown, not described
- Then I went freelance and started building what I design. Discovery, spec, prototype and code from one person means nothing gets lost between them

## How I work

1. Spec is the prompt
2. Taste becomes rules
3. Rules become checks
4. Checks get tested

Short loops, plain messages, a working thing over a plan about one. When something is wrong I say so early, and I say what it costs to fix.

## I tried Impeccable on my own work

I ran it next to my ui-lint on three client prototypes (desktop-only, so mobile findings left out). Impeccable caught the accessibility and flow problems my checks have no rules for, ui-lint the token drift (191 off-scale values). Four things ui-lint missed in that run are now rules with their own fixtures. Fair caveat: Impeccable ran without a DESIGN.md, so it never saw the tokens. Neither checks whether a component is the design system's own.

## What I'd bring back to Impeccable

- Enterprise teams need the agent to respect *their* tokens and components, not general taste alone
- A design review must see slot and nested content, or it passes what it never saw
- The reviewer needs its own tests: a clean result on a big input is a bug signal

## Known limitations

- Strongest on frontend, agent tooling and evals for design output. Backend: I read it and work with it, I don't own it.
- The client work is under NDA. Happy to walk through it live, redacted

## Elsewhere

- Speaking about this workflow at World Usability Day, Cologne, 12 Nov 2026

## Invoke

contact@kristofferlange.com · [kristofferlange.com](https://kristofferlange.com)
