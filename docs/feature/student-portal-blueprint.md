# Student Portal Feature Tracker

Last updated: 2026-03-31
Status: In Progress
Owner: Codex + user

## Objective
- Build a student-first web portal under `src/app/(portal)` with a consistent visual language based on Image #2.
- Keep `AR/EN` support built in from day one.
- Use Image #1 only as a structural reference for discovery and search flows.
- Track the full feature from architecture through implementation and verification in one document.

## Working Memory

### Scope
- Shared portal surface
- Student portal first
- Parent portal later, reusing the same shell

### Invariants
- Follow `docs/STYLE_GUIDE.md`
- Reuse existing `src/components/ui/*` primitives where practical
- Keep portal routes inside `src/app/(portal)`
- Keep all copy localized in `ar.json` and `en.json`
- Support both `rtl` and `ltr`
- Preserve existing portal auth flows and guards

### Affected Areas
- Routes/layouts: `src/app/(portal)`
- Portal auth: `src/features/portal-auth`
- Shared portal UI: new `src/features/portal/*` modules
- Data services and hooks for portal pages
- Localization: `src/features/localization/dictionaries/*.json`
- Docs: `docs/feature/*`
- Tests: portal UI coverage to be added as implementation lands

### Decisions
- Master visual direction: Image #2
- Explore/search structure: Image #1, styled like Image #2
- Student portal is phase 1; parent portal is phase 2+
- Build shared shell and shared components before secondary pages
- Do not ship Arabic-only pages and translate later

### Open Risks
- Visual drift between dashboard pages and explore pages
- RTL/LTR bugs from hardcoded directional styling
- Long Arabic or English text wrapping poorly in compact cards
- Portal pages diverging too far from repo UI primitives
- Missing backend fields for student-facing dashboard summaries
- Placeholder routes shipping before feature-complete states are ready
- Course visuals still rely on gradients instead of real media/art direction
- Student portal still needs a final reference-match pass against Image #1

## Progress Snapshot

### Completed
- Portal auth UI was redesigned to align with the softer student portal direction
- Student and parent auth validation messages are localized
- Student authenticated shell was implemented under `src/app/(portal)/portal/student/(app)`
- Student routes implemented:
  - `/portal/student`
  - `/portal/student/my-courses`
  - `/portal/student/explore`
  - `/portal/student/course/[courseId]`
  - `/portal/student/assignments`
  - `/portal/student/exams`
  - `/portal/student/profile`
  - `/portal/student/notifications`
- Student shell navigation now includes `explore` and `notifications`
- Explore search and filters now have real client-side interaction state
- Portal translation coverage expanded in `ar.json` and `en.json`
- Translation fallback hardened so missing locale keys fall back to English instead of leaking raw translation keys
- First visual correction pass completed for:
  - student shell
  - dashboard
  - explore
  - course detail
  - shared course card
- Secondary student pages were realigned to the corrected visual system:
  - assignments
  - exams
  - profile
  - notifications
- Shared student portal content was centralized in a single feature hook to remove page-local duplication
- Contract-aware student portal types, services, and React Query hooks were added for the web student API
- Dashboard, explore, and course detail now consume contract-aware data seams with safe fallback behavior
- Explore search/category state now feeds the student web API query layer instead of staying purely presentational
- Profile and dashboard summary blocks now derive part of their values from enrolled-course, weekly-activity, and profile-completion queries
- Parent authenticated shell, dashboard, and children list now exist under `src/app/(portal)/portal/parent/(app)` using the parent web API contract
- Parent child detail and course review routes now exist under:
  - `src/app/(portal)/portal/parent/(app)/children/[studentId]`
  - `src/app/(portal)/portal/parent/(app)/children/[studentId]/courses/[courseId]`
- Portal auth hardening is complete for logout/session cleanup, interceptor bypass handling, token refresh scheduling, and typed multi-tab auth sync
- Focused portal unit coverage now exists for route guards, logout/session cleanup, interceptor bypasses, parent service normalization, and parent detail page rendering
- Production build passes with current portal routes

### In Progress
- Matching the dashboard, card hierarchy, and spacing more closely to the reference image
- Tightening Arabic typography, spacing, and density against the visual target
- Replacing decorative gradients with more credible course imagery/art direction
- Moving page-local mock arrays toward structured shared mock data/hooks
- Preparing the student portal for contract-backed data integration using the backend web student API
- Replacing remaining fallback-only sections with contract-backed mappings where backend fields are stable enough
- Keeping backend docs in `/Users/tarekbassiouny/projects/najaah-backend` as the source of truth before wiring any additional live student portal state
- Running broader responsive, AR/EN, and RTL/LTR QA across the completed portal routes

### Not Started
- Full responsive QA
- Full AR/EN + RTL/LTR QA
- Broader portal integration and end-to-end coverage
- Dead code cleanup for superseded portal pieces

