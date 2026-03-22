---
name: lms-backend-contracts
description: Read API contracts and progress from the backend repo to coordinate parallel frontend work. Use when starting a frontend phase that depends on a backend contract.
---

# LMS Backend Contracts Skill

## Use This Skill When
- Starting frontend work that depends on a backend API contract
- Checking if a backend phase is complete and what's unblocked
- Resolving a contract mismatch between frontend implementation and backend API
- The orchestrator needs to know the current state of the web portal project

## Backend Repo Location
`/Users/tarekbassiouny/projects/najaah-backend`

## Key Files To Read

### Progress & Coordination
- `docs/feature/web-portal-progress.md` — lane status, phase tracker, contract delivery, blockers
- `docs/feature/web-portal-workflow.md` — parallel execution rules and communication protocol

### Plans (read-only reference, do not modify)
- `docs/feature/student-parent-web-portal.md` — full backend plan with all phase tasks
- `docs/feature/web-portal-settings-governance.md` — settings classification and catalog entries

### API Contracts (generated per phase)
- `docs/contracts/settings-feature-groups.md` — Phase 0A: settings API with feature_group metadata
- `docs/contracts/web-auth-api.md` — Phase 2: student + parent JWT auth endpoints
- `docs/contracts/web-student-api.md` — Phase 3: student web portal endpoints
- `docs/contracts/web-parent-api.md` — Phase 4: parent web portal endpoints
- `docs/contracts/admin-parent-api.md` — Phase 5A: admin parent management endpoints

### Existing API Reference (for response shapes)
- `routes/api/v1/mobile.php` — existing mobile routes (student web reuses these controllers)
- `routes/api/v1/admin/` — existing admin routes
- `config/settings_catalog.php` — settings catalog structure

## Workflow

### Before Starting a Frontend Phase

1. Read `docs/feature/web-portal-progress.md` from backend repo
2. Check the "Frontend Contract Tracker" table — is your contract `draft` or `final`?
3. If contract exists: read it from `docs/contracts/{name}.md`
4. If contract is `draft (from plan)`: safe to scaffold components and set up types/mocking
5. If contract is `draft (from implementation)`: safe to build real API integration
6. If contract is `final`: safe to run integration tests

### During Frontend Development

- Build against the contract doc shapes
- Use MSW handlers to mock API responses matching the contract
- If you find a mismatch or ambiguity, note it in the "Open Blockers" section of progress.md

### After Frontend Phase Complete

Update the backend repo's `docs/feature/web-portal-progress.md`:
- Update "Lane Status" for the frontend lane
- Add "Integration verified: {phase}" if integration tested
- Note any contract mismatches found

## Contract Doc Structure

Each contract doc follows this format:
```
# {Phase Name} — API Contract
## Status: Draft | Final

## Endpoints
### {GROUP}
#### {METHOD} {PATH}
- Auth: {guard}
- Request: {body/params}
- Response 200: {JSON shape}
- Error Responses: {codes}

## Auth Flow (if applicable)
## Settings / Feature Flags
## Error Codes
```

## Frontend-to-Backend Mapping

| Frontend Phase | Reads Contract | Builds |
|---|---|---|
| Phase 0B (settings cards) | settings-feature-groups.md | FeatureSettingsCard, CenterSettingsEditor update |
| Portal scaffold + auth | web-auth-api.md | Auth pages, token management, API client setup |
| Student pages | web-student-api.md | Course, playback, quiz, assignment, progress pages |
| Parent pages | web-parent-api.md | Linked students, progress, quiz review pages |
| Phase 5B (admin parent UI) | admin-parent-api.md | Parent list, detail, link management pages |

## Do NOT
- Modify backend repo files (except progress.md lane status updates)
- Assume endpoints exist that aren't in the contract doc
- Build features ahead of the contract — wait for at least a draft
- Ignore contract status — `draft (from plan)` means shapes may change
