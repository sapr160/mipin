import { getTranslations } from "next-intl/server";

/**
 * Onboarding stub (issue #31). The callback routes a profile-less sign-in here;
 * cluster 3.3 replaces this with the real DOB gate + profile form (and its own
 * session/age-wall guard). Kept deliberately minimal until then.
 */
export const dynamic = "force-dynamic";

export default async function RegistroPage() {
  const t = await getTranslations("Onboarding");
  const stub = await getTranslations("Stub");

  return (
    <main className="flex min-h-full flex-1 flex-col items-center justify-center gap-3 px-6 py-24 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
      <p className="text-lg text-zinc-500">{stub("comingSoon")}</p>
    </main>
  );
}
