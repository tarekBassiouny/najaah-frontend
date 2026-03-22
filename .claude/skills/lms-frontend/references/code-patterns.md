# Code Patterns

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
  [key: string]: unknown;
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

## Service Layer Pattern

```typescript
// src/features/[feature]/services/[entity].service.ts
import { http } from "@/lib/http";

type RawResponse = {
  data?: unknown;
  meta?: Record<string, unknown>;
  [key: string]: unknown;
};

function normalizeResponse(raw: RawResponse | undefined, fallback: ListEntityParams): EntityResponse {
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
    params: { page: params.page, per_page: params.per_page, search: params.search || undefined },
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
```

## React Query Hook Pattern

### List Hook
```typescript
export function useEntities(params: ListEntityParams, options?: UseEntitiesOptions) {
  return useQuery({
    queryKey: ["entities", params],
    queryFn: () => listEntities(params),
    placeholderData: (previous) => previous,
    ...options,
  });
}
```

### Mutation Hook
```typescript
export function useCreateEntity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createEntity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entities"] });
    },
  });
}
```

## Component Patterns

### Data Table
```typescript
"use client";
import { useState } from "react";
import { useEntities } from "../hooks/use-entities";

export function EntitiesTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const { data, isLoading, isError } = useEntities({ page, per_page: 15, search: search || undefined });

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error loading data</div>;

  return (
    <div className="space-y-4">
      <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
      <Table>...</Table>
      <Pagination currentPage={data?.page ?? 1} totalPages={data?.lastPage ?? 1} onPageChange={setPage} />
    </div>
  );
}
```

### Form with Zod
```typescript
"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const formSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
});

export function CreateEntityForm({ onSuccess }: { onSuccess?: () => void }) {
  const createMutation = useCreateEntity();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", status: "draft" },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    await createMutation.mutateAsync(values);
    form.reset();
    onSuccess?.();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <Button type="submit" disabled={createMutation.isPending}>Create</Button>
      </form>
    </Form>
  );
}
```
