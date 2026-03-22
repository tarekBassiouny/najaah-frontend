---
name: lms-frontend
description: Primary frontend implementation skill for the Najaah admin panel. Use for routes, pages, components, hooks, services, tenant-aware behavior, and backend contract integration.
---

# LMS Admin Panel - Frontend Engineer

## Context
Multi-tenant Next.js admin panel. Platform admin vs center admin scoped by subdomain. Feature modules in `src/features/`, React Query for data, capabilities-based route protection. For full context, read `.claude/skills/lms/SKILL.md`.

## When to Use This Skill
- Implementing new feature modules
- Creating React components following established patterns
- Writing React Query hooks and services
- Integrating with backend APIs
- Adding route protection and capability checks
- Form validation with Zod and react-hook-form

---

## Fast Feature Delivery

1. Find the existing page in `src/app/(dashboard)` or center-scoped variant under `src/app/(dashboard)/centers/[centerId]`.
2. Reuse the feature module under `src/features/<feature>` — extend `types`, `services`, `hooks`, `components`.
3. Keep page files thin: compose `PageHeader`, feature tables/forms, dialog state.
4. Keep API logic in services, query orchestration in hooks, tenant-aware behavior via `useTenant`.
5. If route is new or protected, update sidebar and capability rules in `src/components/Layouts/sidebar/data/index.ts` and `src/lib/capabilities.ts`.
6. Add smallest useful unit or integration coverage.

---

## Architecture

### Route Groups
```
src/app/(auth)/           # Authentication (login, logout)
src/app/(dashboard)/      # Protected admin pages
```

### Feature Module Pattern
```
src/features/[feature]/
  types/          # TypeScript interfaces
  services/       # API calls using http client
  hooks/          # React Query hooks
  components/     # Feature-specific components
  lib/            # Feature helpers (optional)
```

### Core Libraries
```
src/lib/http.ts            # Axios with auth, tenant, locale headers
src/lib/capabilities.ts    # Capability → backend permission mapping
src/lib/admin-response.ts  # Success/error normalization helpers
src/lib/tenant-store.ts    # Runtime tenant state
src/lib/token-storage.ts   # JWT token storage
```

---

## Repo-Specific Conventions

### Page Composition
- Pages own dialog/drawer state and render `PageHeader`
- Feature tables and forms live in `src/features/<feature>/components`
- Shell and protection in `src/app/(dashboard)/layout.tsx`

### Tenant-Aware UI
- Use `useTenant` from `@/app/tenant-provider` — access `centerId`, `centerSlug`, `isResolved`
- Reserve direct `tenant-store` access for infrastructure and tests

### Service Conventions
- Use `http` from `@/lib/http`
- Reuse `@/lib/admin-response` helpers for mutations
- Explicit scope context when data varies by center

### React Query Conventions
- Export feature-specific key factories (e.g., `studentKeys`)
- Include scope context in query keys for center-specific data
- Invalidate smallest stable key on mutation success

### Route Protection
- `AdminRouteGuard` enforces auth centrally
- Route capabilities from `src/components/Layouts/sidebar/data/index.ts`
- New routes need page file + sidebar/capability updates

### Multi-Tenancy
```typescript
import { useTenant } from "@/app/tenant-provider";
const tenant = useTenant();
const isPlatformAdmin = tenant.isResolved && !tenant.centerSlug;
```

---

## File Paths

### Core
```
src/app/tenant-provider.tsx                   # Tenant context
src/app/app-bootstrap-provider.tsx            # Host-based bootstrap
src/lib/http.ts                               # HTTP client
src/lib/capabilities.ts                       # Permissions
src/components/Layouts/sidebar/data/index.ts  # Sidebar + route rules
```

### Feature Modules
```
src/features/courses/  src/features/students/  src/features/centers/
src/features/videos/   src/features/pdfs/      src/features/enrollments/
```

---

## DO / DON'T

**DO:** Feature module pattern, normalize responses in services, React Query for server state, Zod for forms, capability checks, `PageHeader`, `useTenant`, `admin-response` helpers, strict TypeScript.

**DON'T:** Business logic in components, direct API calls from components, skip types, ignore loading/error states, hardcode URLs, skip capability checks.

---

## Read Next Only When Needed
- Code patterns (types, services, hooks, components): `references/code-patterns.md`
