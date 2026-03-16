# Course Asset Authoring MVP

## UX Flow, Wireframes, and Integration with Current LMS Admin Flow

## 1) UX Objective

Provide one clear authoring experience inside course context where admins can:

- See source-bound asset status (video/pdf -> summary/quiz/flashcards/assignment)
- Generate multiple AI assets in one run
- Review/approve/publish per generated asset
- Use manual quiz/assignment creation from the same source context
- Regenerate safely without mutating current live content before publish

MVP scope in UI:

- Source types: `video`, `pdf`
- Asset types: `summary`, `quiz`, `flashcards`, `assignment`
- Hide `interactive_activity` in primary MVP UI

---

## 2) Integration with Current Flow (No Disruption)

Current routes already used by admins:

- Course detail: `/centers/{centerId}/courses/{courseId}`
- AI workspace/jobs: `/centers/{centerId}/ai-content`
- Manual quiz list/create: `/centers/{centerId}/courses/{courseId}/quizzes`
- Quiz builder: `/centers/{centerId}/quizzes/{quizId}`
- Manual assignment list/create: `/centers/{centerId}/courses/{courseId}/assignments`

Proposed integration (additive):

1. Add a new course-level entry:
   - `Assets` tab/page inside course context
   - Route: `/centers/{centerId}/courses/{courseId}/assets`
2. Keep existing pages unchanged as fallback and deep-link targets.
3. Keep `/ai-content` as advanced/debug workspace; primary flow moves to course assets page.
4. Keep `Course Assets` as the single start point and pass `return_to` when opening manual routes.
5. Avoid duplicate entry buttons that bounce users between `Assets` and `AI Workspace`.

### Latest UX refinement (2026-03-13)

Before:
- Course detail showed split Manual vs AI cards that both led back to Assets.
- Assets page exposed multiple "Open Workspace" links.
- Manual create paths did not consistently return to Assets context.

Now:
- Course detail has one primary CTA to open Assets workspace.
- Assets page is the orchestrator; workspace cross-links were reduced.
- Manual quiz/assignment routes carry `return_to` and return users to Assets flow.
- AI review/approve/publish now opens in-page from Assets (no workspace redirect loop).
- Generate modal is AI-only; manual creation starts from a separate `Create Manually` source action.

---

## 3) Page Inventory

## P1. Course Assets Builder (new primary page)

Route:
- `/centers/{centerId}/courses/{courseId}/assets`

Purpose:
- Tree view of sections -> sources (video/pdf) -> asset slots.
- Single place to start AI batch or manual create.

Main components:
- `CourseContentTree`
- `SourceItemCard`
- `AssetSlotList`
- `AssetSlotBadge`
- `GenerateAssetsButton`
- `CreateManualQuizButton`
- `CreateManualAssignmentButton`

API:
- `GET /api/v1/admin/centers/{center}/courses/{course}/asset-catalog`

---

## P2. Generate Assets Modal

Opened from a specific source row (video/pdf).

Purpose:
- Multi-select assets and per-target generation options.
- Submit one batch request.

API:
- `POST /api/v1/admin/centers/{center}/ai-content/batches`

---

## P3. Batch Status Drawer

Purpose:
- Live status for all jobs in one batch.
- Retry/discard/review entry points.

API:
- `GET /api/v1/admin/centers/{center}/ai-content/jobs?batch_key={batchKey}`

Contract note:
- Poll the jobs list endpoint with `batch_key`.
- Do not expect a dedicated batch show endpoint in MVP.

---

## P4. Asset Review Drawer (per job)

Purpose:
- Preview generated payload.
- Edit reviewed payload.
- Approve then publish.

APIs:
- `PATCH .../ai-content/jobs/{job}/review`
- `POST .../ai-content/jobs/{job}/approve`
- `POST .../ai-content/jobs/{job}/publish`

---

## P5. Summary/Flashcards Edit Screens (admin canonical edit)

Routes (new):
- `/centers/{centerId}/learning-assets/{assetId}`

Purpose:
- Edit generated summary/flashcards after publish.
- Publish/archive status control.

APIs:
- `GET /api/v1/admin/centers/{center}/learning-assets/{asset}`
- `PUT /api/v1/admin/centers/{center}/learning-assets/{asset}`
- `PATCH /api/v1/admin/centers/{center}/learning-assets/{asset}/status`

---

## P6. Manual Quiz/Assignment Paths (existing, contextual entry)

From source row actions:
- Manual quiz -> existing quiz create/list flow with source prefilled
- Manual assignment -> existing assignment create/list flow with source prefilled

---

## 4) UX Wireframes (Low-Fidelity)

## W1. Course Assets Builder

