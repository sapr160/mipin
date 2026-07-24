"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { WELCOME_COOKIE } from "@/lib/auth/onboarding";
import { APP_HOME_PATH } from "@/lib/auth/routes";

/**
 * Dismiss the one-time "comparte con tu equipo" Share prompt and enter the app
 * (issue #34). Clearing the flag is what makes the interstitial one-time: with
 * the cookie gone, any later visit to `/bienvenida` finds no flag and bounces to
 * Pines. Runs as a Server Action so the cookie clear rides the redirect response.
 */
export async function continueToApp() {
  const cookieStore = await cookies();
  cookieStore.delete(WELCOME_COOKIE);
  redirect(APP_HOME_PATH);
}
