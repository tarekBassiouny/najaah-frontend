# Analytics Page UI/UX Plan

## Goal
- Build a single analytics page that consumes:
  - `GET /api/v1/admin/analytics/overview`
  - `GET /api/v1/admin/analytics/courses-media`
  - `GET /api/v1/admin/analytics/learners-enrollments`
  - `GET /api/v1/admin/analytics/devices-requests`
- Support both:
  - **System Admin** (optional center filter)
  - **Center Admin/Owner** (center-scoped to own center)

## UX Layout
- Header:
  - Title: `Analytics`
  - Description: `Cross-resource performance insights`
- Filter Bar:
  - Center picker (system admin only)
  - From date
  - To date
  - Timezone select (default `UTC`)
  - `Apply` and `Reset` actions
- KPI Strip:
  - Numeric highlights derived from `overview` payload.
- Endpoint Sections (cards):
  - Overview
  - Courses & Media
  - Learners & Enrollments
  - Devices & Requests
  - Each section displays key-value stats and handles loading/error states.

## Role Behavior
- System Admin:
  - Can query all centers or selected center.
- Center Admin/Owner:
  - No center picker.
  - Queries always include current center id.

## Interaction Rules
- Default date range: last 30 days.
- `Apply` updates all four queries at once.
- `Reset` restores default range + timezone.
- Show section-level retry and clear feedback on failures.

## Component Tickets
1. `src/app/(dashboard)/analytics/page.tsx`
   - Build page shell, filters state, and endpoint query wiring.
2. `src/features/analytics/components/AnalyticsFiltersBar.tsx`
   - Reusable center/date/timezone filter controls.
3. `src/features/analytics/components/AnalyticsSectionCard.tsx`
   - Reusable endpoint result card with loading/error/data rendering.
4. `src/features/analytics/components/AnalyticsKpis.tsx`
   - Numeric KPI extraction and display from overview payload.
