import { isDelegationCode, isDisciplineCode } from "@/lib/vocab";

/**
 * The step-2 profile form's field vocabulary and its single server-side
 * validator (issue #34 / spec #29). Pure and framework-free — no session, no
 * database — so the form page renders its options from these constants and the
 * `createProfile` action validates every submission through `parseProfileForm`,
 * one source of truth for both. The action never trusts the client's fields; a
 * tampered or JS-off submission that skips a control fails here exactly as an
 * empty one does.
 */

/** Gender values, per spec #29: woman / man / non-binary–other. */
export const GENDERS = ["woman", "man", "nonbinary"] as const;
export type Gender = (typeof GENDERS)[number];

/** "Show me" audiences, per spec #29 / issue #4; `everyone` is the default. */
export const SHOW_ME = ["women", "men", "everyone"] as const;
export type ShowMe = (typeof SHOW_ME)[number];

/** The pre-selected "show me" value (issue #4): show everyone unless narrowed. */
export const DEFAULT_SHOW_ME: ShowMe = "everyone";

/** Name-or-nickname cap — a display name, not a legal document. */
export const MAX_DISPLAY_NAME_LENGTH = 50;

/** The optional bio's ~160-character ceiling (spec user story 13). */
export const MAX_BIO_LENGTH = 160;

/** The validated profile fields, ready to persist. Consents are gates, not fields. */
export type ProfileFields = {
  displayName: string;
  delegation: string;
  sport: string;
  gender: Gender;
  showMe: ShowMe;
  bio: string | null;
};

export type ProfileFormResult =
  | { ok: true; values: ProfileFields }
  | { ok: false };

function isGender(value: unknown): value is Gender {
  return (
    typeof value === "string" && (GENDERS as readonly string[]).includes(value)
  );
}

function isShowMe(value: unknown): value is ShowMe {
  return (
    typeof value === "string" && (SHOW_ME as readonly string[]).includes(value)
  );
}

/** A trimmed string value, or `""` for anything that isn't a string field. */
function trimmed(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * A checkbox submits a value only when ticked, and nothing when unticked — so a
 * present, non-empty value is the "checked" signal and absence is "unchecked".
 */
function isChecked(value: FormDataEntryValue | null): boolean {
  return typeof value === "string" && value.length > 0;
}

/**
 * Validate a step-2 submission end to end. Returns the persist-ready fields when
 * every required control is present and in range, else `{ ok: false }` with no
 * detail — the action re-renders the form generically rather than narrating which
 * field a tampering client omitted. The bio is the only optional field; empty or
 * whitespace-only collapses to `null` so a blank textarea stores no bio.
 */
export function parseProfileForm(formData: FormData): ProfileFormResult {
  const displayName = trimmed(formData.get("display_name"));
  if (!displayName || displayName.length > MAX_DISPLAY_NAME_LENGTH) {
    return { ok: false };
  }

  const delegation = formData.get("delegation");
  if (!isDelegationCode(delegation)) return { ok: false };

  const sport = formData.get("sport");
  if (!isDisciplineCode(sport)) return { ok: false };

  const gender = formData.get("gender");
  if (!isGender(gender)) return { ok: false };

  const showMe = formData.get("show_me");
  if (!isShowMe(showMe)) return { ok: false };

  const bioText = trimmed(formData.get("bio"));
  const bio = bioText.length === 0 ? null : bioText;
  if (bio !== null && bio.length > MAX_BIO_LENGTH) return { ok: false };

  // Both checkboxes are required (spec user story 14): 18+/accuracy and ToS +
  // Privacy. Their acceptance is recorded as timestamps by the creation RPC, so
  // they gate the submission but carry no stored value here.
  if (
    !isChecked(formData.get("consent_age")) ||
    !isChecked(formData.get("consent_terms"))
  ) {
    return { ok: false };
  }

  return {
    ok: true,
    values: { displayName, delegation, sport, gender, showMe, bio },
  };
}
