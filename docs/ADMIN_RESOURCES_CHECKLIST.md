# Admin Models/Entities Checklist

Last verified: 2026-02-05  
Source of truth:
- `/Users/tarekbassiouny/projects/najaah/backend/docs/api/ADMIN_ENDPOINT_RESOURCE_MAP.md`
- `/Users/tarekbassiouny/projects/najaah/backend/docs/api/ADMIN_RESOURCES.md`

Use this checklist for remaining work after the latest endpoint/resource sync.

## P0: Missing backend endpoints in frontend
- [x] Add `GET /api/v1/admin/agents/available` in `src/features/agents/services/agents.service.ts`.
- [x] Add `POST /api/v1/admin/agents/execute` in `src/features/agents/services/agents.service.ts`.
- [x] Add `POST /api/v1/admin/auth/password/reset` in `src/services/admin-auth.service.ts`.

## P1: Model alignment gaps
- [x] Create dedicated course model module (`src/features/courses/types/course.ts`).
- [x] Map `CourseResource`, `CourseSummaryResource`, `CourseSettingResource`, `CourseVideoResource`, `CoursePdfResource` to strict types (replace broad inline `Course`).
- [ ] Add shared summary model types for backend summary resources (`CategorySummaryResource`, `CenterSummaryResource`, `CourseSummaryResource`, `InstructorSummaryResource`, `PdfSummaryResource`, `UserSummaryResource`, `VideoSummaryResource`).
- [ ] Tighten broad `[key: string]: unknown` models where backend docs now provide stable fields (centers, enrollments, device/extra-view requests, sections).

## P1: Contract reconciliation (frontend-only endpoints not in backend endpoint map)
- [ ] Confirm backend contract for student endpoints currently used by frontend:
  - `GET /api/v1/admin/students/{student}`
  - `PUT /api/v1/admin/students/{student}/status`
  - `POST /api/v1/admin/students/{student}/reset-device`
  - `POST /api/v1/admin/students/import`
  - `GET /api/v1/admin/students/export`
- [ ] Confirm backend contract for admin-user read endpoints currently used by frontend:
  - `GET /api/v1/admin/users/{user}`
  - `GET /api/v1/admin/users/{user}/roles`
- [ ] Confirm backend contract for `GET /api/v1/admin/roles/{role}/permissions` (frontend currently calls it; endpoint map lists `PUT` only).
- [ ] Confirm backend contract for `GET /api/v1/admin/audit-logs/{logId}` (frontend currently calls it; endpoint map lists list endpoint only).
- [ ] Confirm instructor update strategy: keep multipart `_method=PUT` (`POST /instructors/{id}`) or move to documented `PUT/PATCH`.
