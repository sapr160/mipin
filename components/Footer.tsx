import { useTranslations } from "next-intl";

/** Legal pages get one canonical Spanish slug each (ADR 0002). */
const LEGAL = [
  { href: "/terminos", key: "terms" },
  { href: "/privacidad", key: "privacy" },
  { href: "/encuentros-seguros", key: "safety" },
] as const;

/**
 * The Shell footer: the name-only non-affiliation line (zero official marks),
 * placeholder links to the three legal pages, and a Ko-fi tip-jar link that
 * renders only when `KOFI_URL` is set. The env is read at request time — the
 * app is dynamic (cookie-based locale), so the same build serves both states.
 */
export function Footer() {
  const t = useTranslations("Footer");
  const kofiUrl = process.env.KOFI_URL;

  return (
    <footer className="border-t border-zinc-200 px-4 py-6 text-center text-xs text-zinc-500 dark:border-zinc-800">
      <p className="mx-auto max-w-md leading-5">{t("nonAffiliation")}</p>
      <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1">
        {LEGAL.map((link) => (
          <a key={link.href} href={link.href} className="hover:text-foreground">
            {t(link.key)}
          </a>
        ))}
        {kofiUrl ? (
          <a
            href={kofiUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground"
          >
            {t("kofi")}
          </a>
        ) : null}
      </div>
    </footer>
  );
}
