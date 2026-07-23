import Link from "next/link";
import { useTranslations } from "next-intl";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";

/**
 * The Landing (issue #21 / domain "Landing"): the logged-out homepage the QR
 * code and share links open. A one-screen bilingual pitch — pin exchange front
 * and center, the swipe side framed neutrally (decision from #4: "conoce
 * atletas de otras delegaciones", no dating-app branding), a note that sharing
 * improves your own feed, a prominent non-affiliation line, and a single CTA to
 * the sign-in page `/entrar` (issue #31 / user story 1).
 *
 * It wears the Shell's Header (toggle + Share) and Footer, but not the tab bar:
 * a logged-out visitor has no tabs to badge yet.
 *
 * Forced dynamic so the Footer's `KOFI_URL` read happens per request rather
 * than being inlined at build time — matching the Shell layout.
 */
export const dynamic = "force-dynamic";

export default function Landing() {
  const t = useTranslations("Landing");

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <Header />
      <main className="flex flex-1 flex-col items-center gap-10 px-6 py-12 text-center">
        <div className="flex max-w-xl flex-col gap-3">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            {t("heroTitle")}
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            {t("heroLede")}
          </p>
        </div>

        {/*
         * The non-affiliation line, prominent per issue #21 (AC 3): a bordered
         * callout right under the hero, not footer-style fine print — a repeat
         * of the Footer's claim, kept deliberately louder and higher on the page.
         */}
        <p
          data-testid="landing-non-affiliation"
          className="max-w-xl rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200"
        >
          {t("nonAffiliation")}
        </p>

        <div className="flex w-full max-w-xl flex-col gap-4">
          {/* Pins lead — the core of the app. */}
          <section
            data-testid="pins-pitch"
            className="rounded-xl border border-zinc-200 p-5 text-left dark:border-zinc-800"
          >
            <h2 className="text-xl font-semibold">{t("pinsTitle")}</h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {t("pinsBody")}
            </p>
          </section>

          {/* Swipe, framed neutrally (#4) — no dating-app language. */}
          <section
            data-testid="swipe-pitch"
            className="rounded-xl border border-zinc-200 p-5 text-left dark:border-zinc-800"
          >
            <h2 className="text-xl font-semibold">{t("swipeTitle")}</h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {t("swipeBody")}
            </p>
          </section>
        </div>

        <p
          data-testid="share-note"
          className="max-w-md text-sm text-zinc-600 dark:text-zinc-400"
        >
          {t("shareNote")}
        </p>

        <Link
          data-testid="landing-cta"
          href="/entrar"
          className="rounded-lg bg-zinc-900 px-6 py-3 text-base font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {t("cta")}
        </Link>
      </main>
      <Footer />
    </div>
  );
}
