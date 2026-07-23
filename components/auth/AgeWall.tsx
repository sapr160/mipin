import { getTranslations } from "next-intl/server";
import { signOut } from "@/app/actions/auth";

/**
 * The Age wall (domain term): the permanent refusal shown to any auth account
 * that ever submitted an under-18 date of birth (spec #29 / issue #32). Rendered
 * by the onboarding layout whenever a rejection row exists, so it sticks to the
 * account on every later visit and sign-in — it is not a retry dialog.
 *
 * Its only action is a sign-out link (spec user story 10), so the device isn't
 * locked to the refused account. Sign-out is the shared Server Action form, so it
 * works without client JS, exactly like the Perfil control.
 */
export async function AgeWall() {
  const t = await getTranslations("AgeWall");
  const auth = await getTranslations("Auth");

  return (
    <main
      data-testid="age-wall"
      className="flex min-h-full flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center"
    >
      <h1 className="max-w-md text-2xl font-semibold tracking-tight sm:text-3xl">
        {t("title")}
      </h1>
      <p className="max-w-md text-lg text-zinc-600 dark:text-zinc-400">
        {t("body")}
      </p>
      <form action={signOut} className="mt-2">
        <button
          type="submit"
          data-testid="sign-out"
          className="text-base font-medium text-zinc-900 underline underline-offset-4 transition-colors hover:text-zinc-600 dark:text-zinc-100 dark:hover:text-zinc-400"
        >
          {auth("signOut")}
        </button>
      </form>
    </main>
  );
}
