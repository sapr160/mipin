import { expect, test } from "@playwright/test";

// Runs against the default server (:3000), started without KOFI_URL. The footer
// carrying the Ko-fi link is shared by the Landing and the Shell; assert on the
// Landing, which needs no session (the Shell is now gated, issue #31).
test("the Ko-fi link is absent when its env var is unset", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: /café|coffee/ })).toHaveCount(0);
});
