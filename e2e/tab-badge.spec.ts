import { expect, test } from "@playwright/test";

/**
 * The Tab-badge mechanism (spec #22 / domain "Tab badge"), exercised at the
 * repo's only seam: the browser boundary. There is no component-level harness.
 *
 * Real count-fetchers arrive with clusters 4 and 6; this cluster ships stub
 * fetchers returning 0, so production shows no badges. To prove the provider's
 * behaviour (fetch-on-load, refetch-on-visibility, badge rendering) without
 * those real fetchers, each test injects its own fetcher into
 * `window.__mipinTabBadges` via `addInitScript` — the provider merges that
 * override over the stub registry at fetch time.
 */

// Assert on Spanish tab labels; pin the context locale so the runner's default
// browser language can't flip them to English.
test.use({ locale: "es-DO" });

/** The four tab links, located by their Spanish accessible names. */
const TAB = {
  pines: /Pines/,
  intercambios: /Intercambios/,
  matches: /Matches/,
  perfil: /Perfil/,
} as const;

test.describe("the Tab-badge mechanism", () => {
  test("shows no badges anywhere with the shipped stub fetchers", async ({
    page,
  }) => {
    await page.goto("/pines");

    // Every tab renders, and none carries a numeric unread badge.
    for (const name of Object.values(TAB)) {
      const link = page.getByRole("link", { name });
      await expect(link).toBeVisible();
      await expect(link).not.toContainText(/\d/);
    }
  });

  test("fetches counts on load and renders a badge for a non-zero tab", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      window.__mipinTabBadges = {
        intercambios: {
          fetchCount: async () => 3,
          markSeen: async () => {},
        },
      };
    });

    await page.goto("/pines");

    // The injected tab shows its count on load...
    await expect(
      page.getByRole("link", { name: TAB.intercambios }),
    ).toContainText("3");
    // ...while the tabs left on the stub fetcher stay bare.
    await expect(page.getByRole("link", { name: TAB.pines })).not.toContainText(
      /\d/,
    );
    await expect(
      page.getByRole("link", { name: TAB.matches }),
    ).not.toContainText(/\d/);
  });

  test("refetches counts on visibilitychange", async ({ page }) => {
    await page.addInitScript(() => {
      window.__mipinTabBadges = {
        intercambios: {
          fetchCount: async () => 3,
          markSeen: async () => {},
        },
      };
    });

    await page.goto("/pines");
    await expect(
      page.getByRole("link", { name: TAB.intercambios }),
    ).toContainText("3");

    // Swap in a fetcher returning a new value, then fire the same event the
    // browser fires when the user returns to the tab.
    await page.evaluate(() => {
      window.__mipinTabBadges = {
        intercambios: {
          fetchCount: async () => 5,
          markSeen: async () => {},
        },
      };
      document.dispatchEvent(new Event("visibilitychange"));
    });

    await expect(
      page.getByRole("link", { name: TAB.intercambios }),
    ).toContainText("5");
  });
});
