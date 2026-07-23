import { expect, test } from "@playwright/test";

// Runs only under the "kofi" project, against the second server (:3100) which
// is started with KOFI_URL set. Same build as :3000 — the env is read at
// request time in the footer Server Component.
test("the Ko-fi link is present and points at KOFI_URL when set", async ({
  page,
}) => {
  // The footer is shared by the Landing and the Shell; assert on the Landing,
  // which needs no session (the Shell is now gated, issue #31).
  await page.goto("/");
  const link = page.getByRole("link", { name: /café|coffee/ });
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute("href", "https://ko-fi.com/mipintest");
});
