# LMS Admin Panel Testing Strategy and Implementation Plan

**Status:** Draft
**Author:** Codex (skill-orchestrated)
**Created:** 2026-02-02
**Last Updated:** 2026-02-02

---

## 1) Context and Skill Routing

Requested orchestrator path `.claude/agents/orchestrator.md` is not present in this project.

For this plan, orchestration uses available skills:
- `lms-orchestrator` for planning and phase sequencing
- `lms-qa` for testing standards and tooling
- `lms-pm` for requirement/risk slicing
- `lms-review` for quality gate and pre-merge checklist

This document is structured so it can be implemented incrementally without blocking feature delivery.

---

## 2) Current Baseline Snapshot (as of 2026-02-02)

- Test stack configured: `Vitest`, `React Testing Library`, `MSW`, `Playwright`
- Existing scripts in `package.json`:
  - `test`, `test:unit`, `test:integration`, `test:coverage`, `test:e2e`, `ci:local`
- Current tests found:
  - Unit: **8**
  - Integration: **2**
  - E2E: **0** test files detected under `tests/e2e/**`
  - Total: **10**
- Existing test areas:
  - auth (page/components/hook/service)
  - centers integration
  - utility formatting hook/lib

Implication: project has good foundations but broad feature/domain coverage is still early-stage.

---

## 3) Testing Objectives

1. Protect high-risk admin workflows (auth, permissions, CRUD, filtering, data mutations).
2. Prevent API-contract regressions between frontend and backend.
3. Keep UI behavior reliable across loading, empty, error, and success states.
4. Ensure tenant/center scoping behavior is respected on every data screen.
5. Provide a fast local feedback loop and a reliable CI gate.

---

## 4) Target Test Pyramid

### 4.1 Unit Tests (~60%)

Scope:
- pure utils/formatters
- service normalization logic
- hooks with mocked services/query clients
- component behavior in isolation

### 4.2 Integration Tests (~30%)

Scope:
- feature-level flows with providers + MSW
- page-level behavior with route params/search params
- form submission + optimistic updates + cache invalidation

### 4.3 E2E Tests (~10%)

Scope:
- smoke critical journeys in real browser
- auth/login guard routing
- one happy-path per core admin resource

---

## 5) Domain Coverage Matrix (All Areas)

### 5.1 Authentication & Route Protection
- login success/failure/validation
- token persistence and logout
- protected route redirect behavior

### 5.2 Navigation, Layout, and Global UX
- sidebar/header role-based visibility
- breadcrumb and active-route state
- global error boundary fallback

### 5.3 Resource Management Screens
Apply same pattern to each resource domain (students, courses, categories, centers, instructors, videos, PDFs, roles, etc.):
- list rendering
- filtering/search/sort
- pagination meta handling
- create/edit/delete flows
- optimistic and pessimistic update states

### 5.4 API Contract & Data Normalization
- map backend `success/data/meta/errors` shapes safely
- boolean/numeric query normalization
- date and enum normalization

### 5.5 Permissions and Capability Gating
- UI action visibility by role/capability
- disabled action states when forbidden
- route-level and action-level denial behavior

### 5.6 Multi-Tenancy / Center Scoping
- center-scoped filters respected in requests
- cross-center data is never surfaced
- tenant switch behavior (if applicable) is deterministic

### 5.7 Error Handling and Recovery
- server error toast/messages
- retry buttons and recovery actions
- offline/network-failure messaging

### 5.8 Accessibility and UX Quality
- form labels and keyboard flow
- focus management in modals/dialogs
- loading/skeleton semantics

### 5.9 Performance and Reliability
- table pages avoid unnecessary rerenders/refetch loops
- large list interactions remain responsive
- cache invalidation correctness on mutation

---

## 6) Best Test Structure (Recommended)

```text
tests/
  setup/
    unit.tsx
    integration.ts
    e2e.ts (optional shared helpers)

  unit/
    components/
      ui/
      layout/
      shared/
    hooks/
      auth/
      resources/
    services/
      auth/
      resources/
    lib/
      formatters/
      mappers/
    app/
      auth/
      dashboard/

  integration/
    auth/
    dashboard/
    resources/
      students/
      courses/
      categories/
      centers/
      instructors/
      media/
    workflows/
      onboarding/
      approvals/

  e2e/
    smoke/
    auth/
    resources/
    fixtures/

  mocks/
    handlers/
      auth.handlers.ts
      students.handlers.ts
      courses.handlers.ts
      ...
    server.ts

  helpers/
    render-with-providers.tsx
    query-client.ts
    auth-session.ts
    factories/
      user.factory.ts
      center.factory.ts
      resource.factory.ts

  contract/
    responses/
      auth.contract.test.ts
      resources.contract.test.ts
```

