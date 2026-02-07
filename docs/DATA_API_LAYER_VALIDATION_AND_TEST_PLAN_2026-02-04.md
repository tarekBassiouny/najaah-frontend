# Data + API Layer Validation and Test Plan (No UI)

Status: Draft
Date: 2026-02-04
Scope: services, API client, token/tenant runtime helpers, and domain models/types only

## 1) Validation Run (Executed)

Commands executed:
- `npm run type-check`
- `npx vitest run --config vitest.config.ts tests/unit/services/admin-auth.service.test.ts tests/unit/lib/token-refresh.test.ts`
- `npx vitest run --config vitest.integration.config.ts tests/integration/auth/login.integration.test.ts tests/integration/centers/centers.integration.test.ts`

Results:
- TypeScript check: PASS
- Unit (data/API focused subset): 31/31 PASS
- Integration (API/MSW focused subset): 3/3 PASS

## 2) Current Data/API Coverage Snapshot

Covered now:
- `src/services/admin-auth.service.ts` (unit + integration)
- `src/lib/token-refresh.ts` (unit)
- MSW integration harness is active (`tests/integration/msw/*`)

Not yet covered by dedicated data/API tests:
- `src/services/resolve.service.ts`
- `src/lib/http.ts`, `src/lib/token-storage.ts`, `src/lib/tenant-store.ts`
- All feature service modules in `src/features/*/services/*`
- Contract-level model/type validation across `src/features/*/types/*` and `src/types/*`

## 3) Full Service Inventory to Cover

- `src/services/admin-auth.service.ts`
- `src/services/resolve.service.ts`
- `src/features/admin-users/services/admin-users.service.ts`
- `src/features/agents/services/agents.service.ts`
- `src/features/analytics/services/analytics.service.ts`
- `src/features/audit-logs/services/audit-logs.service.ts`
- `src/features/categories/services/categories.service.ts`
- `src/features/centers/services/center-settings.service.ts`
- `src/features/centers/services/centers.service.ts`
- `src/features/courses/services/courses.service.ts`
- `src/features/device-change-requests/services/device-change-requests.service.ts`
- `src/features/enrollments/services/enrollments.service.ts`
- `src/features/extra-view-requests/services/extra-view-requests.service.ts`
- `src/features/instructors/services/instructors.service.ts`
- `src/features/pdfs/services/pdfs.service.ts`
- `src/features/permissions/services/permissions.service.ts`
- `src/features/role-permissions/services/role-permissions.service.ts`
- `src/features/roles/services/roles.service.ts`
- `src/features/sections/services/sections.service.ts`
- `src/features/students/services/students.service.ts`
- `src/features/videos/services/videos.service.ts`

## 4) Test Architecture (No UI)

### A) Unit tests for services (mock `@/lib/http`)

Create files under:
- `tests/unit/services/core/*.test.ts`
- `tests/unit/services/features/*.test.ts`

Per service test checklist:
1. Sends correct endpoint + HTTP method
2. Sends correct params/payload mapping (snake_case, optional fields omitted)
3. Normalizes response shape correctly (`data`, `meta`, pagination defaults)
4. Handles null/empty payloads safely
5. Handles thrown errors and guarded input cases
6. Validates multipart/FormData payload construction where relevant

### B) Unit tests for API client/runtime helpers

Create files:
- `tests/unit/lib/http.test.ts`
- `tests/unit/lib/token-storage.test.ts`
- `tests/unit/lib/tenant-store.test.ts`
- keep `tests/unit/lib/token-refresh.test.ts` and expand edge cases

Checklist:
1. Request interceptor headers (`X-Api-Key`, `X-Locale`, `Authorization`)
2. 401 refresh flow (single request + concurrent queue behavior)
3. refresh failure fallback (clear token + redirect behavior)
4. storage behavior for remember-me/session/local migration
5. tenant state updates + subscribers

### C) Integration tests (MSW, API layer only)

Create files under:
- `tests/integration/api/*.integration.test.ts`

Checklist:
1. happy path for each domain list/get/create/update/delete action
2. API error scenarios (401/403/422/500)
3. pagination and filter query pass-through
4. contract shape variants (nested `data`, flat payload, missing meta)

### D) Model/contract tests (no UI)

Create files under:
- `tests/unit/contracts/*.contract.test.ts`

Checklist:
1. verify model mapping assumptions used by services
2. verify optional fields and fallback defaults
3. verify enum/status fields accepted by service consumers
4. verify pagination contracts against `src/types/pagination.ts`

## 5) Prioritized Rollout

P0 (first):
- `http`, `token-storage`, `token-refresh`, `admin-auth`, `resolve`
- high-traffic CRUD services: `centers`, `courses`, `students`, `sections`

P1:
- `categories`, `enrollments`, `roles`, `permissions`, `role-permissions`, `admin-users`, `instructors`

P2:
- `videos`, `pdfs`, `analytics`, `audit-logs`, `agents`, `device-change-requests`, `extra-view-requests`, `center-settings`

## 6) Definition of Done for Data/API Layer

1. Every service file has at least one dedicated unit test file
2. All core runtime helpers (`http`/token/tenant) have unit tests
3. Each service has integration coverage for at least one happy path + one failure path
4. Contract tests exist for shared pagination and auth payload assumptions
5. Data/API-only test command passes in CI without requiring any UI component tests

## 7) Suggested Execution Command Set

- Unit (data/API only):
  - `npx vitest run --config vitest.config.ts tests/unit/services tests/unit/lib tests/unit/contracts`
- Integration (data/API only):
  - `npx vitest run --config vitest.integration.config.ts tests/integration/api tests/integration/auth`

