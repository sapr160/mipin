import { expect, skipWithoutLiveAuth, test } from "./support/auth";

/**
 * The minted-session proof (issue #31, AC 5), driven by the Playwright auth
 * fixture against the real `mipin-test` project. Gated behind
 * RUN_DB_CONNECTIVITY=1 (mipin-test credentials), like `db-connectivity.spec.ts`:
 * skipped, not failed, when the credentials aren't wired.
 *
 * It proves the whole session round-trip through real server-enforced flows: a
 * minted session passes the Shell gate, a signed-in visitor is bounced off the
 * sign-in page into the app, and sign-out returns to the Landing and revokes
 * access so the gate bounces again.
 */
test.describe("a minted session", () => {
  skipWithoutLiveAuth();

  // Shell/Landing copy assertions below are Spanish; pin the locale.
  test.use({ locale: "es-DO" });

  test("passes the Shell gate, bounces off sign-in, and is revoked by sign-out", async ({
    authedPage,
  }) => {
    // 1) The minted session passes the gate: a Shell URL renders, not bounces.
    await authedPage.goto("/pines");
    await expect(authedPage).toHaveURL(/\/pines/);
    await expect(
      authedPage.getByRole("navigation", { name: /Navegación|Navigation/ }),
    ).toBeVisible();

    // 2) The sign-in page bounces a signed-in visitor into the app (AC 3).
    await authedPage.goto("/entrar");
    await expect(authedPage).toHaveURL(/\/pines/);

    // 3) Sign out from Perfil returns to the Landing...
    await authedPage.goto("/perfil");
    await authedPage.getByTestId("sign-out").click();
    await expect(authedPage).toHaveURL(/localhost:\d+\/$/);
    await expect(authedPage.getByTestId("landing-non-affiliation")).toBeVisible();

    // 4) ...and the session is revoked: the gate bounces to sign-in again.
    await authedPage.goto("/pines");
    await expect(authedPage).toHaveURL(/\/entrar/);
  });
});
