/**
 * First-touch source (domain term): where a visitor first arrived from — `qr` or
 * `share` — captured once and never overwritten (spec #18 / ADR 0002). Framework-
 * free so both writers share it: the proxy stores the first valid `?src=` in the
 * cookie on the first visit, and the profile-creation action copies that cookie
 * onto `profiles_private` at onboarding (issue #34). One definition of the cookie
 * name and the allow-list, so the two sides can't disagree.
 */

/** The cookie the proxy writes and the profile action reads. */
export const SRC_COOKIE = "mipin_src";

/** The only sources mipin attributes; anything else is ignored. */
export const ALLOWED_SRC = ["qr", "share"] as const;
export type FirstTouchSource = (typeof ALLOWED_SRC)[number];

const allowed = new Set<string>(ALLOWED_SRC);

/**
 * Normalise a raw `?src=` / cookie value to a known first-touch source, or
 * `null` for anything unrecognised (including absent). Used by the proxy to
 * decide what to persist and by the action to decide what to copy.
 */
export function readFirstTouch(
  value: string | undefined | null,
): FirstTouchSource | null {
  return typeof value === "string" && allowed.has(value)
    ? (value as FirstTouchSource)
    : null;
}
