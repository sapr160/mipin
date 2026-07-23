import { expect, test } from "@playwright/test";

/**
 * Database connectivity (issue #30 / ADR 0003): proves the running app can
 * reach its configured Supabase project through the service-role client, at
 * the repo's only seam — the HTTP boundary.
 *
 * The live probe needs the test project's secret key in the server's
 * environment (`.env.local` → mipin-test), which is not wired in every lane, so
 * it runs only when RUN_DB_CONNECTIVITY=1 is set. Skipped otherwise, so the
 * standing suite stays green without secrets.
 */
test.describe("database connectivity", () => {
  test.skip(
    process.env.RUN_DB_CONNECTIVITY !== "1",
    "set RUN_DB_CONNECTIVITY=1 (with mipin-test env wired) to run the live probe",
  );

  test("the app reaches its Supabase project", async ({ request }) => {
    const response = await request.get("/api/health/db");
    expect(response.status()).toBe(200);
    expect(await response.json()).toMatchObject({ ok: true });
  });
});
