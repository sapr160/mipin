import { expect, test } from "@playwright/test";

/**
 * The onboarding session gate (issue #32). Every route under `/registro` — step
 * 1 and step 2 alike — requires a session; a visitor without one bounces to the
 * sign-in page. This is the logged-out half of the onboarding gate, so it needs
 * no minted session and runs in the standing suite. (The signed-in halves — the
 * DOB gate and the Age wall — need the auth fixture and live in
 * `age-gate.spec.ts`.)
 */
const ONBOARDING_PATHS = ["/registro", "/registro/perfil"];

test.describe("the onboarding session gate", () => {
  for (const path of ONBOARDING_PATHS) {
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
