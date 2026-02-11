# LMS Admin Panel - Senior Frontend Engineer

## Purpose
Comprehensive knowledge base for implementing frontend features in the LMS Admin Panel. This skill provides Claude with complete context about the project architecture, React patterns, and development standards for Next.js 16 implementation.

## When to Use This Skill
- Implementing new feature modules
- Creating React components following established patterns
- Writing React Query hooks and services
- Integrating with backend APIs
- Adding route protection and capability checks
- Form validation with Zod and react-hook-form

---

## Project Overview

**LMS Admin Panel** is a multi-tenant admin interface for the Najaah Learning Management System.

### Core Characteristics
- **Multi-tenant SaaS**: Platform admin vs Center admin based on subdomain
- **Next.js 16 App Router**: Server and client components
- **TypeScript Strict Mode**: Full type safety
- **Tailwind CSS**: Utility-first styling
- **React Query**: Server state management
- **Feature Module Pattern**: Organized by domain

### Tech Stack
```
Framework:  Next.js 16 (App Router)
Language:   TypeScript 5.x (strict mode)
Styling:    Tailwind CSS + shadcn/ui components
State:      React Query (@tanstack/react-query)
Forms:      react-hook-form + Zod validation
HTTP:       Axios (via custom http client)
Testing:    Vitest + React Testing Library + MSW
```

---

## Architecture

### Route Groups
```
src/app/
├── (auth)/           # Authentication pages (login, logout)
│   ├── login/
│   └── logout/
└── (dashboard)/      # Protected admin pages
    ├── dashboard/
    ├── courses/
    ├── students/
    ├── enrollments/
    └── ...
```

### Feature Module Pattern
```
src/features/[feature-name]/
├── types/
│   └── [entity].ts           # TypeScript interfaces
├── services/
│   └── [entity].service.ts   # API calls using http client
├── hooks/
│   └── use-[entity].ts       # React Query hooks
└── components/
    └── [Component].tsx       # Feature-specific components
```

### Core Libraries
```
src/lib/
├── http.ts           # Axios instance with auth, tenant, locale headers
├── capabilities.ts   # Permission-based access control
├── tenant-store.ts   # Runtime tenant state (Platform vs Center)
└── token-storage.ts  # JWT token storage and retrieval
```

---

## Type Definition Pattern

### Entity Types
```typescript
// src/features/[feature]/types/[entity].ts

export type Entity = {
  id: string | number;
  name: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;  // For API flexibility
};

export type ListEntityParams = {
  page: number;
  per_page: number;
  search?: string;
  status?: string;
};

export type EntityResponse = {
  items: Entity[];
  page: number;
  perPage: number;
  total: number;
  lastPage: number;
};
```

### Paginated Response Type
```typescript
// src/types/pagination.ts
export type PaginatedResponse<T> = {
  items: T[];
  page: number;
  perPage: number;
  total: number;
  lastPage: number;
};
```

---

## Service Layer Pattern

### Standard Service Structure
```typescript
// src/features/[feature]/services/[entity].service.ts
import { http } from "@/lib/http";

export type Entity = { ... };
export type ListEntityParams = { ... };
export type EntityResponse = { ... };

type RawResponse = {
  data?: unknown;
  meta?: Record<string, unknown>;
  [key: string]: unknown;
};

function normalizeResponse(
  raw: RawResponse | undefined,
  fallback: ListEntityParams,
): EntityResponse {
  const container = raw && typeof raw === "object" ? raw : {};
  const dataNode = (container.data ?? container) as any;
  const items = Array.isArray(dataNode?.data)
    ? (dataNode.data as Entity[])
    : Array.isArray(dataNode)
      ? (dataNode as Entity[])
      : [];

  const meta = (dataNode?.meta ?? container.meta) ?? {};

  return {
    items,
    page: Number(meta.current_page ?? fallback.page),
    perPage: Number(meta.per_page ?? fallback.per_page),
    total: Number(meta.total ?? items.length),
    lastPage: Number(meta.last_page ?? 1),
  };
}

export async function listEntities(params: ListEntityParams) {
  const { data } = await http.get<RawResponse>("/api/v1/admin/entities", {
    params: {
      page: params.page,
      per_page: params.per_page,
      search: params.search || undefined,
    },
  });
  return normalizeResponse(data, params);
}

export async function getEntity(id: string | number) {
  const { data } = await http.get<{ data: Entity }>(`/api/v1/admin/entities/${id}`);
  return data?.data;
}

export async function createEntity(payload: Partial<Entity>) {
  const { data } = await http.post<{ data: Entity }>("/api/v1/admin/entities", payload);
  return data?.data;
}

export async function updateEntity(id: string | number, payload: Partial<Entity>) {
  const { data } = await http.put<{ data: Entity }>(`/api/v1/admin/entities/${id}`, payload);
  return data?.data;
}

export async function deleteEntity(id: string | number) {
  await http.delete(`/api/v1/admin/entities/${id}`);
}
```

---

## React Query Hook Pattern

### List Hook
```typescript
// src/features/[feature]/hooks/use-[entities].ts
import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { listEntities, type ListEntityParams, type EntityResponse } from "../services/entity.service";
import type { PaginatedResponse } from "@/types/pagination";
import type { Entity } from "../types/entity";

type UseEntitiesOptions = Omit<
  UseQueryOptions<PaginatedResponse<Entity>>,
  "queryKey" | "queryFn"
>;

export function useEntities(
  params: ListEntityParams,
  options?: UseEntitiesOptions,
) {
  return useQuery({
    queryKey: ["entities", params],
    queryFn: () => listEntities(params),
    placeholderData: (previous) => previous,
    ...options,
  });
}
```

