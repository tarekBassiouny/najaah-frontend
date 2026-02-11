# Admin API Endpoints + Models Mapping

Last verified: 2026-02-05  
Backend sources:
- `/Users/tarekbassiouny/projects/najaah/backend/docs/api/ADMIN_ENDPOINT_RESOURCE_MAP.md`
- `/Users/tarekbassiouny/projects/najaah/backend/docs/api/ADMIN_RESOURCES.md`

## Step 1 - Backend inventory (source of truth)

- Admin endpoints in map: **114**
- Endpoints returning explicit resources: **83**
- Endpoints with no explicit resource (`—`): **31**
- Resource payload blocks in resources doc: **40**

## Step 2 - Endpoint coverage by frontend module

Legend:
- **Covered**: backend endpoint group has frontend service support.
- **Partial**: some endpoints in group are covered, with gaps noted.
- **Review**: frontend calls endpoints not present in current backend endpoint map.

## Auth
- Backend: `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`, `POST /auth/password/reset`, `POST /auth/refresh`
- Frontend service: `src/services/admin-auth.service.ts`
- Model types: `src/types/auth.ts`
- Status: **Covered**

## Centers + Settings + Categories
- Backend:
  - `GET/POST /centers`
  - `GET/PUT/DELETE /centers/{center}`
  - `POST /centers/{center}/restore`
  - `POST /centers/{center}/onboarding/retry`
  - `POST /centers/{center}/branding/logo`
  - `GET/PATCH /centers/{center}/settings`
  - `GET/POST /centers/{center}/categories`
  - `GET/PUT/DELETE /centers/{center}/categories/{category}`
- Frontend services:
  - `src/features/centers/services/centers.service.ts`
  - `src/features/centers/services/center-settings.service.ts`
  - `src/features/categories/services/categories.service.ts`
- Model types:
  - `src/features/centers/types/center.ts`
  - `src/features/categories/types/category.ts`
- Status: **Covered**

## Courses + Sections + Media assignment
- Backend:
  - Global courses: `GET /courses`, `POST /courses/{course}/clone`, `POST /courses/{course}/publish`
  - Course instructors: `POST /courses/{course}/instructors`, `DELETE /courses/{course}/instructors/{instructor}`
  - Center courses: `GET/POST /centers/{center}/courses`, `GET/PUT/DELETE /centers/{center}/courses/{course}`
  - Course media: `POST /centers/{center}/courses/{course}/videos`, `DELETE /.../videos/{video}`
  - Course media: `POST /centers/{center}/courses/{course}/pdfs`, `DELETE /.../pdfs/{pdf}`
  - Sections: full CRUD + reorder + publish/unpublish + restore + structure + section videos/pdfs attach/detach/show/list
- Frontend services:
  - `src/features/courses/services/courses.service.ts`
  - `src/features/sections/services/sections.service.ts`
- Model types:
  - `src/features/sections/types/section.ts`
  - `src/features/courses/types/course.ts`
- Status: **Covered**
- Note: frontend includes extra global course endpoints (`GET/POST/PUT/DELETE /courses/{id}` + `POST /courses`) not listed in backend endpoint map.

## Videos + PDFs
- Backend:
  - Videos: `GET/POST /centers/{center}/videos`, `GET/PUT/DELETE /centers/{center}/videos/{video}`, `POST /centers/{center}/videos/upload-sessions`
  - PDFs: `GET/POST /centers/{center}/pdfs`, `GET/PUT/DELETE /centers/{center}/pdfs/{pdf}`, `POST /centers/{center}/pdfs/upload-sessions`, `POST /centers/{center}/pdfs/upload-sessions/{pdfUploadSession}/finalize`
- Frontend services:
  - `src/features/videos/services/videos.service.ts`
  - `src/features/pdfs/services/pdfs.service.ts`
- Model types:
  - `src/features/videos/types/video.ts`
  - `src/features/pdfs/types/pdf.ts`
- Status: **Covered**

## Instructors + Enrollments + Students
- Backend:
  - Instructors: `GET/POST /instructors`, `GET /instructors/{instructor}`, `PUT/PATCH /instructors/{instructor}`, `DELETE /instructors/{instructor}`
  - Enrollments: `GET/POST /enrollments`, `GET/PUT/DELETE /enrollments/{enrollment}`
  - Students: `GET/POST /students`, `PUT/DELETE /students/{user}`
  - Student device change request create: `POST /students/{student}/device-change-requests`
- Frontend services:
  - `src/features/instructors/services/instructors.service.ts`
  - `src/features/enrollments/services/enrollments.service.ts`
  - `src/features/students/services/students.service.ts`
  - `src/features/device-change-requests/services/device-change-requests.service.ts`
- Model types:
  - `src/features/instructors/types/instructor.ts`
  - `src/features/enrollments/types/enrollment.ts`
  - `src/features/students/types/student.ts`
  - `src/features/device-change-requests/types/device-change-request.ts`
- Status: **Covered** (backend endpoints), **Review** (extra student endpoints in frontend)
- Notes:
  - Instructor update is sent as `POST /instructors/{id}` with `_method=PUT` multipart override.
  - Frontend also calls student endpoints not in endpoint map: `/students/{id}` GET, `/students/{id}/status`, `/students/{id}/reset-device`, `/students/import`, `/students/export`.

