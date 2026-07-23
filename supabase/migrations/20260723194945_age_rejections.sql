-- age_rejections: the permanent 18+ refusal, keyed to the auth account
-- (spec #29, issue #32, domain term "Age wall"). The DOB gate's server action
-- writes exactly one row here for any account that ever submits an under-18 date
-- of birth; the row's existence is what every later visit and sign-in checks to
-- render the Age wall instead of onboarding. Keyed to the auth user id only —
-- no email is retained.
--
-- Delete behaviour: ON DELETE CASCADE, the default side of ADR 0004 (every user
-- FK cascades; the sole SET NULL carve-out is moderation evidence — reports and
-- bans — which this is not). Self-serve account deletion therefore takes the
-- rejection with it, which is correct: nothing survives a deleted account.
--
-- RLS is owner-select-only. The owner's own session may read its single row —
-- that read is what the onboarding layout uses to decide wall vs. form — and NO
-- policy grants insert, update, or delete to any client role. With RLS enabled
-- and no permissive write policy, client writes are denied outright; the only
-- writer is the DOB gate's server action through the service role, which bypasses
-- RLS. That is the "no client writes" guarantee.

create table public.age_rejections (
  user_id uuid primary key references auth.users (id) on delete cascade,
  submitted_dob date not null,
  created_at timestamptz not null default now()
);

alter table public.age_rejections enable row level security;

-- Owner-select-only: an account can read its own rejection (drives the wall),
-- and nothing more. `(select auth.uid())` is wrapped in a subselect so Postgres
-- caches it per statement (the recommended RLS pattern) rather than re-evaluating
-- it per row.
create policy "Owners can read their own age rejection"
  on public.age_rejections
  for select
  to authenticated
  using ((select auth.uid()) = user_id);