### Single Entity Hook
```typescript
export function useEntity(id: string | number, options?: UseEntityOptions) {
  return useQuery({
    queryKey: ["entity", id],
    queryFn: () => getEntity(id),
    enabled: !!id,
    ...options,
  });
}
```

### Mutation Hook
```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useCreateEntity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createEntity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entities"] });
    },
  });
}

export function useUpdateEntity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string | number; payload: Partial<Entity> }) =>
      updateEntity(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["entities"] });
      queryClient.invalidateQueries({ queryKey: ["entity", id] });
    },
  });
}

export function useDeleteEntity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteEntity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entities"] });
    },
  });
}
```

---

## Component Patterns

### Data Table Component
```typescript
"use client";

import { useState } from "react";
import { useEntities } from "../hooks/use-entities";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";

export function EntitiesTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading, isError } = useEntities({
    page,
    per_page: 15,
    search: search || undefined,
  });

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error loading data</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Input
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.items.map((entity) => (
            <TableRow key={entity.id}>
              <TableCell>{entity.id}</TableCell>
              <TableCell>{entity.name}</TableCell>
              <TableCell>{entity.status}</TableCell>
              <TableCell>
                <Button variant="ghost" size="sm">Edit</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Pagination
        currentPage={data?.page ?? 1}
        totalPages={data?.lastPage ?? 1}
        onPageChange={setPage}
      />
    </div>
  );
}
```

### Form Component with Zod
```typescript
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateEntity } from "../hooks/use-entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const formSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  description: z.string().optional(),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
});

type FormValues = z.infer<typeof formSchema>;

export function CreateEntityForm({ onSuccess }: { onSuccess?: () => void }) {
  const createMutation = useCreateEntity();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      status: "draft",
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      await createMutation.mutateAsync(values);
      form.reset();
      onSuccess?.();
    } catch (error) {
      // Handle error
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? "Creating..." : "Create"}
        </Button>
      </form>
    </Form>
  );
}
```

---

## Route Protection

### AdminRouteGuard Integration
```typescript
// src/features/auth/components/AdminRouteGuard.tsx

// Route-to-capability mapping
const ROUTE_CAPABILITIES: Record<string, string[]> = {
  "/dashboard": [],
  "/courses": ["courses.list"],
  "/courses/create": ["courses.create"],
  "/students": ["students.list"],
  "/enrollments": ["enrollments.list"],
};
```

### Adding New Protected Route
1. Add route to `ROUTE_CAPABILITIES` in `AdminRouteGuard.tsx`
2. Map capability to backend permission in `src/lib/capabilities.ts`
3. Ensure backend permission exists

---

## Multi-Tenancy

### Tenant Context
```typescript
// Access current tenant
import { getTenant, TenantType } from "@/lib/tenant-store";

const tenant = getTenant();
if (tenant.type === TenantType.PLATFORM) {
  // Platform admin view (all centers)
} else {
  // Center admin view (single center)
}
```

### Conditional UI
```typescript
import { getTenant, TenantType } from "@/lib/tenant-store";

export function NavigationMenu() {
  const tenant = getTenant();
  const isPlatformAdmin = tenant.type === TenantType.PLATFORM;

  return (
    <nav>
      {isPlatformAdmin && <Link href="/centers">Manage Centers</Link>}
      <Link href="/courses">Courses</Link>
      <Link href="/students">Students</Link>
    </nav>
  );
}
```

---

## File Paths Reference

### Core
```
src/lib/http.ts           # HTTP client with interceptors
src/lib/capabilities.ts   # Permission mappings
src/lib/tenant-store.ts   # Tenant state management
src/types/pagination.ts   # Shared pagination types
```

### Feature Modules
```
src/features/courses/     # Course management
src/features/students/    # Student management
src/features/centers/     # Center management (platform only)
src/features/videos/      # Video management
src/features/pdfs/        # PDF management
src/features/enrollments/ # Enrollment management
src/features/instructors/ # Instructor management
```

### Components
```
src/components/ui/        # shadcn/ui base components
src/components/Layouts/   # Layout components (sidebar, header)
src/components/Tables/    # Reusable table components
src/components/Forms/     # Reusable form components
```

---

## Commands

```bash
# Development
npm run dev          # Start development server

# Code Quality
npm run lint         # ESLint check
npm run type-check   # TypeScript type checking
npm run format:check # Prettier format check

# Testing
npm run test              # Run all tests
npm run test:unit         # Run unit tests only
npm run test:integration  # Run integration tests only
```

---

## Best Practices

### DO
- Use feature module pattern for new domains
- Normalize API responses in services
- Use React Query for all server state
- Apply Zod validation for forms
- Check capabilities before rendering protected features
- Use TypeScript strict mode

### DON'T
- Put business logic in components
- Call APIs directly from components
- Skip type definitions
- Ignore loading and error states
- Hardcode URLs or API paths
- Skip capability checks for protected features

---

## Related Documentation
- Backend API: `/Users/tarekbassiouny/projects/najaah/backend/docs/`
- Backend Skills: `/Users/tarekbassiouny/projects/najaah/backend/.claude/skills/`
- Component Library: shadcn/ui documentation
