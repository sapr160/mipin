/**
 * The auth flow's canonical paths, in one place so the sign-in page, the Shell
 * gate, the callback route, and the sign-out action can't disagree.
 *
 * Slugs are Spanish per ADR 0002 (`/entrar` = sign in, `/registro` = onboarding).
 * Onboarding is two steps under `/registro`: step 1 is the date-of-birth gate
 * (issue #32); step 2 is the profile form that creates the profile (issue #34),
 * which then lands on the one-time Share prompt at `/bienvenida` before the app.
 */
export const LANDING_PATH = "/";
export const SIGN_IN_PATH = "/entrar";
export const ONBOARDING_PATH = "/registro";
/** Onboarding step 2 — the profile form. Reached only after the 18+ gate passes. */
export const ONBOARDING_PROFILE_PATH = "/registro/perfil";
/**
 * The one-time post-onboarding Share prompt interstitial ("comparte con tu
 * equipo"). Reachable only as `createProfile`'s redirect target, guarded by a
 * one-shot cookie; a direct visit bounces to the app (issue #34 / user story 15).
 */
export const WELCOME_PATH = "/bienvenida";
export const APP_HOME_PATH = "/pines";
/** The Perfil tab — profile management (issue #35) and the sign-out home. */
export const PERFIL_PATH = "/perfil";

/** The OAuth/magic-link redirect target — one code-exchange handler for both. */
export const AUTH_CALLBACK_PATH = "/auth/callback";
