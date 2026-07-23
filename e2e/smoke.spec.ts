import { expect, test } from "@playwright/test";

test("the app serves a page with the mipin wordmark", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "mipin" })).toBeVisible();
});
