# Najaah Frontend — Codex Single Entry

Use this file as the single Codex entrypoint for frontend work.

## Default Rule

Start from `orchestrator`.

Codex should read this file first, then load:

1. `.claude/agents/orchestrator.md`
2. `.claude/skills/lms/SKILL.md`
3. `.claude/skills/lms-orchestrator/SKILL.md`
4. `docs/WORKFLOW.md`
5. the relevant backend plan, progress tracker, and contract docs for cross-repo work

Do not manually load specialist skills first unless the task is already narrowed to a specific approved phase and the orchestrator flow has already been completed.

## What Orchestrator Does

The orchestrator is responsible for:

- discovery and nearby code review
- loading only the needed specialist skills
- plan validation with the user
- phase review gate enforcement
- git worktree phase isolation
- deciding when to switch to `feature-builder` or `reviewer`

## Role Switching Rule

After reading the orchestrator files:

- stay in `orchestrator` for planning, validation, and “what next?”
- switch to `feature-builder` only for one approved implementation phase
- switch to `reviewer` only for review/verification

## Copy-Paste Prompt

```text
Read /docs/codex/CODEX_ORCHESTRATOR_ENTRY.md and act as the frontend orchestrator for this task.
Follow the mapped .claude agent/skill files and shared docs workflow before doing anything else.
```

## Cross-Repo Features

For backend-led frontend work, also read:

- `/Users/tarekbassiouny/projects/najaah-backend/docs/feature/student-parent-web-portal.md`
- `/Users/tarekbassiouny/projects/najaah-backend/docs/feature/web-portal-progress.md`
- `/Users/tarekbassiouny/projects/najaah-backend/docs/contracts/student-parent-web-portal/`

## Important Limitation

Codex does not auto-load repo-local Claude agents/skills by filename alone.
This file exists so you only have to point Codex at one entry doc, not re-list the full workflow every time.
