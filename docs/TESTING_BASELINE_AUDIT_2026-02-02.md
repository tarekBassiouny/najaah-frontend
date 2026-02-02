# Phase 0 Baseline Audit - LMS Admin Panel

**Status:** Updated (post unit-test fix)
**Audit Date:** 2026-02-02
**Scope:** `/Users/tarekbassiouny/projects/lms-admin-panel`
**Executor:** Codex

---

## 1) Baseline Inventory

- Unit test files: **8**
- Integration test files: **2**
- E2E spec files: **1** (`e2e/auth-signin.spec.ts`)
- Total test files: **11**

---

## 2) Script Execution Results (Actual Runs)

| Script | Result | Real Time | Notes |
|---|---|---:|---|
| `npm run check:style` | ✅ Pass | 3.66s | ESLint passed |
| `npm run test:unit` | ✅ Pass | 6.14s | 8 files, 24 tests passed |
| `npm run test:integration` | ✅ Pass | 4.06s | 2 files, 3 tests passed |
| `npm run test:coverage` | ✅ Pass | 8.85s | 10 files, 27 tests passed |
| `npm run check:quality` | ✅ Pass | 11.30s | Includes type-check + unit tests |
| `npm run ci:local` | ✅ Pass | 20.15s | Full local CI chain passed |
| `npm run test:e2e` | ❌ Fail | 5.06s | Playwright browser binary missing (`npx playwright install`) |

---

## 3) Concrete Coverage Numbers (Full Run)

Source: `npm run test:coverage` output.

- **Statements:** 4.38%
- **Branches:** 52.45%
- **Functions:** 45.41%
- **Lines:** 4.38%

Observations:
- Auth-focused tested modules have much higher local coverage (e.g., login/logout/auth service areas).
- Global coverage remains low because most feature modules/pages currently have no direct test coverage yet.

---

## 4) Fix Applied During Audit

To unblock quality gates, unit test mocks were aligned with runtime expectations:

- Updated: `tests/unit/services/admin-auth.service.test.ts`
- Change: mock now includes `tokenStorage.getAccessToken()` used by `scheduleTokenRefresh()`.

Result: previously failing unit tests now pass and unblock `check:quality`, `test:coverage`, and `ci:local`.

---

## 5) Current Blocking Issues

1. **E2E environment blocker (P0):**
   - Playwright executable missing.
   - Required action: `npx playwright install`

---

## 6) Gap Summary (from measured baseline)

- Local quality pipeline is now healthy up to coverage.
- Global coverage is still very low (**4.38% lines/statements**) and needs phased expansion across resource modules.
- E2E suite exists but cannot run until browser binaries are installed.

---

## 7) Recommended Next Actions (Phase 0 Exit)

1. Install Playwright browsers: `npx playwright install`.
2. Re-run `npm run test:e2e` and append results to this audit.
3. Start Phase 1 scaffolding from strategy plan:
   - shared render/query helpers
   - MSW handlers by resource domain
   - contract-style tests for API response normalization
4. Start Phase 2 with highest-risk modules: auth guards, categories, students, centers list/filter/pagination.

---

## 8) Raw Failure Reference (Remaining)

- E2E failure:
  - `browserType.launch: Executable doesn't exist`
  - suggested by Playwright: `npx playwright install`
