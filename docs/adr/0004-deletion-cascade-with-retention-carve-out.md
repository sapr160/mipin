# Deletion is an `auth.users` cascade; reports and bans survive via SET NULL

Self-serve account deletion (Legal basics #8) is implemented as one service-role call — `auth.admin.deleteUser` after a Storage purge — with the database doing the rest: every user-referencing foreign key is `ON DELETE CASCADE`. The sole carve-out is moderation evidence: reports and bans reference users with `ON DELETE SET NULL` and denormalize enough context (reason, dates, snapshotted details) to stay meaningful after the user row is gone.

## Consequences

- Every future table that references a user must pick a side at creation time: CASCADE (the default — listings, likes, matches, consents, want-lists) or SET NULL + snapshot (only if it is moderation evidence). No third option; retrofitting is the failure mode this ADR exists to prevent.
- Deletion completeness is structural, not procedural — there is no clean-up job to keep in sync with the schema. The privacy policy's "immediate, complete deletion" claim rests on these FKs.
- The cluster 5 report/block schema is bound by the carve-out shape before it is designed.
