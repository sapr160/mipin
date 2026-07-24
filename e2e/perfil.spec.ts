import {
  createUser,
  deleteUser,
  expect,
  mintSession,
  seedProfile,
  serviceClient,
  signedInClient,
  skipWithoutLiveAuth,
  test,
} from "./support/auth";

/**
 * The Perfil tab — profile management (issue #35) — end to end against the real
 * `mipin-test` project, so the `update_profile` transaction, the two tables' RLS
 * (including that the WhatsApp number is invisible cross-account), and the
 * signed-in locale persistence all run for real. Gated behind
 * RUN_DB_CONNECTIVITY=1 like the other live-DB specs, and requires the profiles +
 * whatsapp migrations applied to mipin-test (`npm run db:push`).
 *
 * Spanish copy would render by default; these assert on testids and stored values
 * rather than copy, but the locale is pinned for determinism.
 */
test.describe("Perfil profile management", () => {
  skipWithoutLiveAuth();
  test.use({ locale: "es-DO" });

  // The values `seedProfile` writes — the starting point every test edits from.
  const SEEDED_NAME = "Test Athlete";

  test("shows the athlete's card, then an edit persists and re-renders", async ({
    page,
  }) => {
    const user = await createUser();
    try {
      await seedProfile(user.id);
      await mintSession(page, user);
      await page.goto("/perfil");

      // The card renders the seeded public fields, and the form is prefilled.
      await expect(page.getByTestId("profile-card")).toContainText(SEEDED_NAME);
      await expect(page.getByTestId("profile-name")).toHaveValue(SEEDED_NAME);

      // Edit one field per table plus the private WhatsApp number, then save.
      await page.getByTestId("profile-name").fill("Pincoya");
      await page.getByTestId("profile-sport").selectOption("swimming");
      await page.locator('input[name="show_me"][value="women"]').check();
      await page.getByTestId("profile-bio").fill("Nado mariposa.");
      await page.getByTestId("profile-whatsapp").fill("+1 (809) 555-1234");
      await page.getByTestId("profile-save").click();

      // The saved notice shows and the card + form re-render with the new values.
      await expect(page.getByTestId("profile-saved")).toBeVisible();
      await expect(page.getByTestId("profile-card")).toContainText("Pincoya");
      await expect(page.getByTestId("profile-name")).toHaveValue("Pincoya");

      // Both rows carry the edited values (service role bypasses RLS to read).
      const svc = serviceClient();
      const { data: pub } = await svc
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      expect(pub).toMatchObject({
        display_name: "Pincoya",
        sport: "swimming",
        bio: "Nado mariposa.",
      });

      const { data: priv } = await svc
        .from("profiles_private")
        .select("*")
        .eq("id", user.id)
        .single();
      expect(priv).toMatchObject({
        show_me: "women",
        whatsapp: "+18095551234",
      });
    } finally {
      await deleteUser(user.id);
    }
  });

  test("a saved WhatsApp number is never readable by another athlete", async ({
    page,
  }) => {
    const owner = await createUser();
    const other = await createUser();
    try {
      await seedProfile(owner.id);
      await mintSession(page, owner);
      await page.goto("/perfil");

      await page.getByTestId("profile-whatsapp").fill("+18095551234");
      await page.getByTestId("profile-save").click();
      await expect(page.getByTestId("profile-saved")).toBeVisible();

      const asOther = await signedInClient(other);

      // The public card stays readable by any authenticated athlete...
      const { data: card, error: cardError } = await asOther
        .from("profiles")
        .select("id, display_name")
        .eq("id", owner.id)
        .maybeSingle();
      expect(cardError).toBeNull();
      expect(card?.display_name).toBe(SEEDED_NAME);

      // ...but the private row — where the WhatsApp number lives — is invisible
      // cross-account: RLS returns no rows, no error, whether selecting the whole
      // row or the number column specifically.
      const { data: privateRows, error: privateError } = await asOther
        .from("profiles_private")
        .select("*")
        .eq("id", owner.id);
      expect(privateError).toBeNull();
      expect(privateRows).toEqual([]);

      const { data: numberRows } = await asOther
        .from("profiles_private")
        .select("whatsapp")
        .eq("id", owner.id);
      expect(numberRows).toEqual([]);
    } finally {
      await deleteUser(owner.id);
      await deleteUser(other.id);
    }
  });

  test("the signed-in language toggle persists onto the profile row", async ({
    page,
  }) => {
    const user = await createUser();
    try {
      await seedProfile(user.id); // seeded locale is 'es'
      await mintSession(page, user);
      await page.goto("/perfil");

      await page.getByRole("button", { name: "EN" }).click();
      // The switch completes (server re-render) — EN becomes the active choice.
      await expect(page.getByRole("button", { name: "EN" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );

      // The choice followed the account, not just the browser: profiles.locale.
      const svc = serviceClient();
      await expect
        .poll(async () => {
          const { data } = await svc
            .from("profiles")
            .select("locale")
            .eq("id", user.id)
            .single();
          return data?.locale;
        })
        .toBe("en");
    } finally {
      await deleteUser(user.id);
    }
  });
});
