import { expect, test } from "@playwright/test";

/**
 * The Shell session gate (issue #31, AC 3). A visitor with no session may not
 * reach any Shell URL — every one of them bounces to the sign-in page. This is
 * the logged-out half of the gate, so it needs no minted session and runs in
 * the standing suite. (The signed-in half — sign-in/onboarding bouncing into
 * the app — needs the auth fixture and lives in `auth-session.spec.ts`.)
 */
const SHELL_PATHS = ["/pines", "/intercambios", "/matches", "/perfil"];

test.describe("the Shell session gate", () => {
  for (const path of SHELL_PATHS) {
    test(`${path} without a session redirects to the sign-in page`, async ({
      page,
    }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/entrar/);
      await expect(
        page.getByRole("heading", { name: /Entra a mipin|Sign in to mipin/ }),
      ).toBeVisible();
    });
  }
});
