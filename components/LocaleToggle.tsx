"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { setLocale } from "@/app/actions/locale";
import { locales, type Locale } from "@/i18n/config";

/**
 * Compact ES/EN switch. Persists the choice via a server action (cookie) and
 * refreshes the server components so every string re-renders in the new locale.
 */
export function LocaleToggle() {
  const t = useTranslations("LocaleToggle");
  const active = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function choose(locale: Locale) {
    if (locale === active) return;
    startTransition(async () => {
      await setLocale(locale);
      router.refresh();
    });
  }

  return (
    <div
      className="inline-flex items-center gap-1 text-sm"
      role="group"
      aria-label={t("label")}
    >
      {locales.map((locale) => {
        const isActive = locale === active;
        return (
          <button
            key={locale}
            type="button"
            onClick={() => choose(locale)}
            disabled={isPending}
            aria-pressed={isActive}
            className={`rounded px-2 py-1 font-medium transition-colors ${
              isActive
                ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            {t(locale)}
          </button>
        );
      })}
    </div>
  );
}