Naming:
- unit/integration: `*.test.ts` / `*.test.tsx`
- integration heavy flows: `*.integration.test.tsx`
- e2e: `*.spec.ts`
- contract: `*.contract.test.ts`

---

## 7) Quality Gates and Execution Order

Local pre-push gate (already aligned with `ci:local`):
1. `npm run check:style`
2. `npm run check:quality`
3. `npm run test:coverage`

Recommended enhancement:
- include `npm run test:integration` explicitly in `check:quality` (or `ci:local`) so integration gaps fail early.

CI stages:
1. Install + cache dependencies
2. Lint + type-check
3. Unit tests
4. Integration tests
5. Coverage threshold check
6. E2E smoke on protected branch/release

---

## 8) Coverage Targets

Phase-based targets:
- Phase A: global >= 55%
- Phase B: global >= 70%
- Phase C: global >= 80%
- Phase D: global >= 85% with risk-based branch coverage focus

Critical modules target (auth, permission guards, service normalizers):
- maintain >= 95% line coverage and strong branch coverage.

---

## 9) Test Data and Mocking Strategy

1. Use MSW as single source for API mocking in integration tests.
2. Keep handler data realistic to backend contracts (`success`, `data`, `meta`, `errors`).
3. Create shared factories for admin user, center, and common resources.
4. Keep unit tests isolated (mock at service or HTTP boundary only).
5. Add contract tests for normalizers that consume backend responses.

---

## 10) Detailed Implementation Plan

### Phase 0 - Baseline Audit (2-3 days)

Deliverables:
- current coverage and runtime report
- domain-by-domain test gap matrix
- prioritized P0/P1 test backlog

Tasks:
- run and record:
  - `npm run test:unit`
  - `npm run test:integration`
  - `npm run test:coverage`
- map each existing test to domain + risk
- identify untested critical screens/routes

### Phase 1 - Foundation Hardening (3-5 days)

Deliverables:
- finalized folder structure
- test helper toolkit
- baseline MSW handler packs

Tasks:
- add `tests/helpers/*` shared render/factory utilities
- standardize QueryClient test wrapper
- establish core handlers for auth + top 3 resources

### Phase 2 - Critical Path Coverage (1-2 weeks)

Deliverables:
- robust auth and permission suite
- resource list/filter/pagination suites
- mutation flow suites for create/edit/delete

Tasks:
- auth + guards: unit + integration + one e2e smoke
- resource modules: list and filter contract tests
- failure-state tests for API/network errors

### Phase 3 - Contract and Regression Safety (1 week)

Deliverables:
- contract tests for shared response mappers
- regression pack for query params and form serialization

Tasks:
- add `tests/contract/responses/*`
- add normalization regression cases (`true/false`, ids, enums)

### Phase 4 - E2E Smoke Stabilization (3-5 days)

Deliverables:
- first reliable smoke set in Playwright

Tasks:
- auth login + dashboard load
- one read + one write workflow in a core resource
- CI toggle for smoke on release branches

### Phase 5 - Continuous Improvement (ongoing)

- monthly flaky test review
- quarterly coverage threshold raise
- PR template enforces test plan per risk level

---

## 11) Definition of Done (Per PR)

A PR is done only when:
- [ ] required unit tests are added/updated
- [ ] integration tests added for user-visible behavior
- [ ] API success + error states are tested
- [ ] permission/guard behavior covered if touched
- [ ] `npm run ci:local` passes
- [ ] any contract change is reflected in tests/docs

---

## 12) PR Test Planning Template

For each ticket:
1. Domain(s):
2. Risk level: low / medium / high
3. Must-cover scenarios (happy + 3 failures):
4. Test layers needed: unit / integration / e2e / contract
5. Mock data/handlers required:
6. Commands executed before review:

---

## 13) Initial Gap Backlog (Seed)

P0:
- E2E smoke tests are missing (0 files currently)
- permission/capability UI gating matrix is thin
- contract tests for API response normalization missing

P1:
- shared helpers/factories are limited
- resource-domain coverage beyond auth/centers is sparse

P2:
- performance-oriented interaction checks
- accessibility-focused interaction tests for forms/dialogs

---

## 14) Immediate Next Steps

1. Approve this strategy document.
2. Create `Phase 0 Audit Report` with measured runtime + coverage snapshots.
3. Implement Phase 1 helper scaffolding and MSW base handlers.
4. Start Phase 2 with Auth + Categories + Students as first critical bundle.