## Requests + Logs + Analytics + Agents
- Backend:
  - Device change requests: list + approve/reject/pre-approve
  - Extra view requests: list + approve/reject
  - Audit logs: list
  - Analytics: 4 dashboards (`overview`, `courses-media`, `learners-enrollments`, `devices-requests`)
  - Agents: `GET /agents/available`, `POST /agents/execute`, content publishing execute, bulk enrollment execute, executions list/show
- Frontend services:
  - `src/features/device-change-requests/services/device-change-requests.service.ts`
  - `src/features/extra-view-requests/services/extra-view-requests.service.ts`
  - `src/features/audit-logs/services/audit-logs.service.ts`
  - `src/features/analytics/services/analytics.service.ts`
  - `src/features/agents/services/agents.service.ts`
- Model types:
  - `src/features/extra-view-requests/types/extra-view-request.ts`
  - `src/features/audit-logs/types/audit-log.ts`
  - `src/features/analytics/types/analytics.ts`
  - `src/features/agents/types/agent.ts`
- Status: **Covered**
- Review:
  - frontend calls `GET /api/v1/admin/audit-logs/{logId}` not present in endpoint map.

## Roles + Permissions + Admin Users
- Backend:
  - Permissions: `GET /permissions`
  - Roles: `GET/POST /roles`, `GET/PUT/DELETE /roles/{role}`, `PUT /roles/{role}/permissions`
  - Admin users: `GET/POST /users`, `PUT/DELETE /users/{user}`, `PUT /users/{user}/roles`
- Frontend services:
  - `src/features/permissions/services/permissions.service.ts`
  - `src/features/roles/services/roles.service.ts`
  - `src/features/role-permissions/services/role-permissions.service.ts`
  - `src/features/admin-users/services/admin-users.service.ts`
- Model types:
  - `src/features/permissions/types/permission.ts`
  - `src/features/roles/types/role.ts`
  - `src/features/role-permissions/types/role-permission.ts`
  - `src/features/admin-users/types/admin-user.ts`
- Status: **Covered** (backend endpoints), **Review** (extra frontend reads)
- Review:
  - frontend calls `GET /api/v1/admin/roles/{role}/permissions` (backend map has `PUT` only).
  - frontend calls `GET /api/v1/admin/users/{user}` and `GET /api/v1/admin/users/{user}/roles` (not in backend map).

## Step 3 - Resource model mapping (40 backend resource payload blocks)

## Covered by dedicated frontend models
- Analytics resources -> `src/features/analytics/types/analytics.ts`
- CategoryResource -> `src/features/categories/types/category.ts`
- CenterResource, CenterSettingResource -> `src/features/centers/types/center.ts`
- DeviceChangeRequestResource, DeviceChangeRequestListResource -> `src/features/device-change-requests/types/device-change-request.ts`
- ExtraViewRequestResource, ExtraViewRequestListResource -> `src/features/extra-view-requests/types/extra-view-request.ts`
- RoleResource -> `src/features/roles/types/role.ts`
- PermissionResource -> `src/features/permissions/types/permission.ts`
- AgentExecutionResource -> `src/features/agents/types/agent.ts`
- AuditLogResource -> `src/features/audit-logs/types/audit-log.ts`
- EnrollmentResource -> `src/features/enrollments/types/enrollment.ts`
- InstructorResource -> `src/features/instructors/types/instructor.ts`
- PdfResource -> `src/features/pdfs/types/pdf.ts`
- SectionResource, SectionSummaryResource, SectionVideoResource, SectionPdfResource, SectionCollection -> `src/features/sections/types/section.ts`
- AdminUserResource -> `src/features/admin-users/types/admin-user.ts` and `src/types/auth.ts`
- StudentResource -> `src/features/students/types/student.ts`
- VideoResource, AdminVideoResource, VideoUploadSessionResource -> `src/features/videos/types/video.ts`

## Partial / weakly typed
- CourseResource family now has dedicated types in `src/features/courses/types/course.ts`.
- Remaining work is to tighten nested structures and remove permissive index signatures over time.
- Summary resources:
  - `CategorySummaryResource`
  - `CenterSummaryResource`
  - `CourseSummaryResource` (Summary namespace)
  - `InstructorSummaryResource`
  - `PdfSummaryResource`
  - `UserSummaryResource`
  - `VideoSummaryResource`
  - currently represented ad hoc in nested objects, no shared summary-model module.

## Step 4 - Required follow-up from this mapping

1. Add missing agent service endpoints:
   - done (`src/features/agents/services/agents.service.ts`)
2. Add auth password reset endpoint:
   - done (`src/services/admin-auth.service.ts`)
3. Create dedicated course model typings:
   - done (`src/features/courses/types/course.ts`)
   - includes course setting/video/pdf + summary models.
4. Align/confirm backend contract for frontend-only endpoints currently not in endpoint map:
   - students extra endpoints (`show/status/reset/import/export`)
   - admin-user read endpoints (`show/get roles`)
   - role permissions read endpoint (`GET /roles/{role}/permissions`)
   - audit-log show endpoint (`GET /audit-logs/{id}`)
