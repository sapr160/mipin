import { expect, test } from "@playwright/test";

async function srcCookie(context: import("@playwright/test").BrowserContext) {
  const cookies = await context.cookies();
  return cookies.find((c) => c.name === "mipin_src")?.value;
}

test.describe("first-touch source capture", () => {
  test("captures the first ?src= value and never overwrites it", async ({
    browser,
  }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto("/?src=qr");
    expect(await srcCookie(context)).toBe("qr");

    // A later visit with a different src must not clobber the first touch.
    await page.goto("/?src=share");
    expect(await srcCookie(context)).toBe("qr");

    await context.close();
  });

  test("ignores unknown src values", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto("/?src=totally-made-up");
    expect(await srcCookie(context)).toBeUndefined();

    await context.close();
  });
});
