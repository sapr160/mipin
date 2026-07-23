/**
 * The auth flow's canonical paths, in one place so the sign-in page, the Shell
 * gate, the callback route, and the sign-out action can't disagree.
 *
 * Slugs are Spanish per ADR 0002 (`/entrar` = sign in, `/registro` = onboarding).
 * `/registro` is a stub in cluster 3.2 (issue #31); cluster 3.3 fills in the real
 * DOB gate + profile form behind it.
 */
export const LANDING_PATH = "/";
export const SIGN_IN_PATH = "/entrar";
export const ONBOARDING_PATH = "/registro";
export const APP_HOME_PATH = "/pines";

/** The OAuth/magic-link redirect target — one code-exchange handler for both. */
export const AUTH_CALLBACK_PATH = "/auth/callback";