```text
+----------------------------------------------------------------------------------+
| Course: Biology 101                                              [Back]          |
| Tabs: Overview | Students | Settings | Assets                                   |
+----------------------------------------------------------------------------------+
| Section: Introduction                                                           |
|  - Video: Welcome to Biology                                                    |
|    [Generate Assets] [Create Quiz] [Create Assignment]                          |
|    Slots:                                                                        |
|      Summary      [Published]   "Welcome Summary"         [View] [Regenerate]   |
|      Quiz         [Missing]                             [Generate] [Create Man.] |
|      Flashcards   [Review Required]                     [Review]                 |
|      Assignment   [Draft]      "Week 1 Homework"        [Edit] [Publish]        |
|                                                                                  |
|  - PDF: Syllabus                                                                 |
|    [Generate Assets] [Create Quiz] [Create Assignment]                          |
|    Slots: Summary [Missing]  Quiz [Published]  Flashcards [Missing] ...         |
+----------------------------------------------------------------------------------+
```

## W2. Generate Assets Modal

```text
+---------------------------------------------------------------+
| Generate Assets                                               |
| Source: Video #801 - "Welcome to Biology" (locked)          |
|                                                               |
| Select assets:                                                |
| [x] Summary      [x] Quiz      [ ] Assignment [x] Flashcards |
|                                                               |
| Summary options:   length [medium]  include_key_points [x]    |
| Quiz options:      question_count [10] difficulty [medium]    |
|                    styles [single_choice, true_false]         |
| Flashcard options: card_count [15] focus [definitions]        |
|                                                               |
|                             [Cancel] [Generate Batch]         |
+---------------------------------------------------------------+
```

## W3. Batch Status Drawer

```text
+---------------------------------------------------------------+
| Batch: 2f0e... (Video #801)                                   |
| Summary: 1 processing | 2 completed | 1 failed                |
|---------------------------------------------------------------|
| Summary      [Completed]       [Review]                       |
| Quiz         [Processing...]                                  |
| Flashcards   [Failed]          [View Error] [Retry]           |
| Assignment   [Completed]       [Review]                       |
|---------------------------------------------------------------|
| [Close]                                                       |
+---------------------------------------------------------------+
```

## W4. Review Drawer (Per Asset)

```text
+---------------------------------------------------------------+
| Review: Quiz (Job #1234)                                      |
| Status: Completed                                              |
|---------------------------------------------------------------|
| Generated Payload (editable reviewed draft)                   |
| - title                                                       |
| - questions[]                                                  |
| - answers[] + correctness                                     |
| - explanations / points                                       |
|---------------------------------------------------------------|
| [Save Draft] [Approve] [Publish]                              |
+---------------------------------------------------------------+
```

---

## 5) End-to-End User Flows

## Flow A: AI Batch from Source

1. Admin opens `Assets` tab on course.
2. Selects a `video` or `pdf` row -> clicks `Generate Assets`.
3. Chooses 1..4 target types and options -> submits batch.
4. Sees batch drawer polling status.
5. Opens each completed asset -> reviews/edits.
6. Approves -> publishes per asset.
7. Slot updates to `Published` and shows canonical title.

## Flow B: Manual Quiz/Assignment from Source

1. Admin opens source row.
2. Clicks `Create Quiz` or `Create Assignment`.
3. Redirects to existing manual screen with attachable context prefilled.
4. Saves manually.
5. Returning to `Assets` tab shows slot as `Draft`/`Published` accordingly.

## Flow C: Regenerate Published Asset

1. Slot is `Published`.
2. Admin clicks `Regenerate`.
3. New AI job and draft path created.
4. Live asset remains unchanged during review.
5. On publish: new version becomes active; previous active is archived/deactivated atomically.

---

## 6) Slot State Model (UI)

Derived states (backend-derived, frontend rendered):

- `missing`
- `generating`
- `review_required`
- `approved`
- `published`
- `draft`
- `failed`

Action matrix:

- `missing`: `Generate`, manual create (quiz/assignment only)
- `generating`: `View batch`
- `review_required`: `Review`, `Discard`
- `approved`: `Publish`
- `published`: `View`, `Regenerate`; `Edit` for summary/flashcards
- `draft`: `Edit`, `Publish` (where valid)
- `failed`: `View Error`, `Regenerate`

---

## 7) Navigation and Deep-Link Strategy

Primary route:
- `/centers/{centerId}/courses/{courseId}/assets`

Deep links:

- Quiz detail/builder: existing quiz routes
- Assignment detail: existing assignment routes
- Summary/flashcards: new learning-asset detail route
- AI workspace fallback: `/centers/{centerId}/ai-content?...`

Rule:
- Always return user to course assets context after modal/drawer close.

---

## 8) UX Quality Rules

1. Do not expose unsupported manual paths (summary/flashcards manual create hidden).
2. Source context is locked in generate modal (prevents cross-source mistakes).
3. Batch errors are per-job; never hide partial success.
4. Show explicit “Live version remains unchanged until publish” message on regeneration.
5. Respect permission visibility:
   - `course.manage`: view catalog
   - `ai_content.generate`: generate/discard
   - `ai_content.review_publish`: review/approve/publish
   - `learning_asset.manage`: summary/flashcards post-publish edits

---

## 9) Delivery Plan (UX-first)

## UX Phase U1: Clickable low-fi

- Finalize page layout, slot badges, action buttons, modal structure.

