import { expect, skipWithoutLiveAuth, test } from "./support/auth";

/**
 * The session round-trip (issue #31, AC 5; Onboarded gating updated by #34),
 * driven by the Playwright auth fixture against the real `mipin-test` project.
 * Gated behind RUN_DB_CONNECTIVITY=1 (mipin-test credentials), like
 * `db-connectivity.spec.ts`: skipped, not failed, when the credentials aren't
 * wired.
 *
 * It proves the whole round-trip through real server-enforced flows for an
 * Onboarded athlete: the session passes the Shell gate, a signed-in Onboarded
 * visitor is bounced off the sign-in page into the app, and sign-out returns to
 * the Landing and revokes access so the gate bounces again.
 */
test.describe("an Onboarded session", () => {
  skipWithoutLiveAuth();

  // Shell/Landing copy assertions below are Spanish; pin the locale.
  test.use({ locale: "es-DO" });

  test("passes the Shell gate, bounces off sign-in, and is revoked by sign-out", async ({
    onboardedPage,
  }) => {
    // 1) The Onboarded session passes the gate: a Shell URL renders, not bounces.
    await onboardedPage.goto("/pines");
    await expect(onboardedPage).toHaveURL(/\/pines/);
    await expect(
      onboardedPage.getByRole("navigation", { name: /Navegación|Navigation/ }),
    ).toBeVisible();

    // 2) The sign-in page bounces an Onboarded visitor into the app (AC 3).
    await onboardedPage.goto("/entrar");
    await expect(onboardedPage).toHaveURL(/\/pines/);

    // 3) Sign out from Perfil returns to the Landing...
    await onboardedPage.goto("/perfil");
    await onboardedPage.getByTestId("sign-out").click();
    await expect(onboardedPage).toHaveURL(/localhost:\d+\/$/);
    await expect(
      onboardedPage.getByTestId("landing-non-affiliation"),
    ).toBeVisible();

    // 4) ...and the session is revoked: the gate bounces to sign-in again.
    await onboardedPage.goto("/pines");
    await expect(onboardedPage).toHaveURL(/\/entrar/);
  });
});
