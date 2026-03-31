# Student Portal Dashboard — UI Alignment Execution Plan

Last updated: 2026-03-31
Status: UI implementation complete, browser QA pending
Branch: `feature/portal-scaffold-auth`
Reference: Image #2 (WhatsApp Image 2026-03-21)
Skill: `lms-frontend-design`

## Objective

Align the student portal shell and dashboard with the approved warm-minimal Arabic-first reference while preserving:
- the current route structure under `src/app/(portal)`
- the existing portal data layer
- `docs/STYLE_GUIDE.md`
- AR/EN and RTL/LTR support

This is a presentation-focused plan. It is not permission to redesign unrelated portal pages or change backend contracts.

## Code-Verified Starting Point

Verified against the current branch:
- [StudentPortalShell.tsx](/Users/tarekbassiouny/projects/najaah-frontend/src/features/portal/components/layout/StudentPortalShell.tsx)
- [student dashboard page](/Users/tarekbassiouny/projects/najaah-frontend/src/app/(portal)/portal/student/(app)/page.tsx)
- [PortalSectionHeader.tsx](/Users/tarekbassiouny/projects/najaah-frontend/src/features/portal/components/shared/PortalSectionHeader.tsx)
- [PortalCourseCard.tsx](/Users/tarekbassiouny/projects/najaah-frontend/src/features/portal/components/shared/PortalCourseCard.tsx)
- [use-student-portal-content.ts](/Users/tarekbassiouny/projects/najaah-frontend/src/features/portal/hooks/use-student-portal-content.ts)

Current realities:
- the shell still mixes sidebar, topbar, search, locale, logout, and role UI in one file
- the desktop sidebar still carries profile and notifications that should move to the topbar
- the dashboard hero still uses a card wrapper and CTA buttons that do not match the reference
- both continue-learning and enrolled-course sections still reuse the same image-first card
- `PortalSectionHeader` still places the visual accent on the eyebrow instead of the title
- `useStudentDashboardContent()` still shapes dashboard cards with the old shared card model and still contains `array.map(...) || fallback` patterns that should be tightened

## Design Direction

The target aesthetic remains:
- refined and warm, not corporate
- Arabic-first composition with RTL-awareness
- soft container geometry and generous whitespace
- teal/emerald core palette with amber and slate accents
- real course imagery or credible image-like fallbacks
- circular progress rings as the memorable visual signature

## Constraints

- reuse existing Tailwind tokens and repo primitives first
- keep all new copy in `t()`
- do not change API contracts
- do not rewrite parent portal pages as part of this plan
- do not mix visual planning notes or exploratory audit docs into implementation commits
- if implementation introduces reusable layout or presentation patterns that extend current repo guidance, update `docs/STYLE_GUIDE.md` in the same slice

## Status Summary

| Phase | Status | Scope |
|---|---|---|
| UI-0 | complete | translation keys and execution scaffolding |
| UI-1 | complete | section header refinement |
| UI-2 | complete | continue-learning card refinement |
| UI-3 | complete | new enrolled-course card |
| UI-4 | complete | shell redesign: sidebar + topbar |
| UI-5 | complete | dashboard hero, stats, and section composition |
| UI-6 | in progress | code verification complete; browser QA still pending |

## Execution Order

Use this order, not the older draft order:

1. UI-0: translation keys and execution scaffolding
2. UI-1: section header refinement
3. UI-2: continue-learning card refinement
4. UI-3: new enrolled-course card
5. UI-4: shell redesign in `StudentPortalShell.tsx`
6. UI-5: dashboard composition and view-model shaping
7. UI-6: verification and polish

Why this order:
- `PortalSectionHeader` is a shared dependency for the shell and dashboard
- `PortalCourseCard` and `EnrolledCourseCard` should stabilize before dashboard composition
- `StudentPortalShell.tsx` is high-risk because it mixes many concerns; it should be changed after shared primitives are ready
- dashboard composition should happen only after the final shell/header/card APIs are known

## Phase Details

### UI-0: Translation and Scope Prep

**Status**: Complete

