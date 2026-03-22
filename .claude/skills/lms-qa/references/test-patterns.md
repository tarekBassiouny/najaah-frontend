# Test Patterns

## Component Test
```typescript
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

describe("Button", () => {
  it("renders with correct text", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button")).toHaveTextContent("Click me");
  });
  it("calls onClick when clicked", () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    fireEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

## Hook Test
```typescript
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("@/features/students/services/students.service");

describe("useStudents", () => {
  let queryClient: QueryClient;
  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    vi.clearAllMocks();
  });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("fetches students", async () => {
    vi.mocked(studentsService.listStudents).mockResolvedValue(mockData);
    const { result } = renderHook(() => useStudents({ page: 1, per_page: 15 }), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockData);
  });
});
```

## Service Test
```typescript
vi.mock("@/lib/http");

describe("studentsService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls API with correct params", async () => {
    vi.mocked(http.get).mockResolvedValue({ data: { data: [...], meta: {...} } });
    const result = await listStudents({ page: 1, per_page: 15 });
    expect(http.get).toHaveBeenCalledWith("/api/v1/admin/students", { params: { page: 1, per_page: 15, search: undefined } });
  });
});
```

## MSW Handler
```typescript
import { http, HttpResponse } from "msw";

export const handlers = [
  http.get("/api/v1/admin/students", ({ request }) => {
    const url = new URL(request.url);
    return HttpResponse.json({
      success: true,
      data: { data: [{ id: 1, name: "John" }], meta: { current_page: 1, per_page: 15, total: 1, last_page: 1 } },
    });
  }),
];
```

## Integration Test
```typescript
import "../../setup/integration";
import { screen, waitFor } from "@testing-library/react";
import { renderWithQueryProvider } from "../../unit/setupHelpers";
import { setAuthPermissions } from "@/lib/auth-state";
import { setTenantState } from "@/lib/tenant-store";

describe("feature (integration)", () => {
  beforeEach(() => {
    setAuthPermissions(["student.manage"]);
    setTenantState({ centerId: 1, centerName: "Center A" });
  });
  it("renders and interacts", async () => {
    renderWithQueryProvider(<Component />);
    await waitFor(() => expect(screen.getByText("data")).toBeInTheDocument());
  });
});
```

## Test Setup
```typescript
// tests/setup/unit.tsx — already provides LocaleProvider, QueryClient (no retry), jest-dom matchers
// tests/setup/integration.ts — wires MSW server
// Use renderWithQueryProvider from tests/unit/setupHelpers.ts
// Seed tenant: setTenantState({ centerId: 1, centerName: "Center A" })
// Seed permissions: setAuthPermissions(["student.manage"])
```
