import { expect, test } from "@playwright/test";
import { normalizeWhatsApp, parseProfileEdit } from "@/lib/auth/profile-form";
import {
  DELEGATIONS,
  delegationName,
  DISCIPLINES,
  disciplineName,
} from "@/lib/vocab";

/**
 * The Perfil-tab edit seam's pure validators (issue #35), asserted directly like
 * profile-form.spec.ts. The edit action delegates every field decision to these,
 * so this is where the "same validation as onboarding, plus an E.164 WhatsApp
 * number" contract is pinned — no page, no database.
 */

test.describe("normalizeWhatsApp", () => {
  test("treats an empty or whitespace-only value as no number (null)", () => {
    expect(normalizeWhatsApp("")).toEqual({ ok: true, value: null });
    expect(normalizeWhatsApp("   ")).toEqual({ ok: true, value: null });
    expect(normalizeWhatsApp(null)).toEqual({ ok: true, value: null });
  });

  test("keeps an already-E.164 number unchanged", () => {
    expect(normalizeWhatsApp("+18095551234")).toEqual({
      ok: true,
      value: "+18095551234",
    });
  });

  test("strips spaces, hyphens, parentheses and dots down to E.164", () => {
    expect(normalizeWhatsApp("+1 (809) 555-1234")).toEqual({
      ok: true,
      value: "+18095551234",
    });
    expect(normalizeWhatsApp("  +52.55.1234.5678  ")).toEqual({
      ok: true,
      value: "+525512345678",
    });
  });

  test("rejects a number without the leading + (no country code to assume)", () => {
    expect(normalizeWhatsApp("8095551234").ok).toBe(false);
    expect(normalizeWhatsApp("00 809 555 1234").ok).toBe(false);
  });

  test("rejects letters or other junk", () => {
    expect(normalizeWhatsApp("+1809CALLME").ok).toBe(false);
    expect(normalizeWhatsApp("not a number").ok).toBe(false);
  });

  test("rejects a leading +0 and an over-length (>15 digit) number", () => {
    expect(normalizeWhatsApp("+0123456789").ok).toBe(false);
    expect(normalizeWhatsApp("+1234567890123456").ok).toBe(false);
  });
});

const DELEGATION = DELEGATIONS[0].code;
const SPORT = DISCIPLINES[0].code;

/** A fully valid edit submission — no consents (those are creation gates). */
function validEdit(overrides: Record<string, string> = {}): FormData {
  const fd = new FormData();
  fd.set("display_name", "Pincoya");
  fd.set("delegation", DELEGATION);
  fd.set("sport", SPORT);
  fd.set("gender", "woman");
  fd.set("show_me", "everyone");
  fd.set("bio", "");
  fd.set("whatsapp", "");
  for (const [key, value] of Object.entries(overrides)) fd.set(key, value);
  return fd;
}

test.describe("parseProfileEdit", () => {
  test("accepts a valid submission with the fields plus a normalized number", () => {
    const result = parseProfileEdit(
      validEdit({ display_name: "  Pincoya  ", whatsapp: "+1 (809) 555-1234" }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.values).toEqual({
      displayName: "Pincoya",
      delegation: DELEGATION,
      sport: SPORT,
      gender: "woman",
      showMe: "everyone",
      bio: null,
      whatsapp: "+18095551234",
    });
  });

  test("does not require consent checkboxes (they are creation-only gates)", () => {
    // No consent fields are ever set on an edit; it must still validate.
    expect(parseProfileEdit(validEdit()).ok).toBe(true);
  });

  test("reports an empty number as null", () => {
    const result = parseProfileEdit(validEdit({ whatsapp: "   " }));
    expect(result.ok && result.values.whatsapp).toBe(null);
  });

  test("rejects the submission when a profile field is invalid", () => {
    expect(parseProfileEdit(validEdit({ delegation: "ZZ" })).ok).toBe(false);
    expect(parseProfileEdit(validEdit({ display_name: "  " })).ok).toBe(false);
    expect(parseProfileEdit(validEdit({ gender: "robot" })).ok).toBe(false);
  });

  test("rejects the submission when the number is present but not E.164", () => {
    expect(parseProfileEdit(validEdit({ whatsapp: "809-555-1234" })).ok).toBe(
      false,
    );
  });
});

test.describe("delegationName / disciplineName", () => {
  test("resolve a code to its name in the requested language", () => {
    expect(delegationName("DO", "es")).toBe("República Dominicana");
    expect(delegationName("DO", "en")).toBe("Dominican Republic");
    expect(disciplineName("athletics", "es")).toBe("Atletismo");
    expect(disciplineName("athletics", "en")).toBe("Athletics");
  });

  test("default to Spanish for any non-English locale", () => {
    expect(delegationName("DO", "fr")).toBe(delegationName("DO", "es"));
    expect(disciplineName("athletics", "pt")).toBe(
      disciplineName("athletics", "es"),
    );
  });

  test("return undefined for an unknown code", () => {
    expect(delegationName("ZZ", "es")).toBeUndefined();
    expect(disciplineName("quidditch", "en")).toBeUndefined();
  });

  test("cover every vocabulary row in both languages", () => {
    for (const d of DELEGATIONS) {
      expect(delegationName(d.code, "es")).toBe(d.es);
      expect(delegationName(d.code, "en")).toBe(d.en);
    }
    for (const d of DISCIPLINES) {
      expect(disciplineName(d.code, "es")).toBe(d.es);
      expect(disciplineName(d.code, "en")).toBe(d.en);
    }
  });
});
