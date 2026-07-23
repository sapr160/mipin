import { getTranslations } from "next-intl/server";
import { submitDob } from "./actions";

/**
 * Onboarding step 1 (issue #32): the date-of-birth gate. It asks only for a DOB
 * so nothing else is shared before the account is confirmed eligible (spec user
 * story 7). The gate (session, wall, onboarded checks) lives in the layout; this
 * page is just the form.
 *
 * A plain Server Action form — no client JS. The server owns the verdict
 * (`submitDob`): the native date input is a UX affordance and its `max`/`min` are
 * hints only, re-validated server-side. An invalid submission bounces back with
 * `?error=invalid`, surfaced as one inline notice.
 *
 * Forced dynamic: it reads the locale and today's date per request.
 */
export const dynamic = "force-dynamic";

export default async function OnboardingDobPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const t = await getTranslations("Onboarding");
  const invalid = Boolean((await searchParams).error);

  // Today's date (UTC) as the input's max, so a birth date can't be in the
  // future in the picker. The server re-checks regardless.
  const today = new Date().toISOString().slice(0, 10);

  return (
    <main className="flex min-h-full flex-1 flex-col items-center justify-center gap-6 px-6 py-24">
      <div className="flex max-w-md flex-col gap-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {t("dobTitle")}
        </h1>
        <p className="text-base text-zinc-600 dark:text-zinc-400">
          {t("dobLede")}
        </p>
      </div>

      {invalid && (
        <p
          data-testid="dob-error"
          role="alert"
          className="max-w-sm rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-800 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200"
        >
          {t("dobError")}
        </p>
      )}

      <form
        action={submitDob}
        className="flex w-full max-w-sm flex-col gap-2 text-left"
      >
        <label htmlFor="dob" className="text-sm font-medium">
          {t("dobLabel")}
        </label>
        <input
          id="dob"
          name="dob"
          type="date"
          required
          max={today}
          data-testid="dob-input"
          className="rounded-lg border border-zinc-300 px-4 py-2.5 text-base outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-transparent dark:focus:border-zinc-100"
        />
        <button
          type="submit"
          data-testid="dob-submit"
          className="mt-2 rounded-lg bg-zinc-900 px-6 py-3 text-base font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {t("dobSubmit")}
        </button>
      </form>
    </main>
  );
}
