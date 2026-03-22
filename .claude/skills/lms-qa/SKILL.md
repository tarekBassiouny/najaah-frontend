---
name: lms-qa
description: Frontend testing and validation skill for the Najaah admin panel. Use for unit and integration coverage, MSW setup, regression checks, and targeted validation commands.
---

# LMS Admin Panel - QA Engineer

## Context
Multi-tenant Next.js admin panel. Feature modules in `src/features/`, React Query for data. Tests: Vitest + React Testing Library + MSW. For full context, read `.claude/skills/lms/SKILL.md`.

## When to Use This Skill
- Writing unit tests for components and hooks
- Writing integration tests with API mocking
- Creating test utilities and helpers
- Debugging failing tests
- Setting up MSW handlers

---

## Testing Stack
```
Test Runner:     Vitest
Component Tests: React Testing Library
API Mocking:     MSW (Mock Service Worker)
Environment:     jsdom
Assertions:      Vitest expect + jest-dom matchers
```

## Test Structure
```
tests/
  setup/unit.tsx           # Providers, QueryClient (no retry), jest-dom
  setup/integration.ts     # MSW server lifecycle
  unit/setupHelpers.ts     # renderWithQueryProvider
  unit/components/         # Shared component tests
  unit/features/           # Feature-specific tests
  unit/lib/                # Library tests
  unit/services/           # Service tests
  integration/msw/         # MSW handlers and server
```

## Repo-Specific Accelerators

- `renderWithQueryProvider` from `tests/unit/setupHelpers.ts` for most tests
- `tests/setup/unit.tsx` mocks `next/navigation`, provides `LocaleProvider`, no-retry QueryClient
- `tests/setup/integration.ts` wires MSW server — extend `tests/integration/msw/handlers.ts`
- Seed tenant with `setTenantState` from `@/lib/tenant-store`
- Seed permissions with `setAuthPermissions` from `@/lib/auth-state`
- Mock `http` methods directly in service tests
- Update `getRouteCapabilities` tests when route rules change

## Testing Checklist

### Components
- [ ] Renders with default props
- [ ] User interactions work
- [ ] Loading/error states display
- [ ] Accessibility (a11y) compliance

### Hooks
- [ ] Correct initial state
- [ ] Loading/error/success states
- [ ] Refetches on param change
- [ ] Cache invalidation for mutations

### Services
- [ ] Correct API endpoint called
- [ ] Correct request params
- [ ] Response normalization
- [ ] Error handling

### Integration
- [ ] Full user flow end-to-end
- [ ] MSW covers all scenarios
- [ ] Data updates after mutations

## Coverage
- Overall: 80%, Critical paths (auth, enrollment): 90%, Utilities: 100%

## Commands
```bash
npm run test              # All tests
npm run test:unit         # Unit only
npm run test:integration  # Integration only
npx vitest run tests/unit/path/to/test.test.ts  # Single file
```

## DO / DON'T

**DO:** `screen` queries, `getByRole`, test behavior not implementation, mock at API boundary, meaningful descriptions, cleanup.

**DON'T:** Test implementation details, mock internals, arbitrary timeouts, skip error cases, order-dependent tests, ignore flaky tests.

## Read Next Only When Needed
- Test code patterns (component, hook, service, MSW, integration): `references/test-patterns.md`
