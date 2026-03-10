# Center Landing Page Feature

## Overview
- Feature is center-scoped only: admin routes live under `/api/v1/admin/centers/{centerId}/landing-page`, protected by `landing_page.manage` + `scope.center`.
- Public landing pages resolved via `/api/v1/resolve/landing-page/{slug}` with optional `?preview_token`.
- Goal: provide admin tabbed editor (meta/hero/about/contact/social/styling/visibility/testimonials), preview iframe, publish/unpublish controls, and a public renderer that obeys visibility flags.
- This doc tracks UX/UX/contract details and implementation checkpoints.

## Admin Experience Plan
### Navigation & Shell
- Add “Landing Page” card to the center overview grid; link points to `/centers/[centerId]/landing-page` for branded centers only.
  Unbranded centers should not surface the link because they rely on the shared system landing experience.
- Reuse dashboard layout (breadcrumbs: Centers → {center} → Landing Page).
- Gate entire page with `landing_page.manage`; center context derived from route params.
- Header shows center name/slug, publish state, and primary actions: `Preview`, `Publish`, `Unpublish`.

### Data Flow
1. **Initial fetch**: `GET /api/v1/admin/centers/{centerId}/landing-page` (auto-creates draft); treat response as canonical editor state.
2. **Per-tab saves**: each section has its own `PATCH /sections/{section}` endpoint; payloads can be partial.
3. **State updates**: each PATCH returns full landing page resource—update React Query cache to keep tabs in sync.
4. **Preview token**: `POST /preview-token` returns `preview_url`, `token`, and expiration (30m); reused until expiry.
5. **Publish**: `POST /publish`; **Unpublish**: `POST /unpublish`; both respond with updated resource for immediate UI update.

### Tab Sketches
1. **Meta**
   - Fields: `meta_title`, `meta_description`, `meta_keywords` (tags or comma string).
   - Save button at footer (disabled while `PATCH` in-flight).

2. **Hero**
   - Translation objects for `hero_title` and `hero_subtitle` (EN/AR textareas).
   - CTA inputs: `hero_cta_text`, `hero_cta_url` (single language).
   - Background upload: POST `/media/hero-background`; show thumbnail, support re-upload, persist returned URL.

3. **About**
   - EN/AR fields for title/content (`about_title`, `about_content`).
   - Image upload via `/media/about-image` (persist URL), preview existing image.

4. **Contact**
   - Simple form: `contact_email`, `contact_phone`, `contact_address` (textarea).

5. **Social**
   - Inputs for `social_facebook`, `social_twitter`, `social_instagram`, `social_youtube`, `social_linkedin`, `social_tiktok`.

6. **Styling**
   - `primary_color`, `secondary_color`, `font_family` fields; color input enforces regex `^#[0-9A-Fa-f]{3,8}$`.
   - Show color swatch preview to reinforce constraint.

7. **Visibility**
   - Toggles for `show_hero`, `show_about`, `show_courses`, `show_testimonials`, `show_contact` with helper text; no course payload yet—just visibility.

8. **Testimonials**
   - Table/list rendering each testimonial with rating, status, and actions (edit/delete, toggle active).
   - Create/edit form fields: `author_name*`, `author_title?`, `content.en*`, `content.ar`, `rating`, `is_active`, image upload (`/media/testimonial-image`, max 2MB) storing returned URL in payload.
   - Reorder via `/testimonials/reorder` with body `{ testimonial_ids: number[] }`; response returns full landing page resource for updated order.

### Shared UX
- Show 422 errors drawn from `error.details` per tab.
- Translation fields must be object shapes (EN/AR); disallow plain strings.
- Color inputs enforce hex regex; show inline helper when validation fails.
- Media upload flow: hero/about responses already update landing page; testimonial image upload only returns URL for later inclusion.
- Preview iframe reuses token until expiry; show countdown or expiry message and ability to regenerate token.
- Publish/unpublish buttons update cache immediately; optional `refetch` for safety.

## Preview Iframe Plan
- “Preview” action triggers `POST /preview-token`; store `preview_url`, `preview_token`, `expires_in_minutes`.
- Render iframe inline (or optional modal) loading `preview_url?preview_token=…`.
- Surface expiry state: detect 404 → show warning + button to regenerate token.
- Provide optional “Open preview in new tab” control for manual testing.

## Public Landing Page Plan
- Route resolves via `GET /api/v1/resolve/landing-page/{slug}` (with optional `preview_token`, `X-Locale` header preferred).
- Render order: hero → about → courses block (flag only) → testimonials → contact; skip any section whose payload is null or flagged `false`.
- Hero/about/contact may be null; do not render placeholders.
- Testimonials already filtered/ordered—render as received; hide entire block if array empty.
- Show courses section/CTA only if `show_courses` is `true`; no course details/videos yet to keep security intact.
- Preview query `?preview_token=...` uses same resolve endpoint; 404 indicates expired token—show user-friendly message if needed.
- Locale: rely on existing middleware; send `X-Locale` when overriding from UI.

## API Contract Summary
- Base admin path: `/api/v1/admin/centers/{centerId}/landing-page`.
- Attachment uploads:
  - `/media/hero-background` and `/media/about-image` (return URL + updated landing page).
  - `/media/testimonial-image` (returns URL only).
- Testimonials CRUD: GET `/testimonials`, POST `/testimonials`, PUT `/testimonials/{id}`, DELETE `/testimonials/{id}`, POST `/testimonials/reorder`.
- Publish/unpublish endpoints return full resource for immediate UI sync.
- Preview token endpoint returns reusable token for 30 minutes; embed via query param.

## Security Notes
- No course/video access is exposed beyond existing secure APIs; `show_courses` is visibility-only. Media URLs use storage protections and preview iframe uses tokens.
- Preview token appended to iframe URL handles draft visibility, no additional media bridges needed.

## Tracking & Next Steps
1. [ ] Implement services/hooks (types, queries, mutations) and API client for all endpoints.
2. [ ] Build tabbed UI following above sketches, including upload helpers and validation.
3. [ ] Implement preview iframe flow (token management + expiry handling).
4. [ ] Add public landing page route that renders the resolved payload.
5. [ ] Create tests/QA flows, document manual test steps, and run lint/build before merge.

## Questions/Follow-ups
- Provide frontend-ready contract sheet (screen/tab request-response examples) if available to double-check payload shapes.
- Confirm preferred approach for the preview iframe (inline vs. modal) and whether we need auto-refresh behavior.
