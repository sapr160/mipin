import { expect, skipWithoutLiveAuth, test } from "./support/auth";

const TABS = ["/pines", "/intercambios", "/matches", "/perfil"];
const TAB_BAR = { name: /Navegación|Navigation/ };

/**
 * The Shell frame (spec #20). Since issue #34 the Shell admits only an Onboarded
 * athlete, so the frame is reached with the `onboardedPage` fixture (a minted
 * session plus a seeded profile) — these run behind it and skip (like
 * `db-connectivity.spec.ts`) when RUN_DB_CONNECTIVITY is unset. The logged-out
 * redirect itself is covered, without secrets, by `auth-gate.spec.ts`.
 */
test.describe("the Shell", () => {
  skipWithoutLiveAuth();

  // The per-tab and mobile checks assert on Spanish copy; pin the context so
  // they don't depend on the runner's default browser locale.
  test.use({ locale: "es-DO" });

  for (const path of TABS) {
    test(`${path} renders a coming-soon stub inside the Shell`, async ({
      onboardedPage,
    }) => {
      await onboardedPage.goto(path);

      // Header wordmark
      await expect(
        onboardedPage.getByRole("link", { name: "mipin" }),
      ).toBeVisible();
      // Coming-soon stub content
      await expect(onboardedPage.getByText("Muy pronto")).toBeVisible();
      // Bottom tab bar with the four destinations
      const tabBar = onboardedPage.getByRole("navigation", TAB_BAR);
      await expect(tabBar.getByRole("link")).toHaveCount(4);
      // Footer non-affiliation line
      await expect(onboardedPage.getByText(/Proyecto independiente/)).toBeVisible();
    });
  }

  test("the tab bar is bottom-fixed and thumb-usable on a mobile viewport", async ({
    onboardedPage,
  }) => {
    await onboardedPage.setViewportSize({ width: 390, height: 844 });
    await onboardedPage.goto("/pines");

    const tabBar = onboardedPage.getByRole("navigation", TAB_BAR);
    await expect(tabBar).toBeVisible();

    const position = await tabBar.evaluate(
      (el) => getComputedStyle(el).position,
    );
    expect(position).toBe("fixed");

    const box = await tabBar.boundingBox();
    const viewport = onboardedPage.viewportSize()!;
    expect(box).not.toBeNull();
    // Sits flush against the bottom of the viewport, spans its full width...
    expect(box!.y + box!.height).toBeGreaterThan(viewport.height - 2);
    expect(box!.width).toBeGreaterThan(viewport.width - 2);
    // ...and each of the four targets clears the ~44px thumb minimum.
    expect(box!.height).toBeGreaterThanOrEqual(48);
  });
});

/**
 * The footer non-affiliation line is identical on the Landing and the Shell;
 * assert its bilingual copy on the Landing, which needs no session.
 */
test.describe("the footer", () => {
  test("non-affiliation line appears in both languages", async ({ browser }) => {
    const es = await browser.newContext({ locale: "es-DO" });
    const esPage = await es.newPage();
    await esPage.goto("/");
    await expect(esPage.getByText(/Proyecto independiente/)).toBeVisible();
    await es.close();

    const en = await browser.newContext({ locale: "en-US" });
    const enPage = await en.newPage();
    await enPage.goto("/");
    await expect(enPage.getByText(/Independent, free project/)).toBeVisible();
    await en.close();
  });
});
