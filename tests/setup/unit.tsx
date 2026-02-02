import "@testing-library/jest-dom/vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, type RenderOptions } from "@testing-library/react";
import React, { type PropsWithChildren } from "react";
import { vi, beforeAll } from "vitest";

export const routerMocks = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  prefetch: vi.fn(),
};

vi.mock("next/navigation", () => ({
  useRouter: () => routerMocks,
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
}));

// Mock window.location to prevent jsdom "Not implemented: navigation" errors
// jsdom throws when code tries to navigate, so we replace the entire location object
export const locationMocks = {
  replace: vi.fn(),
  assign: vi.fn(),
  reload: vi.fn(),
};

beforeAll(() => {
  if (typeof window !== "undefined") {
    const originalLocation = window.location;
    // Delete the original location and replace with a mock that preserves properties
    // @ts-expect-error - Intentionally deleting location for mocking
    delete window.location;
    // @ts-expect-error - Intentionally replacing location with partial mock
    window.location = {
      ...originalLocation,
      replace: locationMocks.replace,
      assign: locationMocks.assign,
      reload: locationMocks.reload,
    };
  }
});

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

export function renderWithQueryProvider(
  ui: React.ReactElement,
  options?: RenderOptions,
) {
  const queryClient = createQueryClient();
  const Wrapper: React.FC<PropsWithChildren> = ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return render(ui, { wrapper: Wrapper, ...options });
}
