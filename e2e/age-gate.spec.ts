import {
  createUser,
  deleteUser,
  expect,
  mintSession,
  skipWithoutLiveAuth,
  test,
} from "./support/auth";

/**
 * The DOB gate and the Age wall (issue #32), driven by the auth fixture against
 * the real `mipin-test` project — so the server action's verdict, the
 * `age_rejections` RLS (owner-select-only, service-role writes), and the
 * onboarding layout's routing all run for real. Gated behind RUN_DB_CONNECTIVITY=1
 * like the other live-DB specs, and requires the `age_rejections` migration
 * applied to mipin-test (`npm run db:push`).
 *
 * These specs manage their own user lifecycle (rather than the `authedPage`
 * fixture) so they can re-mint a session for the SAME account — the only way to
 * prove the wall survives a fresh sign-in.
 *
 * Spanish copy is asserted, so pin the locale.
 */
test.describe("the DOB gate and Age wall", () => {
  skipWithoutLiveAuth();
  test.use({ locale: "es-DO" });

  const UNDER_18_DOB = "2015-06-15";
  const ADULT_DOB = "1990-06-15";

  test("under-18 hits the wall, which persists across sign-in and has a working sign-out", async ({
    page,
  }) => {
    const user = await createUser();
    try {
      // Step 1 asks only for a date of birth.
      await mintSession(page, user);
      await page.goto("/registro");
      await expect(page.getByTestId("dob-input")).toBeVisible();

      // An under-18 DOB is refused immediately — no form to string them along.
      await page.getByTestId("dob-input").fill(UNDER_18_DOB);
      await page.getByTestId("dob-submit").click();
      await expect(page).toHaveURL(/\/registro$/);
      await expect(page.getByTestId("age-wall")).toBeVisible();
      await expect(
        page.getByRole("heading", { name: /solo para mayores de 18/ }),
      ).toBeVisible();

      // The refusal sticks to the account: re-fetching onboarding shows the wall,
      // never the form.
      await page.goto("/registro");
      await expect(page.getByTestId("age-wall")).toBeVisible();
      await expect(page.getByTestId("dob-input")).toHaveCount(0);

      // The wall's sign-out returns to the Landing and revokes the session.
      await page.getByTestId("sign-out").click();
      await expect(page).toHaveURL(/localhost:\d+\/$/);
      await expect(page.getByTestId("landing-non-affiliation")).toBeVisible();
      await page.goto("/registro");
      await expect(page).toHaveURL(/\/entrar/);

      // A fresh sign-in on the same account still lands on the wall — the gate is
      // real, not a per-session retry dialog.
      await mintSession(page, user);
      await page.goto("/registro");
      await expect(page.getByTestId("age-wall")).toBeVisible();
    } finally {
      await deleteUser(user.id);
    }
  });

  test("18+ proceeds to step 2 without creating any profile", async ({
    page,
  }) => {
    const user = await createUser();
    try {
      await mintSession(page, user);
      await page.goto("/registro");
      await page.getByTestId("dob-input").fill(ADULT_DOB);
      await page.getByTestId("dob-submit").click();

      // Advances to the profile step — not the wall.
      await expect(page).toHaveURL(/\/registro\/perfil$/);
      await expect(page.getByTestId("onboarding-step2")).toBeVisible();

      // No profile was created: returning to onboarding shows the DOB form again
      // (not the app, not the wall), so the account is still just a fresh signer-in.
      await page.goto("/registro");
      await expect(page.getByTestId("dob-input")).toBeVisible();
      await expect(page.getByTestId("age-wall")).toHaveCount(0);
    } finally {
      await deleteUser(user.id);
    }
  });
});
