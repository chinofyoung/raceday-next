import { test, expect } from "@playwright/test";

test("homepage loads and has a visible heading", async ({ page }) => {
  await page.goto("/");

  // The page title should be set
  await expect(page).toHaveTitle(/.+/);

  // At least one heading should be visible on the marketing homepage
  const heading = page.locator("h1").first();
  await expect(heading).toBeVisible();
});
