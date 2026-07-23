import { useTranslations } from "next-intl";

/** Canonical URL used when `APP_URL` is not configured (dev / tests). */
const DEFAULT_APP_URL = "http://localhost:3000";

/**
 * The Share prompt: a one-tap `wa.me/?text=` link (no Web Share API branch, per
 * spec #20) carrying the pre-written message in the current language and ending
 * in the app URL tagged `?src=share` so shared traffic is attributed as a
 * first-touch source. Server-rendered, so the message re-renders in the new
 * language whenever the toggle refreshes the tree.
 */
export function ShareButton() {
  const t = useTranslations("Share");

  const appUrl = new URL("/", process.env.APP_URL ?? DEFAULT_APP_URL);
  appUrl.searchParams.set("src", "share");

  const message = t("message", { url: appUrl.toString() });
  const href = `https://wa.me/?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t("label")}
      className="inline-flex items-center gap-1 rounded bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
    >
      <span aria-hidden>↗</span>
      {t("label")}
    </a>
  );
}
