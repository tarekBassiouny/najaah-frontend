import { expect, test } from "@playwright/test";

test.describe("Authentication", () => {
  test.beforeEach(async ({ page }) => {
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
  });

  test("redirects to login when unauthenticated", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("logs in and lands on dashboard", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel(/email/i).fill("admin@example.com");
    await page.getByLabel(/password/i).fill("admin123");
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page).toHaveURL(/\/dashboard/);
  });
});
