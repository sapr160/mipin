import { expect, test } from "@playwright/test";

const TABS = ["/pines", "/intercambios", "/matches", "/perfil"];
const TAB_BAR = { name: /Navegación|Navigation/ };

test.describe("the Shell", () => {
  // The per-tab and mobile checks assert on Spanish copy; pin the context so
  // they don't depend on the runner's default browser locale. The bilingual
  // footer test below drives its own contexts and is unaffected.
  test.use({ locale: "es-DO" });

  for (const path of TABS) {
    test(`${path} renders a coming-soon stub inside the Shell`, async ({
      page,
    }) => {
      await page.goto(path);

      // Header wordmark
      await expect(page.getByRole("link", { name: "mipin" })).toBeVisible();
      // Coming-soon stub content
      await expect(page.getByText("Muy pronto")).toBeVisible();
      // Bottom tab bar with the four destinations
      const tabBar = page.getByRole("navigation", TAB_BAR);
      await expect(tabBar.getByRole("link")).toHaveCount(4);
      // Footer non-affiliation line
      await expect(page.getByText(/Proyecto independiente/)).toBeVisible();
    });
  }

  test("the tab bar is bottom-fixed and thumb-usable on a mobile viewport", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/pines");

    const tabBar = page.getByRole("navigation", TAB_BAR);
    await expect(tabBar).toBeVisible();

    const position = await tabBar.evaluate(
      (el) => getComputedStyle(el).position,
    );
    expect(position).toBe("fixed");

    const box = await tabBar.boundingBox();
    const viewport = page.viewportSize()!;
    expect(box).not.toBeNull();
    // Sits flush against the bottom of the viewport, spans its full width...
    expect(box!.y + box!.height).toBeGreaterThan(viewport.height - 2);
    expect(box!.width).toBeGreaterThan(viewport.width - 2);
    // ...and each of the four targets clears the ~44px thumb minimum.
    expect(box!.height).toBeGreaterThanOrEqual(48);
  });

  test("the footer non-affiliation line appears in both languages", async ({
    browser,
  }) => {
    const es = await browser.newContext({ locale: "es-DO" });
    const esPage = await es.newPage();
    await esPage.goto("/matches");
    await expect(esPage.getByText(/Proyecto independiente/)).toBeVisible();
    await es.close();

    const en = await browser.newContext({ locale: "en-US" });
    const enPage = await en.newPage();
    await enPage.goto("/matches");
    await expect(enPage.getByText(/Independent, free project/)).toBeVisible();
    await en.close();
  });
});
