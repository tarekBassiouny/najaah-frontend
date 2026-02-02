# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev          # Start development server
npm run build        # Production build
npm run start        # Start production server

# Code Quality
npm run lint         # ESLint check
npm run type-check   # TypeScript type checking
npm run format:check # Prettier format check

# Testing
npm run test              # Run all tests
npm run test:unit         # Run unit tests only
npm run test:integration  # Run integration tests only
npm run test:ui           # Run tests with Vitest UI
npx vitest run tests/unit/path/to/test.test.ts  # Run a single test file
```

## Architecture

### Multi-Tenant Admin Panel

This is a Learning Management System (LMS) admin panel with multi-tenant support:
- **Platform Admin** (`admin.*` subdomain): Manages all centers, has full platform control
- **Center Admin** (other subdomains): Manages a specific center's resources

Tenant resolution happens at runtime based on subdomain, affecting sidebar navigation and API key headers.

### Route Groups

- `src/app/(auth)/` - Authentication pages (login, logout)
- `src/app/(dashboard)/` - Protected admin pages wrapped with `AdminRouteGuard`

### Feature Module Pattern

Features are organized in `src/features/[feature-name]/` with:
- `types/` - TypeScript interfaces
- `services/` - API calls using the `http` client
- `hooks/` - React Query hooks wrapping services
- `components/` - Feature-specific components

Example: `src/features/centers/` contains `types/center.ts`, `services/centers.service.ts`, `hooks/use-centers.ts`, `components/CentersTable.tsx`

### Core Libraries

- **`src/lib/http.ts`**: Axios instance with auth token refresh, tenant API key injection, and locale headers
- **`src/lib/capabilities.ts`**: Permission-based access control mapping capabilities to backend permissions
- **`src/lib/tenant-store.ts`**: Runtime tenant state management with subscription pattern
- **`src/lib/token-storage.ts`**: JWT token storage and retrieval

### State Management

- **React Query** (`@tanstack/react-query`): Server state and data fetching
- **React Context**: App-level state (theme, sidebar, tenant)
- **Module-level stores**: `tenant-store.ts` and `auth-state.ts` use subscription pattern for cross-component sync

### Authorization

`AdminRouteGuard` protects dashboard routes by:
1. Verifying access token exists
2. Fetching current admin user via `/api/v1/admin/auth/me`
3. Checking route-specific capabilities against user permissions

Route-to-capability mapping is defined in `AdminRouteGuard.tsx` (`ROUTE_CAPABILITIES`).

### Testing Structure

- `tests/unit/` - Unit tests with jsdom environment
- `tests/integration/` - Integration tests with MSW for API mocking
- `tests/setup/unit.tsx` - Unit test setup
- `tests/setup/integration.ts` - Integration test setup with MSW server

## Key Patterns

### API Service Pattern
```typescript
// Services return normalized data, handle response structure
export async function listItems(params): Promise<PaginatedResponse<Item>> {
  const { data } = await http.get("/api/v1/admin/items", { params });
  return { items: data?.data ?? [], meta: { ... } };
}
```

### React Query Hook Pattern
```typescript
export function useItems(params, options?) {
  return useQuery({
    queryKey: ["items", params],
    queryFn: () => listItems(params),
    placeholderData: (previous) => previous,
    ...options,
  });
}
```

## Requirements

- Node.js >=20 <21
