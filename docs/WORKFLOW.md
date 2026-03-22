# Najaah Frontend — Shared Workflow

## Shared Source Of Truth

Claude and Codex must use the same repo-local markdown sources.

- Claude agent behavior lives in `.claude/agents/*.md`
- Claude skill behavior lives in `.claude/skills/**`
- frontend workflow lives in `docs/WORKFLOW.md`
- Codex mapping lives in `docs/codex/CODEX_CLAUDE_ALIGNMENT.md`
- cross-repo feature plans, progress trackers, and contracts live in the backend repo under `/Users/tarekbassiouny/projects/najaah-backend/docs/`

Do not create a second Codex-only workflow when the `.claude` files already define it.

## Frontend Phase Workflow

### 1) Discovery
- Read `.claude/skills/lms/SKILL.md`
- Read `.claude/skills/lms-orchestrator/SKILL.md` for orchestrated work
- Inspect repository state and nearby implementation
- Read `docs/STYLE_GUIDE.md` when UI is affected
- For cross-repo features, read the backend plan, tracker, and contract docs before coding

### 2) Plan With The User
- Provide a short phase-based plan
- Wait for explicit confirmation before coding unless the user explicitly asks for immediate execution

### 3) Phase Review Gate
- Re-read the approved phase
- Inspect nearby code and affected modules
- Record contract impact
- Define tests/checks for the phase
- Record any phase-local adjustments before implementation
- Do not start coding until the phase review gate is complete and approved

### 4) Implementation
- Use existing app-shell, feature-module, and design-system patterns
- Keep data fetching in services and hooks, not components
- Match backend contracts exactly; do not guess fields or endpoints
- Update the backend progress tracker lane status for cross-repo phases

### 5) Cleanup
- List unused or redundant files before deletion
- Delete only after confirmation

### 6) Verification
- Run the checks required by the phase
- At minimum, prefer `npm run check:style` and `npm run check:quality` when the phase touches runtime code
- Note any skipped checks or unresolved gaps

### 7) Wrap-Up
- Summarize completed phase work
- Note verification status
- Record remaining risks or contract follow-ups

## Git Worktree Workflow

Use `git worktree` as the default branch-isolation workflow for implementation phases.

### Standard Rule

- keep the main checkout available for planning, reviews, and docs
- create a dedicated worktree for each implementation phase branch
- use separate frontend and backend worktrees when both repos are active in parallel
- do not start coding a phase in the main checkout when it belongs on its own branch

### Recommended Pattern

```bash
# main checkout: planning/review/docs
cd ~/projects/najaah-frontend

# phase worktree
git worktree add ../najaah-frontend-phase-0b -b feat/settings-ui-phase-0b dev
```

## Cross-Repo Feature Workflow

For backend-led features, frontend should read the backend repo artifacts in this order:

1. feature plan in `/Users/tarekbassiouny/projects/najaah-backend/docs/feature/`
2. active progress tracker in `/Users/tarekbassiouny/projects/najaah-backend/docs/feature/`
3. contract docs in `/Users/tarekbassiouny/projects/najaah-backend/docs/contracts/{feature-slug}/`

Current web portal feature mapping:
- plan: `/Users/tarekbassiouny/projects/najaah-backend/docs/feature/student-parent-web-portal.md`
- tracker: `/Users/tarekbassiouny/projects/najaah-backend/docs/feature/web-portal-progress.md`
- contracts: `/Users/tarekbassiouny/projects/najaah-backend/docs/contracts/student-parent-web-portal/`
