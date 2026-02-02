import "../../setup/integration";
import { describe, expect, it } from "vitest";
import { loginAdmin } from "@/services/admin-auth.service";

describe("loginAdmin (integration with MSW)", () => {
  it("returns user on successful login", async () => {
    const result = await loginAdmin({
      email: "admin@example.com",
      password: "admin123",
    });

    expect(result.user?.email).toBe("admin@example.com");
    expect(result.user?.name).toBe("Admin");
    expect(result.tokens.access_token).toBe("mock-token");
  });

  it("throws on invalid credentials", async () => {
    await expect(
      loginAdmin({
        email: "admin@example.com",
        password: "wrong",
      }),
    ).rejects.toBeTruthy();
  });
});