## UX Phase U2: High-fidelity states

- Loading/empty/error/partial-failure states for each page component.

## UX Phase U3: Integration pass

- Wire catalog and batch endpoints, then review/publish and manual deep-links.

## UX Phase U4: Validation pass

- Permission variants
- Edge-case states (failed + published coexistence)
- Arabic/English localization fit

---

## 10) Acceptance (UX)

1. Admin can complete AI flow from course page without navigating to generic jobs screen.
2. Admin can clearly choose manual vs AI for quiz/assignment from the same source row.
3. Asset status is visible in one glance under each source.
4. Regeneration behavior is understandable and safe (live unchanged until publish).
5. No duplicate/conflicting entry points cause confusion.

---

## 11) Current vs Next (Refactor Comparison)

This section defines what is being refactored, not only what is added.

| Area | Current Flow | Next Flow (MVP) | Refactor Action |
|---|---|---|---|
| Primary AI authoring entry | `/centers/{center}/ai-content` generic workspace | `/centers/{center}/courses/{course}/assets` source-bound builder | Move primary flow to course assets; keep ai-content as secondary workspace |
| AI generation granularity | One job per submit | One batch per source (1..4 assets) | Replace single-job form usage in primary flow with batch modal |
| Source selection UX | Manual source type/id inputs in AI workspace | Source fixed by clicked video/pdf row | Remove manual free-form source picking in primary flow |
| Manual vs AI quiz/assignment | Split across different pages; decision is implicit | Side-by-side actions on source row | Surface explicit `Create manually` and `Generate with AI` actions together |
| Summary/flashcards post-publish edit | Not unified in course flow | Dedicated learning-asset edit path | Add canonical edit route and deep-link from slot |
| Status visibility | Jobs list-centric; source context is weak | Slot state visible under each source | Replace job-centric awareness with source-centric slot awareness |
| Regeneration messaging | Technical and scattered | Explicit safe-swap messaging on slot actions | Add UX copy: live stays unchanged until publish |
| Permission UX | Capability checks exist but not source-action-first | Action buttons gated at slot/action level | Refactor visibility/disabled states around slot actions |

---

## 12) Refactor Scope (Existing Screens)

## R1. Course detail page (`/courses/{courseId}`)

- Keep `Overview`, `Students`, `Settings`.
- Add `Assets` tab as the default place for authoring.
- Keep current panel links to manual quiz/assignment for continuity, but reduce duplicate CTA noise after rollout.

## R2. AI workspace page (`/ai-content`)

- Keep page (do not remove in MVP).
- Reposition as advanced operational workspace:
  - global job monitoring
  - troubleshooting failed jobs
  - cross-course ops
- Remove dependency on this page for day-to-day course authoring.

## R3. Quiz and assignment manual pages

- Keep existing routes and APIs.
- Refactor entry into them from source rows using attachable prefill context.
- Standardize create UX patterns (dialog/form spacing/state handling) between quiz and assignment pages.

## R4. Reusable review/editor components

- Extract shared review shell used by AI job review so both:
  - course assets flow
  - ai-content workspace
  can render consistent review/edit/approve/publish behavior.

---

## 13) Transition Plan (No Hard Cutover)

## T1. Phase-in strategy

1. Release `Assets` page behind capability and route.
2. Keep all current pages functional.
3. Add links from current pages to the new `Assets` page.
4. After stability, reduce duplicate top-level CTAs that cause path confusion.

## T2. Backward compatibility

- Existing deep links to quiz/assignment/ai-content continue to work.
- Existing single-job AI endpoint remains supported.
- Existing manual CRUD flows remain unchanged.

## T3. UX de-duplication after stabilization

- Keep exactly one primary CTA per intent in course context:
  - Generate assets (source row)
  - Create quiz manually (source row)
  - Create assignment manually (source row)
- Avoid duplicate “Generate with AI” buttons in multiple places once `Assets` is primary.

---

## 14) Component Refactor Map

## New primary components

- `features/course-builder/*`
- `features/course-assets/*`

## Existing components to refactor/reuse

- Reuse and adapt review payload editors currently embedded in `ai-content/page.tsx`.
- Reuse publish/approve action logic hooks from `features/ai/hooks/use-ai.ts`.
- Reuse quiz builder and assignment manual routes as deep-link destinations.

## Remove/avoid

- Avoid duplicating AI payload editor logic in two separate implementations.
- Avoid creating a second manual quiz/assignment flow outside existing canonical pages.

---

## 15) Documentation Update Checklist

When implementation starts, keep docs aligned in parallel:

1. Update this UX doc with screenshots after high-fidelity UI pass.
2. Add route ownership notes in `docs/NAV_MAPPING.md`:
   - course assets route is a course-internal tab, not a sidebar item.
3. Add API contract examples for:
   - asset-catalog
   - ai-content batches (create)
   - ai-content jobs list with `batch_key` (polling)
   - learning asset admin endpoints
4. Add state mapping table used by frontend and backend tests (`slot_state` precedence rules).
