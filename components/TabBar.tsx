"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

/**
 * The four Tabs (spec #20 / domain "Tab"). Routes keep their Spanish slugs (one
 * canonical URL per page, ADR 0002) while the labels translate. The bar is
 * bottom-fixed and full-width so every target sits in the thumb zone on mobile.
 */
const TABS = [
  { href: "/pines", key: "pines" },
  { href: "/intercambios", key: "intercambios" },
  { href: "/matches", key: "matches" },
  { href: "/perfil", key: "perfil" },
] as const;

export function TabBar() {
  const t = useTranslations("Nav");
  const pathname = usePathname();

  return (
    <nav
      aria-label={t("label")}
      className="fixed inset-x-0 bottom-0 z-10 flex border-t border-zinc-200 bg-background dark:border-zinc-800"
    >
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-14 flex-1 items-center justify-center px-2 py-2 text-sm transition-colors ${
              active
                ? "font-semibold text-foreground"
                : "text-zinc-500 hover:text-foreground"
            }`}
          >
            {t(tab.key)}
          </Link>
        );
      })}
    </nav>
  );
}
