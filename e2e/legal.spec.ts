import { expect, test } from "@playwright/test";

/**
 * The three legal pages (issue #23): each Spanish slug serves the correct
 * language per the locale cookie, the toggle switches it in place, the ToS and
 * privacy documents carry their mandated clauses, and the footer links navigate
 * between the routes. Asserts only user-observable content, per the spec's
 * single browser seam.
 */

const SLUGS = ["/terminos", "/privacidad", "/encuentros-seguros"];

test.describe("legal pages — language by cookie", () => {
  test("Spanish browsers get the Spanish document at each slug", async ({
    browser,
  }) => {
    const context = await browser.newContext({ locale: "es-DO" });
    const page = await context.newPage();

    await page.goto("/terminos");
    await expect(
      page.getByRole("heading", { name: "Términos de servicio", level: 1 }),
    ).toBeVisible();

    await page.goto("/privacidad");
    await expect(
      page.getByRole("heading", { name: "Política de privacidad", level: 1 }),
    ).toBeVisible();

    await page.goto("/encuentros-seguros");
    await expect(
      page.getByRole("heading", { name: "Encuentros seguros", level: 1 }),
    ).toBeVisible();

    await context.close();
  });

  test("English browsers get the English document at the same slugs", async ({
    browser,
  }) => {
    const context = await browser.newContext({ locale: "en-US" });
    const page = await context.newPage();

    await page.goto("/terminos");
    await expect(
      page.getByRole("heading", { name: "Terms of Service", level: 1 }),
    ).toBeVisible();

    await page.goto("/privacidad");
    await expect(
      page.getByRole("heading", { name: "Privacy Policy", level: 1 }),
    ).toBeVisible();

    await page.goto("/encuentros-seguros");
    await expect(
      page.getByRole("heading", { name: "Safe meetups", level: 1 }),
    ).toBeVisible();

    await context.close();
  });
});

test.describe("legal pages — toggle switches in place", () => {
  test.use({ locale: "es-DO" });

  for (const slug of SLUGS) {
    test(`${slug} switches language without changing the URL`, async ({
      page,
    }) => {
      await page.goto(slug);
      // Starts Spanish.
      await expect(page.getByRole("button", { name: "EN" })).toBeVisible();

      await page.getByRole("button", { name: "EN" }).click();

      // The document is now English and the URL is unchanged (ADR 0002).
      await expect(page.locator("html")).toHaveAttribute("lang", "en");
      await expect(page).toHaveURL(new RegExp(`${slug}$`));
    });
  }
});

test.describe("Terms of Service — mandated clauses", () => {
  test.use({ locale: "es-DO" });

  test("carries Spanish-prevails, non-affiliation, meetup liability, moderation and DR law", async ({
    page,
  }) => {
    await page.goto("/terminos");

    // Spanish legally prevails on conflict.
    await expect(page.getByText(/prevalecerá el texto en español/)).toBeVisible();
    // Non-affiliation, name-only.
    await expect(page.getByText(/No tiene afiliación/)).toBeVisible();
    // Meetup liability: introductions only, no identity verification, own risk.
    await expect(
      page.getByText(/no verifica la identidad de nadie/),
    ).toBeVisible();
    await expect(page.getByText(/por tu cuenta y riesgo/)).toBeVisible();
    // Moderation / termination rights.
    await expect(page.getByText(/suspender o cancelar cuentas/)).toBeVisible();
    // Dominican Republic governing law.
    await expect(page.getByText(/República Dominicana/)).toBeVisible();
  });
});

test.describe("Privacy policy — data inventory", () => {
  test.use({ locale: "es-DO" });

  test("describes the WhatsApp-number lifecycle and the reports/bans carve-out", async ({
    page,
  }) => {
    await page.goto("/privacidad");

    // Lazy collection at first consent-reveal.
    await expect(page.getByText(/Recolección tardía/)).toBeVisible();
    // Hidden until mutual consent.
    await expect(
      page.getByText(/Oculto hasta el consentimiento mutuo/),
    ).toBeVisible();
    // RLS gate.
    await expect(page.getByText(/seguridad a nivel de fila/)).toBeVisible();
    // Self-serve cascade deletion.
    await expect(page.getByText(/se elimina en cascada/)).toBeVisible();
    // Reports/bans retention carve-out.
    await expect(page.getByText(/Excepción por seguridad/)).toBeVisible();
    // Only the two cookies disclosed.
    await expect(page.getByText(/NEXT_LOCALE/)).toBeVisible();
  });
});

test.describe("legal pages — footer navigation", () => {
  test.use({ locale: "es-DO" });

  test("footer links reach all three legal routes from any page", async ({
    page,
  }) => {
    // Start on the Landing, which also carries the footer.
    await page.goto("/");

    await page.getByRole("contentinfo").getByRole("link", { name: "Términos" }).click();
    await expect(page).toHaveURL(/\/terminos$/);
    await expect(
      page.getByRole("heading", { name: "Términos de servicio", level: 1 }),
    ).toBeVisible();

    await page
      .getByRole("contentinfo")
      .getByRole("link", { name: "Privacidad" })
      .click();
    await expect(page).toHaveURL(/\/privacidad$/);
    await expect(
      page.getByRole("heading", { name: "Política de privacidad", level: 1 }),
    ).toBeVisible();

    await page
      .getByRole("contentinfo")
      .getByRole("link", { name: "Encuentros seguros" })
      .click();
    await expect(page).toHaveURL(/\/encuentros-seguros$/);
    await expect(
      page.getByRole("heading", { name: "Encuentros seguros", level: 1 }),
    ).toBeVisible();
  });
});
