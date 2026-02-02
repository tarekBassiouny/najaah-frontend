# Categories CRUD UX Plan

## Goal
- Build a categories management experience that supports:
  - **System Admin**: manage categories across all centers.
  - **Center Admin/Owner**: manage categories for **only their center**.

## Backend Endpoints (Center-Scoped)
- `GET /api/v1/admin/centers/{center_id}/categories`
- `POST /api/v1/admin/centers/{center_id}/categories`
- `GET /api/v1/admin/centers/{center_id}/categories/{category_id}`
- `PUT /api/v1/admin/centers/{center_id}/categories/{category_id}`
- `DELETE /api/v1/admin/centers/{center_id}/categories/{category_id}`

## UX Model

### 1) Route Strategy
- **Global page (System Admin audit):** `/categories`
  - Shows list with **Center Picker**.
  - Supports quick filtering/auditing.
  - Create/Edit/Delete actions require selected center and then open center-scoped flow.
- **Center-scoped page (primary CRUD):** `/centers/[centerId]/categories`
  - Full CRUD for selected center.
  - This is the main management page.

### 2) Role Behavior
- **System Admin**
  - Can select any center from picker.
  - Can create/edit/delete categories in selected center.
  - If no center selected: table is read-only or empty-state prompting center selection.
- **Center Admin/Owner**
  - No center picker.
  - Auto-scoped to their own center.
  - Full CRUD only for their center.

### 3) Page Content Layout
- Page header:
  - Title: `Categories`
  - Description: context based on role/scope.
  - Actions: `Center Picker` (system admin only), `Create Category`.
- Filters row:
  - Search by title.
  - `Status` filter (`All`, `Active`, `Inactive`).
  - `Parent Category` filter.
- Table:
  - `Title`, `Parent`, `Order`, `Status`, `Updated At`, `Actions`.
- Pagination footer.

### 4) CRUD Interaction Design
- **Create**
  - Open modal: `Create Category`.
  - Fields:
    - `title_translations.en`, `title_translations.ar` (at least one required)
    - `description_translations.en`, `description_translations.ar` (optional)
    - `parent_id` (optional)
    - `order_index` (number)
    - `is_active` (toggle)
  - Submit -> toast success/error -> refresh list.
- **Read**
  - Row click or `View` opens detail drawer/modal (or dedicated page later).
- **Update**
  - `Edit` action opens prefilled modal.
  - Submit -> toast -> refresh list.
- **Delete**
  - `Delete` action opens confirm modal.
  - Confirm -> API delete -> toast -> refresh list.

### 5) Validation + Feedback
- Inline field errors from client schema + server messages.
- Prevent invalid parent selection:
  - no self-parenting when editing.
- Show loading/skeleton states for table and submit buttons.
- Empty states:
  - no center selected (system admin)
  - no categories yet
  - no search results

## Implementation Tasks
1. Data layer: category types + center-scoped service + React Query hooks.
2. Build reusable `CategoryFormModal` (create/edit).
3. Build `CategoriesTable` with filters/actions/pagination.
4. Add center-scoped page: `/centers/[centerId]/categories`.
5. Update global `/categories` page to use Center Picker + center-aware actions.
6. Add permission guards for system-admin vs center-admin behavior.
7. QA states: loading, empty, validation, errors, delete confirmations.

## Acceptance Criteria
- System admin can CRUD categories for any selected center.
- Center admin/owner can CRUD categories only for own center.
- All category API calls include `center_id` in path.
- UX is consistent with current NextAdmin style (header, table, modals, toasts).
