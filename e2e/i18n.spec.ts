import { expect, test } from "@playwright/test";

test.describe("first-visit locale negotiation", () => {
  test("an English browser renders the app in English", async ({ browser }) => {
    const context = await browser.newContext({ locale: "en-US" });
    const page = await context.newPage();
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: /Swap pins/ }),
    ).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");

    await context.close();
  });

  test("a Spanish browser renders the app in Spanish", async ({ browser }) => {
    const context = await browser.newContext({ locale: "es-DO" });
    const page = await context.newPage();
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: /Intercambia pines/ }),
    ).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "es");

    await context.close();
  });

  test("a request with no Accept-Language falls back to Spanish", async ({
    request,
  }) => {
    // The `request` fixture honors explicit headers (unlike a browser
    // navigation, where Chromium always derives Accept-Language from the
    // context locale), so this exercises the true header-absent branch.
    const response = await request.get("/", {
      headers: { "Accept-Language": "" },
    });
    const html = await response.text();

    expect(html).toContain("Intercambia pines");
    expect(html).toContain('lang="es"');
    expect(html).not.toContain("Swap pins");
  });
});
