# LMS Admin Panel - Senior QA Engineer

## Purpose
Comprehensive testing knowledge base for the LMS Admin Panel. This skill provides Claude with complete context about testing patterns, tools, and standards for ensuring quality in the Next.js frontend application.

## When to Use This Skill
- Writing unit tests for components and hooks
- Writing integration tests with API mocking
- Creating test utilities and helpers
- Analyzing test coverage
- Debugging failing tests
- Setting up MSW handlers

---

## Testing Stack

```
Test Runner:     Vitest
Component Tests: React Testing Library
API Mocking:     MSW (Mock Service Worker)
Environment:     jsdom (for DOM simulation)
Assertions:      Vitest expect + jest-dom matchers
```

---

## Test Structure

### Directory Layout
```
tests/
├── setup/
│   ├── unit.tsx           # Unit test setup with providers
│   └── integration.ts     # Integration test setup with MSW
├── unit/
│   ├── components/        # Component tests
│   ├── hooks/             # Hook tests
│   └── services/          # Service tests
├── integration/
│   └── features/          # Integration tests by feature
└── mocks/
    └── handlers/          # MSW request handlers
```

### Test File Naming
```
[component-name].test.tsx   # Component tests
[hook-name].test.ts         # Hook tests
[service-name].test.ts      # Service tests
[feature].integration.test.tsx  # Integration tests
```

---

## Unit Test Patterns

### Component Test Pattern
```typescript
// tests/unit/components/Button.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Button } from "@/components/ui/button";

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

  it("is disabled when disabled prop is true", () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("applies variant classes correctly", () => {
    render(<Button variant="destructive">Delete</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("bg-destructive");
  });
});
```

### Hook Test Pattern
```typescript
// tests/unit/hooks/use-students.test.ts
import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useStudents } from "@/features/students/hooks/use-students";
import * as studentsService from "@/features/students/services/students.service";

vi.mock("@/features/students/services/students.service");

describe("useStudents", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("fetches students with correct params", async () => {
    const mockData = {
      items: [{ id: 1, name: "John Doe" }],
      page: 1,
      perPage: 15,
      total: 1,
      lastPage: 1,
    };

    vi.mocked(studentsService.listStudents).mockResolvedValue(mockData);

    const { result } = renderHook(
      () => useStudents({ page: 1, per_page: 15 }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockData);
    expect(studentsService.listStudents).toHaveBeenCalledWith({
      page: 1,
      per_page: 15,
    });
  });

  it("handles error states", async () => {
    vi.mocked(studentsService.listStudents).mockRejectedValue(
      new Error("Network error")
    );

    const { result } = renderHook(
      () => useStudents({ page: 1, per_page: 15 }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});
```

### Service Test Pattern
```typescript
// tests/unit/services/students.service.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { listStudents, getStudent } from "@/features/students/services/students.service";
import { http } from "@/lib/http";

vi.mock("@/lib/http");

describe("studentsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("listStudents", () => {
    it("calls API with correct params and normalizes response", async () => {
      const mockResponse = {
        data: {
          data: [{ id: 1, name: "John" }],
          meta: {
            current_page: 1,
            per_page: 15,
            total: 1,
            last_page: 1,
          },
        },
      };

      vi.mocked(http.get).mockResolvedValue(mockResponse);

      const result = await listStudents({ page: 1, per_page: 15 });

      expect(http.get).toHaveBeenCalledWith("/api/v1/admin/students", {
        params: { page: 1, per_page: 15, search: undefined },
      });

      expect(result).toEqual({
        items: [{ id: 1, name: "John" }],
        page: 1,
        perPage: 15,
        total: 1,
        lastPage: 1,
      });
    });
  });
});
```

---

## Integration Test Patterns

### MSW Handler Setup
```typescript
// tests/mocks/handlers/students.ts
import { http, HttpResponse } from "msw";

export const studentsHandlers = [
  http.get("/api/v1/admin/students", ({ request }) => {
    const url = new URL(request.url);
    const page = url.searchParams.get("page") || "1";
    const search = url.searchParams.get("search");

    const students = [
      { id: 1, name: "John Doe", email: "john@example.com" },
      { id: 2, name: "Jane Smith", email: "jane@example.com" },
    ];

    const filtered = search
      ? students.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()))
      : students;

    return HttpResponse.json({
      success: true,
      data: {
        data: filtered,
        meta: {
          current_page: parseInt(page),
          per_page: 15,
          total: filtered.length,
          last_page: 1,
        },
      },
    });
  }),

  http.get("/api/v1/admin/students/:id", ({ params }) => {
    const { id } = params;
    return HttpResponse.json({
      success: true,
      data: {
        id: parseInt(id as string),
        name: "John Doe",
        email: "john@example.com",
      },
    });
  }),

  http.post("/api/v1/admin/students", async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      success: true,
      data: {
        id: 999,
        ...body,
      },
    }, { status: 201 });
  }),

  http.delete("/api/v1/admin/students/:id", () => {
    return HttpResponse.json({ success: true }, { status: 200 });
  }),
];
```

