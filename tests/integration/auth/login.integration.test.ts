import "../../setup/integration";
import { describe, expect, it } from "vitest";
import { authService } from "@/services/auth.service";

describe("authService login (integration with MSW)", () => {
  it("returns user on successful login", async () => {
    const user = await authService.login({
      email: "admin@example.com",
      password: "admin123",
    });

    expect(user.email).toBe("admin@example.com");
    expect(user.name).toBe("Admin");
  });

  it("throws on invalid credentials", async () => {
    await expect(
      authService.login({
        email: "admin@example.com",
        password: "wrong",
      }),
    ).rejects.toBeTruthy();
  });
});
