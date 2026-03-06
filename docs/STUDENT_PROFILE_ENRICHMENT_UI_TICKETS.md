# Student Profile Enrichment UI Tickets (Single `/education`)

Status legend: `TODO` / `IN_PROGRESS` / `DONE`

## Ticket 1 — Education Data Layer (Backend-Aligned)
- **Status:** `TODO`
- **Goal:** Add types/services/hooks for grades, schools, colleges using confirmed backend endpoints.
- **Files:**
  - `src/features/education/types/education.ts`
  - `src/features/education/services/grades.service.ts`
  - `src/features/education/services/schools.service.ts`
  - `src/features/education/services/colleges.service.ts`
  - `src/features/education/hooks/use-grades.ts`
  - `src/features/education/hooks/use-schools.ts`
  - `src/features/education/hooks/use-colleges.ts`
- **Tasks:**
  - Implement list/create/get/update/delete + lookup endpoints.
  - Normalize translation/name/stage/type fields for table/form usage.
  - Add stable query keys and cache invalidation per center + entity.

## Ticket 2 — Single `/education` Page Shell
- **Status:** `TODO`
- **Goal:** Build one page for both system and center admins.
- **Files:**
  - `src/app/(dashboard)/education/page.tsx`
  - `src/features/education/components/EducationPanel.tsx`
- **Tasks:**
  - System admin mode:
    - show `CenterPicker` and require selected center.
  - Center admin mode:
    - auto-use tenant center; hide picker.
  - Add 3-tab switcher (`Grades`, `Schools`, `Colleges`) using existing tab style pattern.

## Ticket 3 — Grades Tab CRUD
- **Status:** `TODO`
- **Goal:** Implement grades management in `/education`.
- **Files:**
  - `src/features/education/components/GradesTable.tsx`
  - `src/features/education/components/GradeFormDialog.tsx`
  - `src/features/education/components/DeleteGradeDialog.tsx`
- **Tasks:**
  - Reuse existing list pattern:
    - `ListingCard`, `ListingFilters`, `Table`, `PaginationControls`.
  - Filters: search, stage, active status.
  - Form fields: `name_translations`, `stage`, `order`, `is_active`.

## Ticket 4 — Schools Tab CRUD
- **Status:** `TODO`
- **Goal:** Implement schools management in `/education`.
- **Files:**
  - `src/features/education/components/SchoolsTable.tsx`
  - `src/features/education/components/SchoolFormDialog.tsx`
  - `src/features/education/components/DeleteSchoolDialog.tsx`
- **Tasks:**
  - Reuse existing list pattern and dropdown style.
  - Filters: search, type, active status.
  - Form fields: `name_translations`, `type`, `address`, `is_active`.

## Ticket 5 — Colleges Tab CRUD
- **Status:** `TODO`
- **Goal:** Implement colleges management in `/education`.
- **Files:**
  - `src/features/education/components/CollegesTable.tsx`
  - `src/features/education/components/CollegeFormDialog.tsx`
  - `src/features/education/components/DeleteCollegeDialog.tsx`
- **Tasks:**
  - Reuse existing list pattern and dropdown style.
  - Filters: search, active status.
  - Form fields: `name_translations`, optional `type`, `address`, `is_active`.

## Ticket 6 — Center Settings `education_profile` Controls
- **Status:** `TODO`
- **Goal:** Add module enable/require controls to center settings.
- **Files:**
  - `src/features/centers/components/forms/CenterPolicyForm.tsx`
  - `src/features/centers/components/forms/index.ts`
  - `src/app/(dashboard)/centers/[centerId]/settings/page.tsx`
  - `src/app/(dashboard)/centers/settings/page.tsx`
- **Tasks:**
  - Add controls for `enable_*` and `require_*`.
  - Disable `require_*` when related `enable_*` is off.
  - Save with partial patch to `settings.education_profile`.

## Ticket 7 — Student List Filters + Education Display
- **Status:** `TODO`
- **Goal:** Use backend student enrichment fields in admin student views.
- **Files:**
  - `src/features/students/services/students.service.ts`
  - `src/features/students/hooks/use-students.ts`
  - `src/features/students/types/student.ts`
  - `src/features/students/components/StudentsTable.tsx`
  - `src/features/students/components/StudentDetailsDrawer.tsx`
  - `src/app/(dashboard)/centers/[centerId]/students/[studentId]/page.tsx`
  - `src/features/education/hooks/use-grade-options.ts`
  - `src/features/education/hooks/use-school-options.ts`
  - `src/features/education/hooks/use-college-options.ts`
- **Tasks:**
  - Add filters: `grade_id`, `school_id`, `college_id`, `stage`.
  - Show grade/school/college in details/profile UI.
  - Keep create/edit education fields gated until admin payload contract is explicitly confirmed.

## Ticket 8 — Navigation + Route Capability Wiring
- **Status:** `TODO`
- **Goal:** Make `/education` discoverable for both scopes.
- **Files:**
  - `src/components/Layouts/sidebar/data/sidebar.center.ts`
  - `src/components/Layouts/sidebar/data/sidebar.platform.ts`
  - `src/components/Layouts/sidebar/data/index.ts`
  - `src/lib/capabilities.ts` (only if new capability is needed)
- **Tasks:**
  - Add sidebar entry for `Education`.
  - Map route capability rule for `/education` and `/education/*`.
  - Reuse existing capability if possible (prefer `manage_students` unless backend requires different permission).

## Ticket 9 — Error Mapping + QA
- **Status:** `TODO`
- **Goal:** Align UI messaging with backend validation and protect UX quality.
- **Files:**
  - education dialogs/tables + student filters/details files
  - `docs/STUDENT_PROFILE_ENRICHMENT_UI_UX_PLAN.md`
- **Tasks:**
  - Handle backend error codes/messages:
    - `GRADE_NOT_FOUND`, `SCHOOL_NOT_FOUND`, `COLLEGE_NOT_FOUND`
    - `GRADE_INACTIVE`, `SCHOOL_INACTIVE`, `COLLEGE_INACTIVE`
    - `GRADE_HAS_STUDENTS`, `SCHOOL_HAS_STUDENTS`, `COLLEGE_HAS_STUDENTS`
    - `DUPLICATE_SLUG`
  - Validate loading/empty/error states for all 3 tabs.
  - Validate center-scoped behavior in both system and center admin modes.
  - Validate style consistency with existing paginated tables and filters.

