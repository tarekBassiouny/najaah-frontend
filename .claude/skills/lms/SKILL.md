---
name: lms
description: Master Najaah LMS frontend context. Use first for work in this repo to load tenant rules, route and feature patterns, design-system constraints, and validation commands.
---

# LMS Master Skill

## Read This First
Load this skill before any specialist skill.

Then load only the next skill you need:
- `.claude/skills/lms-orchestrator/SKILL.md`
- `.claude/skills/lms-frontend/SKILL.md`
- `.claude/skills/lms-pm/SKILL.md`
- `.claude/skills/lms-qa/SKILL.md`
- `.claude/skills/lms-review/SKILL.md`
- `.claude/skills/lms-frontend-design/SKILL.md`

## Stable Invariants
- This frontend is multi-tenant. Platform admin and center admin behavior must stay explicitly scoped.
- Dashboard routes live under `src/app/(dashboard)` and auth routes live under `src/app/(auth)`.
- Route access rules follow capability and tenant checks, not ad hoc per-page logic.
- Services own API calls and normalization. Components do not call APIs directly.
- Keep UI accessible, responsive, locale-aware, and consistent with `docs/STYLE_GUIDE.md`.
- Preserve existing backend contracts unless the task explicitly approves a contract change.
- Once an orchestrated task has a plan, the orchestrator working memory becomes the live coordination source for later phases and handoffs.

## Read Next Only When Needed
- Frontend implementation patterns and file map: `.claude/skills/lms-frontend/SKILL.md`
- Orchestration workflow: `.claude/skills/lms-orchestrator/SKILL.md`
- Requirements, capabilities, and backend handoff planning: `.claude/skills/lms-pm/SKILL.md`
- Tests and validation: `.claude/skills/lms-qa/SKILL.md`
- Review and PR readiness: `.claude/skills/lms-review/SKILL.md`
- Visual or interaction-heavy work: `.claude/skills/lms-frontend-design/SKILL.md`

## Local Sources of Truth
- Repo workflow and constraints: `AGENTS.md`
- UI styling rules: `docs/STYLE_GUIDE.md`
- Commands and validation scripts: `package.json`
- Route capability and sidebar rules: `src/components/Layouts/sidebar/data/index.ts`
- Tenant context and bootstrap: `src/app/tenant-provider.tsx`, `src/app/app-bootstrap-provider.tsx`
- Admin API response helpers: `src/lib/admin-response.ts`
- App routes: `src/app`
- Shared UI and layout primitives: `src/components`
- Feature modules: `src/features`
- Core libraries: `src/lib`
- Shared types: `src/types`
- Tests and mocks: `tests`

## Fast Feature Path
For most admin features, inspect these areas first:
1. the page entry in `src/app/(dashboard)` or `src/app/(dashboard)/centers/[centerId]`
2. the matching feature folder in `src/features/<feature>`
3. `src/components/Layouts/sidebar/data/index.ts` if the route is protected or navigable
4. `src/lib/capabilities.ts` if access rules change
5. `tests/unit` and `tests/integration` for the nearest existing pattern

## Default Workflow
1. Read this file.
2. Inspect similar implementation in the codebase.
3. Load the one specialist skill needed for the current phase.
4. If the task is coordinated by the orchestrator, read from and write to the working memory instead of re-deriving settled decisions.
5. Keep changes aligned with the local style guide, tenant rules, and backend contract expectations.
6. Update the relevant skill or local source-of-truth document if you introduce a stable new pattern.
