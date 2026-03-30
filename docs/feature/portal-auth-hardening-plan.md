# Portal Auth Hardening & Commit Plan

Last updated: 2026-03-31
Status: Executed and verified
Branch: `feature/portal-scaffold-auth`
Owner: AI agent (orchestrator or feature-builder)

## Context

This plan covers the work needed to get the current branch (`feature/portal-scaffold-auth`) into a clean, committable state. This document was refreshed against the current code before execution. The branch contains:
- **4 committed changes**: Portal auth infrastructure, OTP login flows, localization, course-asset batch hardening
- **Uncommitted changes**: Auth page refactor to `PortalAuthShell`, new `(app)` route groups with real dashboards, portal feature module, 1000+ translation lines

A prior code review identified 6 required fixes and 5 recommended improvements before this branch is merge-ready. One required fix is already present in the code and is now marked complete below.

## Prerequisites

Before starting any phase, the agent must:
1. Read `.claude/skills/lms/SKILL.md` (master context)
2. Read `docs/STYLE_GUIDE.md` (UI rules)
3. Read this plan fully
4. Run `git branch --show-current` to confirm you are on `feature/portal-scaffold-auth`
5. If on `main` or `dev`, **stop and ask the user**

## Source Files

### Portal auth feature module
- `src/features/portal-auth/types/portal-auth.ts`
- `src/features/portal-auth/services/portal-auth.service.ts`
- `src/features/portal-auth/hooks/use-student-send-otp.ts`
- `src/features/portal-auth/hooks/use-student-verify.ts`
- `src/features/portal-auth/hooks/use-parent-send-otp.ts`
- `src/features/portal-auth/hooks/use-parent-verify.ts`
- `src/features/portal-auth/hooks/use-portal-me.ts`
- `src/features/portal-auth/hooks/use-portal-logout.ts`
- `src/features/portal-auth/hooks/use-parent-register.ts`
- `src/features/portal-auth/context/portal-auth-context.tsx`
- `src/features/portal-auth/components/PortalRouteGuard.tsx`
- `src/features/portal-auth/components/PortalHeader.tsx`
- `src/features/portal-auth/components/PortalAuthShell.tsx`
- `src/features/portal-auth/components/RoleSwitcher.tsx`
- `src/features/portal-auth/lib/extract-portal-error.ts`
- `src/features/portal-auth/index.ts`

### Portal infrastructure
- `src/lib/portal-http.ts`
- `src/lib/portal-token-storage.ts`
- `src/lib/portal-token-refresh.ts`

### Portal pages
- `src/app/(portal)/layout.tsx`
- `src/app/(portal)/portal/student/login/page.tsx`
- `src/app/(portal)/portal/parent/login/page.tsx`
- `src/app/(portal)/portal/parent/register/page.tsx`

### Portal app (uncommitted new files)
- `src/app/(portal)/portal/student/(app)/` (all files)
- `src/app/(portal)/portal/parent/(app)/` (all files)
- `src/features/portal/` (all files)

### Localization
- `src/features/localization/dictionaries/en.json`
- `src/features/localization/dictionaries/ar.json`
- `src/features/localization/use-translation.ts`

---

## Verified Findings Snapshot

### Confirmed complete already
- `schedulePortalTokenRefresh()` is already called in both OTP verify hooks:
  - `src/features/portal-auth/hooks/use-student-verify.ts`
  - `src/features/portal-auth/hooks/use-parent-verify.ts`

### Completed in this branch
- 401 interceptor now bypasses logout and refresh endpoints without retrying refresh
- `PortalAuthShell` is exported from the portal auth barrel
- BroadcastChannel payloads use `TokenBroadcastMessage`
- Logout clears only portal session query families, not every `["portal"]` query
- Unused `extractPortalErrorCode` path was removed
- Student and parent login pages now share `OtpLoginForm`
- ARIA labels and portal auth accessibility copy were added
- `PortalUser` role flags were tightened to required booleans
- Translation coverage was re-checked and missing portal keys were filled
- Parent child detail and course review routes were delivered against the backend contract
- Focused unit coverage was added for auth/session behavior and parent detail rendering

### Remaining follow-up outside this plan
- Role state hydration behavior on the client can still be reviewed separately if SSR/flash issues appear
- Broader responsive, locale, and RTL/LTR QA remain open
- Broader integration coverage remains open

---

## Phase A: Auth Layer Fixes (Required)

**Goal**: Fix 6 bugs/issues found in code review before committing.
**Skill**: `lms-frontend` for implementation, `lms-review` for verification.

### Task A1: Schedule token refresh after OTP verify

**Priority**: High
**Files**: `src/features/portal-auth/hooks/use-student-verify.ts`, `src/features/portal-auth/hooks/use-parent-verify.ts`

**Status**: Already fixed in current branch

**Problem (historical)**: Both verify hooks saved tokens via `portalTokenStorage.setTokens()` but never called `schedulePortalTokenRefresh()`. The token would expire without being refreshed until the user navigated to a page that triggered the context's effect.

**Current state**:
1. `schedulePortalTokenRefresh` is imported in both hooks
2. `onSuccess` in both hooks already calls `schedulePortalTokenRefresh()`

