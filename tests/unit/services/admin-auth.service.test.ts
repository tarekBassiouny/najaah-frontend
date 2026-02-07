import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  fetchAdminProfile,
  loginAdmin,
  logoutAdmin,
  refreshAdminSession,
} from "@/services/admin-auth.service";
import { http } from "@/lib/http";
import { tokenStorage } from "@/lib/token-storage";
import { setAuthPermissions } from "@/lib/auth-state";

vi.mock("@/lib/http", () => {
  return {
    http: {
      post: vi.fn(),
      get: vi.fn(),
    },
  };
});

vi.mock("@/lib/token-storage", () => ({
  tokenStorage: {
    getAccessToken: vi.fn(() => null),
    setTokens: vi.fn(),
    setRememberMe: vi.fn(),
    clear: vi.fn(),
  },
}));

vi.mock("@/lib/auth-state", () => ({
  setAuthPermissions: vi.fn(),
}));

const mockedHttp = http as unknown as {
  post: ReturnType<typeof vi.fn>;
  get: ReturnType<typeof vi.fn>;
};

const mockedTokenStorage = tokenStorage as unknown as {
  getAccessToken: ReturnType<typeof vi.fn>;
  setTokens: ReturnType<typeof vi.fn>;
  setRememberMe: ReturnType<typeof vi.fn>;
  clear: ReturnType<typeof vi.fn>;
};

const mockedSetAuthPermissions = setAuthPermissions as unknown as ReturnType<
  typeof vi.fn
>;

describe("loginAdmin", () => {
  const user = { id: 1, name: "Admin", email: "admin@example.com" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends correct payload on login success", async () => {
    mockedHttp.post.mockResolvedValueOnce({
      data: {
        success: true,
        data: { user, token: "token-123" },
      },
    });

    const payload = { email: "admin@example.com", password: "admin123" };
    const result = await loginAdmin(payload);

    expect(mockedHttp.post).toHaveBeenCalledWith(
      "/api/v1/admin/auth/login",
      payload,
      { skipAuth: true },
    );
    expect(result.user).toMatchObject({
      ...user,
      permissions: [],
    });
    expect(mockedTokenStorage.setRememberMe).toHaveBeenCalledWith(false);
    expect(mockedTokenStorage.setTokens).toHaveBeenCalledWith({
      accessToken: "token-123",
    });
  });

  it("sets rememberMe to true when remember flag is passed", async () => {
    mockedHttp.post.mockResolvedValueOnce({
      data: {
        success: true,
        data: { user, token: "token-123" },
      },
    });

    await loginAdmin({
      email: "admin@example.com",
      password: "admin123",
      remember: true,
    });

    expect(mockedTokenStorage.setRememberMe).toHaveBeenCalledWith(true);
  });

  it("throws on login error", async () => {
    mockedHttp.post.mockRejectedValueOnce({
      response: { status: 401, data: { message: "Invalid credentials" } },
    });

    await expect(
      loginAdmin({ email: "admin@example.com", password: "wrong" }),
    ).rejects.toBeTruthy();
  });
});

describe("fetchAdminProfile", () => {
  const user = {
    id: 1,
    name: "Admin",
    email: "admin@example.com",
    permissions: ["admin.read"],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns normalized user and sets permissions", async () => {
    mockedHttp.get.mockResolvedValueOnce({
      data: { success: true, data: { user } },
    });

    const result = await fetchAdminProfile();

    expect(mockedHttp.get).toHaveBeenCalledWith("/api/v1/admin/auth/me");
    expect(result).toMatchObject(user);
    expect(mockedSetAuthPermissions).toHaveBeenCalledWith(["admin.read"]);
  });

  it("returns null and clears permissions on 401", async () => {
    mockedHttp.get.mockRejectedValueOnce({
      isAxiosError: true,
      response: { status: 401 },
    });

    const result = await fetchAdminProfile();

    expect(result).toBeNull();
    expect(mockedSetAuthPermissions).toHaveBeenCalledWith(null);
  });
});

describe("refreshAdminSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns new token payload", async () => {
    mockedHttp.post.mockResolvedValueOnce({
      data: { data: { token: "new-token" } },
    });

    await expect(refreshAdminSession()).resolves.toEqual({
      access_token: "new-token",
    });
  });

  it("throws if refresh response is missing token", async () => {
    mockedHttp.post.mockResolvedValueOnce({ data: {} });

    await expect(refreshAdminSession()).rejects.toThrow(
      "Invalid refresh response: missing token",
    );
  });
});

describe("logoutAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("clears tokens and permissions on success", async () => {
    mockedHttp.post.mockResolvedValueOnce({});

    await logoutAdmin();

    expect(mockedHttp.post).toHaveBeenCalledWith("/api/v1/admin/auth/logout");
    expect(mockedTokenStorage.clear).toHaveBeenCalled();
    expect(mockedSetAuthPermissions).toHaveBeenCalledWith(null);
  });

  it("clears tokens even if request fails", async () => {
    mockedHttp.post.mockRejectedValueOnce(new Error("network error"));

    await expect(logoutAdmin()).rejects.toThrow("network error");
    expect(mockedTokenStorage.clear).toHaveBeenCalled();
    expect(mockedSetAuthPermissions).toHaveBeenCalledWith(null);
  });
});
