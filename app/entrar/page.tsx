import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { SignInForm } from "@/components/auth/SignInForm";
import { getSessionUser } from "@/lib/auth/session";
import { APP_HOME_PATH } from "@/lib/auth/routes";

/**
 * The sign-in page (issue #31 / user story 1), the dedicated destination of the
 * Landing CTA. Carries the non-affiliation line, bilingual copy (via the cookie
 * locale, ADR 0002), the primary Google button and the magic-link fallback.
 *
 * An already-signed-in visitor is bounced into the app (user story 6) so they
 * never see a stale sign-in flow. Reuses the Shell's Header/Footer for the
 * toggle, share prompt and legal links, matching the Landing.
 *
 * Forced dynamic: it reads the session per request and the Footer reads
 * `KOFI_URL` per request.
 */
export const dynamic = "force-dynamic";

export default async function EntrarPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await getSessionUser()) redirect(APP_HOME_PATH);

  // A failed code exchange bounces back here with `?error=` (see the callback).
  // Surface it as one generic notice — never which code — so the "soft failure"
  // the callback promises is actually visible, without leaking exchange details.
  const failed = Boolean((await searchParams).error);

  const t = await getTranslations("SignIn");
  const landing = await getTranslations("Landing");

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <Header />
      <main className="flex flex-1 flex-col items-center gap-8 px-6 py-12 text-center">
        <div className="flex max-w-xl flex-col gap-3">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {t("title")}
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            {t("lede")}
          </p>
        </div>

        {/* The non-affiliation line, reusing the Landing's exact wording. */}
        <p
          data-testid="signin-non-affiliation"
          className="max-w-xl rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200"
        >
          {landing("nonAffiliation")}
        </p>

        {failed && (
          <p
            data-testid="signin-error"
            role="alert"
            className="max-w-sm rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-800 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200"
          >
            {t("error")}
          </p>
        )}

        <SignInForm />
      </main>
      <Footer />
    </div>
  );
}
