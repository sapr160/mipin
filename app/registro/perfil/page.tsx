import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createProfile } from "../actions";
import { ProfileFieldset } from "@/components/profile/ProfileFieldset";
import { DOB_COOKIE } from "@/lib/auth/onboarding";
import { ONBOARDING_PATH } from "@/lib/auth/routes";

/**
 * Onboarding step 2 (issue #34): the one profile form. Reached only once the
 * step-1 gate accepts an 18+ DOB, which is carried here in a short-lived cookie;
 * a visit without it means step 1 wasn't done, so bounce back to it rather than
 * show a form that can't be submitted. The onboarding layout still owns the
 * session/wall/onboarded gate around this route.
 *
 * A plain Server Action form — no client JS. The shared `ProfileFieldset` renders
 * the six profile fields (identical to the Perfil edit form); this page adds only
 * the two required consent checkboxes and the submit. Native constraints are UX
 * affordances only; `createProfile` re-validates every field server-side and
 * re-renders here with a generic notice on failure.
 *
 * Forced dynamic: it reads the locale, the DOB cookie, and the error flag per
 * request.
 */
export const dynamic = "force-dynamic";

export default async function OnboardingProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const cookieStore = await cookies();
  if (!cookieStore.get(DOB_COOKIE)?.value) redirect(ONBOARDING_PATH);

  const t = await getTranslations("Onboarding");
  const invalid = Boolean((await searchParams).error);

  return (
    <main
      data-testid="onboarding-step2"
      className="flex min-h-full flex-1 flex-col items-center px-6 py-12"
    >
      <div className="flex w-full max-w-md flex-col gap-6">
        <div className="flex flex-col gap-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {t("title")}
          </h1>
          <p className="text-base text-zinc-600 dark:text-zinc-400">
            {t("formLede")}
          </p>
        </div>

        {invalid && (
          <p
            data-testid="profile-error"
            role="alert"
            className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-800 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200"
          >
            {t("formError")}
          </p>
        )}

        <form action={createProfile} className="flex flex-col gap-6">
          <ProfileFieldset />

          {/* The two required consent checkboxes (spec user story 14). */}
          <div className="flex flex-col gap-3">
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                name="consent_age"
                required
                data-testid="consent-age"
                className="mt-0.5 h-4 w-4"
              />
              <span>{t("consentAge")}</span>
            </label>
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                name="consent_terms"
                required
                data-testid="consent-terms"
                className="mt-0.5 h-4 w-4"
              />
              <span>
                {t.rich("consentTerms", {
                  terms: (chunks) => (
                    <Link
                      href="/terminos"
                      className="underline underline-offset-2"
                    >
                      {chunks}
                    </Link>
                  ),
                  privacy: (chunks) => (
                    <Link
                      href="/privacidad"
                      className="underline underline-offset-2"
                    >
                      {chunks}
                    </Link>
                  ),
                })}
              </span>
            </label>
          </div>

          <button
            type="submit"
            data-testid="profile-submit"
            className="mt-2 rounded-lg bg-zinc-900 px-6 py-3 text-base font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {t("submit")}
          </button>
        </form>
      </div>
    </main>
  );
}
