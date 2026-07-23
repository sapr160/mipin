import { expect, test } from "@playwright/test";

/**
 * The Landing (issue #21): the logged-out homepage the QR code and share links
 * open. One-screen bilingual pitch — pins first, swipe framed neutrally, a
 * prominent non-affiliation line, and a single CTA to `/pines`.
 */
test.describe("the Landing", () => {
  // Tests that assert on specific copy pin Spanish so they don't depend on the
  // runner's default browser locale; the toggle test below drives its own
  // context and is unaffected.
  test.use({ locale: "es-DO" });

  test("renders the pitch in the negotiated language and the toggle switches it", async ({
    browser,
  }) => {
    const context = await browser.newContext({ locale: "es-DO" });
    const page = await context.newPage();
    await page.goto("/");

    // Negotiated Spanish on the first visit.
    await expect(
      page.getByRole("heading", { name: /Intercambia pines/ }),
    ).toBeVisible();

    await page.getByRole("button", { name: "EN" }).click();

    await expect(
      page.getByRole("heading", { name: /Swap pins/ }),
    ).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");

    await context.close();
  });

  test("pitches both features with pins first and swipe framed neutrally", async ({
    page,
  }) => {
    await page.goto("/");

    const pins = page.getByTestId("pins-pitch");
    const swipe = page.getByTestId("swipe-pitch");
    await expect(pins).toBeVisible();
    await expect(swipe).toBeVisible();

    // Pins lead: the pin-exchange pitch sits above the swipe pitch.
    const pinsBox = await pins.boundingBox();
    const swipeBox = await swipe.boundingBox();
    expect(pinsBox).not.toBeNull();
    expect(swipeBox).not.toBeNull();
    expect(pinsBox!.y).toBeLessThan(swipeBox!.y);

    // Neutral framing (decision from #4): no dating-app language.
    const swipeText = (await swipe.textContent())?.toLowerCase() ?? "";
    expect(swipeText).toContain("atletas");
    expect(swipeText).not.toMatch(/cita|match|dating|romance|pareja/);
  });

  test("notes that sharing improves your own feed", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("share-note")).toBeVisible();
  });

  test("shows a prominent non-affiliation line on the page itself", async ({
    page,
  }) => {
    await page.goto("/");

    const line = page.getByTestId("landing-non-affiliation");
    await expect(line).toBeVisible();
    // In addition to the footer: it names the Games and denies affiliation.
    await expect(line).toContainText(/sin afiliaci|no affiliation|no tiene afiliaci/i);
    await expect(line).toContainText(/Santo Domingo 2026/);

    // Prominent, not footer-style fine print: it sits above the fold (before
    // the CTA) and is not the dimmest, smallest text on the page.
    const cta = page.getByTestId("landing-cta");
    const lineBox = await line.boundingBox();
    const ctaBox = await cta.boundingBox();
    expect(lineBox).not.toBeNull();
    expect(ctaBox).not.toBeNull();
    expect(lineBox!.y).toBeLessThan(ctaBox!.y);

    const fontSize = await line.evaluate(
      (el) => parseFloat(getComputedStyle(el).fontSize),
    );
    expect(fontSize).toBeGreaterThan(12); // larger than the footer's text-xs
  });

  test("has a single CTA that navigates to /pines", async ({ page }) => {
    await page.goto("/");

    const cta = page.getByTestId("landing-cta");
    await expect(cta).toBeVisible();
    await cta.click();
    await expect(page).toHaveURL(/\/pines$/);
  });

  test("carries the Shell header (toggle + share) and footer", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "mipin" })).toBeVisible();
    await expect(page.getByRole("button", { name: "EN" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Compartir|Share/ })).toBeVisible();
    await expect(page.getByText(/Proyecto independiente/)).toBeVisible();
  });
});
