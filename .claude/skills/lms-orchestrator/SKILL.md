---
name: lms-orchestrator
description: Coordinate complex Najaah LMS frontend work across frontend implementation, product planning, quality, review, and design skills. Use for new features, bug fixes, and multi-layer UI changes.
---

# LMS Frontend Orchestrator

## Use This Skill When
- starting a new frontend feature
- fixing a bug that touches multiple layers
- planning before implementation
- coordinating routes, components, hooks, API usage, and tests
- coordinating multiple specialists with shared memory or parallel lanes
- answering "what's next?" for a non-trivial task

## Mandatory Load Order
1. Read `.claude/skills/lms/SKILL.md`
2. Inspect repository state and nearby implementations
3. Load only the specialist skill needed for the next phase

Do not load all specialist skills unless the task genuinely spans all of them.

## Operating Model
Follow this sequence every time:
1. Discovery
2. Build working memory
3. Plan
4. Approval
5. Execute by phase or parallel lane
6. Verify
7. Report

Do not implement before approval unless the user explicitly asked for immediate execution without a plan.

## Discovery Checklist
- Check changed files and current repo state
- Locate the nearest similar implementation
- Identify affected routes, layouts, components, hooks, services, capability checks, docs, and tests
- Inspect `docs/STYLE_GUIDE.md`, `src/components/Layouts/sidebar/data/index.ts`, `src/app/tenant-provider.tsx`, `src/lib/admin-response.ts`, and the relevant test setup when those layers are touched
- Confirm whether the change is platform-scoped, center-scoped, shared, or mixed
- Confirm whether backend contract, localization, or responsive states are involved
- Confirm whether the task touches shared layout or design-system primitives
- Note open risks, assumptions, and missing requirements

## Working Memory Protocol
Create and keep a compact task memory with these sections:

```text
OBJECTIVE
- requested outcome

SCOPE
- platform | center | shared | mixed

INVARIANTS
- auth
- tenant scope
- localization
- responsive behavior
- contract compatibility
- design-system consistency

AFFECTED AREAS
- routes/layouts
- components
- hooks/state
- services/API integration
- docs
- tests

OWNERSHIP
- lane or specialist -> owned files/modules

DEPENDENCIES
- what must finish before another lane can proceed

DECISIONS
- concrete choices that are now settled

VERIFICATION LEDGER
- tests/checks run
- checks still pending

OPEN RISKS
- unresolved questions
```

Do not let specialists drift from this memory. Update it whenever component contracts, routing, API usage, or test scope changes.

## Plan Template
Use a short phase-based plan:

```text
OBJECTIVE
- one sentence on the requested outcome

WORKING MEMORY
- scope
- invariants
- ownership
- key dependencies

PHASES
- Architecture: routing, component boundaries, shared state, app-shell decisions
- Features: pages, components, hooks, forms, guards, user flows
- API Integration: services, request/response handling, query behavior, capability alignment
- Quality: unit/integration/e2e tests, lint, type-check, review pass
- Design: style-guide alignment, responsive refinements, interaction polish
- Documentation: skill docs, feature notes, local references

RISKS
- auth
- tenant scope
- contract compatibility
- localization
- responsive behavior
- design-system consistency

VERIFICATION
- tests or checks you will run
```

## Parallel Execution Rules
Parallel work is allowed only when it reduces latency without creating contract drift.

Use parallel lanes for:
- discovery across nearby routes, components, hooks, services, and tests
- feature implementation plus quality work after component and API contracts are stable
- documentation or design adjustments after behavior and contracts are frozen

Do not parallelize when:
- two lanes need to edit the same file set
- shared component contracts or layout primitives are still changing
- route guards, tenant scope, or auth assumptions are unsettled
- API response assumptions or cache keys are still being defined
- shared design tokens or style-guide-level decisions are still moving

Before opening a lane, record:
- lane owner
- exact write scope
- dependency edges
- expected handoff target

## Delegation Matrix
- Use `lms-frontend` for routing, layouts, components, hooks, forms, services, query behavior, and capability-aware flows.
- Use `lms-pm` for requirement clarification, capability mapping, backend contract planning, and ambiguous scope decisions.
- Use `lms-qa` for tests, mocks, validation commands, and debugging failing checks.
- Use `lms-review` for review, security and tenant-scope checks, API contract verification, and PR readiness.
- Use `lms-frontend-design` only for design or interaction work, and keep it constrained by `docs/STYLE_GUIDE.md`.

## Default Feature Slice
For standard admin features, prefer this implementation order:
1. page or route entry in `src/app/(dashboard)` or `src/app/(dashboard)/centers/[centerId]`
2. feature module changes in `src/features/<feature>`
3. sidebar or capability updates in `src/components/Layouts/sidebar/data/index.ts` and `src/lib/capabilities.ts`
4. unit or integration coverage in `tests/unit` and `tests/integration`

## Communication Contract
Default communication path is through the orchestrator and shared memory.

Use a handoff memo whenever one specialist hands work to another:

```text
FROM
- specialist or lane

TO
- specialist or lane

OWNED AREA
- files/modules that changed or are reserved

CHANGED CONTRACTS
- routing, component, service, capability, or test assumptions that changed

DECISIONS
- choices that are now fixed

BLOCKERS
- what is missing

VERIFICATION
- tests/checks run
- tests/checks still needed

NEXT ACTION
- exact next step for the receiver
```

Direct specialist-to-specialist sync is acceptable only for a shared contract boundary, and the result must be written back to memory immediately.

## Non-Negotiable Rules
- Preserve tenant boundaries between platform and center behavior.
- Keep data fetching in services and hooks, not directly in components.
- Follow `docs/STYLE_GUIDE.md` and existing UI primitives before introducing new patterns.
- Preserve backend contracts unless the task explicitly allows contract changes.
- Keep UI accessible, locale-aware, and responsive.
- Add or update tests for changed behavior.

## Backend Contract Questions
For backend-driven frontend coordination:
1. Load `.claude/skills/lms-frontend/SKILL.md`
2. Load `.claude/skills/lms-pm/SKILL.md` if capability mapping or feature requirements are unclear
3. Answer with exact endpoints, params, response fields, tenant scope rules, and known gaps
4. Do not invent backend support that does not exist

## Verification Gates
Do not report complete until you have checked:
- implementation matches the approved plan
- working memory reflects final decisions and no stale blockers remain
- affected auth and tenant-scope paths are covered
- changed behavior has tests or a documented testing gap
- `docs/STYLE_GUIDE.md` was respected for UI work
- documentation is updated when a reusable pattern changed

## Reporting Format
Use a compact delivery report:

```text
Completed
- phases finished
- main files or modules changed

Verified
- tests/checks run
- checks not run

Risks / Follow-ups
- residual risk
- contract or rollout note
```
