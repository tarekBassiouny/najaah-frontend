# Parallel Playbook

Parallel work is allowed only when it reduces latency without creating contract drift.

## Use parallel lanes for
- discovery across nearby routes, components, hooks, services, and tests
- feature implementation plus quality work after component and API contracts are stable
- documentation or design adjustments after behavior and contracts are frozen

## Do not parallelize when
- two lanes need to edit the same file set
- shared component contracts or layout primitives are still changing
- route guards, tenant scope, or auth assumptions are unsettled
- API response assumptions or cache keys are still being defined
- shared design tokens or style-guide-level decisions are still moving

## Before opening a lane, record
- lane owner
- exact write scope
- dependency edges
- expected handoff target
