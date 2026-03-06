# Student Profile Enrichment UI/UX Plan (Backend Aligned)

## Status
- Backend status: ready and verified by backend team (`./vendor/bin/sail composer quality`, 882 tests passed).
- Frontend status: planning aligned; implementation not started yet.

## Final Product Decisions
- Single management route: `/education`.
- Reuse existing frontend primitives and patterns only:
  - paginated table pattern
  - listing filters
  - dropdown/searchable selects
  - modal dialogs
  - existing NextAdmin styling/tokens
- No custom UI system or new global styles.

## Confirmed Backend Contract

### 1) Center Settings
- Endpoint:
  - `PATCH /api/v1/admin/centers/{center}/settings`
- Payload key:
  - `settings.education_profile`
- Shape:

```json
{
  "enable_grade": true,
  "enable_school": false,
  "enable_college": true,
  "require_grade": true,
  "require_school": false,
  "require_college": false
}
```

### 2) Admin CRUD + Lookup (Center-Scoped)
- Grades:
  - `GET/POST /api/v1/admin/centers/{center}/grades`
  - `GET/PUT/DELETE /api/v1/admin/centers/{center}/grades/{grade}`
  - `GET /api/v1/admin/centers/{center}/grades/lookup`
- Schools:
  - same pattern under `/schools`
- Colleges:
  - same pattern under `/colleges`
- Rule:
  - Admin CRUD stays available even when student module toggles are disabled.

### 3) Mobile Lookup + Education Update
- Lookup:
  - `GET /api/v1/centers/{center}/grades`
  - `GET /api/v1/centers/{center}/schools`
  - `GET /api/v1/centers/{center}/colleges`
- Disabled module behavior:
  - endpoint returns empty list (`data: []`).
- Student update endpoint:
  - `PATCH /api/v1/auth/me/education`
- Validation behavior:
  - disabled submitted module => `422 VALIDATION_ERROR`
  - required module missing/null => `422`
  - ids must be active and within student scope.

### 4) Student List/Profile Enrichment
- Admin student list supports filters:
  - `grade_id`, `school_id`, `college_id`, `stage`
- Student list/profile resources now include education entities.

## Route and Scope Model
- Use one page only: `src/app/(dashboard)/education/page.tsx`.
- System admin:
  - page shows `CenterPicker`
  - center must be selected to query and mutate education entities.
- Center admin:
  - center resolved from tenant context
  - no center picker shown
  - all requests center-scoped automatically.
- No `/centers/[centerId]/education` route in this implementation.

## `/education` Page UX Composition
- Header:
  - title: `Education`
  - description: `Manage grades, schools, and colleges by center`
  - actions:
    - `CenterPicker` for system scope
    - contextual create button based on active tab.
- Tab switcher:
  - tabs: `Grades`, `Schools`, `Colleges`
  - visual style reused from existing tab button sections (`VideoAccessPanel` pattern).
- Body:
  - active tab mounts a dedicated table module.
  - each table uses `ListingCard`, `ListingFilters`, `Table`, `PaginationControls`.

## Per-Tab UX Requirements

### Grades Tab
- Filters:
  - search, stage, active status
- Table columns:
  - name, stage, order, active status, actions
- Form fields:
  - `name_translations.en/ar`, `stage`, `order`, `is_active`

### Schools Tab
- Filters:
  - search, type, active status
- Table columns:
  - name, type, address, active status, actions
- Form fields:
  - `name_translations.en/ar`, `type`, `address`, `is_active`

### Colleges Tab
- Filters:
  - search, active status
- Table columns:
  - name, type, address, active status, actions
- Form fields:
  - `name_translations.en/ar`, `type` (optional), `address`, `is_active`

## Center Settings UX (Education Profile)
- Add an `Education Profile` section in center settings form (same card pattern as existing policy settings).
- Controls:
  - `enable_grade`, `enable_school`, `enable_college`
  - `require_grade`, `require_school`, `require_college`
- UX rules:
  - disable `require_*` control when matching `enable_*` is false.
  - show helper note that disabling affects student/mobile behavior only.
  - submit partial patch under `settings.education_profile`.

## Student Management UX Integration
- `StudentsTable`:
  - add dropdown/searchable filters for `grade_id`, `school_id`, `college_id`, `stage`.
- `StudentDetailsDrawer` and center-student profile page:
  - add education section showing grade/school/college.
- `StudentFormDialog`:
  - keep education edit controls behind a backend contract confirmation gate for admin create/update payload.

## Error Handling Contract
- Surface backend error codes/messages through existing admin error parsing:
  - `GRADE_NOT_FOUND`, `SCHOOL_NOT_FOUND`, `COLLEGE_NOT_FOUND`
  - `GRADE_INACTIVE`, `SCHOOL_INACTIVE`, `COLLEGE_INACTIVE`
  - `GRADE_HAS_STUDENTS`, `SCHOOL_HAS_STUDENTS`, `COLLEGE_HAS_STUDENTS`
  - `DUPLICATE_SLUG`

## Planned Frontend Artifacts

### New
- `src/features/education/types/education.ts`
- `src/features/education/services/grades.service.ts`
- `src/features/education/services/schools.service.ts`
- `src/features/education/services/colleges.service.ts`
- `src/features/education/hooks/use-grades.ts`
- `src/features/education/hooks/use-schools.ts`
- `src/features/education/hooks/use-colleges.ts`
- `src/features/education/hooks/use-grade-options.ts`
- `src/features/education/hooks/use-school-options.ts`
- `src/features/education/hooks/use-college-options.ts`
- `src/features/education/components/EducationPanel.tsx`
- `src/features/education/components/GradesTable.tsx`
- `src/features/education/components/GradeFormDialog.tsx`
- `src/features/education/components/DeleteGradeDialog.tsx`
- `src/features/education/components/SchoolsTable.tsx`
- `src/features/education/components/SchoolFormDialog.tsx`
- `src/features/education/components/DeleteSchoolDialog.tsx`
- `src/features/education/components/CollegesTable.tsx`
- `src/features/education/components/CollegeFormDialog.tsx`
- `src/features/education/components/DeleteCollegeDialog.tsx`
- `src/app/(dashboard)/education/page.tsx`

### Existing to Extend
- `src/features/centers/components/forms/CenterPolicyForm.tsx`
- `src/features/centers/components/forms/index.ts`
- `src/app/(dashboard)/centers/[centerId]/settings/page.tsx`
- `src/app/(dashboard)/centers/settings/page.tsx`
- `src/features/students/types/student.ts`
- `src/features/students/services/students.service.ts`
- `src/features/students/hooks/use-students.ts`
- `src/features/students/components/StudentsTable.tsx`
- `src/features/students/components/StudentDetailsDrawer.tsx`
- `src/app/(dashboard)/centers/[centerId]/students/[studentId]/page.tsx`
- `src/components/Layouts/sidebar/data/sidebar.center.ts`
- `src/components/Layouts/sidebar/data/sidebar.platform.ts`
- `src/components/Layouts/sidebar/data/index.ts`

## Build Sequence
1. Education API types/services/hooks.
2. Single `/education` page shell + tab panel.
3. Grades tab CRUD.
4. Schools tab CRUD.
5. Colleges tab CRUD.
6. Center settings `education_profile` controls.
7. Student filters + education display.
8. Navigation wiring and permission mapping.
9. QA and rollout validation.

