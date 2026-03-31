# Architecture Audit — 2026-03-30

> Full codebase analysis of najaah-frontend: architecture, API patterns, state management, inconsistencies, and core patterns.

---

## 1. Frontend Architecture

### Stack

Next.js App Router + React 19 + TypeScript + Tailwind CSS + React Query v5

### Folder Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Auth pages (login, forgot/reset password)
│   ├── (dashboard)/        # Protected admin panel (AdminRouteGuard)
│   ├── (portal)/           # Student/parent portal
│   ├── providers.tsx       # Root QueryClient + auth sync
│   ├── tenant-provider.tsx # Tenant context via useSyncExternalStore
│   └── app-bootstrap-provider.tsx  # One-time tenant resolution
├── components/             # Shared UI (37+ components in ui/)
│   ├── ui/                 # button, card, dialog, table, etc.
│   ├── Layouts/            # header/, sidebar/ with their own contexts
│   └── marketing/          # SEO shells for landing pages
├── features/               # 41 feature modules
│   └── [feature]/
│       ├── types/          # TypeScript interfaces
│       ├── services/       # API calls via http client
│       ├── hooks/          # React Query hooks
│       ├── components/     # Feature-specific UI
│       └── context/        # Optional feature context
├── hooks/                  # 2 global hooks (use-click-outside, use-mobile)
├── lib/                    # 23 utility files (http, auth, tenant, tokens)
├── services/               # 2 root services (admin-auth, resolve)
└── types/                  # 7 shared type files (pagination, auth, etc.)
```

### Organizational Pattern

**Feature-Module Architecture** — each of the 41 features follows `types/ -> services/ -> hooks/ -> components/`. Shared concerns live in `src/lib/` (infrastructure) and `src/components/ui/` (design system).

### Scale

| Metric               | Count |
|-----------------------|-------|
| Feature modules       | 41    |
| Service files         | 40    |
| React Query hooks     | 68    |
| Shared UI components  | 37+   |
| Route groups          | 3     |
| Context providers     | 7     |
| Pages                 | 100+  |

---

## 2. API Call Handling

### HTTP Clients — Two Axios Instances

| Client       | File                   | Purpose                                                        |
|--------------|------------------------|----------------------------------------------------------------|
| `http`       | `src/lib/http.ts`      | Admin panel — auth token, X-Api-Key, X-Locale, token refresh   |
| `portalHttp` | `src/lib/portal-http.ts` | Student/parent portal — same interceptor pattern, role-based 401 redirect |

### Service Layer

40 service files across `src/services/` (2 root) and `src/features/*/services/` (38 feature-scoped).

**Service responsibilities:**
- Own a resource's CRUD + bulk endpoints
- Unwrap `data.data`, apply fallback defaults, normalize translations
- Use `buildBasePath(centerId?)` for scoped endpoints: `/api/v1/admin/courses` vs `/api/v1/admin/centers/{id}/courses`

### React Query Hooks

68 custom hooks wrap services following this pattern:

```ts
// Query
useQuery({ queryKey: ["resource", params], queryFn: () => service(params), placeholderData: (prev) => prev })

// Mutation
useMutation({ mutationFn: ..., onSuccess: () => queryClient.invalidateQueries(...) })
```

### Direct Axios Calls (Outside HTTP Clients)

3 intentional exceptions — all unauthenticated or special-purpose:

| File                                                        | Reason                         |
|-------------------------------------------------------------|--------------------------------|
| `src/services/resolve.service.ts`                           | No-auth center resolution      |
| `src/features/landing-page/services/landing-page-resolve.service.ts` | No-auth landing resolution     |
| `src/features/pdfs/services/pdfs.service.ts`                | Direct PUT to storage URL      |

### API Route Handlers

**None** — this is a pure frontend app. All calls go to an external backend.

### Endpoint Duplicates

**None found.** Each endpoint is called from exactly one service file.

---

## 3. State Management Patterns

### Server State — React Query

- `QueryClient` configured in `src/app/providers.tsx`
- `refetchOnWindowFocus: false`, custom retry (skip 401s)
- All data fetching: hooks -> services -> http client

### Module-Level Subscription Stores

| Store            | File                      | Mechanism                                          |
|------------------|---------------------------|----------------------------------------------------|
| Tenant           | `src/lib/tenant-store.ts` | `Set<Listener>` + `useSyncExternalStore` in `tenant-provider.tsx` |
| Auth permissions | `src/lib/auth-state.ts`   | Simple get/set module variable                     |

### React Context Providers (7)

| Context       | File                                              | Purpose                                       |
|---------------|---------------------------------------------------|-----------------------------------------------|
| Auth          | `features/auth/context/auth-context.tsx`          | Admin user + BroadcastChannel multi-tab sync  |
| Portal Auth   | `features/portal-auth/context/portal-auth-context.tsx` | Student/parent auth + role switching         |
| Locale        | `features/localization/locale-context.tsx`         | Language + RTL direction                      |
| Video Upload  | `features/videos/context/video-upload-context.tsx` | Concurrent TUS uploads with progress          |
| PDF Upload    | `features/pdfs/context/pdf-upload-context.tsx`     | PDF uploads with AbortController              |
| Modal         | `components/ui/modal-store.tsx`                    | Global modal/toast management                 |
| Sidebar       | `components/Layouts/sidebar/sidebar-context.tsx`   | Collapse state                                |

### Browser Storage

| Key                          | Storage                    | Purpose                          |
|------------------------------|----------------------------|----------------------------------|
| `access_token`, `remember_me`| localStorage / sessionStorage | Admin tokens (based on remember-me) |
| `portal_access_token`, `portal_refresh_token`, `portal_active_role` | localStorage | Portal tokens |
| `najaah.locale`              | localStorage               | Language preference               |
| `najaah.sidebar.collapsed`   | localStorage               | Sidebar state                    |

### Multi-Tab Synchronization

- `BroadcastChannel("auth")` for admin
- `BroadcastChannel("portal_auth")` for portal

### Third-Party State Libraries

**None.** No Redux, Zustand, Recoil, Jotai, or MobX.

---

## 4. Inconsistencies & Observations

### 4.1 Duplicated Admin/Portal Infrastructure

**Files affected:**
- `src/lib/token-storage.ts` vs `src/lib/portal-token-storage.ts`
- `src/lib/token-refresh.ts` vs `src/lib/portal-token-refresh.ts`
- `src/lib/http.ts` vs `src/lib/portal-http.ts`
- `features/auth/context/auth-context.tsx` vs `features/portal-auth/context/portal-auth-context.tsx`

**Assessment:** The portal versions are structurally identical to admin versions with minor adaptations (different storage keys, role-based redirects). Not a bug — but a consolidation opportunity if the two auth flows stabilize.

### 4.2 Direct Axios Imports in 3 Service Files

- `src/services/resolve.service.ts`
- `src/features/landing-page/services/landing-page-resolve.service.ts`
- `src/features/pdfs/services/pdfs.service.ts`

**Assessment:** Intentional (no-auth endpoints / direct storage upload), but breaks the convention that all calls go through the http client. Could be wrapped in a lightweight `publicHttp` client for consistency.

### 4.3 Root `src/services/` vs Feature `services/`

Two service files (`admin-auth.service.ts`, `resolve.service.ts`) live at the root level while the other 38 are in feature directories. `admin-auth.service.ts` arguably belongs in `features/auth/services/`.

### 4.4 Modal Store Naming

`src/components/ui/modal-store.tsx` uses React Context but is named "store", which could confuse with the subscription-store pattern in `tenant-store.ts`.

### 4.5 Complex Component-Level State

`src/features/course-assets/hooks/use-review-state.ts` manages 15+ `useState` variables. Candidate for `useReducer` or context extraction.

### 4.6 Orphaned `ai/` Directory

Contains historical agent configs from `.trae-cn/`, `.trae/`, `.agents/` — leftovers from migration to `.claude/`. Not used by the application. Safe to remove.

### 4.7 No Rule Violations

No violations detected against CLAUDE.md or AGENTS.md conventions.

---

## 5. Core Patterns

| #  | Pattern                        | Location                                | Description                                                       |
|----|--------------------------------|-----------------------------------------|-------------------------------------------------------------------|
| 1  | Feature Module                 | `src/features/*/`                       | `types -> services -> hooks -> components` per domain             |
| 2  | Service Layer                  | `*/services/*.service.ts`               | Axios calls, response normalization, scope-aware path building    |
| 3  | React Query Hook               | `*/hooks/use-*.ts`                      | `useQuery`/`useMutation` wrapping services, `placeholderData: previous` |
| 4  | Route Group Guards             | `(auth)`, `(dashboard)`, `(portal)`     | Layout-level auth + capability checks                             |
| 5  | Capability-Based Auth          | `src/lib/capabilities.ts`               | Route -> permission mapping checked in `AdminRouteGuard`          |
| 6  | Multi-Tenant Resolution        | `tenant-store.ts` + `tenant-provider.tsx` | Subdomain -> API key + center config at runtime                 |
| 7  | Dual HTTP Clients              | `http.ts`, `portal-http.ts`             | Interceptors for token injection, refresh, locale headers         |
| 8  | Proactive Token Refresh        | `token-refresh.ts`, `portal-token-refresh.ts` | JWT decode -> schedule refresh 2 min before expiry           |
| 9  | BroadcastChannel Sync          | Auth contexts + token storage           | Multi-tab token/logout synchronization                            |
| 10 | Module-Level Store             | `tenant-store.ts`, `auth-state.ts`      | Subscription pattern + `useSyncExternalStore` bridge              |
| 11 | Upload Context                 | Video + PDF contexts                    | Concurrent uploads with progress, pause/resume, abort             |
| 12 | Scoped API Paths               | All admin services                      | `buildBasePath(centerId?)` -> platform vs center-scoped endpoints |
| 13 | AI Agent Orchestration         | `.claude/skills/`, `.claude/agents/`    | Specialist skills coordinated by orchestrator agent               |
| 14 | Contract-Driven Development    | `docs/contracts/`, backend repo         | Frontend builds against backend contract docs with MSW mocks      |
| 15 | Localization                   | `features/localization/`                | Dual-language (en/ar) with RTL, `useTranslation` hook, JSON dictionaries |

---

## 6. AI/Agent Configuration

### `.claude/` Directory

- **3 agent definitions:** `orchestrator.md`, `feature-builder.md`, `reviewer.md`
- **7 specialist skills:** `lms`, `lms-orchestrator`, `lms-frontend`, `lms-qa`, `lms-review`, `lms-frontend-design`, `lms-pm`, `lms-backend-contracts`
- **Reference docs:** Execution patterns, handoff contracts, parallel playbook, code patterns, test patterns, review patterns

### Workflow

```
Discovery -> Working Memory -> Plan -> Approval -> Phase Review Gate -> Execution -> Verification -> Report
```

Orchestrator delegates to specialists. Mandatory phase review gates before implementation. Progress tracked via `docs/feature/*-progress.md`.

### `ai/` Directory (Orphaned)

Historical configs from `.trae-cn/`, `.trae/`, `.agents/`. Migrated to `.claude/`. Safe to clean up.