**Verify**: Re-read both files before any commit split and keep this item closed unless the code regresses.

### Task A2: Skip token refresh for logout and refresh endpoints

**Priority**: High
**File**: `src/lib/portal-http.ts`

**Problem**: The 401 response interceptor still attempts token refresh on logout endpoints. Refresh endpoints are already excluded, but logout endpoints are not. If a logout request returns 401 (token already invalid), it can trigger an unnecessary refresh path.

**Fix**:
1. In the response error interceptor, before the retry logic, add an early return for logout and refresh URLs
2. Check if `originalConfig.url` includes `/auth/student/logout`, `/auth/parent/logout`, `/auth/student/refresh`, or `/auth/parent/refresh`
3. If matched, clear portal auth state and reject without attempting refresh

**Verify**: Read the interceptor after edit. Confirm logout and refresh endpoints skip the retry path.

### Task A3: Export missing components from barrel

**Priority**: Medium
**File**: `src/features/portal-auth/index.ts`

**Problem**: `PortalAuthShell` and `getStoredDeviceUuid` are imported outside their defining files but not exported from the barrel `index.ts`.

**Fix**:
1. Add `export { PortalAuthShell } from "./components/PortalAuthShell"`
2. Add `export { getStoredDeviceUuid } from "./hooks/use-student-verify"` (only if `getStoredDeviceUuid` is actually imported externally — grep first)

**Verify**: Run `grep -r "PortalAuthShell" src/app/` and `grep -r "getStoredDeviceUuid" src/app/` to confirm all imports resolve.

### Task A4: Type BroadcastChannel messages

**Priority**: Medium
**File**: `src/features/portal-auth/context/portal-auth-context.tsx`

**Problem**: BroadcastChannel `onmessage` casts data to loose `{ type?: string; token?: string }` instead of the actual `TokenBroadcastMessage` type.

**Fix**:
1. Check if `TokenBroadcastMessage` or an equivalent type exists in `src/lib/portal-token-storage.ts`
2. If yes, import and use it as the cast type
3. If no, define an inline type that matches the actual message shapes sent by `portal-token-storage.ts`

**Verify**: Read the context file. Confirm the cast uses a specific type, not a loose object shape.

### Task A5: Narrow query removal on logout

**Priority**: Medium
**Files**: `src/features/portal-auth/context/portal-auth-context.tsx`, `src/features/portal-auth/hooks/use-portal-logout.ts`

**Problem**: `queryClient.removeQueries({ queryKey: ["portal"] })` removes all queries with the `"portal"` prefix. This is too broad and would remove unrelated portal data queries.

**Fix**:
1. Replace `removeQueries({ queryKey: ["portal"] })` with specific key removals:
   - `removeQueries({ queryKey: ["portal", "me"] })`
   - Add any other specific portal query keys that should be cleared on logout
2. Check what query keys exist in `src/features/portal/hooks/` and `src/features/portal-auth/hooks/` to build the correct removal list

**Verify**: Grep for `queryKey:.*portal` across the codebase. Confirm only auth-related keys are removed on logout.

### Task A6: Remove or use `extractPortalErrorCode`

**Priority**: Low
**File**: `src/features/portal-auth/lib/extract-portal-error.ts`

**Problem**: `extractPortalErrorCode` is exported but not currently imported anywhere.

**Fix** (choose one):
- **Option 1 (remove)**: Delete the function if no error-code-specific UX is planned
- **Option 2 (use)**: Import it in login pages to show specific messages for known error codes (e.g., `CENTER_INACTIVE`, `OTP_EXPIRED`) — this is the better UX

**Verify**: If removed, grep confirms zero references. If used, grep confirms at least one import.

### Phase A Verification

After all open A tasks:
1. Run `npm run type-check` — must pass
2. Run `npm run lint` — must pass
3. Run `npm run build` — must pass

**Status**: Complete

---

## Phase B: Login Page Deduplication

**Goal**: Extract shared OTP login logic to reduce ~660 lines of near-identical code.
**Skill**: `lms-frontend` for implementation, `lms-frontend-design` if visual changes needed.

### Task B1: Extract shared OTP login form component

**Priority**: Medium
**Files**: Create `src/features/portal-auth/components/OtpLoginForm.tsx`

**Problem**: Student login (340 lines) and parent login (326 lines) share 95%+ identical code: same form schemas, same step state machine, same error handling, same UI structure. Only differences are: role, hooks, device info capture (student only), footer links.

**Fix**:
1. Read both login pages fully to identify exact differences
2. Create `src/features/portal-auth/components/OtpLoginForm.tsx` with props:
   - `role: "student" | "parent"`
   - `useSendOtp: () => UseMutationResult` (the role-specific send-otp hook)
   - `useVerify: () => UseMutationResult` (the role-specific verify hook)
   - `showDeviceInfo?: boolean` (true for student)
   - `footer?: ReactNode` (role-specific links)
   - `redirectPath: string` (where to go after success)
3. Move all shared logic (schemas, step state, error display, OTP timer, form rendering) into the shared component
4. Simplify both login pages to ~30-50 lines each, composing the shared component

