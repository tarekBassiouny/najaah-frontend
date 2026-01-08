import { expect, test } from "@playwright/test";

test.describe("Authentication", () => {
  test("renders sign-in page", async ({ page }) => {
    await page.goto("/auth/sign-in");
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
  });
});
