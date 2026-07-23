"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTabBadges } from "@/components/tab-badge/TabBadgeProvider";
import { type TabKey } from "@/components/tab-badge/types";

/**
 * The four Tabs (spec #20 / domain "Tab"). Routes keep their Spanish slugs (one
 * canonical URL per page, ADR 0002) while the labels translate. The bar is
 * bottom-fixed and full-width so every target sits in the thumb zone on mobile.
 * Each Tab renders its unread badge from the Tab-badge provider (spec #22).
 */
const TABS: readonly { href: string; key: TabKey }[] = [
  { href: "/pines", key: "pines" },
  { href: "/intercambios", key: "intercambios" },
  { href: "/matches", key: "matches" },
  { href: "/perfil", key: "perfil" },
];

export function TabBar() {
  const t = useTranslations("Nav");
  const pathname = usePathname();
  const { counts } = useTabBadges();

  return (
    <nav
      aria-label={t("label")}
      className="fixed inset-x-0 bottom-0 z-10 flex border-t border-zinc-200 bg-background dark:border-zinc-800"
    >
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        const count = counts[tab.key] ?? 0;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`relative flex min-h-14 flex-1 items-center justify-center gap-1.5 px-2 py-2 text-sm transition-colors ${
              active
                ? "font-semibold text-foreground"
                : "text-zinc-500 hover:text-foreground"
            }`}
          >
            {t(tab.key)}
            {count > 0 ? (
              <span
                aria-label={t("unread", { count })}
                className="inline-flex min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-xs font-semibold text-white"
              >
                {count}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
