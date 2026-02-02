import { expect, test } from "@playwright/test";

test.describe("Authentication", () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await page.addInitScript(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });

    await page.route("**/api/v1/admin/auth/login", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            user: { id: 1, name: "Admin", email: "admin@example.com" },
            token: "mock-token",
          },
        }),
      });
    });

    await page.route("**/api/v1/admin/auth/me", async (route) => {
      const authHeader = route.request().headers()["authorization"];
      const isAuthenticated = typeof authHeader === "string" && authHeader.startsWith("Bearer ");

      if (!isAuthenticated) {
        await route.fulfill({
          status: 401,
          contentType: "application/json",
          body: JSON.stringify({
            success: false,
            message: "Unauthenticated",
          }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            user: { id: 1, name: "Admin", email: "admin@example.com" },
          },
        }),
      });
    });

    // Mock refresh endpoint to return 401 when no valid token
    await page.route("**/api/v1/admin/auth/refresh", async (route) => {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          message: "Token refresh failed",
        }),
      });
    });
  });

  test("redirects to login when unauthenticated", async ({ page }) => {
    await page.goto("/login");
    const tokenBefore = await page.evaluate(() => localStorage.getItem("access_token"));
    expect(tokenBefore).toBeNull();

    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/, { timeout: 20000 });
  });

  test("logs in and lands on dashboard", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel(/email/i).fill("admin@example.com");
    await page.getByLabel(/password/i).fill("admin123");
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page).toHaveURL(/\/dashboard/);
  });
});
