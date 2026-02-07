import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getAccessToken,
  clearTokens,
  getTenantApiKey,
  getApiLocale,
  refreshToken,
  cancelTokenRefresh,
  state,
} = vi.hoisted(() => ({
  getAccessToken: vi.fn(),
  clearTokens: vi.fn(),
  getTenantApiKey: vi.fn(),
  getApiLocale: vi.fn(),
  refreshToken: vi.fn(),
  cancelTokenRefresh: vi.fn(),
  state: {
    requestInterceptor: undefined as ((_config: any) => any) | undefined,
    responseErrorInterceptor: undefined as
      | ((_error: any) => Promise<unknown>)
      | undefined,
    createdClient: undefined as any,
  },
}));

vi.mock("@/lib/token-storage", () => ({
  tokenStorage: {
    getAccessToken,
    clear: clearTokens,
  },
}));

vi.mock("@/lib/tenant-store", () => ({
  getTenantApiKey,
}));

vi.mock("@/lib/runtime-config", () => ({
  apiBaseUrl: "https://api.example.com",
  getApiLocale,
}));

vi.mock("@/lib/token-refresh", () => ({
  refreshToken,
  cancelTokenRefresh,
}));

vi.mock("axios", () => {
  const create = vi.fn(() => {
    const createdClient: any = vi.fn();
    createdClient.interceptors = {
      request: {
        use: vi.fn((handler: any) => {
          state.requestInterceptor = handler;
        }),
      },
      response: {
        use: vi.fn((_: any, handler: any) => {
          state.responseErrorInterceptor = handler;
        }),
      },
    };
    state.createdClient = createdClient;
    return createdClient;
  });

  return {
    default: { create },
  };
});

import { http } from "@/lib/http";

describe("http client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getTenantApiKey.mockReturnValue("tenant-api-key");
    getApiLocale.mockReturnValue("en");
    getAccessToken.mockReturnValue("access-token");
    refreshToken.mockResolvedValue("new-token");

    if (!state.requestInterceptor || !state.responseErrorInterceptor) {
      throw new Error("Interceptors were not registered");
    }
  });

  it("adds tenant and locale headers and auth token on requests", () => {
    const config = state.requestInterceptor?.({ headers: {} });

    expect(config.headers["X-Api-Key"]).toBe("tenant-api-key");
    expect(config.headers["X-Locale"]).toBe("en");
    expect(config.headers.Authorization).toBe("Bearer access-token");
  });

  it("does not add Authorization when skipAuth is true", () => {
    const config = state.requestInterceptor?.({ headers: {}, skipAuth: true });

    expect(config.headers["X-Api-Key"]).toBe("tenant-api-key");
    expect(config.headers["X-Locale"]).toBe("en");
    expect(config.headers.Authorization).toBeUndefined();
  });

  it("retries once on 401 with refreshed token", async () => {
    state.createdClient.mockResolvedValueOnce({ data: { ok: true } });

    const originalConfig = { url: "/api/v1/admin/students", headers: {} };

    const result = await state.responseErrorInterceptor?.({
      response: { status: 401 },
      config: originalConfig,
    });

    expect(refreshToken).toHaveBeenCalledTimes(1);
    expect(state.createdClient).toHaveBeenCalledWith(
      expect.objectContaining({
        _retry: true,
        headers: expect.objectContaining({ Authorization: "Bearer new-token" }),
      }),
    );
    expect(result).toEqual({ data: { ok: true } });
  });

  it("rejects when status is not 401", async () => {
    const error = { response: { status: 500 }, config: { headers: {} } };

    await expect(state.responseErrorInterceptor?.(error)).rejects.toBe(error);
    expect(refreshToken).not.toHaveBeenCalled();
  });

  it("rejects when request already retried", async () => {
    const error = {
      response: { status: 401 },
      config: { headers: {}, _retry: true },
    };

    await expect(state.responseErrorInterceptor?.(error)).rejects.toBe(error);
    expect(refreshToken).not.toHaveBeenCalled();
  });

  it("clears token and rejects when refresh fails", async () => {
    refreshToken.mockRejectedValueOnce(new Error("refresh failed"));

    const error = {
      response: { status: 401 },
      config: { url: "/api/v1/admin/students", headers: {} },
    };

    await expect(state.responseErrorInterceptor?.(error)).rejects.toThrow(
      "refresh failed",
    );
    expect(clearTokens).toHaveBeenCalled();
    expect(cancelTokenRefresh).toHaveBeenCalled();
  });

  it("exports a configured axios instance", () => {
    expect(http).toBe(state.createdClient);
  });
});
