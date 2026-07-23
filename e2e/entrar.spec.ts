import { expect, test } from "@playwright/test";

/**
 * The sign-in page (issue #31): the dedicated `/entrar` destination of the
 * Landing CTA. Asserted at the browser seam, logged-out — no session needed, so
 * this runs in the standing suite. The magic-link check deliberately does not
 * depend on sending or receiving real email (AC): the form flips to its
 * confirmation state on submit regardless of the network result.
 */
test.describe("the sign-in page", () => {
  test("renders the non-affiliation line, the primary Google button and the email fallback (Spanish)", async ({
    browser,
  }) => {
    const context = await browser.newContext({ locale: "es-DO" });
    const page = await context.newPage();
    await page.goto("/entrar");

    await expect(
      page.getByRole("heading", { name: /Entra a mipin/ }),
    ).toBeVisible();

    const nonAffiliation = page.getByTestId("signin-non-affiliation");
    await expect(nonAffiliation).toContainText(/sin afiliaci|no tiene afiliaci/i);
    await expect(nonAffiliation).toContainText(/Santo Domingo 2026/);

    const google = page.getByTestId("google-signin");
    await expect(google).toBeVisible();
    await expect(google).toContainText(/Google/);

    const email = page.getByLabel("Correo electrónico");
    await expect(email).toBeVisible();

    // Google is the primary method: it sits above the email fallback.
    const googleBox = await google.boundingBox();
    const emailBox = await email.boundingBox();
    expect(googleBox).not.toBeNull();
    expect(emailBox).not.toBeNull();
    expect(googleBox!.y).toBeLessThan(emailBox!.y);

    await context.close();
  });

  test("renders bilingually — English copy under an English browser", async ({
    browser,
  }) => {
    const context = await browser.newContext({ locale: "en-US" });
    const page = await context.newPage();
    await page.goto("/entrar");

    await expect(
      page.getByRole("heading", { name: /Sign in to mipin/ }),
    ).toBeVisible();
    await expect(page.getByTestId("google-signin")).toContainText(/Google/);
    await expect(page.getByLabel("Email")).toBeVisible();

    await context.close();
  });

  test("surfaces a generic error when the callback bounces back with ?error=", async ({
    browser,
  }) => {
    const context = await browser.newContext({ locale: "es-DO" });
    const page = await context.newPage();
    await page.goto("/entrar?error=exchange_failed");

    const notice = page.getByTestId("signin-error");
    await expect(notice).toBeVisible();
    await expect(notice).toContainText(/No pudimos completar/);
    // The form still renders so the visitor can retry.
    await expect(page.getByTestId("google-signin")).toBeVisible();

    await context.close();
  });

  test("the magic-link form shows a check-your-email state without real email", async ({
    browser,
  }) => {
    const context = await browser.newContext({ locale: "es-DO" });
    const page = await context.newPage();
    await page.goto("/entrar");

    await page.getByLabel("Correo electrónico").fill("nadie@example.com");
    await page.getByTestId("magic-link-submit").click();

    const confirmation = page.getByTestId("magic-link-sent");
    await expect(confirmation).toBeVisible();
    await expect(confirmation).toContainText(/Revisa tu correo/);
    await expect(confirmation).toContainText("nadie@example.com");

    await context.close();
  });
});
