---
name: lms-backend-contracts
description: Read API contracts and progress from the backend repo to coordinate parallel frontend work. Use when starting any frontend phase that depends on a backend contract.
---

# LMS Backend Contracts Skill

## Use This Skill When
- Starting frontend work that depends on a backend API contract
- Checking if a backend phase is complete and what's unblocked
- Resolving a contract mismatch between frontend implementation and backend API
- The orchestrator needs to know the current state of any cross-repo feature

## Backend Repo Location
`/Users/tarekbassiouny/projects/najaah-backend`

## How To Find Contracts For Any Feature

All cross-repo features follow the same structure in the backend repo:

```
docs/feature/{feature-slug}.md              # the plan (read-only reference)
docs/feature/{feature-slug}-progress.md     # progress tracker (read + update lane status)
docs/contracts/{feature-slug}/              # API contracts per phase
  {contract-name}.md
```

### Discovery Steps
1. Check `docs/feature/` for `*-progress.md` files — each is an active cross-repo feature
2. Read the progress tracker to find which phase is current and which contracts exist
3. Read the relevant contract doc from `docs/contracts/{feature-slug}/`

### Known Features
| Feature | Plan | Progress | Contracts Dir |
|---------|------|----------|---------------|
| Web Portal | `student-parent-web-portal.md` | `web-portal-progress.md` | `docs/contracts/web-portal/` |

(This table grows as new cross-repo features are added)

## Existing API Reference (for response shapes)
- `routes/api/v1/mobile.php` — mobile routes
- `routes/api/v1/admin/` — admin routes
- `config/settings_catalog.php` — settings catalog

## Workflow

### Before Starting a Frontend Phase

1. Read the feature's progress tracker from backend repo
2. Check the "Frontend Contract Tracker" table — is your contract `draft` or `final`?
3. If contract exists: read it from `docs/contracts/{feature-slug}/{name}.md`
4. If contract is `draft (from plan)`: safe to scaffold components and set up types/mocking
5. If contract is `draft (from implementation)`: safe to build real API integration
6. If contract is `final`: safe to run integration tests
7. If no contract yet: check if the backend phase is in progress — wait or ask

### During Frontend Development

- Build against the contract doc shapes
- Use MSW handlers to mock API responses matching the contract
- If you find a mismatch or ambiguity, note it in the "Open Blockers" section of the progress tracker

### After Frontend Phase Complete

Update the backend repo's progress tracker:
- Update "Lane Status" for the frontend lane
- Add "Integration verified: {phase}" if integration tested
- Note any contract mismatches found

## Contract Doc Structure

Each contract doc follows this format:
```markdown
# {Feature} — {Phase} API Contract
## Status: Draft (from plan) | Draft (from implementation) | Final

## Endpoints
### {GROUP}
#### {METHOD} {PATH}
- Auth: {guard}
- Request: {body/params}
- Response 200: {JSON shape}
- Error Responses: {codes}

## Auth Flow (if applicable)
## Settings / Feature Flags (if applicable)
## Error Codes
## Breaking Changes (from previous draft)
```

## Contract Lifecycle

```
Draft (from plan)  →  Draft (from implementation)  →  Final (after tests pass)
     │                        │                              │
     └─ scaffold + mock       └─ build real integration      └─ integration tests
```

## Communication Protocol

### Frontend → Backend signals (update progress tracker):
| Signal | When |
|--------|------|
| "Building against contract: {phase}" | Started frontend work |
| "Contract mismatch: {detail}" | Found discrepancy during integration |
| "Need clarification: {endpoint}" | Ambiguity in contract |
| "Integration verified: {phase}" | Successfully tested against real API |

### Backend → Frontend signals (in progress tracker):
| Signal | When |
|--------|------|
| "Contract ready: {phase}" | Contract doc generated |
| "Contract updated: {phase}" | Implementation changed the contract |
| "API live: {phase}" | Backend PR merged |
| "Contract final: {phase}" | Tests pass, shape is stable |

## Do NOT
- Modify backend repo files except progress tracker lane status and blockers
- Assume endpoints exist that aren't in the contract doc
- Build features ahead of the contract — wait for at least a draft
- Ignore contract status — `draft (from plan)` means shapes may change
- Invent backend endpoints or response fields not in the contract
