# Admin API Resources (Backend Inventory)

Last verified: 2026-02-01
Source of truth: `najaah/backend/routes/api/v1/admin/*.php` and `najaah/backend/bootstrap/app.php`.

## Global Notes
- Base prefix: `/api/v1/admin`.
- All admin routes are registered under the `api` middleware group.
- All admin resources (except `auth` login/reset) are nested under `jwt.admin` in `bootstrap/app.php`.
- Per-route permissions are enforced via `require.permission:*` and sometimes `require.role:*`.

## Auth
- POST `/auth/login` (throttle: `admin-login`)
- POST `/auth/password/reset`
- GET `/auth/me` (jwt.admin)
- POST `/auth/refresh` (jwt.admin)
- POST `/auth/logout` (jwt.admin)

## Centers (require.permission:center.manage, require.role:super_admin)
- GET `/centers`
- POST `/centers`
- GET `/centers/{center}`
- PUT `/centers/{center}`
- DELETE `/centers/{center}`
- POST `/centers/{center}/restore`
- POST `/centers/{center}/onboarding/retry`
- POST `/centers/{center}/branding/logo`

## Center Settings (require.permission:settings.manage)
- GET `/centers/{center}/settings`
- PATCH `/centers/{center}/settings`

## Categories (require.permission:course.manage)
- GET `/centers/{center}/categories`
- POST `/centers/{center}/categories`
- GET `/centers/{center}/categories/{category}`
- PUT `/centers/{center}/categories/{category}`
- DELETE `/centers/{center}/categories/{category}`

## Courses (require.permission:course.manage)
- GET `/courses`
- POST `/courses/{course}/clone`
- GET `/centers/{center}/courses`
- POST `/centers/{center}/courses`
- GET `/centers/{center}/courses/{course}`
- PUT `/centers/{center}/courses/{course}`
- DELETE `/centers/{center}/courses/{course}`

## Course Publishing (require.permission:course.publish)
- POST `/courses/{course}/publish`

## Course Media Assignments (require.permission:course.manage)
- POST `/centers/{center}/courses/{course}/videos`
- DELETE `/centers/{center}/courses/{course}/videos/{video}`
- POST `/centers/{center}/courses/{course}/pdfs`
- DELETE `/centers/{center}/courses/{course}/pdfs/{pdf}`

## Sections (require.permission:section.manage)
Base: `/centers/{center}/courses/{course}/sections`
- GET `/`
- POST `/`
- PUT `/reorder`
- GET `/{section}`
- PUT `/{section}`
- DELETE `/{section}`
- POST `/{section}/restore`
- PATCH `/{section}/visibility`
- POST `/structure`
- PUT `/{section}/structure`
- DELETE `/{section}/structure`
- GET `/{section}/videos`
- GET `/{section}/videos/{video}`
- POST `/{section}/videos`
- DELETE `/{section}/videos/{video}`
- GET `/{section}/pdfs`
- GET `/{section}/pdfs/{pdf}`
- POST `/{section}/pdfs`
- DELETE `/{section}/pdfs/{pdf}`
- POST `/{section}/publish`
- POST `/{section}/unpublish`

## Videos (require.permission:video.manage)
- GET `/centers/{center}/videos`
- POST `/centers/{center}/videos`
- GET `/centers/{center}/videos/{video}`
- PUT `/centers/{center}/videos/{video}`
- DELETE `/centers/{center}/videos/{video}`

## Video Upload Sessions (require.permission:video.upload)
- POST `/centers/{center}/videos/upload-sessions`

## PDFs (require.permission:pdf.manage)
- GET `/centers/{center}/pdfs`
- POST `/centers/{center}/pdfs`
- GET `/centers/{center}/pdfs/{pdf}`
- PUT `/centers/{center}/pdfs/{pdf}`
- DELETE `/centers/{center}/pdfs/{pdf}`
- POST `/centers/{center}/pdfs/upload-sessions`
- POST `/centers/{center}/pdfs/upload-sessions/{pdfUploadSession}/finalize`

## Instructors (require.permission:instructor.manage)
- GET `/instructors`
- POST `/instructors`
- GET `/instructors/{instructor}`
- PUT `/instructors/{instructor}`
- DELETE `/instructors/{instructor}`
- POST `/courses/{course}/instructors`
- DELETE `/courses/{course}/instructors/{instructor}`

## Enrollments (require.permission:enrollment.manage)
- GET `/enrollments`
- GET `/enrollments/{enrollment}`
- POST `/enrollments`
- PUT `/enrollments/{enrollment}`
- DELETE `/enrollments/{enrollment}`

## Students
- GET `/students` (require.permission:student.manage)
- PUT `/students/{user}` (require.permission:student.manage)
- POST `/students` (require.permission:student.manage, require.role:super_admin)
- DELETE `/students/{user}` (require.permission:student.manage, require.role:super_admin)

## Device Change Requests (require.permission:device_change.manage)
- GET `/device-change-requests`
- POST `/device-change-requests/{deviceChangeRequest}/approve`
- POST `/device-change-requests/{deviceChangeRequest}/reject`
- POST `/device-change-requests/{deviceChangeRequest}/pre-approve`
- POST `/students/{student}/device-change-requests`

## Extra View Requests (require.permission:extra_view.manage)
- GET `/extra-view-requests`
- POST `/extra-view-requests/{extraViewRequest}/approve`
- POST `/extra-view-requests/{extraViewRequest}/reject`

## Audit Logs (require.permission:audit.view)
- GET `/audit-logs`

## Analytics (require.permission:audit.view)
- GET `/analytics/overview`
- GET `/analytics/courses-media`
- GET `/analytics/learners-enrollments`
- GET `/analytics/devices-requests`

## Agents (jwt.admin, no explicit permission middleware in routes)
- GET `/agents/executions`
- GET `/agents/executions/{agentExecution}`
- GET `/agents/available`
- POST `/agents/execute`
- POST `/agents/content-publishing/execute`
- POST `/agents/enrollment/bulk`

## Roles (require.permission:role.manage)
- GET `/roles`
- GET `/roles/{role}`
- POST `/roles`
- PUT `/roles/{role}`
- DELETE `/roles/{role}`
- PUT `/roles/{role}/permissions`

## Permissions (require.permission:permission.view)
- GET `/permissions`

## Admin Users (require.permission:admin.manage)
- GET `/users`
- POST `/users`
- PUT `/users/{user}`
- DELETE `/users/{user}`
- PUT `/users/{user}/roles`

## Settings Preview (require.permission:settings.manage)
- GET `/settings/preview`
