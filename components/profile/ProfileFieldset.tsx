import { getLocale, getTranslations } from "next-intl/server";
import {
  DEFAULT_SHOW_ME,
  type Gender,
  MAX_BIO_LENGTH,
  MAX_DISPLAY_NAME_LENGTH,
  type ShowMe,
} from "@/lib/auth/profile-form";
import {
  DELEGATIONS,
  delegationName,
  DISCIPLINES,
  disciplineName,
} from "@/lib/vocab";

/**
 * The six shared profile fields — name, delegation, sport, gender, show-me, bio —
 * rendered identically for onboarding's step-2 form and the Perfil edit form
 * (issue #35), so both offer the exact same controls the shared `parseProfileFields`
 * validates. It renders only the fields (a fragment), never the surrounding form,
 * its submit, or the consent checkboxes: those differ between creation and editing
 * and stay with each page. Labels come from the `Onboarding` message namespace —
 * the one source for these field labels wherever they appear.
 *
 * `defaults` prefills the edit form from the stored profile; omitting it
 * reproduces the empty onboarding form exactly — no gender pre-selected (the
 * choice is required) and show-me at its `everyone` default.
 */
export const fieldClass =
  "rounded-lg border border-zinc-300 px-4 py-2.5 text-base outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-transparent dark:focus:border-zinc-100";

const GENDER_OPTIONS = [
  { value: "woman", labelKey: "genderWoman" },
  { value: "man", labelKey: "genderMan" },
  { value: "nonbinary", labelKey: "genderNonbinary" },
] as const satisfies readonly { value: Gender; labelKey: string }[];

const SHOW_ME_OPTIONS = [
  { value: "women", labelKey: "showMeWomen" },
  { value: "men", labelKey: "showMeMen" },
  { value: "everyone", labelKey: "showMeEveryone" },
] as const satisfies readonly { value: ShowMe; labelKey: string }[];

export type ProfileFieldDefaults = {
  displayName?: string;
  delegation?: string;
  sport?: string;
  gender?: Gender;
  showMe?: ShowMe;
  bio?: string | null;
};

export async function ProfileFieldset({
  defaults,
}: {
  defaults?: ProfileFieldDefaults;
}) {
  const t = await getTranslations("Onboarding");
  const locale = await getLocale();

  // Resolve each picker option's label through the shared vocab helpers rather
  // than re-inlining the locale ternary (the codes are from the vocabulary, so
  // the `?? d.code` fallback never fires — it only satisfies the type).
  const delegations = DELEGATIONS.map((d) => ({
    code: d.code,
    name: delegationName(d.code, locale) ?? d.code,
  }));
  const disciplines = DISCIPLINES.map((d) => ({
    code: d.code,
    name: disciplineName(d.code, locale) ?? d.code,
  }));

  const selectedShowMe = defaults?.showMe ?? DEFAULT_SHOW_ME;

  return (
    <>
      {/* Name or nickname. */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="display_name" className="text-sm font-medium">
          {t("nameLabel")}
        </label>
        <input
          id="display_name"
          name="display_name"
          type="text"
          required
          maxLength={MAX_DISPLAY_NAME_LENGTH}
          defaultValue={defaults?.displayName ?? ""}
          placeholder={t("namePlaceholder")}
          data-testid="profile-name"
          className={fieldClass}
        />
        <p className="text-xs text-zinc-500">{t("nameHelp")}</p>
      </div>

      {/* Delegation picker. */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="delegation" className="text-sm font-medium">
          {t("delegationLabel")}
        </label>
        <select
          id="delegation"
          name="delegation"
          required
          defaultValue={defaults?.delegation ?? ""}
          data-testid="profile-delegation"
          className={fieldClass}
        >
          <option value="" disabled>
            {t("delegationPlaceholder")}
          </option>
          {delegations.map((d) => (
            <option key={d.code} value={d.code}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      {/* Sport picker. */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="sport" className="text-sm font-medium">
          {t("sportLabel")}
        </label>
        <select
          id="sport"
          name="sport"
          required
          defaultValue={defaults?.sport ?? ""}
          data-testid="profile-sport"
          className={fieldClass}
        >
          <option value="" disabled>
            {t("sportPlaceholder")}
          </option>
          {disciplines.map((d) => (
            <option key={d.code} value={d.code}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      {/* Gender — required, no default unless prefilled. */}
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium">{t("genderLabel")}</legend>
        {GENDER_OPTIONS.map((o) => (
          <label key={o.value} className="flex items-center gap-2 text-base">
            <input
              type="radio"
              name="gender"
              value={o.value}
              required
              defaultChecked={defaults?.gender === o.value}
              className="h-4 w-4"
            />
            {t(o.labelKey)}
          </label>
        ))}
      </fieldset>

      {/* Show me — defaults to everyone (issue #4) unless prefilled. */}
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium">{t("showMeLabel")}</legend>
        {SHOW_ME_OPTIONS.map((o) => (
          <label key={o.value} className="flex items-center gap-2 text-base">
            <input
              type="radio"
              name="show_me"
              value={o.value}
              defaultChecked={selectedShowMe === o.value}
              className="h-4 w-4"
            />
            {t(o.labelKey)}
          </label>
        ))}
      </fieldset>

      {/* Optional bio, capped at ~160 characters. */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="bio" className="text-sm font-medium">
          {t("bioLabel")}
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={3}
          maxLength={MAX_BIO_LENGTH}
          defaultValue={defaults?.bio ?? ""}
          placeholder={t("bioPlaceholder")}
          data-testid="profile-bio"
          className={fieldClass}
        />
        <p className="text-xs text-zinc-500">{t("bioHelp")}</p>
      </div>
    </>
  );
}
