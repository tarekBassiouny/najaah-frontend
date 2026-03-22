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
Create and keep a compact task memory. For the template and section definitions, see `references/shared-memory.md`.

## Plan Template
Use a short phase-based plan. For the template, see `references/execution-patterns.md`.

## Parallel Execution Rules
For detailed rules on when to parallelize, lane setup, and ownership, see `references/parallel-playbook.md`.

## Delegation Matrix
- Use `lms-frontend` for routing, layouts, components, hooks, forms, services, query behavior, and capability-aware flows.
- Use `lms-pm` for requirement clarification, capability mapping, backend contract planning, and ambiguous scope decisions.
- Use `lms-qa` for tests, mocks, validation commands, and debugging failing checks.
- Use `lms-review` for review, security and tenant-scope checks, API contract verification, and PR readiness.
- Use `lms-frontend-design` only for design or interaction work, and keep it constrained by `docs/STYLE_GUIDE.md`.

## Communication Contract
Default communication path is through the orchestrator and shared memory. For the handoff memo template, see `references/handoff-contract.md`.

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

## Cross-Repo Feature Workflow
For any feature that spans backend and frontend:

1. Load `.claude/skills/lms-backend-contracts/SKILL.md`
2. Find the progress tracker: `/Users/tarekbassiouny/projects/najaah-backend/docs/feature/{feature}-progress.md`
3. Check available contracts: `/Users/tarekbassiouny/projects/najaah-backend/docs/contracts/{feature-slug}/`
4. Read the relevant contract doc for the current frontend phase
5. Build against the contract — do not assume endpoints exist without checking
6. Use MSW mocks matching contract shapes during development
7. After completing a frontend phase, update the progress tracker's lane status

For discovering active cross-repo features, check `lms-backend-contracts` skill's "Known Features" table.

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

## References
- Shared memory template: `references/shared-memory.md`
- Patterns and plan template: `references/execution-patterns.md`
- Parallel lane playbook: `references/parallel-playbook.md`
- Handoff memo contract: `references/handoff-contract.md`
- Backend contracts and cross-repo progress: `.claude/skills/lms-backend-contracts/SKILL.md`