**Verify**:
- Both login pages still render correctly (no missing props or broken layouts)
- `npm run type-check` passes
- `npm run build` passes

### Task B2: Export new component

**File**: `src/features/portal-auth/index.ts`

**Fix**: Add `export { OtpLoginForm } from "./components/OtpLoginForm"` if pages import from barrel.

**Status**: Complete

---

## Phase C: Improvements & Polish

**Goal**: Address recommended improvements before final commit.
**Skill**: `lms-frontend` for code, `lms-review` for verification.

**Status note**: These are not all confirmed defects yet. Re-verify each item against current code before editing.

### Task C1: Add ARIA labels to PortalHeader and RoleSwitcher

**Priority**: Medium
**Files**: `src/features/portal-auth/components/PortalHeader.tsx`, `src/features/portal-auth/components/RoleSwitcher.tsx`

**Fix**:
1. Add `aria-label` to the avatar circle in PortalHeader
2. Add `aria-label` to role switch buttons in RoleSwitcher
3. Use translation keys for labels (e.g., `pages.portal.a11y.userAvatar`, `pages.portal.a11y.switchRole`)
4. Add the new translation keys to both `en.json` and `ar.json`

### Task C2: Verify translation key coverage

**Priority**: Medium
**Files**: All portal pages and components

**Fix**:
1. Grep all `t("pages.portal` and `t("pages.portalAuth` calls across the codebase
2. For each key found, verify it exists in both `en.json` and `ar.json`
3. Report any missing keys
4. Add missing keys with appropriate English and Arabic translations

### Task C3: Tighten PortalUser type

**Priority**: Low
**File**: `src/features/portal-auth/types/portal-auth.ts`

**Fix**:
1. Review how `is_student` and `is_parent` are used in the codebase
2. If auth logic depends on them being defined, make them required (`boolean` not `boolean | undefined`)
3. Optionally add discriminated union types for `StudentProfile`, `ParentProfile`, `DualRoleUser`

### Phase C Verification

1. Run `npm run type-check` — must pass
2. Run `npm run lint` — must pass
3. Run `npm run build` — must pass

**Status**: Complete

---

## Phase D: Portal App Delivery

**Goal**: Deliver the portal app layer and next parent detail slice against the backend contract.
**Skill**: `lms-frontend` and `lms-backend-contracts`.

### Delivered in this phase
- Parent child detail route:
  - `src/app/(portal)/portal/parent/(app)/children/[studentId]/page.tsx`
- Parent course review route:
  - `src/app/(portal)/portal/parent/(app)/children/[studentId]/courses/[courseId]/page.tsx`
- Parent portal service, hook, and type updates for:
  - student detail
  - enrollments
  - weekly activity
  - course progress
  - quiz attempts
  - assignment submissions
- Translation keys for parent detail and course review pages

**Status**: Complete

## Phase E: Focused Test Coverage

**Goal**: Add the smallest useful portal-specific test coverage before broader release QA.

### Delivered tests
- Route guard coverage:
  - `tests/unit/features/portal-auth/components/PortalRouteGuard.test.tsx`
- Logout/session cleanup coverage:
  - `tests/unit/features/portal-auth/hooks/use-portal-logout.test.tsx`
- Portal HTTP 401 bypass coverage:
  - `tests/unit/lib/portal-http.test.ts`
- Parent service normalization coverage:
  - `tests/unit/services/parent-portal.service.test.ts`
- Parent page rendering coverage:
  - `tests/unit/app/portal/parent/student-detail.page.test.tsx`
  - `tests/unit/app/portal/parent/course-review.page.test.tsx`

### Phase E Verification

- `npx vitest run tests/unit/features/portal-auth/components/PortalRouteGuard.test.tsx tests/unit/features/portal-auth/hooks/use-portal-logout.test.tsx tests/unit/services/parent-portal.service.test.ts tests/unit/lib/portal-http.test.ts tests/unit/app/portal/parent/student-detail.page.test.tsx tests/unit/app/portal/parent/course-review.page.test.tsx`
- Result: `6` files passed, `16` tests passed

**Status**: Complete

---

## Post-Merge: Update Trackers

After this plan is complete, update these docs:
- `docs/feature/web-portal-progress.md` — mark FE-P1 as complete, update FE-P2/P3/P4 status
- `docs/feature/student-portal-blueprint.md` — check off completed items in Phase 3 (Auth) and Phase 8 (Quality)

If backend/frontend tracker drift still exists, also update the backend progress lane note in:
- `/Users/tarekbassiouny/projects/najaah-backend/docs/feature/web-portal-progress.md`

---

## Remaining Work (Out of Scope for This Plan)

These items are tracked in `student-portal-blueprint.md` and `web-portal-progress.md`:
- Visual polish: dashboard spacing, Arabic typography, gradient-to-imagery replacement
- Empty/loading/error states on secondary student pages
- Full responsive QA (desktop + mobile)
- Full AR/EN + RTL/LTR QA
- Broader portal integration tests and end-to-end coverage
- Dead code cleanup for superseded portal pieces
