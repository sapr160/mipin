import { useTranslations } from "next-intl";
import { LocaleToggle } from "@/components/LocaleToggle";

export default function Home() {
  const t = useTranslations("Home");

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-24 text-center">
      <div className="absolute right-4 top-4">
        <LocaleToggle />
      </div>
      <h1 className="text-5xl font-semibold tracking-tight">mipin</h1>
      <p className="text-lg text-zinc-600 dark:text-zinc-400">{t("tagline")}</p>
      <p className="max-w-md text-sm leading-6 text-zinc-500 dark:text-zinc-500">
        {t("disclaimer")}
      </p>
    </main>
  );
}
