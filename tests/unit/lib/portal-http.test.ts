import type { AxiosError } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

function createAxios401Error(url: string) {
  return {
    response: { status: 401 },
    config: {
      url,
      headers: {},
    },
  } as AxiosError;
}

describe("portalHttp response interceptor", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("does not attempt token refresh for logout endpoint failures", async () => {
    const clear = vi.fn();
    const getActiveRole = vi.fn(() => "parent");
    const cancel = vi.fn();
    const refresh = vi.fn();

    vi.doMock("@/lib/runtime-config", () => ({
      apiBaseUrl: "https://api.test",
      defaultApiKey: "test-key",
      getApiLocale: () => "en",
    }));
    vi.doMock("@/lib/tenant-store", () => ({
      getTenantApiKey: () => "tenant-key",
      getTenantState: () => ({ centerSlug: null, apiKey: null }),
    }));
    vi.doMock("@/lib/portal-token-storage", () => ({
      portalTokenStorage: {
        getAccessToken: vi.fn(() => "access-token"),
        getActiveRole,
        clear,
      },
    }));
    vi.doMock("@/lib/portal-token-refresh", () => ({
      portalRefreshToken: refresh,
      cancelPortalTokenRefresh: cancel,
    }));

    const { portalHttp } = await import("@/lib/portal-http");
    const rejected = (
      portalHttp.interceptors.response as unknown as {
        handlers: Array<{ rejected: (_error: AxiosError) => Promise<unknown> }>;
      }
    ).handlers[0].rejected;

    await expect(
      rejected(createAxios401Error("/api/v1/web/auth/parent/logout")),
    ).rejects.toMatchObject({
      response: { status: 401 },
    });

    expect(refresh).not.toHaveBeenCalled();
    expect(clear).toHaveBeenCalledTimes(1);
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(getActiveRole).not.toHaveBeenCalled();
  });

  it("clears tokens and avoids refresh when refresh endpoint itself returns 401", async () => {
    const clear = vi.fn();
    const getActiveRole = vi.fn(() => "student");
    const cancel = vi.fn();
    const refresh = vi.fn();

    vi.doMock("@/lib/runtime-config", () => ({
      apiBaseUrl: "https://api.test",
      defaultApiKey: "test-key",
      getApiLocale: () => "en",
    }));
    vi.doMock("@/lib/tenant-store", () => ({
      getTenantApiKey: () => "tenant-key",
      getTenantState: () => ({ centerSlug: null, apiKey: null }),
    }));
    vi.doMock("@/lib/portal-token-storage", () => ({
      portalTokenStorage: {
        getAccessToken: vi.fn(() => "access-token"),
        getActiveRole,
        clear,
      },
    }));
    vi.doMock("@/lib/portal-token-refresh", () => ({
      portalRefreshToken: refresh,
      cancelPortalTokenRefresh: cancel,
    }));

    const { portalHttp } = await import("@/lib/portal-http");
    const rejected = (
      portalHttp.interceptors.response as unknown as {
        handlers: Array<{ rejected: (_error: AxiosError) => Promise<unknown> }>;
      }
    ).handlers[0].rejected;

    await expect(
      rejected(createAxios401Error("/api/v1/web/auth/student/refresh")),
    ).rejects.toMatchObject({
      response: { status: 401 },
    });

    expect(refresh).not.toHaveBeenCalled();
    expect(clear).toHaveBeenCalledTimes(1);
    expect(cancel).toHaveBeenCalledTimes(2);
  });
});
