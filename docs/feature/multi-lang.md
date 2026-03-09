# Multi-Language EN/AR Plan

## Background
- Backend already normalizes all landing-page, section, and notification payloads to support Arabic (`ar`) and English (`en`) translations (hero/about translations use `{ en?: string | null; ar?: string | null }`).
- All API calls automatically include `X-Locale` (default `en`) via `http` helpers, but the UI currently never exposes a language switch or persists the selected locale.
- We now need to coordinate a front-end plan that lets admins author both locales, renders the correct copy for public visitors, and keeps media/course access secure while honoring the `show_*` visibility flags.

## Goals
1. Provide a first-class locale toggle (EN/AR) for admin experiences so editors can enter translations and preview them without guessing which language is being saved.
2. Make the public-facing landing-page, preview iframe, and notification cards render the best matching locale based on `Accept-Language`/`X-Locale`, with a deterministic fallback and no extra media routes.
3. Capture the rollout in a tracking document so the backend contract, UX notes, validation, QA tasks, and admin contact/social/testimonial workflows are easy to follow.

## Backend Contract Highlights
- **Locale headers:** every request uses `X-Locale` (fallback `Accept-Language` → app default). Preview iframe uses the `preview_token` query string; no basic auth is required.
- **Translation payload shapes:** hero/about sections expect `{ en?: string | null; ar?: string | null }`. `meta` and `styling` remain language-agnostic, but CTA/url/visibility metadata drives UI logic.
- **Visibility & content:** `show_*` flags determine which sections render; `show_courses` is currently a flag only (no course list). Hidden hero/about/contact arrive as `null`, testimonials as empty arrays.
- **Media:** uploads return storage URLs that are already server-owned; preview token controls which draft is viewable in iframe.

## Frontend Implementation Plan
### 1. Locale infrastructure (in progress)
- Create a supported-locale list (`en`, `ar`) and new `LocaleContext` that exposes `locale` + `setLocale`.
- Persist the last selection in `localStorage`, default to `getApiLocale()` when nothing is stored, and keep `document.documentElement.lang`/`apiLocale` in sync.
- Wrap the provider around the app (inside `Providers`) so React Query and Axios always send the selected locale.

### 2. Locale switcher UI
- Add a `LocaleToggle` control in the dashboard header alongside theme/notification controls.
- Make the control display EN/AR buttons, highlight the active locale, and expose screen-reader text.
- When the locale changes, update the provider state so `setApiLocale` runs and the new locale persists globally.

### 3. Admin/editor UX for EN/AR
- Update landing-page form sections to render labeled EN/AR inputs (meta titles, hero copy, about copy) using translation objects rather than plain strings.
- Add helper text reminding editors that they can save per tab and that colors must be hex with `#` (existing validation can extend to all language fields).
- Ensure the preview iframe button includes the selected locale, so editors can preview the draft in either EN or AR without extra steps.
- Add contact, social, visibility, and testimonial cards to the same editor, so center admins can keep every landing-page section under a single roof, including per-locale testimonial text plus create/update/delete/reorder workflows.

### 4. Public rendering
- Leverage marketing/public resolve endpoints to send `X-Locale` (already wired) and ensure the UI picks the matching translation or falls back to English when the requested translation is missing.
- Skip rendering `null` sections and hide testimonials when empty (per contract). If `show_courses` is `true`, render the CTA/section shell but keep data pulled separately via the courses API to respect media security.
- For preview mode, respect `preview_token` + locale combination and handle 404s when tokens expire.

## QA Checklist
- [ ] Unit test for `LocaleContext` ensures `setLocale` persists state and updates `localStorage` + `documentElement.lang`.
- [ ] Header snapshot/unit test confirms `LocaleToggle` renders EN/AR buttons and fires the setter.
- [x] Landing-page resolver service test (`tests/unit/features/landing-page/landing-page-resolve.service.test.ts`) asserts locale headers, preview tokens, and nested payloads.
- [ ] Integration test or manual step verifying Axios requests carry the chosen locale (maybe via MSW request headers).
- [ ] Manual validation that hero/about translations saved in both EN and AR show up correctly on the public landing page when using `X-Locale` or Arabic path (if that path exists).

## Tracking
| Task | Owner | Status | Notes |
| --- | --- | --- | --- |
| Document backend contract + multi-lang UX | Frontend/PM | ✅ In doc | This file captures the current plan. |
| Build LocaleContext/provider | Frontend | ✅ Completed | Adds `setApiLocale`, storage, and `<html lang>` sync. |
| Header locale toggle + UX cues | Frontend | ✅ Completed | Hook up new provider to header and admin forms. |
| Landing page editor updates (EN + AR inputs + contact/social/visibility/testimonials) | Frontend | ✅ Completed | Hero/about plus contact/social/visibility/testimonials forms and preview button now live. |
| Public landing page locale rendering | Frontend | ✅ Completed | New `/landing/[slug]` resolver renders hero/about/contact/testimonials using the request locale and honors visibility flags. |
| QA/tests for multi-lang flow | QA | ✅ Completed | Service-level tests ensure locale headers, preview tokens, and nested payloads unpack correctly for the resolver. |