**Files**
- [en.json](/Users/tarekbassiouny/projects/najaah-frontend/src/features/localization/dictionaries/en.json)
- [ar.json](/Users/tarekbassiouny/projects/najaah-frontend/src/features/localization/dictionaries/ar.json)

**Goal**
- add all labels needed by the redesigned shell and cards before implementation

**Tasks**
- add nav/topbar labels for:
  - `pages.portal.nav.aiTutor`
  - `pages.portal.nav.examsAndQuizzes`
- add sidebar CTA labels for:
  - `pages.portal.sidebar.upgradePro`
  - `pages.portal.sidebar.upgradeHint`
- add enrolled-course level labels for:
  - `pages.portal.enrolledCourses.level.beginner`
  - `pages.portal.enrolledCourses.level.intermediate`
  - `pages.portal.enrolledCourses.level.advanced`
- add any icon/button ARIA labels required by the new shell

**Verify**
- `npm run check:i18n:deep`

### UI-1: Section Header Refinement

**Status**: Complete

**File**
- [PortalSectionHeader.tsx](/Users/tarekbassiouny/projects/najaah-frontend/src/features/portal/components/shared/PortalSectionHeader.tsx)

**Goal**
- make the section header visually closer to the reference and stable before larger page work

**Tasks**
- move the accent bar from the eyebrow row to the title row
- make the accent bar thicker and taller
- ensure the accent reads correctly in RTL and LTR
- shift actions from button-like treatment toward plain text link styling where appropriate

**Verify**
- dashboard sections still render correctly
- no action alignment regressions on mobile

### UI-2: Continue-Learning Card Refinement

**Status**: Complete

**File**
- [PortalCourseCard.tsx](/Users/tarekbassiouny/projects/najaah-frontend/src/features/portal/components/shared/PortalCourseCard.tsx)

**Goal**
- keep this component for continue-learning and explore-style visual cards only

**Tasks**
- add `imageUrl?: string`
- keep `accentClassName` as fallback when no image exists
- switch the hero area to support real imagery with `next/image` or a credible fallback layer
- remove the dark title box and replace it with more direct image-overlay text treatment
- simplify the footer so it shows:
  - lesson/meta information
  - a thin progress bar
  - progress percentage
- remove the large circular percentage pill from this component

**Verify**
- card still works with and without `href`
- card still works with and without image data

### UI-3: Enrolled-Course Card

**Status**: Complete

**File**
- create `src/features/portal/components/shared/EnrolledCourseCard.tsx`

**Goal**
- stop reusing `PortalCourseCard` for enrolled-course tiles

**Tasks**
- build a new vertical enrolled-course card with:
  - level badge
  - large circular progress ring
  - centered percentage
  - course title
  - instructor avatar/name
  - directional arrow CTA
- keep the implementation self-contained and display-focused
- use SVG progress ring logic rather than adding a new dependency
- decide whether the progress ring becomes a reusable portal pattern; if yes, document the pattern in `docs/STYLE_GUIDE.md`

**Verify**
- ring renders correctly at low, medium, and high percentages
- arrow direction feels correct in RTL and LTR

### UI-4: Shell Redesign

**Status**: Complete

**File**
- [StudentPortalShell.tsx](/Users/tarekbassiouny/projects/najaah-frontend/src/features/portal/components/layout/StudentPortalShell.tsx)

**Goal**
- align the shell with the reference without breaking existing student portal navigation

**Tasks**
- move the desktop sidebar visually to the right in RTL-aware layout
- remove the user card from the sidebar
- reorder sidebar items to:
  - dashboard
  - my courses
  - explore
  - assignments
  - exams and quizzes
  - AI tutor
- move profile and notifications out of the desktop sidebar and into the topbar
- add the active item accent bar
- add the upgrade CTA block and logout action at the bottom of the sidebar
- simplify the topbar into:
  - avatar/profile access
  - centered search pill
  - notifications icon
  - AI tutor icon
  - locale control
- preserve mobile navigation parity and keep profile/notifications reachable on small screens
- if the right-side portal sidebar and simplified topbar become reusable shell patterns, add the rules to `docs/STYLE_GUIDE.md`

