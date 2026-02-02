# Admin API Resources -> Frontend Mapping

Last verified: 2026-02-01
Source: `docs/ADMIN_RESOURCES.md`

## Legend
- Covered: endpoint(s) + types/services exist.
- Partial: some endpoints/types exist; gaps listed.
- Missing: no matching frontend service/types found.

## Auth
- Endpoints: `/auth/login`, `/auth/password/reset`, `/auth/me`, `/auth/refresh`, `/auth/logout`
- Frontend:
  - Service: `src/services/admin-auth.service.ts`
  - Types: `src/types/auth.ts`
- Status: Partial
- Gaps:
  - Missing password reset service for `/auth/password/reset`.

## Centers
- Endpoints: `/centers`, `/centers/{center}`, `/centers/{center}/restore`, `/centers/{center}/onboarding/retry`, `/centers/{center}/branding/logo`
- Frontend:
  - Service: `src/features/centers/services/centers.service.ts`
  - Types: `src/features/centers/types/center.ts`
- Status: Partial
- Gaps:
  - No create/update/delete/restore/onboarding-retry/branding-logo actions implemented.

## Center Settings
- Endpoints: `/centers/{center}/settings` (GET, PATCH)
- Frontend: None
- Status: Missing

## Categories (Center-scoped)
- Endpoints: `/centers/{center}/categories` CRUD
- Frontend: None
- Status: Missing

## Courses
- Endpoints:
  - `/courses` (list)
  - `/courses/{course}/clone`
  - `/courses/{course}/publish`
  - `/centers/{center}/courses` CRUD
  - `/centers/{center}/courses/{course}/videos` (assign/remove)
  - `/centers/{center}/courses/{course}/pdfs` (assign/remove)
- Frontend:
  - Service: `src/features/courses/services/courses.service.ts`
  - Types: `src/features/courses/services/courses.service.ts` (inline type)
- Status: Partial
- Gaps:
  - No center-scoped course CRUD.
  - No clone/publish actions.
  - No media assignment endpoints (videos/pdfs).

## Sections (Center/Course-scoped)
- Endpoints: `/centers/{center}/courses/{course}/sections/*`
- Frontend: None
- Status: Missing

## Videos (Center-scoped)
- Endpoints: `/centers/{center}/videos` CRUD
- Frontend:
  - Service: `src/features/videos/services/videos.service.ts`
  - Types: `src/features/videos/types/video.ts`
- Status: Partial
- Gaps:
  - Frontend service targets `/api/v1/admin/videos` which does not exist in backend routes.
  - Missing create/update/delete/show + center param support.

## Video Upload Sessions
- Endpoint: `/centers/{center}/videos/upload-sessions`
- Frontend: None
- Status: Missing

## PDFs (Center-scoped)
- Endpoints: `/centers/{center}/pdfs` CRUD, `/centers/{center}/pdfs/upload-sessions`, `/finalize`
- Frontend:
  - Service: `src/features/pdfs/services/pdfs.service.ts`
  - Types: `src/features/pdfs/types/pdf.ts`
- Status: Partial
- Gaps:
  - Frontend service targets `/api/v1/admin/pdfs` which does not exist in backend routes.
  - Missing create/update/delete/show + center param support.
  - Missing upload-session endpoints.

## Instructors
- Endpoints: `/instructors` CRUD, `/courses/{course}/instructors` attach/detach
- Frontend:
  - Service: `src/features/instructors/services/instructors.service.ts`
  - Types: `src/features/instructors/types/instructor.ts`
- Status: Partial
- Gaps:
  - Course instructor assignment endpoints not implemented.
  - Verify CRUD coverage vs apiResource (list/show/create/update/delete).

## Enrollments
- Endpoints: `/enrollments` CRUD (list/show/create/update/delete)
- Frontend: None
- Status: Missing

## Students
- Endpoints: `/students` (list/create), `/students/{user}` (update/delete)
- Frontend:
  - Service: `src/features/students/services/students.service.ts`
  - Types: `src/features/students/types/student.ts`
- Status: Partial
- Gaps:
  - Missing create/update/delete services.

## Device Change Requests
- Endpoints: list + approve/reject/pre-approve + create for student
- Frontend:
  - Service: `src/features/device-change-requests/services/device-change-requests.service.ts`
  - Types: `src/features/device-change-requests/types/device-change-request.ts`
- Status: Partial
- Gaps:
  - Missing approve/reject/pre-approve actions.
  - Missing create-for-student action.

## Extra View Requests
- Endpoints: list + approve/reject
- Frontend:
  - Service: `src/features/extra-view-requests/services/extra-view-requests.service.ts`
  - Types: `src/features/extra-view-requests/types/extra-view-request.ts`
- Status: Partial
- Gaps:
  - Missing approve/reject actions.

## Audit Logs
- Endpoints: `/audit-logs` (list)
- Frontend:
  - Service: `src/features/audit-logs/services/audit-logs.service.ts`
  - Types: `src/features/audit-logs/types/audit-log.ts`
- Status: Covered (list)

## Analytics
- Endpoints: `/analytics/overview`, `/analytics/courses-media`, `/analytics/learners-enrollments`, `/analytics/devices-requests`
- Frontend: None
- Status: Missing

## Agents
- Endpoints: `/agents/executions` (list/show), `/agents/available`, `/agents/execute`, `/agents/content-publishing/execute`, `/agents/enrollment/bulk`
- Frontend:
  - Service: `src/features/agents/services/agents.service.ts`
  - Types: `src/features/agents/types/agent.ts`
- Status: Partial
- Gaps:
  - Missing `/agents/available`.
  - Missing `/agents/execute` generic endpoint.

## Roles
- Endpoints: `/roles` CRUD, `/roles/{role}/permissions`
- Frontend:
  - Service: `src/features/roles/services/roles.service.ts`
  - Service: `src/features/role-permissions/services/role-permissions.service.ts`
  - Types: `src/features/roles/types/role.ts`, `src/features/role-permissions/types/role-permission.ts`
- Status: Partial
- Gaps:
  - Missing role create/update/delete.

## Permissions
- Endpoints: `/permissions` (list)
- Frontend:
  - Service: `src/features/permissions/services/permissions.service.ts`
  - Types: `src/features/permissions/types/permission.ts`
- Status: Covered (list)

## Admin Users
- Endpoints: `/users` CRUD, `/users/{user}/roles`
- Frontend:
  - Service: `src/features/admin-users/services/admin-users.service.ts`
  - Types: `src/features/admin-users/types/admin-user.ts`
- Status: Partial
- Gaps:
  - Missing create/update/delete.
  - Missing role sync endpoint.

## Settings Preview
- Endpoint: `/settings/preview`
- Frontend: None
- Status: Missing
