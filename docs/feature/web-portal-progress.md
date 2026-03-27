# Web Portal — Frontend Progress

## Current Phase: Not started
## Last Updated: 2026-03-24

---

## Streams

Two independent streams running in parallel on separate branches.

```
Stream 1: Admin changes (parent management, settings cards)
Stream 2: Web portal (new route group, student + parent portal)
```

### Stream Status

| Stream | Current Phase | Branch | Next Action |
|--------|--------------|--------|-------------|
| Admin | FE-0C pending | — | Merge 0B PR #78, verify settings cards |
| Portal | FE-P1 pending | — | Scaffold + auth + minimal login/dashboard |

---

## Phase Tracker

### Stream 1: Admin

| Phase | Status | PR | Notes |
|-------|--------|-----|-------|
| FE-0C — Settings card verification | pending | — | Merge 0B, verify existing feature groups |
| FE-0D — Web portal settings cards | pending | — | Verify new web_portal/parent_portal groups, i18n |
| FE-5B — Admin parent management UI | pending | — | Parent list, detail, pending requests, sidebar |

### Stream 2: Web Portal

| Phase | Status | PR | Notes |
|-------|--------|-----|-------|
| FE-P1 — Scaffold & auth | pending | — | Route group, JWT auth, login pages, blank dashboards |
| FE-P2 — Course discovery | pending | — | Explore, enrolled, course detail, search |
| FE-P3 — Content consumption | pending | — | Playback, PDFs, quizzes, assignments, surveys |
| FE-P4 — Profile & education | pending | — | Profile page, education lookups, activity chart |
| FE-P5 — Parent portal | pending | — | Linked students, progress, quiz review, assignments |
| FE-P6 — Polish & testing | pending | — | Responsive, i18n, error handling, tests |

---

## Phase Review Gate

### Gate Record Template

```text
PHASE
- <phase name>

PLAN REVIEWED
- yes | no

CODE INSPECTED
- files/modules:

CONTRACT IMPACT
- none | new routes | new components | auth changes

RISKS / ADJUSTMENTS
- concrete change from plan after code review

VERIFICATION PLAN
- exact tests/checks to run for this phase

APPROVED TO IMPLEMENT
- yes | no
- approved by:
- date:
```

---

## Backend API Reference

All backend APIs are complete (7 phases merged). Reference docs in backend repo:

- **API Contract**: `/Users/tarekbassiouny/projects/najaah-backend/docs/feature/student-parent-web-portal-api.md`
- **Frontend Plan**: `/Users/tarekbassiouny/projects/najaah-backend/docs/feature/web-portal-frontend-plan.md`
- **Backend Progress**: `/Users/tarekbassiouny/projects/najaah-backend/docs/feature/web-portal-progress.md`

### Key API Endpoints

**Student Auth:**
- `POST /api/v1/web/auth/student/send-otp`
- `POST /api/v1/web/auth/student/verify`
- `POST /api/v1/web/auth/student/refresh`
- `GET /api/v1/web/auth/student/me`
- `POST /api/v1/web/auth/student/logout`

**Parent Auth:**
- `POST /api/v1/web/auth/parent/register`
- `POST /api/v1/web/auth/parent/send-otp`
- `POST /api/v1/web/auth/parent/verify`
- `POST /api/v1/web/auth/parent/refresh`
- `GET /api/v1/web/auth/parent/me`
- `POST /api/v1/web/auth/parent/logout`

**Parent Portal:**
- `GET /api/v1/web/students` — linked students
- `GET /api/v1/web/students/{id}` — student detail
- `GET /api/v1/web/links` — link requests
- `POST /api/v1/web/links` — request new link

**All requests require:** `X-Api-Key` header (center API key), `Authorization: Bearer {token}` (for protected endpoints).

---

## Architecture Notes

- **Auth**: JWT everywhere (no Sanctum). Admin and portal use different guards and endpoints.
- **Route group**: `src/app/(portal)/` — separate layout from admin `(dashboard)/`
- **Auth context**: `PortalAuthContext` with separate token storage keys from admin `AuthContext`
- **HTTP client**: Separate Axios instance for portal (`portal-http.ts`)
- **Center resolution**: Subdomain or URL param → `GET /api/v1/resolve/centers/{slug}`
- **Designs**: Not ready yet — use minimal UI with existing components, will be reskinned later

---

## Decisions Changed

| Date | Phase | Decision | Reason |
|------|-------|----------|--------|
| 2026-03-24 | FE-P1 | Minimal placeholder UI instead of custom design | Designs not ready, scaffold first |

---

## Open Blockers

| Blocker | Affects | Owner | Status |
|---------|---------|-------|--------|
| Phase 0B PR #78 not merged | FE-0C | Frontend | pending merge |
| Portal designs not ready | FE-P2+ | Design | placeholder UI for now |