## Full Feature Scope

### Product Scope
- Student dashboard
- Student course discovery
- Student course participation flows
- Student assignments and exams views
- Student profile and notifications
- Parent portal follow-up phase

### Technical Scope
- Portal shell and navigation
- Portal auth and route guards
- Portal page components
- Portal hooks and services
- Localization and RTL/LTR behavior
- Responsive behavior
- QA and release readiness

## Feature Workstreams

### 1. Architecture
- Route structure
- Shell structure
- Feature module boundaries
- Shared component boundaries

### 2. Auth and Access
- Student login and redirect flow
- Parent login and redirect flow
- Guard behavior for public vs protected portal routes
- Logout and session expiry handling

### 3. Data and Contracts
- Dashboard data requirements
- Course listing data requirements
- Course details data requirements
- Assignments and exams data requirements
- Notification and profile data requirements

### 4. UI and Interaction
- Shared shell
- Page layouts
- Reusable cards and progress components
- Discovery/filter interactions

### 5. Localization
- Translation namespaces
- Arabic and English content coverage
- RTL/LTR behavior

### 6. Quality
- Visual consistency review
- Responsive review
- Lint/build/test coverage
- Empty/loading/error states

## Portal Information Architecture

### Student Routes
- `/portal/student`
- `/portal/student/my-courses`
- `/portal/student/explore`
- `/portal/student/course/[courseId]`
- `/portal/student/assignments`
- `/portal/student/exams`
- `/portal/student/profile`
- `/portal/student/notifications`

### Parent Routes
- `/portal/parent`
- `/portal/parent/children`
- `/portal/parent/child/[childId]`
- `/portal/parent/assignments`
- `/portal/parent/exams`
- `/portal/parent/notifications`

## Design Direction

### Use Image #2 For
- Dashboard
- My Courses
- Assignments
- Exams
- Profile
- Notifications

### Use Image #1 Structure With Image #2 Styling For
- Explore
- Search
- Category browsing

## Shared Components Inventory

### Shell
- `PortalShell`
- `PortalSidebar`
- `PortalTopbar`
- `PortalMobileNav`
- `PortalPageHeader`

### Dashboard and Content
- `WelcomeHero`
- `MetricCard`
- `SectionHeader`
- `ContinueLearningCard`
- `EnrolledCourseCard`
- `ProgressRing`
- `ProgressBar`
- `ActivityList`

### Explore and Discovery
- `ExploreHero`
- `SearchInput`
- `CategoryChipGroup`
- `FilterSidebar`
- `FilterDrawer`
- `CatalogCourseCard`
- `PaginationControls`

### Shared States
- `PortalEmptyState`
- `PortalLoadingState`
- `PortalErrorState`
- `NotificationBell`
- `UserMenu`

## i18n Structure

Use one portal namespace in both:
- `src/features/localization/dictionaries/ar.json`
- `src/features/localization/dictionaries/en.json`

Recommended top-level keys:
- `portal.nav`
- `portal.common`
- `portal.dashboard`
- `portal.myCourses`
- `portal.explore`
- `portal.course`
- `portal.assignments`
- `portal.exams`
- `portal.profile`
- `portal.notifications`
- `portal.cards`

## RTL / LTR Checklist
- Sidebar placement mirrors correctly
- Search, filter, and dropdown alignment work in both directions
- Arrows and chevrons flip semantically
- Tabs, pills, and pagination remain readable
- Course card metadata wraps safely in Arabic and English
- Empty, loading, and error states are translated
- No hardcoded text inside page components

## Phase Plan

### Phase 1: Foundation
Status: Completed

- [x] Confirm final student route inventory
- [x] Confirm portal folder/module structure
- [x] Define which current placeholder portal pages remain and which are replaced first
- [x] Define portal translation namespace in `ar.json` and `en.json`
- [x] Define shared shell responsibilities
- [x] Define shared card and progress component contracts
- [x] Define which data on each page is real, mocked, or placeholder during initial implementation

### Phase 2: Shared Shell
Status: In Progress

- [x] Build `PortalShell`
- [x] Build `PortalSidebar`
- [x] Build `PortalTopbar`
- [x] Build mobile navigation behavior
- [x] Verify RTL/LTR shell layout
- [x] Integrate shell with current portal auth state
- [x] Add `explore` and `notifications` to student shell navigation
- [x] Route shell search into student explore flow
- [ ] Final reference-match correction for shell visual weight and spacing

### Phase 3: Auth and Access
Status: In Progress

- [x] Review existing student login flow against target dashboard routing
- [x] Review existing parent login flow against target parent routing
- [x] Verify public portal routes remain accessible without auth
- [x] Verify protected routes redirect correctly by role
- [x] Verify logout and session expiry behavior in the new shell
- [x] Localize auth validation messages

