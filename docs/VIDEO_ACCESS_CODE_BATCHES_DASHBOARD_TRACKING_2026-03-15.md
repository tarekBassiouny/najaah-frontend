# Video Access Code Batches Dashboard Tracking

Last updated: 2026-03-15

## Scope

Implement the admin dashboard support for the `video_code` course access model:

- Add `access_model` handling to course create/edit/detail flows
- Add center-scoped video code batch management screens and actions
- Add batch exports, expand, close, and statistics flows
- Add a full redemptions table with pagination on batch details
- Prevent enrollment-only admin workflows from targeting `video_code` courses

## Backend Assumptions

These assumptions are required for the frontend implementation:

1. Course list and course detail responses include `access_model` everywhere the dashboard reads courses.
2. Video code batch list/detail/statistics endpoints match the documented admin guide payloads.
3. A dedicated paginated redemptions endpoint will exist for batch details because the documented statistics response only includes `recent_redemptions`.
4. Batch pages and actions are gated by `manage_video_access`, which maps to backend permission `video_access.manage`.

Proposed redemptions endpoint contract:

- `GET /api/v1/admin/centers/{centerId}/code-batches/{batchId}/redemptions`
- Query params:
  - `page`
  - `per_page`
  - `search` optional
- Expected response shape:

```json
{
  "success": true,
  "data": [
    {
      "id": 100,
      "sequence_number": 42,
      "code": "VB001-00042-X7K9",
      "user": {
        "id": 500,
        "name": "John Doe",
        "phone": "+1234567890"
      },
      "redeemed_at": "2026-03-14T14:30:00Z"
    }
  ],
  "meta": {
    "current_page": 1,
    "last_page": 1,
    "per_page": 15,
    "total": 1
  }
}
```

## Delivery Phases

### Phase 1: Contracts and Shared Types

- [x] Extend course types with `access_model`
- [x] Add batch and redemption types
- [x] Add batch service layer
- [x] Add batch React Query hooks
- [x] Add file download helpers for CSV/PDF exports

### Phase 2: Course Access Model UI

- [x] Add `access_model` to course create form
- [x] Show immutable `access_model` in course edit form
- [x] Hide enrollment-only controls when `access_model === "video_code"`
- [x] Surface `access_model` on course detail
- [x] Add a route entry point to manage code batches from course detail

### Phase 3: Batch Management Screens

- [x] Add center-scoped batch list page
- [x] Add batch details page
- [x] Add create batch dialog
- [x] Add expand batch dialog
- [x] Add close batch dialog
- [x] Add export CSV/PDF actions

### Phase 4: Navigation and Permissions

- [x] Add sidebar entry for video code batches
- [x] Add route capability mapping for all new routes
- [x] Keep center-scoped behavior consistent for center admins and system admins on center pages

### Phase 5: Regression Containment

- [x] Restrict enrollment dialogs to `enrollment` courses
- [x] Restrict student-specific video access code generation dialogs to `enrollment` courses
- [x] Update batch-related entry points on course detail pages
- [ ] Add a video-level entry point if the admin videos payload starts returning reliable course access-model data

### Phase 6: Validation

- [x] Run lint on changed files or the repo
- [x] Record unresolved backend dependencies
- [x] Record any remaining UI gaps

## Notes

- The admin guide asked for quick close actions directly from the list view. Implementation target: action menu with a compact close modal.
- The batch details page should include a full paginated redemptions table, not only a recent activity summary.
- Validation completed on 2026-03-15:
  - `npm run lint`
  - `npm run build`
- Lint warnings came only from generated coverage assets outside the feature work:
  - `coverage/unit/block-navigation.js`
  - `coverage/unit/lcov-report/block-navigation.js`
- Remaining backend dependency:
  - The full redemptions table uses a dedicated paginated endpoint because the documented statistics response only includes `recent_redemptions`.
- Backend alignment applied on 2026-03-15:
  - `manage_video_access` now maps to `video_access.manage`
  - Batch routes/sidebar use `manage_video_access`, not `manage_videos`
  - `/statistics` powers summary widgets plus recent redemption preview
  - `/redemptions` powers the full paginated table
  - Close or sold-limit update actions now respect `batch.can_close`
- Remaining optional UI enhancement:
  - If video list/detail payloads expose `access_model` or course model data reliably, add a direct "Create Batch" or "Manage Batches" action from the admin videos table.
