import { ALLOWED_PHOTO_TYPES } from "@/lib/auth/profile-photo";

/**
 * The profile-photo file input, shared by onboarding step 2 and the Perfil
 * upload/replace form (issue #36) — the same DRY-the-shared-control pattern as
 * `ProfileFieldset`, so both offer the identical `photo` field the actions
 * validate through `validatePhotoUpload`. It renders only the labelled input and
 * its help line (never the surrounding form, its submit, or the replace warning),
 * which differ between the two callers and stay with each page.
 *
 * `required` differs by caller: onboarding's photo is optional (left empty, the
 * form still submits); Perfil's dedicated upload form requires a file. The
 * `accept` filter mirrors the bucket's allowed types so the picker only offers
 * valid images. Labels/help come from each page's message namespace.
 */
export function PhotoField({
  label,
  help,
  required = false,
}: {
  label: string;
  help: string;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="photo" className="text-sm font-medium">
        {label}
      </label>
      <input
        id="photo"
        name="photo"
        type="file"
        required={required}
        accept={ALLOWED_PHOTO_TYPES.join(",")}
        data-testid="profile-photo-input"
        className="text-sm file:mr-3 file:rounded-lg file:border file:border-zinc-300 file:bg-transparent file:px-3 file:py-1.5 file:text-sm file:font-medium dark:file:border-zinc-700"
      />
      <p className="text-xs text-zinc-500">{help}</p>
    </div>
  );
}
