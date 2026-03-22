---
name: lms-pm
description: Product and integration planning skill for the Najaah admin panel. Use for scope definition, capability mapping, backend contract framing, and implementation breakdowns.
---

# LMS Admin Panel - Product Manager

## Context
Multi-tenant Next.js admin panel. Platform admin (full control) vs center admin (scoped). Backend: Laravel 11 with center_id isolation. For full context, read `.claude/skills/lms/SKILL.md`.

## When to Use This Skill
- Defining permission/capability requirements for a new feature
- Mapping frontend features to backend services
- Scoping work as platform, center, shared, or mixed

---

## Scope Framing

Classify work before implementation:
- `platform`: only for system admins or platform-wide operations
- `center`: bound to a specific center or center admin flow
- `shared`: same feature shape in both platform and center contexts
- `mixed`: one feature spans both but with different route, capability, or API behavior

Use scope to decide route placement: `src/app/(dashboard)` (platform), `src/app/(dashboard)/centers/[centerId]` (center), or both.

## User Personas

| Persona | Scope | Access | Example URL |
|---------|-------|--------|-------------|
| Platform Admin | all centers | full access | `admin.najaah.me` |
| Center Admin | single center | center resources | `centername.najaah.me` |
| Content Manager | single center | courses/content only | `centername.najaah.me` |

## Feature Areas & Capabilities

| Area | Features | Capability Prefix |
|------|----------|-------------------|
| Content | Courses, Sections, Videos, PDFs, Categories | `courses.*`, `videos.*`, `pdfs.*`, `categories.*` |
| Users | Students, Instructors, Admin Users, Roles | `students.*`, `instructors.*`, `admin-users.*`, `roles.*` |
| Enrollment | Enrollments, Devices, Device Changes, Extra Views | `enrollments.*`, `devices.*`, `device-changes.*`, `extra-views.*` |
| Analytics | Dashboard, Playback Sessions, Audit Logs | `dashboard.view`, `playback.*`, `audit-logs.*` |

## Capability Model

- Frontend capability names: `src/lib/capabilities.ts`
- Capabilities map to backend permission strings
- Route protection: `src/components/Layouts/sidebar/data/index.ts`
- If a new route is navigable, update sidebar and route capability rules

## Integration Checklist

When integrating a new backend feature:

1. **API Contract** — endpoint documented, types defined, error codes, permissions
2. **Frontend Types** — entity type, request params, response shape in `types/`
3. **Frontend Service** — service function, response normalization, error handling
4. **Frontend Hook** — query/mutation hooks, key strategy, scope context
5. **Frontend UI** — component, PageHeader, loading/error/empty states
6. **Route Protection** — route added, capability mapped, sidebar updated, tenant scope decided
7. **Testing** — MSW handlers, component tests, service/integration tests

## Data Isolation Rules
1. Center Admins ONLY see their center's data
2. Students scoped to center (branded) or shared (unbranded)
3. Courses belong to exactly one center
4. Enrollments scoped by course's center

## Read Next Only When Needed
- Backend contract integration: `.claude/skills/lms-backend-contracts/SKILL.md`
- Frontend implementation patterns: `.claude/skills/lms-frontend/SKILL.md`
- Capability source code: `src/lib/capabilities.ts`
