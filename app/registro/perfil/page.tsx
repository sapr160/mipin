import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { createProfile } from "../actions";
import { DOB_COOKIE } from "@/lib/auth/onboarding";
import { ONBOARDING_PATH } from "@/lib/auth/routes";
import {
  DEFAULT_SHOW_ME,
  type Gender,
  MAX_BIO_LENGTH,
  MAX_DISPLAY_NAME_LENGTH,
  type ShowMe,
} from "@/lib/auth/profile-form";
import { DELEGATIONS, DISCIPLINES } from "@/lib/vocab";

/**
 * Onboarding step 2 (issue #34): the one profile form. Reached only once the
 * step-1 gate accepts an 18+ DOB, which is carried here in a short-lived cookie;
 * a visit without it means step 1 wasn't done, so bounce back to it rather than
 * show a form that can't be submitted. The onboarding layout still owns the
 * session/wall/onboarded gate around this route.
 *
 * A plain Server Action form — no client JS. Native constraints (`required`,
 * `maxLength`, a placeholder `<option>`) are UX affordances only; `createProfile`
 * re-validates every field server-side and re-renders here with a generic notice
 * on failure. The pickers are the bilingual vocabulary (issue #33), labelled in
 * the request's language.
 *
 * Forced dynamic: it reads the locale, the DOB cookie, and the error flag per
 * request.
 */
export const dynamic = "force-dynamic";

const GENDER_OPTIONS = [
  { value: "woman", labelKey: "genderWoman" },
  { value: "man", labelKey: "genderMan" },
  { value: "nonbinary", labelKey: "genderNonbinary" },
] as const satisfies readonly { value: Gender; labelKey: string }[];

const SHOW_ME_OPTIONS = [
  { value: "women", labelKey: "showMeWomen" },
  { value: "men", labelKey: "showMeMen" },
  { value: "everyone", labelKey: "showMeEveryone" },
] as const satisfies readonly { value: ShowMe; labelKey: string }[];

const fieldClass =
  "rounded-lg border border-zinc-300 px-4 py-2.5 text-base outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-transparent dark:focus:border-zinc-100";

export default async function OnboardingProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const cookieStore = await cookies();
  if (!cookieStore.get(DOB_COOKIE)?.value) redirect(ONBOARDING_PATH);

  const t = await getTranslations("Onboarding");
  const locale = await getLocale();
  const invalid = Boolean((await searchParams).error);

  const delegations = DELEGATIONS.map((d) => ({
    code: d.code,
    name: locale === "en" ? d.en : d.es,
  }));
  const disciplines = DISCIPLINES.map((d) => ({
    code: d.code,
    name: locale === "en" ? d.en : d.es,
  }));

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
          {/* Name or nickname. */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="display_name" className="text-sm font-medium">
              {t("nameLabel")}
            </label>
            <input
              id="display_name"
              name="display_name"
              type="text"
              required
              maxLength={MAX_DISPLAY_NAME_LENGTH}
              placeholder={t("namePlaceholder")}
              data-testid="profile-name"
              className={fieldClass}
            />
            <p className="text-xs text-zinc-500">{t("nameHelp")}</p>
          </div>

          {/* Delegation picker. */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="delegation" className="text-sm font-medium">
              {t("delegationLabel")}
            </label>
            <select
              id="delegation"
              name="delegation"
              required
              defaultValue=""
              data-testid="profile-delegation"
              className={fieldClass}
            >
              <option value="" disabled>
                {t("delegationPlaceholder")}
              </option>
              {delegations.map((d) => (
                <option key={d.code} value={d.code}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sport picker. */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="sport" className="text-sm font-medium">
              {t("sportLabel")}
            </label>
            <select
              id="sport"
              name="sport"
              required
              defaultValue=""
              data-testid="profile-sport"
              className={fieldClass}
            >
              <option value="" disabled>
                {t("sportPlaceholder")}
              </option>
              {disciplines.map((d) => (
                <option key={d.code} value={d.code}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Gender — required, no default. */}
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-medium">
              {t("genderLabel")}
            </legend>
            {GENDER_OPTIONS.map((o) => (
              <label key={o.value} className="flex items-center gap-2 text-base">
                <input
                  type="radio"
                  name="gender"
                  value={o.value}
                  required
                  className="h-4 w-4"
                />
                {t(o.labelKey)}
              </label>
            ))}
          </fieldset>

          {/* Show me — defaults to everyone (issue #4). */}
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-medium">
              {t("showMeLabel")}
            </legend>
            {SHOW_ME_OPTIONS.map((o) => (
              <label key={o.value} className="flex items-center gap-2 text-base">
                <input
                  type="radio"
                  name="show_me"
                  value={o.value}
                  defaultChecked={o.value === DEFAULT_SHOW_ME}
                  className="h-4 w-4"
                />
                {t(o.labelKey)}
              </label>
            ))}
          </fieldset>

          {/* Optional bio, capped at ~160 characters. */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="bio" className="text-sm font-medium">
              {t("bioLabel")}
            </label>
            <textarea
              id="bio"
              name="bio"
              rows={3}
              maxLength={MAX_BIO_LENGTH}
              placeholder={t("bioPlaceholder")}
              data-testid="profile-bio"
              className={fieldClass}
            />
            <p className="text-xs text-zinc-500">{t("bioHelp")}</p>
          </div>

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
