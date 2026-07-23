import { expect, test } from "@playwright/test";

// Runs against the default server (:3000), started without KOFI_URL.
test("the Ko-fi link is absent when its env var is unset", async ({ page }) => {
  await page.goto("/pines");
  await expect(page.getByRole("link", { name: /café|coffee/ })).toHaveCount(0);
});
