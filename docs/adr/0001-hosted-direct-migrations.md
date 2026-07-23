# Migrations run against the hosted Supabase database directly, no local Docker DB

Schema changes live as checked-in SQL files in `supabase/migrations/` (`supabase migration new <name>`, hand-written SQL) and are applied to the hosted project with `supabase db push`. We deliberately skip the local Docker database (`supabase start`) and Supabase's paid GitHub-integration branching: the Games are live now, the app has a solo operator, and one fewer moving part beats the safety of a local shadow DB. Mitigation: `db push` previews the diff before applying, and pre-launch the production DB holds nothing irreplaceable.

## Consequences

- Migrations are append-only once pushed; never edit a pushed migration file.
- The dashboard SQL editor is for inspection/emergencies only — any schema change made there must be immediately backfilled as a migration file, or the checked-in history stops being the truth.
- If a local dev DB is ever wanted post-launch, `supabase start` can replay the same migration history — nothing blocks reversal.
