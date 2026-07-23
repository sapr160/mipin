import "server-only";

/** The minimum age to use mipin (spec #29 / issue #32). */
export const MIN_AGE = 18;

/**
 * Older than any living person — a DOB implying an age beyond this is treated as
 * malformed input, not a real age claim, so a fat-fingered year (e.g. 0195) is a
 * form error rather than a silent "eligible".
 */
const MAX_AGE = 120;

/**
 * The result of validating a submitted date of birth. `{ valid: false }` means
 * the input wasn't a usable calendar date at all (empty, malformed, in the
 * future, or absurdly old) — the caller re-prompts. `{ valid: true }` carries the
 * normalized `YYYY-MM-DD` date and the server's eligibility verdict.
 */
export type DobResult =
  | { valid: false }
  | { valid: true; dob: string; eligible: boolean };

/**
 * Validate a raw date-of-birth string from the onboarding step-1 form and decide
 * eligibility. The server owns this verdict end to end: the client sends only the
 * raw date, never whether it thinks the user is old enough (issue #32).
 *
 * Everything is computed in UTC so the answer doesn't drift with the server's
 * local time zone; a sub-day skew at the exact midnight of an 18th birthday is
 * immaterial to an age gate. A garbled or future date fails validation and is
 * surfaced as a form error — it is deliberately NOT recorded as an under-18
 * rejection, because a malformed date is not an age claim.
 */
export function checkDob(raw: unknown, now: Date = new Date()): DobResult {
  if (typeof raw !== "string") return { valid: false };

  // The native <input type="date"> submits YYYY-MM-DD; accept exactly that.
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw.trim());
  if (!match) return { valid: false };

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  // Reject impossible dates. Building the date in UTC and checking the parts
  // round-trip catches overflow like 2021-02-31 (which would roll into March).
  const asUtc = new Date(Date.UTC(year, month - 1, day));
  if (
    asUtc.getUTCFullYear() !== year ||
    asUtc.getUTCMonth() !== month - 1 ||
    asUtc.getUTCDate() !== day
  ) {
    return { valid: false };
  }

  const todayYear = now.getUTCFullYear();
  const todayMonth = now.getUTCMonth() + 1;
  const todayDay = now.getUTCDate();

  // Whether the birth month/day falls later in the calendar year than today's —
  // the shared test behind both "born in the future" and "hasn't reached this
  // year's birthday yet".
  const birthdayLaterInYear =
    month > todayMonth || (month === todayMonth && day > todayDay);

  const bornInFuture =
    year > todayYear || (year === todayYear && birthdayLaterInYear);
  if (bornInFuture) return { valid: false };

  // Whole years lived: the year gap, minus one if this year's birthday is still
  // ahead of today.
  let age = todayYear - year;
  if (birthdayLaterInYear) age -= 1;

  if (age > MAX_AGE) return { valid: false };

  return { valid: true, dob: raw.trim(), eligible: age >= MIN_AGE };
}
