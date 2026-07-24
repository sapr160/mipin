import { expect, test } from "@playwright/test";
import {
  DEFAULT_SHOW_ME,
  MAX_BIO_LENGTH,
  MAX_DISPLAY_NAME_LENGTH,
  parseProfileForm,
} from "@/lib/auth/profile-form";
import { DELEGATIONS, DISCIPLINES } from "@/lib/vocab";

/**
 * The step-2 profile form validator (issue #34), asserted at the repo's single
 * standing seam. Like `vocab.spec.ts` it drives a pure function directly rather
 * than a page: the server action delegates every field decision here, so this is
 * where the "all server-validated" contract is pinned — a name is required, the
 * pickers must carry a real vocabulary code, gender/show-me must be in range, the
 * bio is optional but capped, and both consent checkboxes must be ticked.
 */

const DELEGATION = DELEGATIONS[0].code;
const SPORT = DISCIPLINES[0].code;

/** A fully valid submission; individual tests knock out one field at a time. */
function validForm(overrides: Record<string, string> = {}): FormData {
  const fd = new FormData();
  fd.set("display_name", "Pincoya");
  fd.set("delegation", DELEGATION);
  fd.set("sport", SPORT);
  fd.set("gender", "woman");
  fd.set("show_me", "everyone");
  fd.set("bio", "");
  fd.set("consent_age", "on");
  fd.set("consent_terms", "on");
  for (const [key, value] of Object.entries(overrides)) fd.set(key, value);
  return fd;
}

test.describe("parseProfileForm", () => {
  test("accepts a complete, valid submission and trims the name", () => {
    const result = parseProfileForm(validForm({ display_name: "  Pincoya  " }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.values).toEqual({
      displayName: "Pincoya",
      delegation: DELEGATION,
      sport: SPORT,
      gender: "woman",
      showMe: "everyone",
      bio: null,
    });
  });

  test("keeps a present bio and reports an empty bio as null", () => {
    const withBio = parseProfileForm(validForm({ bio: "  Nado mariposa  " }));
    expect(withBio.ok && withBio.values.bio).toBe("Nado mariposa");

    const blank = parseProfileForm(validForm({ bio: "   " }));
    expect(blank.ok && blank.values.bio).toBe(null);
  });

  test("everyone is the documented default show-me value", () => {
    expect(DEFAULT_SHOW_ME).toBe("everyone");
  });

  test("rejects a missing or whitespace-only name", () => {
    expect(parseProfileForm(validForm({ display_name: "   " })).ok).toBe(false);
    const missing = validForm();
    missing.delete("display_name");
    expect(parseProfileForm(missing).ok).toBe(false);
  });

  test("rejects a name longer than the cap", () => {
    const tooLong = "x".repeat(MAX_DISPLAY_NAME_LENGTH + 1);
    expect(parseProfileForm(validForm({ display_name: tooLong })).ok).toBe(
      false,
    );
  });

  test("rejects a delegation or sport that isn't in the vocabulary", () => {
    expect(parseProfileForm(validForm({ delegation: "ZZ" })).ok).toBe(false);
    expect(parseProfileForm(validForm({ sport: "quidditch" })).ok).toBe(false);
  });

  test("rejects an out-of-range gender or show-me", () => {
    expect(parseProfileForm(validForm({ gender: "robot" })).ok).toBe(false);
    expect(parseProfileForm(validForm({ show_me: "aliens" })).ok).toBe(false);
  });

  test("rejects a bio longer than the cap", () => {
    const tooLong = "x".repeat(MAX_BIO_LENGTH + 1);
    expect(parseProfileForm(validForm({ bio: tooLong })).ok).toBe(false);
  });

  test("requires both consent checkboxes to be ticked", () => {
    const noAge = validForm();
    noAge.delete("consent_age");
    expect(parseProfileForm(noAge).ok).toBe(false);

    const noTerms = validForm();
    noTerms.delete("consent_terms");
    expect(parseProfileForm(noTerms).ok).toBe(false);
  });
});
