import { delegationName, disciplineName } from "@/lib/vocab";
import { photoPlaceholder, type ProfilePhoto } from "@/lib/auth/profile-photo";

/**
 * An athlete's public card — the single renderer for a profile's public fields,
 * used by the Perfil tab for the owner's own card and by every future feature
 * (feeds, swipe, trade proposals) that shows an athlete (issue #35). Delegation
 * and sport arrive as stored codes and are resolved to names in `locale`; an
 * unrecognised code (one retired from the vocabulary) falls back to the raw code
 * rather than vanishing.
 *
 * The photo (issue #36) is already resolved to a decision by the caller (via
 * `resolveProfilePhoto`): a `photo` with a signed URL renders the image — with
 * the `pendingLabel` badge when it's the owner's not-yet-approved photo — and its
 * absence renders the neutral placeholder, the display name's initial on a disc
 * whose colour is derived from the name. This component never mints URLs or reads
 * state; it just draws what it's given.
 *
 * Presentational and framework-light — it takes plain values and reads no
 * session — so it renders anywhere a caller has resolved the public fields.
 */
export function ProfileCard({
  displayName,
  delegation,
  sport,
  bio,
  locale,
  photo,
  pendingLabel,
}: {
  displayName: string;
  delegation: string;
  sport: string;
  bio: string | null;
  locale: string;
  photo?: ProfilePhoto | null;
  pendingLabel?: string;
}) {
  const delegationLabel = delegationName(delegation, locale) ?? delegation;
  const sportLabel = disciplineName(sport, locale) ?? sport;

  return (
    <article
      data-testid="profile-card"
      className="flex flex-col items-center gap-4 rounded-2xl border border-zinc-200 px-6 py-8 text-center dark:border-zinc-800"
    >
      {photo ? (
        <div className="relative h-24 w-24">
          {/* eslint-disable-next-line @next/next/no-img-element -- a private, per-request signed URL, not an optimisable static asset. */}
          <img
            src={photo.url}
            alt=""
            data-testid="profile-photo"
            className="h-24 w-24 rounded-full object-cover"
          />
          {photo.pending && pendingLabel ? (
            <span
              data-testid="profile-photo-pending"
              className="absolute inset-x-0 bottom-0 rounded-b-full bg-black/65 px-1 py-0.5 text-[10px] font-medium leading-tight text-white"
            >
              {pendingLabel}
            </span>
          ) : null}
        </div>
      ) : (
        <PlaceholderDisc displayName={displayName} />
      )}

      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold tracking-tight">{displayName}</h2>
        <p className="text-sm text-zinc-500">
          {delegationLabel} · {sportLabel}
        </p>
      </div>

      {bio ? (
        <p className="max-w-prose text-base text-zinc-600 dark:text-zinc-300">
          {bio}
        </p>
      ) : null}
    </article>
  );
}

/**
 * The no-photo placeholder: the athlete's initial on a disc whose hue is a stable
 * hash of the name (issue #36). Decorative — the name is the heading right below
 * it — so it's hidden from assistive tech.
 */
function PlaceholderDisc({ displayName }: { displayName: string }) {
  const { initial, hue } = photoPlaceholder(displayName);
  return (
    <div
      data-testid="profile-photo-placeholder"
      aria-hidden="true"
      className="flex h-24 w-24 items-center justify-center rounded-full text-3xl font-semibold text-white"
      style={{ backgroundColor: `hsl(${hue} 55% 45%)` }}
    >
      {initial}
    </div>
  );
}
