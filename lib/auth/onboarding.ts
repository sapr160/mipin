import "server-only";

/**
 * The two transient cookies of the onboarding flow (issue #34). Both are
 * short-lived and server-managed — not the 400-day locale/first-touch cookies —
 * so they name their own lifetime here rather than borrowing `COOKIE_MAX_AGE`.
 */

/**
 * Carries the DOB the step-1 gate accepted forward to step 2. httpOnly and
 * minutes-long: the client carries the eligible date across the two-step form,
 * and the step-2 action re-validates it (the server never trusts it twice, spec
 * #29) and clears it on success.
 */
export const DOB_COOKIE = "mipin_dob";

/**
 * The one-shot flag `createProfile` sets so the `/bienvenida` Share prompt shows
 * exactly once — the interstitial is reachable only with this cookie present, and
 * continuing to Pines clears it. That is what makes the "comparte con tu equipo"
 * prompt one-time by construction (spec #29 / user story 15).
 */
export const WELCOME_COOKIE = "mipin_welcome";

/** Both onboarding cookies expire in 30 minutes — long enough to finish the form. */
export const ONBOARDING_COOKIE_MAX_AGE = 60 * 30;
