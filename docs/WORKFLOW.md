# Workflow (Plan-First)

This repository follows a plan-first workflow.

## 1) Discovery
- Read relevant docs (especially `docs/STYLE_GUIDE.md`).
- Identify affected areas (routes, features, services, layout).
- Confirm any template or business constraints.
- Validate API endpoints against the backend repo at `/Users/tarekbassiouny/projects/xyz-lms/backend` when needed.

## 2) Plan (Required)
- Provide a short, step-by-step plan.
- Wait for explicit confirmation before coding.

## 3) Implementation
- Use existing NextAdmin template components only.
- Keep UI changes inside existing layout and component patterns.
- Prefer centralized, reusable structures (config-driven navigation).

## 4) Cleanup
- List unused/redundant files before deletion.
- Delete only after confirmation.

## 5) Verification
- Run `npm run lint` and `npm run type-check`.
- Note any skipped checks.

## 6) Wrap-up
- Summarize changes and touched files.
- Suggest next steps if needed.
