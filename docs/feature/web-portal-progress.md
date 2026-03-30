# Web Portal Frontend — Progress

Last updated: 2026-03-31
Status: In Progress
Primary tracker: [student-portal-blueprint.md](./student-portal-blueprint.md)
Active plan: [portal-auth-hardening-plan.md](./portal-auth-hardening-plan.md)

## Scope
- Student web portal in `src/app/(portal)/portal/student`
- Parent web portal in `src/app/(portal)/portal/parent`
- Shared portal auth, route guard, data hooks, and localization

## Current Summary

### Completed
- Student and parent auth shell implemented
- Student and parent OTP validation localized
- Student authenticated shell implemented
- Portal auth hardening completed:
  - verify flows schedule token refresh
  - 401 interceptor bypasses logout/refresh endpoints correctly
  - logout cleanup is narrowed to portal session queries
  - BroadcastChannel auth messages use the real token message type
  - portal auth barrel exports are complete
- Student routes implemented:
  - `/portal/student`
  - `/portal/student/my-courses`
  - `/portal/student/explore`
  - `/portal/student/course/[courseId]`
  - `/portal/student/assignments`
  - `/portal/student/exams`
  - `/portal/student/profile`
  - `/portal/student/notifications`
- Student UI correction pass completed for shell, dashboard, explore, course detail, and secondary pages
- Shared student portal content hook added to centralize page mock state
- `npm run build` passes

### In Progress
- Match student dashboard and cards more closely to the approved visual reference
- Replace decorative gradients with stronger course visuals or imagery
- Prepare the student portal for contract-backed data integration
- Contract-aware student portal types, services, and React Query hooks have been added
- Dashboard and explore are now wired through contract-aware hooks with query-backed search/category support and explicit loading states
- Profile and dashboard summaries now derive part of their state from enrolled courses, weekly activity, and profile completion data
- Parent authenticated shell, dashboard, and children page are now implemented against the documented parent web API
- Contract-aware parent portal types, services, hooks, and content seams have been added for linked students, enrollments, progress, links, and weekly activity
- Parent detail routes are now implemented for:
  - `/portal/parent/children/[studentId]`
  - `/portal/parent/children/[studentId]/courses/[courseId]`
- Focused portal unit coverage now exists for:
  - route guard behavior
  - logout/session cleanup behavior
  - portal HTTP 401 bypass behavior
  - parent course review service normalization
  - parent detail and course review page rendering states

### Pending
- Full contract-backed student data replacement for remaining fallback-only sections
- Responsive QA
- Arabic/English QA
- RTL/LTR QA
- Broader portal integration coverage beyond the current focused unit tests

## Phase Status

| Phase | Status | Notes |
|---|---|---|
| FE-P1 — Scaffold + auth + login | complete | Auth shell, route guard, login/register flows, and auth hardening are implemented |
| FE-P2 — Student portal UI foundation | in progress | Student routes and shared portal components are implemented; visual reference matching is ongoing |
| FE-P3 — Student data integration | in progress | Explore, enrolled courses, course detail, categories, and weekly activity are wired through contract-aware seams; some sections still rely on structured fallback content |
| FE-P4 — Parent portal UI | in progress | Parent shell, dashboard, children list, child detail, and course review routes are implemented against the parent web API |
| FE-P5 — QA and release polish | in progress | Focused unit coverage is in place; broader responsive, locale, RTL, and integration QA still pending |

## Contract Notes
- Backend student web API is implemented in `/api/v1/web/*`
- Current frontend student pages still use centralized structured mock content where the backend contract does not yet expose equivalent endpoints
- Next integration targets:
  - deepen mappings for `GET /api/v1/web/courses/enrolled`
  - deepen mappings for `GET /api/v1/web/centers/{center}/activity/weekly`
  - deepen mappings for `GET /api/v1/web/auth/me/profile`
  - keep assignments/exams/notifications on fallback content until the backend contract exposes student web endpoints for them

## Next Action
- Run responsive and RTL/LTR QA on the completed parent detail routes, then continue FE-P5 by expanding portal integration coverage and closing the remaining student fallback sections
