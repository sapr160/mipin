import { expect, test } from "@playwright/test";

test.describe("language toggle", () => {
  test("switches all visible text and persists across reloads", async ({
    browser,
  }) => {
    const context = await browser.newContext({ locale: "es-DO" });
    const page = await context.newPage();
    await page.goto("/");
    await expect(page.getByText("Muy pronto.")).toBeVisible();

    await page.getByRole("button", { name: "EN" }).click();

    await expect(page.getByText("Coming soon.")).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");

    await page.reload();
    await expect(page.getByText("Coming soon.")).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");

    await context.close();
  });

  test("an explicit choice beats Accept-Language on later visits", async ({
    browser,
  }) => {
    // Browser prefers Spanish, but the user explicitly picks English.
    const context = await browser.newContext({ locale: "es-DO" });
    const page = await context.newPage();
    await page.goto("/");
    await page.getByRole("button", { name: "EN" }).click();
    await expect(page.getByText("Coming soon.")).toBeVisible();

    // A later visit in the same browser (still sending es-DO) must stay English.
    const later = await context.newPage();
    await later.goto("/");
    await expect(later.getByText("Coming soon.")).toBeVisible();
    await expect(later.locator("html")).toHaveAttribute("lang", "en");

    await context.close();
  });
});
