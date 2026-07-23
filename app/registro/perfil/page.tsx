import { getTranslations } from "next-intl/server";

/**
 * Onboarding step 2 — the profile form — reached only once the 18+ gate passes
 * (issue #32). A deliberate stub for now: the profile-table ticket replaces it
 * with the real form (name, delegation, sport, gender, consents, optional photo)
 * and the server action that creates the profile in one transaction. Until then,
 * reaching here proves an eligible DOB was accepted without any profile data
 * being written yet.
 *
 * The onboarding layout guards this route too, so a walled account never lands
 * here.
 */
export const dynamic = "force-dynamic";

export default async function OnboardingProfilePage() {
  const t = await getTranslations("Onboarding");
  const stub = await getTranslations("Stub");

  return (
    <main
      data-testid="onboarding-step2"
      className="flex min-h-full flex-1 flex-col items-center justify-center gap-3 px-6 py-24 text-center"
    >
      <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
      <p className="text-lg text-zinc-500">{stub("comingSoon")}</p>
    </main>
  );
}
