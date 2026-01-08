import { describe, expect, it, vi, beforeEach } from "vitest";
import { authService } from "@/services/auth.service";
import { http } from "@/lib/http";
import { endpoints } from "@/services/endpoints";

vi.mock("@/lib/http", () => {
  return {
    http: {
      post: vi.fn(),
      get: vi.fn(),
    },
  };
});

const mockedHttp = http as unknown as {
  post: ReturnType<typeof vi.fn>;
  get: ReturnType<typeof vi.fn>;
};

describe("authService", () => {
  const user = { id: 1, name: "Admin", email: "admin@example.com" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends correct payload on login success", async () => {
    mockedHttp.post.mockResolvedValueOnce({ data: { user } });

    const payload = { email: "admin@example.com", password: "admin123" };
    const result = await authService.login(payload);

    expect(mockedHttp.post).toHaveBeenCalledWith(
      endpoints.admin.auth.login,
      payload,
    );
    expect(result).toEqual(user);
  });

  it("throws on login error", async () => {
    mockedHttp.post.mockRejectedValueOnce({
      response: { status: 401, data: { message: "Invalid credentials" } },
    });

    await expect(
      authService.login({ email: "admin@example.com", password: "wrong" }),
    ).rejects.toBeTruthy();
  });
});