### Integration Test with Full Stack
```typescript
// tests/integration/features/students.integration.test.tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { setupServer } from "msw/node";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { studentsHandlers } from "../../mocks/handlers/students";
import { StudentsTable } from "@/features/students/components/StudentsTable";

const server = setupServer(...studentsHandlers);

describe("Students Integration", () => {
  let queryClient: QueryClient;

  beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
  afterEach(() => {
    server.resetHandlers();
    queryClient.clear();
  });
  afterAll(() => server.close());

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    );
  };

  it("loads and displays students", async () => {
    renderWithProviders(<StudentsTable />);

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    });
  });

  it("filters students by search", async () => {
    renderWithProviders(<StudentsTable />);

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText("Search...");
    fireEvent.change(searchInput, { target: { value: "john" } });

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.queryByText("Jane Smith")).not.toBeInTheDocument();
    });
  });

  it("handles pagination", async () => {
    renderWithProviders(<StudentsTable />);

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    // Check pagination controls exist
    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });
});
```

---

## Test Setup Files

### Unit Test Setup
```typescript
// tests/setup/unit.tsx
import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

// Mock tenant store
vi.mock("@/lib/tenant-store", () => ({
  getTenant: () => ({ type: "center", centerId: 1 }),
  TenantType: { PLATFORM: "platform", CENTER: "center" },
}));
```

### Integration Test Setup
```typescript
// tests/setup/integration.ts
import "@testing-library/jest-dom";
import { server } from "../mocks/server";

beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### MSW Server Setup
```typescript
// tests/mocks/server.ts
import { setupServer } from "msw/node";
import { studentsHandlers } from "./handlers/students";
import { coursesHandlers } from "./handlers/courses";

export const server = setupServer(
  ...studentsHandlers,
  ...coursesHandlers,
);
```

---

## Vitest Configuration

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/setup/unit.tsx"],
    include: ["tests/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "tests/",
        "**/*.d.ts",
        "**/*.config.*",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

---

## Testing Checklist

### Component Testing
- [ ] Renders correctly with default props
- [ ] Handles all prop variations
- [ ] User interactions work correctly
- [ ] Loading states display correctly
- [ ] Error states display correctly
- [ ] Accessibility (a11y) compliance
- [ ] Responsive behavior (if applicable)

### Hook Testing
- [ ] Returns correct initial state
- [ ] Fetches data on mount (for queries)
- [ ] Handles loading state
- [ ] Handles error state
- [ ] Handles success state
- [ ] Refetches when params change
- [ ] Cache invalidation works (for mutations)

### Service Testing
- [ ] Calls correct API endpoint
- [ ] Sends correct request params
- [ ] Normalizes response data
- [ ] Handles error responses
- [ ] Handles empty responses

### Integration Testing
- [ ] Full user flow works end-to-end
- [ ] API mocking covers all scenarios
- [ ] Error scenarios handled gracefully
- [ ] Loading states visible during requests
- [ ] Data updates after mutations

---

## Coverage Requirements

### Minimum Coverage
- **Overall:** 80%
- **Critical paths:** 90% (auth, payments, enrollment)
- **Utilities:** 100%

### Coverage Commands
```bash
# Run tests with coverage
npm run test -- --coverage

# View coverage report
open coverage/index.html

# Check specific file coverage
npx vitest run --coverage tests/unit/hooks/use-students.test.ts
```

---

## Debugging Tips

### Common Issues

**Test hangs or times out:**
- Check for unresolved promises
- Ensure MSW handlers return responses
- Increase timeout for async operations

**Query not fetching:**
- Verify QueryClient is in wrapper
- Check that `enabled` option is true
- Ensure MSW handler matches URL

**Mock not working:**
- Verify `vi.mock()` is at top of file
- Check mock module path matches import
- Call `vi.clearAllMocks()` in beforeEach

### Debug Mode
```typescript
// Enable verbose logging
import { screen } from "@testing-library/react";

// Print current DOM state
screen.debug();

// Print specific element
screen.debug(screen.getByRole("button"));
```

---

## Commands

```bash
# Run all tests
npm run test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run tests with UI
npm run test:ui

# Run single test file
npx vitest run tests/unit/path/to/test.test.ts

# Run tests in watch mode
npx vitest watch

# Run tests matching pattern
npx vitest run --reporter=verbose -t "should fetch students"
```

---

## Best Practices

### DO
- Use `screen` queries over container queries
- Prefer `getByRole` for accessible queries
- Test behavior, not implementation
- Mock at API boundary (http layer)
- Use meaningful test descriptions
- Clean up after each test

### DON'T
- Test implementation details
- Mock too many internals
- Use arbitrary timeouts
- Skip error case testing
- Write tests that depend on order
- Ignore flaky tests (fix them!)

---

## Related Documentation
- Vitest: https://vitest.dev/
- React Testing Library: https://testing-library.com/react
- MSW: https://mswjs.io/
- jest-dom matchers: https://github.com/testing-library/jest-dom
