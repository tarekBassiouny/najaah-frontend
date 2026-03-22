# Execution Patterns

## Plan Template

```text
OBJECTIVE
- one sentence on the requested outcome

WORKING MEMORY
- scope
- invariants
- ownership
- key dependencies

PHASES
- Architecture: routing, component boundaries, shared state, app-shell decisions
- Features: pages, components, hooks, forms, guards, user flows
- API Integration: services, request/response handling, query behavior, capability alignment
- Quality: unit/integration/e2e tests, lint, type-check, review pass
- Design: style-guide alignment, responsive refinements, interaction polish
- Documentation: skill docs, feature notes, local references

RISKS
- auth
- tenant scope
- contract compatibility
- localization
- responsive behavior
- design-system consistency

VERIFICATION
- tests or checks you will run
```

## Default Feature Slice

For standard admin features, prefer this implementation order:
1. page or route entry in `src/app/(dashboard)` or `src/app/(dashboard)/centers/[centerId]`
2. feature module changes in `src/features/<feature>`
3. sidebar or capability updates in `src/components/Layouts/sidebar/data/index.ts` and `src/lib/capabilities.ts`
4. unit or integration coverage in `tests/unit` and `tests/integration`
