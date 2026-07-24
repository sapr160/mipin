import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { signOut } from "@/app/actions/auth";
import { updateProfile } from "./actions";
import { ProfileCard } from "@/components/profile/ProfileCard";
import {
  fieldClass,
  ProfileFieldset,
} from "@/components/profile/ProfileFieldset";
import { createClient } from "@/lib/supabase/server";
import { getOwnProfile } from "@/lib/auth/profile";
import { ONBOARDING_PATH, SIGN_IN_PATH } from "@/lib/auth/routes";

/**
 * The Perfil tab — profile management (issue #35). An Onboarded athlete sees
 * their own public card (the same `ProfileCard` other features will render) and
 * an edit form over every profile field, plus the private WhatsApp number and
 * sign-out. The Shell layout has already admitted only Onboarded users; this page
 * re-reads the session to fetch the row and would bounce a just-deleted account.
 *
 * All server-rendered, no client JS: editing is a Server Action form validated by
 * `updateProfile`, which re-renders here with a saved or error notice.
 *
 * Forced dynamic: it reads the session, the profile, the locale, and the notice
 * flags per request.
 */
export const dynamic = "force-dynamic";

export default async function PerfilPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(SIGN_IN_PATH);

  const profile = await getOwnProfile(supabase, user.id);
  if (!profile) redirect(ONBOARDING_PATH);

  const t = await getTranslations("Profile");
  const auth = await getTranslations("Auth");
  const locale = await getLocale();
  const params = await searchParams;
  const saved = Boolean(params.saved);
  const invalid = Boolean(params.error);

  return (
    <div className="flex flex-1 flex-col items-center px-6 py-10">
      <div className="flex w-full max-w-md flex-col gap-8">
        <section className="flex flex-col gap-4">
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <ProfileCard
            displayName={profile.displayName}
            delegation={profile.delegation}
            sport={profile.sport}
            bio={profile.bio}
            locale={locale}
          />
        </section>

        <section className="flex flex-col gap-6">
          <h2 className="text-lg font-semibold tracking-tight">
            {t("editTitle")}
          </h2>

          {saved && (
            <p
              data-testid="profile-saved"
              role="status"
              className="rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-sm font-medium text-green-800 dark:border-green-500/40 dark:bg-green-500/10 dark:text-green-200"
            >
              {t("saved")}
            </p>
          )}
          {invalid && (
            <p
              data-testid="profile-error"
              role="alert"
              className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-800 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200"
            >
              {t("error")}
            </p>
          )}

          <form action={updateProfile} className="flex flex-col gap-6">
            <ProfileFieldset
              defaults={{
                displayName: profile.displayName,
                delegation: profile.delegation,
                sport: profile.sport,
                gender: profile.gender,
                showMe: profile.showMe,
                bio: profile.bio,
              }}
            />

            {/* WhatsApp number — optional, private, E.164 on save (issue #35). */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="whatsapp" className="text-sm font-medium">
                {t("whatsappLabel")}
              </label>
              <input
                id="whatsapp"
                name="whatsapp"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                defaultValue={profile.whatsapp ?? ""}
                placeholder={t("whatsappPlaceholder")}
                data-testid="profile-whatsapp"
                className={fieldClass}
              />
              <p className="text-xs text-zinc-500">{t("whatsappHelp")}</p>
            </div>

            <button
              type="submit"
              data-testid="profile-save"
              className="mt-2 rounded-lg bg-zinc-900 px-6 py-3 text-base font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {t("save")}
            </button>
          </form>
        </section>

        <div className="flex justify-center border-t border-zinc-200 pt-8 dark:border-zinc-800">
          <form action={signOut}>
            <button
              type="submit"
              data-testid="sign-out"
              className="rounded-lg border border-zinc-300 px-6 py-2.5 text-base font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
            >
              {auth("signOut")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
