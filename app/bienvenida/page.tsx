import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ShareButton } from "@/components/ShareButton";
import { requireOnboarded } from "@/lib/auth/gate";
import { WELCOME_COOKIE } from "@/lib/auth/onboarding";
import { APP_HOME_PATH } from "@/lib/auth/routes";
import { continueToApp } from "./actions";

/**
 * The one-time post-onboarding Share prompt (spec #29 / user story 15): "comparte
 * con tu equipo", reusing the header's Share component. It is reachable only as
 * `createProfile`'s redirect target — the gate below enforces that. An Onboarded
 * athlete who never came through creation (no one-shot cookie) is bounced to
 * Pines, so a bookmark or refresh after continuing never re-shows it; that is what
 * makes it one-time by construction. A signed-out or not-yet-Onboarded visitor is
 * sent to sign-in or onboarding respectively.
 *
 * Forced dynamic: it reads the session and the one-shot cookie per request.
 */
export const dynamic = "force-dynamic";

export default async function WelcomePage() {
  await requireOnboarded();

  const cookieStore = await cookies();
  if (!cookieStore.get(WELCOME_COOKIE)?.value) redirect(APP_HOME_PATH);

  const t = await getTranslations("Welcome");

  return (
    <main
      data-testid="welcome"
      className="flex min-h-full flex-1 flex-col items-center justify-center gap-6 px-6 py-24 text-center"
    >
      <div className="flex max-w-md flex-col gap-3">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {t("title")}
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">{t("body")}</p>
      </div>

      <ShareButton />

      <form action={continueToApp}>
        <button
          type="submit"
          data-testid="welcome-continue"
          className="text-base font-medium text-zinc-900 underline underline-offset-4 transition-colors hover:text-zinc-600 dark:text-zinc-100 dark:hover:text-zinc-400"
        >
          {t("continue")}
        </button>
      </form>
    </main>
  );
}
