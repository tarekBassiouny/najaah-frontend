# FRONTEND_CODEX_INSTRUCTIONS.md

### Next.js 16 Admin Panel — Engineering & Codegen Standard

---

# 1. Purpose of This Document

This document defines the official, strict rules for generating code for the LMS Admin Panel using Codex/GPT-based code generation.

It ensures:

* Clean architecture
* SOLID principles
* Reusable UI components
* Reusable API/data layers
* Consistent folder structure
* TypeScript correctness
* Template-compatible layout
* Enterprise-level code quality
* Full reproducibility
* GitHub CI validation

Codex must always follow this document when generating any frontend code.

---

# 2. Tech Stack & Architecture

### Framework

* Next.js 16 (App Router)
* TypeScript (strict mode)
* React 18 server + client components
* TailwindCSS
* shadcn/ui component system

### State & API

* React Query (TanStack Query)
* Axios (withCredentials=true)
* Centralized API endpoint registry
* Per-feature API services
* Per-feature React Query hooks

### Structure

```
src/
  app/
  components/
  lib/
  services/
  features/
    centers/
    users/
    courses/
    videos/
    pdfs/
    enrollments/
    settings/
  types/
  providers/
docs/
```

---

# 3. General Rules for Codex

* Never duplicate components; reuse existing ones.
* Every file must have a single responsibility (SRP).
* Follow SOLID principles.
* Always use TypeScript interfaces.
* Always reuse template layout & shadcn/ui.
* Forms must use React Hook Form + Zod + shadcn Form.
* All API calls must go through services + React Query hooks.
* No backend code generation.

---

# 4. API Client Rules

Use Axios client:

```
import axios from "axios";
export const http = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  headers: { Accept: "application/json" },
});
```

---

# 5. API Endpoint Registry

Endpoints must be centrally declared in `src/services/endpoints.ts`.
Example:

```
export const endpoints = {
  admin: {
    login: "/api/v1/admin/auth/login",
    logout: "/api/v1/admin/auth/logout",
    me: "/api/v1/admin/auth/me",
  },
  auth: {
    sendOtp: "/api/v1/auth/send-otp",
    verifyOtp: "/api/v1/auth/verify",
    refresh: "/api/v1/auth/refresh",
  },
};
```

---

# 6. API Services

Per-feature services in:

```
src/features/<feature>/services/
```

Example:

```
export const CentersService = {
  list: () => http.get(endpoints.centers.list),
  create: (payload) => http.post(endpoints.centers.create, payload),
};
```

---

# 7. React Query Hooks

```
src/features/<feature>/hooks/
```

Example:

```
export function useCentersList() {
  return useQuery({ queryKey: ["centers"], queryFn: CentersService.list });
}
```

---

# 8. Pages (Server Components)

Server components must:

* Render layouts
* Redirect unauthenticated users via `me()`
* Use suspended components

---

# 9. UI Components (Client Components)

All forms, tables, dialogs → client components.
Use:

* shadcn/ui
* Tailwind
* Zod
* React Hook Form

---

# 10. Authentication Requirements

Use endpoints:

* POST `/api/v1/admin/auth/login`
* GET `/api/v1/admin/auth/me`
* POST `/api/v1/admin/auth/logout`

Protected routes must redirect if `me()` fails.

---

# 11. Reusable Components

Codex must ALWAYS reuse:

* shadcn Form
* Input
* Button
* Dialog
* Table
* Card

Only create new components when absolutely necessary.

---

# 12. GitHub Workflow Requirements

CI file path:

```
.github/workflows/frontend-ci.yml
```

Must include:

* Install deps
* Type check
* Lint
* Test
* Build
* Auto tagging on main

Example:

```
name: Frontend CI
on:
  push: { branches: ["main"] }
  pull_request: { branches: ["main"] }
jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run type-check
      - run: npm run lint
      - run: npm test
      - run: npm run build
      - name: Create Git Tag
        if: github.ref == 'refs/heads/main'
        run: |
          TAG="v$(date +'%Y.%m.%d.%H%M')"
          git tag $TAG
          git push origin $TAG
```

---

# 13. Testing Rules

Unit tests:

* Services
* Hooks (React Query)
* Components (Vitest + Testing Library)

Integration tests:

* Routing
* Forms
* API calls (MSW)

---

# 14. Codex Output Requirements

Codex MUST:

* Include full file paths
* Use complete code blocks
* Generate production-ready code
* Require TypeScript strict typing
* Follow Next.js 16 App Router
* Use Tailwind & shadcn
* Follow the folder structure exactly

---

# 15. Codex Task Template

When using Codex, always write tasks as:

```
Using the instructions in /docs/FRONTEND_CODEX_INSTRUCTIONS.md,
generate the following feature:
[TASK HERE]
```

Examples:

```
Generate Centers CRUD module.
Generate Admin Login page.
Generate Users list with pagination.
Generate Course Builder UI.
```
