# Categories UI Tickets (Center-Scoped CRUD)

Status legend: `TODO` / `IN_PROGRESS` / `DONE`

## Ticket 1 — Data Contracts + API Hooks
- **Status:** `DONE`
- **Goal:** Align category types and hooks with center-scoped backend payloads.
- **Files:**
  - `src/features/categories/types/category.ts`
  - `src/features/categories/services/categories.service.ts`
  - `src/features/categories/hooks/use-categories.ts`
- **Tasks:**
  - Add translation-friendly fields to `Category` (`title_translations`, `description_translations`, `order_index`, `is_active`).
  - Add list params for `is_active` + `parent_id`.
  - Add create/update payload shape based on translations.
  - Keep all endpoints center-scoped (`/centers/{center_id}/categories`).
  - Ensure react-query invalidation keys are stable and center-aware.

## Ticket 2 — Categories Table UX (List + Filters + Actions)
- **Status:** `DONE`
- **Goal:** Build production-grade categories listing with filters and row actions.
- **Files:**
  - `src/features/categories/components/CategoriesTable.tsx`
- **Tasks:**
  - Add filters: search, active status, parent category.
  - Add columns: title, parent, order, status, actions.
  - Add actions: edit + delete callbacks.
  - Keep loading/error/empty states and pagination.

## Ticket 3 — CRUD Modals (Create/Edit/Delete)
- **Status:** `DONE`
- **Goal:** Add full create, update, delete UX with validation and inline feedback.
- **Files:**
  - `src/features/categories/components/CategoryFormDialog.tsx` (new)
  - `src/features/categories/components/DeleteCategoryDialog.tsx` (new)
- **Tasks:**
  - Create/Edit modal with `react-hook-form + zod`.
  - Fields: `title_translations.en/ar`, `description_translations.en/ar`, `parent_id`, `order_index`, `is_active`.
  - Validation: at least one title locale; numeric order index.
  - Inline API error alert in modal and pending states.
  - Delete confirmation modal with danger messaging.

## Ticket 4 — Page Wiring (System Admin vs Center Admin)
- **Status:** `DONE`
- **Goal:** Wire role/scope behavior in global and center-scoped categories pages.
- **Files:**
  - `src/app/(dashboard)/categories/page.tsx`
  - `src/app/(dashboard)/centers/[centerId]/categories/page.tsx`
  - `src/features/centers/components/CenterPicker.tsx` (reuse)
- **Tasks:**
  - Global `/categories`:
    - show `CenterPicker` in actions;
    - require center selection for CRUD actions.
  - Center-scoped `/centers/[centerId]/categories`:
    - full CRUD without picker.
  - Add success/error inline feedback at page level.

## Ticket 5 — QA + Guardrails
- **Status:** `DONE`
- **Goal:** Ensure stable UX and no regressions.
- **Files:**
  - `src/features/categories/components/CategoriesTable.tsx`
  - `src/features/categories/components/CategoryFormDialog.tsx`
  - `src/features/categories/components/DeleteCategoryDialog.tsx`
  - `src/app/(dashboard)/categories/page.tsx`
  - `src/app/(dashboard)/centers/[centerId]/categories/page.tsx`
- **Tasks:**
  - Prevent invalid parent selection during edit (self-parenting).
  - Confirm center-scoped calls for every mutation and query.
  - Run lint for changed files and fix all issues.
