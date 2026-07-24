import {
  createUser,
  deleteUser,
  expect,
  mintSession,
  serviceClient,
  signedInClient,
  skipWithoutLiveAuth,
  test,
} from "./support/auth";
import type { Page } from "@playwright/test";

/**
 * Onboarding step 2 end to end (issue #34), driven by the auth fixture against
 * the real `mipin-test` project — so the `create_profile` transaction, the two
 * tables' RLS, the copied locale/first-touch values, and the Onboarded gating all
 * run for real. Gated behind RUN_DB_CONNECTIVITY=1 like the other live-DB specs,
 * and requires the `profiles` migration applied to mipin-test (`npm run db:push`).
 *
 * Spanish copy is asserted, so pin the locale.
 */
test.describe("profile creation and Onboarded gating", () => {
  skipWithoutLiveAuth();
  test.use({ locale: "es-DO" });

  const ADULT_DOB = "1994-03-12";
  const DELEGATION = "DO"; // República Dominicana
  const SPORT = "athletics"; // Atletismo

  /** Drive the two-step signup UI for `user` through to the Share interstitial. */
  async function onboard(
    page: Page,
    fields: { name: string; gender: string; bio?: string },
  ): Promise<void> {
    // Arrive via a tagged link so first-touch = share is captured, then step 1.
    await page.goto("/registro?src=share");
    await page.getByTestId("dob-input").fill(ADULT_DOB);
    await page.getByTestId("dob-submit").click();
    await expect(page).toHaveURL(/\/registro\/perfil/);

    // Step 2: the profile form.
    await page.getByTestId("profile-name").fill(fields.name);
    await page.getByTestId("profile-delegation").selectOption(DELEGATION);
    await page.getByTestId("profile-sport").selectOption(SPORT);
    // Target the radio by value, not its localized label.
    await page.locator(`input[name="gender"][value="${fields.gender}"]`).check();
    // "show me" is left at its default (everyone), asserted below.
    if (fields.bio) await page.getByTestId("profile-bio").fill(fields.bio);
    await page.getByTestId("consent-age").check();
    await page.getByTestId("consent-terms").check();
    await page.getByTestId("profile-submit").click();

    await expect(page).toHaveURL(/\/bienvenida/);
  }

  test("full signup lands in the Shell with the copied values, and both bounces work", async ({
    page,
  }) => {
    const user = await createUser();
    try {
      await mintSession(page, user);
      await onboard(page, {
        name: "Pincoya",
        gender: "woman",
        bio: "Nado en la pista.",
      });

      // The one-time Share prompt reuses the header's Share link, then Pines.
      await expect(page.getByTestId("welcome")).toBeVisible();
      await expect(
        page.getByRole("link", { name: /Compartir|Share/ }),
      ).toBeVisible();
      await page.getByTestId("welcome-continue").click();
      await expect(page).toHaveURL(/\/pines/);
      await expect(
        page.getByRole("navigation", { name: /Navegación|Navigation/ }),
      ).toBeVisible();

      // Both rows exist with the copied values (service role bypasses RLS to read).
      const svc = serviceClient();
      const { data: profile } = await svc
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      expect(profile).toMatchObject({
        id: user.id,
        display_name: "Pincoya",
        delegation: DELEGATION,
        sport: SPORT,
        gender: "woman",
        bio: "Nado en la pista.",
        locale: "es",
      });

      const { data: priv } = await svc
        .from("profiles_private")
        .select("*")
        .eq("id", user.id)
        .single();
      expect(priv).toMatchObject({
        id: user.id,
        dob: ADULT_DOB,
        show_me: "everyone",
        first_touch_source: "share",
      });
      // Both consent timestamps were stamped by the transaction.
      expect(priv.consent_age_accuracy_at).toBeTruthy();
      expect(priv.consent_terms_privacy_at).toBeTruthy();

      // An Onboarded athlete visiting sign-in or onboarding bounces into the app.
      await page.goto("/entrar");
      await expect(page).toHaveURL(/\/pines/);
      await page.goto("/registro");
      await expect(page).toHaveURL(/\/pines/);
    } finally {
      await deleteUser(user.id);
    }
  });

  test("a signed-in account without a profile is sent to onboarding", async ({
    page,
  }) => {
    const user = await createUser();
    try {
      await mintSession(page, user);

      // A Shell URL sends a not-yet-Onboarded account to onboarding (step 1)...
      await page.goto("/pines");
      await expect(page).toHaveURL(/\/registro$/);
      await expect(page.getByTestId("dob-input")).toBeVisible();

      // ...as does the sign-in page (it makes the same routing the callback does).
      await page.goto("/entrar");
      await expect(page).toHaveURL(/\/registro$/);
    } finally {
      await deleteUser(user.id);
    }
  });

  test("a second athlete reads the public card but never the private row", async ({
    page,
  }) => {
    const owner = await createUser();
    const other = await createUser();
    try {
      await mintSession(page, owner);
      await onboard(page, { name: "Pincoya", gender: "woman" });

      const asOther = await signedInClient(other);

      // The public card is readable by any authenticated athlete.
      const { data: card, error: cardError } = await asOther
        .from("profiles")
        .select("id, display_name, delegation, sport")
        .eq("id", owner.id)
        .maybeSingle();
      expect(cardError).toBeNull();
      expect(card).toMatchObject({
        id: owner.id,
        display_name: "Pincoya",
        delegation: DELEGATION,
        sport: SPORT,
      });

      // The private row is invisible cross-account: RLS returns no rows, no error.
      const { data: privateRows, error: privateError } = await asOther
        .from("profiles_private")
        .select("*")
        .eq("id", owner.id);
      expect(privateError).toBeNull();
      expect(privateRows).toEqual([]);
    } finally {
      await deleteUser(owner.id);
      await deleteUser(other.id);
    }
  });
});
