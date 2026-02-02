# Admin Models/Entities Checklist

Last verified: 2026-02-01
Use this to update models/types/services/hooks/components against backend admin resources.

## Auth
- [ ] Add password reset service for `/auth/password/reset`.
- [ ] Confirm `AdminAuthResponse` typings cover `/auth/me` payload with roles/permissions.

## Centers
- [ ] Add Center create/update/delete services.
- [ ] Add center restore action.
- [ ] Add onboarding retry action.
- [ ] Add branding logo upload action.
- [ ] Review `Center` type for branding/onboarding fields.

## Center Settings
- [ ] Add `CenterSettings` type.
- [ ] Add services/hooks for GET + PATCH `/centers/{center}/settings`.

## Categories (Center-scoped)
- [ ] Add `Category` type and filters.
- [ ] Add services/hooks for `/centers/{center}/categories` CRUD.

## Courses
- [ ] Add center-scoped course CRUD services.
- [ ] Add course clone action.
- [ ] Add course publish action.
- [ ] Add course media assignment services (videos/pdfs).
- [ ] Expand `Course` type to reflect backend fields.

## Sections
- [ ] Add `Section` type (plus section media/structure types).
- [ ] Add services/hooks for section CRUD, reorder, restore, visibility.
- [ ] Add services/hooks for structure endpoints (create/update/delete with videos/pdfs).
- [ ] Add services/hooks for section videos/pdfs attach/detach.
- [ ] Add services/hooks for section publish/unpublish.

## Videos
- [ ] Update services to use `/centers/{center}/videos` endpoints.
- [ ] Add show/create/update/delete endpoints.
- [ ] Add `VideoUploadSession` type + upload session service.

## PDFs
- [ ] Update services to use `/centers/{center}/pdfs` endpoints.
- [ ] Add show/create/update/delete endpoints.
- [ ] Add `PdfUploadSession` type + upload session/finalize services.

## Instructors
- [ ] Verify instructors CRUD coverage (list/show/create/update/delete).
- [ ] Add course instructor assignment endpoints.

## Enrollments
- [ ] Add `Enrollment` type + filters.
- [ ] Add services/hooks for list/show/create/update/delete.

## Students
- [ ] Add student create/update/delete services.
- [ ] Confirm `Student` type includes admin-managed fields.

## Device Change Requests
- [ ] Add approve/reject/pre-approve actions.
- [ ] Add create-for-student action.

## Extra View Requests
- [ ] Add approve/reject actions.

## Audit Logs
- [ ] Confirm `AuditLog` type matches backend payloads.

## Analytics
- [ ] Add analytics types for overview, courses-media, learners-enrollments, devices-requests.
- [ ] Add services/hooks for analytics endpoints.

## Agents
- [ ] Add `/agents/available` endpoint + types.
- [ ] Add `/agents/execute` generic endpoint + types.

## Roles
- [ ] Add role create/update/delete services.
- [ ] Confirm role type includes permissions summary fields.

## Permissions
- [ ] Confirm permission types reflect backend permissions list.

## Admin Users
- [ ] Add admin user create/update/delete services.
- [ ] Add admin user role sync service.
- [ ] Confirm admin user type includes role/center assignment fields.

## Settings Preview
- [ ] Add settings preview endpoint service + type.