### Phase 4: Core Student Pages
Status: In Progress

- [x] Implement `/portal/student`
- [x] Implement `/portal/student/my-courses`
- [x] Implement `/portal/student/explore`
- [x] Reuse the same section header and course card patterns
- [x] Add interactive search/filter behavior for explore
- [ ] Verify Arabic and English content lengths on all three pages
- [ ] Replace mock visual treatments with final course imagery/art direction
- [ ] Final UI pass to match dashboard reference more closely

### Phase 5: Secondary Student Pages
Status: In Progress

- [x] Implement `/portal/student/course/[courseId]`
- [x] Implement `/portal/student/assignments`
- [x] Implement `/portal/student/exams`
- [x] Implement `/portal/student/profile`
- [x] Implement `/portal/student/notifications`
- [x] Align secondary pages to the corrected dashboard/card system
- [ ] Add empty/loading states where needed

### Phase 6: Data Integration
Status: In Progress

- [x] Centralize mock content into shared portal hook/module
- [x] Add student portal type layer for contract-backed data
- [x] Add student portal service layer using `portalHttp`
- [x] Add student portal React Query hooks
- [ ] Add or wire dashboard data hooks
- [ ] Add or wire course listing hooks
- [ ] Add or wire course detail hooks
- [ ] Add or wire assignments hooks
- [ ] Add or wire exams hooks
- [ ] Add or wire profile and notifications hooks
- [x] Review backend student web API contracts
- [ ] Document any backend contract gaps

### Phase 7: Parent Portal
Status: Pending

- [ ] Reuse shared shell for parent routes
- [ ] Define child-centric dashboard modules
- [ ] Implement parent summary pages

### Phase 8: Quality
Status: In Progress

- [x] Lint
- [x] Build
- [ ] Add or update tests for portal UI behavior
- [ ] Run responsive review
- [ ] Run AR/EN review
- [ ] Run RTL/LTR review
- [ ] Review auth and redirect regressions
- [ ] Review loading and empty states with real data
- [ ] Compare final student dashboard against reference screenshots on desktop

## Next Plan

### Immediate
- Replace dashboard/explore/course gradient placeholders with stronger course imagery or pseudo-image treatments that feel closer to the reference cards
- Tighten Arabic spacing, line length, and card density on the student dashboard
- Move page-local mock arrays into structured shared portal data
- Add empty/loading states and polish mobile density on secondary pages

### After Immediate
- Start real student data integration behind shared hooks
- Build the authenticated parent shell and dashboard using the same refined system

### Release Readiness
- Run `npm run lint`
- Run `npm run build`
- Perform desktop and mobile screenshot review in both Arabic and English
- Document backend contract gaps for portal-facing summaries and course data

## Page Content Blueprint

### `/portal/student`
- Greeting and date
- KPI summary cards
- Continue learning section
- Enrolled courses section
- Upcoming assignments and exams preview
- Recent activity or notifications preview

### `/portal/student/my-courses`
- Page header
- Tabs: in progress, completed, saved
- Course grid or list
- Optional category or instructor filter
- Empty states per tab

### `/portal/student/explore`
- Search hero
- Category chips
- Filters
- Course results grid
- Sort options
- Pagination or infinite loading

### `/portal/student/course/[courseId]`
- Course hero
- Continue button
- Curriculum and lessons
- Progress summary
- Instructor section
- Resources
- Related assignments and exams

### `/portal/student/assignments`
- Title and summary counts
- Tabs by status
- Assignment list or cards
- Due date emphasis
- Course reference

### `/portal/student/exams`
- Summary cards
- Tabs by state
- Exam list
- Results blocks for completed exams

### `/portal/student/profile`
- User card
- Learning stats
- Account details
- Security and preferences

### `/portal/student/notifications`
- Unread and all tabs
- Notification groups
- Empty state

## Repo Structure Proposal

### Routes
- `src/app/(portal)/portal/student/*`
- `src/app/(portal)/portal/parent/*`

### Shared Portal Modules
- `src/features/portal/components/layout`
- `src/features/portal/components/dashboard`
- `src/features/portal/components/courses`
- `src/features/portal/components/explore`
- `src/features/portal/components/shared`
- `src/features/portal/hooks`
- `src/features/portal/services`
- `src/features/portal/types`

## Verification Ledger
- Pending: portal route implementation
- Pending: auth review against new shell
- Pending: data contract review for dashboard, courses, assignments, exams, profile, notifications
- Pending: localization key insertion
- Pending: responsive review
- Pending: RTL/LTR review
- Pending: lint and build after implementation

## Current Next Step
- Start Phase 1 by defining the route inventory, placeholder replacement order, translation namespace, and shared shell/component boundaries before coding page-specific UI.
