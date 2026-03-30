import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePortalLogout } from "@/features/portal-auth/hooks/use-portal-logout";
import { portalTokenStorage } from "@/lib/portal-token-storage";
import {
  parentLogout,
  studentLogout,
} from "@/features/portal-auth/services/portal-auth.service";
import { cancelPortalTokenRefresh } from "@/lib/portal-token-refresh";

vi.mock("@/features/portal-auth/services/portal-auth.service", () => ({
  parentLogout: vi.fn(),
  studentLogout: vi.fn(),
}));

vi.mock("@/lib/portal-token-refresh", () => ({
  cancelPortalTokenRefresh: vi.fn(),
}));

const mockedParentLogout = parentLogout as unknown as ReturnType<typeof vi.fn>;
const mockedStudentLogout = studentLogout as unknown as ReturnType<
  typeof vi.fn
>;
const mockedCancelPortalTokenRefresh =
  cancelPortalTokenRefresh as unknown as ReturnType<typeof vi.fn>;

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe("usePortalLogout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it("logs out the parent role and clears only portal session queries", async () => {
    mockedParentLogout.mockResolvedValueOnce(undefined);
    portalTokenStorage.setActiveRole("parent");
    portalTokenStorage.setTokens({
      accessToken: "parent-access-token",
      refreshToken: "parent-refresh-token",
    });

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    queryClient.setQueryData(["portal", "me", "parent"], { id: 7 });
    queryClient.setQueryData(["portal", "student", "dashboard"], { ok: true });
    queryClient.setQueryData(["portal", "parent", "children"], { ok: true });
    queryClient.setQueryData(["portal", "catalog"], { ok: true });

    const { result } = renderHook(() => usePortalLogout(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync("parent");
    });

    expect(mockedParentLogout).toHaveBeenCalledTimes(1);
    expect(mockedStudentLogout).not.toHaveBeenCalled();
    expect(mockedCancelPortalTokenRefresh).toHaveBeenCalledTimes(1);
    expect(portalTokenStorage.getAccessToken()).toBeNull();
    expect(
      queryClient.getQueryData(["portal", "me", "parent"]),
    ).toBeUndefined();
    expect(
      queryClient.getQueryData(["portal", "student", "dashboard"]),
    ).toBeUndefined();
    expect(
      queryClient.getQueryData(["portal", "parent", "children"]),
    ).toBeUndefined();
    expect(queryClient.getQueryData(["portal", "catalog"])).toEqual({
      ok: true,
    });
  });

  it("skips network logout when no access token is stored but still clears session state", async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    queryClient.setQueryData(["portal", "me", "student"], { id: 4 });
    queryClient.setQueryData(["portal", "student", "courses"], { ok: true });

    const { result } = renderHook(() => usePortalLogout(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync("student");
    });

    expect(mockedStudentLogout).not.toHaveBeenCalled();
    expect(mockedParentLogout).not.toHaveBeenCalled();
    expect(mockedCancelPortalTokenRefresh).toHaveBeenCalledTimes(1);
    expect(
      queryClient.getQueryData(["portal", "me", "student"]),
    ).toBeUndefined();
    expect(
      queryClient.getQueryData(["portal", "student", "courses"]),
    ).toBeUndefined();
  });
});
