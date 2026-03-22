# Najaah Frontend — Claude/Codex Alignment Map

## Goal

Claude agents, Claude skills, and Codex workflows must read the same repo-local markdown files so all AI agents follow one shared source of truth.

Codex should not maintain a second competing workflow when a `.claude` file already defines that behavior.

## Shared Source Of Truth

Use these files first:

1. `.claude/skills/lms/SKILL.md`
2. `.claude/skills/lms-orchestrator/SKILL.md`
3. specialist skills under `.claude/skills/`
4. agent definitions under `.claude/agents/`
5. `docs/WORKFLOW.md`
6. `docs/STYLE_GUIDE.md` when UI is touched
7. backend feature plan, progress tracker, and contract docs for cross-repo work

Codex-specific docs should only point back to these sources and add Codex invocation notes where needed.

Single-entry Codex start file:
- `docs/codex/CODEX_ORCHESTRATOR_ENTRY.md`

## Agent Mapping

| Claude Agent File | Purpose | Codex Equivalent Behavior | Files Codex Must Read |
|-------------------|---------|---------------------------|-----------------------|
| `.claude/agents/orchestrator.md` | planning, sequencing, approvals, cross-phase coordination | Codex planning mode for complex frontend work | `.claude/agents/orchestrator.md`, `.claude/skills/lms/SKILL.md`, `.claude/skills/lms-orchestrator/SKILL.md`, `docs/WORKFLOW.md` |
| `.claude/agents/feature-builder.md` | end-to-end frontend phase execution | Codex implementation mode for one approved phase | `.claude/agents/feature-builder.md`, current backend contract, current tracker, relevant specialist skills |
| `.claude/agents/reviewer.md` | review and quality gate | Codex review mode before commit/PR | `.claude/agents/reviewer.md`, `.claude/skills/lms-review/SKILL.md`, `.claude/skills/lms-qa/SKILL.md` |

## Skill Mapping

| Claude Skill File | Purpose | Codex Must Use It When |
|-------------------|---------|------------------------|
| `.claude/skills/lms/SKILL.md` | master frontend context | always first in frontend work |
| `.claude/skills/lms-orchestrator/SKILL.md` | planning, phase gating, working memory | new features, multi-layer fixes, phased work |
| `.claude/skills/lms-frontend/SKILL.md` | routes, components, hooks, services, forms | implementation phases |
| `.claude/skills/lms-pm/SKILL.md` | scope framing, capability mapping, contract clarification | planning or ambiguous product scope |
| `.claude/skills/lms-qa/SKILL.md` | tests, mocks, validation | verification phases |
| `.claude/skills/lms-review/SKILL.md` | review and release-readiness checks | review phases |
| `.claude/skills/lms-backend-contracts/SKILL.md` | backend tracker and contract discovery | any backend-led cross-repo feature |

## Shared Phase Workflow

Claude and Codex follow the same phase workflow defined in `docs/WORKFLOW.md`:

1. Discovery
2. Plan With The User
3. Phase Review Gate
4. Implementation (one phase per branch/worktree)
5. Verification & Reporting

See `docs/WORKFLOW.md` for full details including git worktree usage, phase review gate template, and cross-repo feature coordination.

## Codex Rules

When Codex starts work in this repo, it must:

1. Treat `.claude` markdown files as the primary workflow source of truth.
2. Use `docs/WORKFLOW.md` as the repo workflow summary.
3. Use backend plan/tracker/contract docs as the live execution artifacts for cross-repo features.
4. Follow the same phase review gate and git worktree pattern used by Claude.
5. Avoid creating duplicate instructions when a `.claude` or workflow file already exists.

## Getting Started

Default single-entry start for Codex: read `docs/codex/CODEX_ORCHESTRATOR_ENTRY.md`.
