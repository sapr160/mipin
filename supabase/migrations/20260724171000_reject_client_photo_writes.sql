-- Enforce the "moderation columns are not client-writable" invariant (issue #36
-- follow-up, completing 20260724170000_lock_photo_moderation.sql).
--
-- Why a trigger, not grants: the pending model requires that photo_state/photo_path
-- can only be set by set_profile_photo() (which hardcodes 'pending') or by an operator
-- (the service role / dashboard). A client must never PATCH them directly. Column
-- REVOKE can't achieve this — Supabase grants `authenticated`/`anon` a TABLE-wide
-- UPDATE that subsumes any column REVOKE — and revoking the whole table UPDATE would
-- break update_profile() (SECURITY INVOKER: it writes the card fields AS the caller,
-- so the caller needs table UPDATE). RLS can't express it either (a policy can't
-- compare OLD vs NEW to permit the RPC's write while forbidding a direct one). A
-- row-level trigger keyed on the effective role can, and targets exactly these two
-- columns without having to enumerate every other client-writable column now and
-- forever.
--
-- The role check: PostgREST runs each request under the caller's role — `authenticated`
-- for a signed-in user, `anon` otherwise (that is `current_user` inside the trigger).
-- set_profile_photo() is now SECURITY DEFINER (170000), so its UPDATE runs as the
-- function owner `postgres`, and the operator/dashboard runs as `postgres`/`service_role`.
-- So: block a write to the two columns when, and only when, `current_user` is one of
-- the two client roles; every other role (the definer RPC, the service role, an
-- operator) passes through. This is what actually closes the self-approve /
-- path-repoint hole.
--
-- SECURITY INVOKER (default) is correct: the trigger reads current_user, OLD and NEW
-- only — it needs no elevated privilege, and it must observe the REAL invoking role,
-- not an owner. search_path pinned empty, every name schema-qualified.
create or replace function public.reject_client_photo_writes()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('authenticated', 'anon') then
    if tg_op = 'INSERT' then
      if new.photo_path is not null or new.photo_state is not null then
        raise exception
          'photo_path/photo_state are set only via set_profile_photo() or an operator';
      end if;
    elsif tg_op = 'UPDATE' then
      if new.photo_path is distinct from old.photo_path
         or new.photo_state is distinct from old.photo_state then
        raise exception
          'photo_path/photo_state are set only via set_profile_photo() or an operator';
      end if;
    end if;
  end if;
  return new;
end;
$$;

-- One BEFORE trigger for both verbs. DROP … IF EXISTS keeps the CREATE re-runnable
-- (CREATE TRIGGER has no OR REPLACE before PG14-era syntax we rely on portably).
drop trigger if exists reject_client_photo_writes on public.profiles;
create trigger reject_client_photo_writes
  before insert or update on public.profiles
  for each row execute function public.reject_client_photo_writes();