**Risk note**
- this file is high-churn and mixes layout, behavior, logout, locale, and search state
- do not rewrite it in the same commit as dashboard composition

**Verify**
- desktop shell in AR and EN
- mobile nav still works
- search still routes to explore
- logout still clears session and redirects correctly

### UI-5: Dashboard Composition

**Status**: Ready

**Files**
- [student dashboard page](/Users/tarekbassiouny/projects/najaah-frontend/src/app/(portal)/portal/student/(app)/page.tsx)
- [use-student-portal-content.ts](/Users/tarekbassiouny/projects/najaah-frontend/src/features/portal/hooks/use-student-portal-content.ts)

**Goal**
- rebuild the dashboard composition around the refined shared pieces

**Tasks**
- simplify the greeting block:
  - remove card wrapper
  - remove CTA buttons
  - keep greeting + date
- move the main stat cards below the greeting
- add stronger per-card accent treatment for XP, streak, and completion
- switch enrolled-course rendering to `EnrolledCourseCard`
- keep continue-learning on `PortalCourseCard`
- reshape `useStudentDashboardContent()` only as needed for display props:
  - `level`
  - `instructorName`
  - `instructorAvatar`
  - `ringColor`
  - `imageUrl` if available
- replace `array.map(...) || fallback` with explicit empty checks
- update enrolled-course tabs to match the reference more closely

**Verify**
- dashboard still renders with real query data
- dashboard still renders with fallback content
- no regressions in loading state behavior

### UI-6: Verification and Polish

**Status**: In progress

**Goal**
- finish with a focused QA pass before committing

**Tasks**
- verify AR and EN rendering
- verify RTL and LTR alignment
- verify desktop and mobile shell behavior
- check for overflow/wrapping issues in cards and nav labels
- check icon hit areas and keyboard focus styling
- verify fallback rendering logic on student dashboard and explore data seams uses explicit empty checks rather than `map(...) || fallback`

**Code-verified progress**
- `images.unsplash.com` is now allowed in `next.config.mjs` for dashboard fallback imagery
- the explore view-model now uses explicit empty checks instead of `map(...) || fallback`
- shell/nav/dashboard/card changes pass i18n scan, type-check, lint, and build once the remaining manual browser pass is excluded from code validation

**Required commands**
- `npm run type-check`
- `npm run lint`
- `npm run build`

## Commit Slices

Use these commit slices before implementation. Do not collapse everything into one commit.

### Commit 1
**Message**
- `Refine portal section headers and course cards`

**Scope**
- translation keys added for dashboard alignment work
- `PortalSectionHeader.tsx`
- `PortalCourseCard.tsx`
- new `EnrolledCourseCard.tsx`
- `docs/STYLE_GUIDE.md` if the new card or progress ring establishes a reusable pattern

### Commit 2
**Message**
- `Redesign student portal shell layout and navigation`

**Scope**
- `StudentPortalShell.tsx`
- any directly related localization updates
- only shell-level supporting adjustments required to keep navigation and search working
- `docs/STYLE_GUIDE.md` if the shell introduces reusable sidebar/topbar layout conventions

### Commit 3
**Message**
- `Align student dashboard composition with portal reference`

**Scope**
- student dashboard page
- `use-student-portal-content.ts`
- any minimal shared styling follow-up required after dashboard integration

### Commit 4
**Message**
- `Document portal dashboard alignment progress`

**Scope**
- update this doc status
- update any linked tracker docs only after implementation is verified

## Verification Checklist

Before each commit:
- inspect the affected files again
- run the smallest relevant validation for that slice

Before the final push:
- `npm run type-check`
- `npm run lint`
- `npm run build`
- browser QA on:
  - `/portal/student`
  - `/portal/student/explore`
  - `/portal/student/my-courses`

## Out of Scope

- new backend fields or contract changes
- AI tutor functionality beyond visual/nav presence
- payment/upgrade implementation
- redesigning parent portal pages
- broader explore/my-courses visual overhaul beyond what is needed to keep the shared card component coherent
