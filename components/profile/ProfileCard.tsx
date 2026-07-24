import { delegationName, disciplineName } from "@/lib/vocab";

/**
 * An athlete's public card — the single renderer for a profile's public fields,
 * used by the Perfil tab for the owner's own card and by every future feature
 * (feeds, swipe, trade proposals) that shows an athlete (issue #35). Delegation
 * and sport arrive as stored codes and are resolved to names in `locale`; an
 * unrecognised code (one retired from the vocabulary) falls back to the raw code
 * rather than vanishing. The photo slot is the no-photo placeholder until real
 * photos ship (ticket 7).
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
}: {
  displayName: string;
  delegation: string;
  sport: string;
  bio: string | null;
  locale: string;
}) {
  const delegationLabel = delegationName(delegation, locale) ?? delegation;
  const sportLabel = disciplineName(sport, locale) ?? sport;

  return (
    <article
      data-testid="profile-card"
      className="flex flex-col items-center gap-4 rounded-2xl border border-zinc-200 px-6 py-8 text-center dark:border-zinc-800"
    >
      {/* No-photo placeholder until ticket 7 adds real photos. */}
      <div
        data-testid="profile-photo-placeholder"
        aria-hidden="true"
        className="flex h-24 w-24 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500"
      >
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-12 w-12"
          role="presentation"
        >
          <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5Z" />
        </svg>
      </div>

      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold tracking-tight">{displayName}</h2>
        <p className="text-sm text-zinc-500">
          {delegationLabel} · {sportLabel}
        </p>
      </div>

      {bio ? <p className="max-w-prose text-base text-zinc-600 dark:text-zinc-300">{bio}</p> : null}
    </article>
  );
}
