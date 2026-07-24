import { expect, test } from "@playwright/test";
import { DELEGATIONS, DISCIPLINES } from "@/lib/vocab";

/**
 * Vocabulary invariants for the delegations & disciplines module (issue #33 /
 * spec #29), asserted at the repo's single standing seam. This spec drives no
 * page and no server — it exercises the exported source arrays directly — but
 * lives with the e2e suite because Playwright is the only test runner the repo
 * wires (see playwright.config.ts). It's the guard that keeps the two
 * source-of-truth arrays honest — right counts, unique stable codes, no
 * half-translated row — before either the UI or a future CHECK-constraint
 * generator reads them. The underlying data and its citations live in
 * research/delegations-sports.md (issue #13), not duplicated here.
 */

// A recognized ISO 3166-1 region resolves to a human-readable name; an
// unassigned but well-formed code (e.g. "ZZ") echoes back unchanged. Full-ICU
// Node returns the localized name, so `of(code) !== code` is a
// dependency-free "is this a real, assigned region?" check.
const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

/**
 * The invariants every bilingual vocabulary term shares regardless of what its
 * `code` means: both names present, and no name reused within a language. Kept
 * as one helper so both vocabularies are held to the identical bar; each
 * vocabulary's code-shaped invariants (ISO region vs URL-safe slug) stay in its
 * own block, where they differ.
 */
function assertBilingualTerms(
  terms: readonly { code: string; es: string; en: string }[],
) {
  for (const term of terms) {
    expect(term.es.trim(), `${term.code} ES name`).not.toBe("");
    expect(term.en.trim(), `${term.code} EN name`).not.toBe("");
  }
  const es = terms.map((t) => t.es);
  const en = terms.map((t) => t.en);
  expect(new Set(es).size, "ES names are unique").toBe(es.length);
  expect(new Set(en).size, "EN names are unique").toBe(en.length);
}

test.describe("delegations vocabulary", () => {
  test("ships exactly the 37 participating delegations", () => {
    expect(DELEGATIONS).toHaveLength(37);
  });

  test("every code is a valid, unique ISO 3166-1 alpha-2 code", () => {
    const codes = DELEGATIONS.map((d) => d.code);
    for (const code of codes) {
      expect(code, `${code} is two uppercase letters`).toMatch(/^[A-Z]{2}$/);
      expect(
        regionNames.of(code),
        `${code} is an assigned ISO 3166-1 region`,
      ).not.toBe(code);
    }
    expect(new Set(codes).size, "codes are unique").toBe(codes.length);
  });

  test("has complete, unique bilingual names", () => {
    assertBilingualTerms(DELEGATIONS);
  });
});

test.describe("disciplines vocabulary", () => {
  test("ships exactly the 55 official picker disciplines", () => {
    expect(DISCIPLINES).toHaveLength(55);
  });

  test("every code is a unique, URL-safe slug", () => {
    const codes = DISCIPLINES.map((d) => d.code);
    for (const code of codes) {
      // Lowercase alphanumerics in hyphen-separated segments — safe as a URL
      // path segment and as a stored CHECK-constraint value, no escaping.
      expect(code, `${code} is a kebab-case slug`).toMatch(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      );
    }
    expect(new Set(codes).size, "slugs are unique").toBe(codes.length);
  });

  test("has complete, unique bilingual names", () => {
    assertBilingualTerms(DISCIPLINES);
  });
});
