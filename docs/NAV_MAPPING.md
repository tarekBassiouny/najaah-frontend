# Admin Sidebar Mapping (Backend Postman Reference)

This document maps the backend Postman collection folders (admin) to the LMS Admin Panel sidebar navigation. It is a reference only; no UI implementation is implied.

Source: `/Users/tarekbassiouny/projects/xyz-lms/backend/postman/xyz-lms.postman.json`

## Mapping
- Admin – Auth (JWT) → Auth flow only (no sidebar entry)
- Admin – Analytics → Analytics
- Admin – Categories → Categories
- Admin – Centers → Centers (platform only)
- Admin – Courses → Courses
- Admin – Enrollment & Controls → Enrollments & Controls (Enrollments, Extra View Requests, Device Change Requests)
- Admin – Videos → Videos
- Admin – Instructors → Users → Instructors
- Admin – PDFs → PDFs
- Admin – Roles → Roles & Permissions → Roles
- Admin – Permissions → Roles & Permissions → Permissions
- Admin – Users → Users → Admins
- Admin – Students → Users → Students
- Admin – Settings → Settings
- Admin – Audit Logs → Audit Logs

## Notes
- This mapping mirrors the Postman collection structure one-to-one.
- Admin – Users maps to admin users; keep label “Admins” in the sidebar to avoid confusion.
- Platform-only sections should remain gated by tenant and capability rules.
