import { expect, type Page, test } from "@playwright/test";

const WA_PREFIX = "https://wa.me/?text=";

async function shareMessage(page: Page): Promise<string> {
  const href = await page
    .getByRole("link", { name: /Compartir|Share/ })
    .getAttribute("href");
  expect(href).toBeTruthy();
  expect(href!.startsWith(WA_PREFIX)).toBe(true);
  return decodeURIComponent(href!.slice(WA_PREFIX.length));
}

test.describe("the Share prompt", () => {
  test("is a wa.me link whose text is the current-language message ending in the app URL with ?src=share", async ({
    browser,
  }) => {
    const context = await browser.newContext({ locale: "es-DO" });
    const page = await context.newPage();
    // The Share prompt lives in the Header, shared by the Landing and the Shell;
    // assert it on the Landing, which needs no session (the Shell is now gated).
    await page.goto("/");

    let message = await shareMessage(page);
    expect(message).toContain("Únete");
    expect(message.endsWith("/?src=share")).toBe(true);

    // The message switches with the toggle.
    await page.getByRole("button", { name: "EN" }).click();
    await expect(page.getByRole("link", { name: "Share" })).toBeVisible();

    message = await shareMessage(page);
    expect(message).toContain("Join me");
    expect(message.endsWith("/?src=share")).toBe(true);

    await context.close();
  });
});
