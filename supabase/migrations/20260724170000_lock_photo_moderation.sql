-- Lock down the photo-moderation columns (issue #36 follow-up). The pending model
-- rests on ONE invariant: the only in-app photo transition is "→ pending", and the
-- two terminal states (approved/rejected) are flipped only by an operator in the
-- Supabase dashboard (the service role) until the admin panel ships (cluster 5).
-- The 20260724161500_profile_photos migration enforced that invariant in the WRONG
-- layer: set_profile_photo() hardcodes 'pending', but nothing stopped a client from
-- writing photo_state DIRECTLY. The owner-update RLS policy on public.profiles
-- ("Owners can update their own profile") is ROW-scoped (auth.uid() = id) but not
-- COLUMN-scoped, and Supabase's default table grants give `authenticated`/`anon`
-- UPDATE on every column — so an athlete could `PATCH /profiles?id=eq.<uid>` with
-- {"photo_state":"approved"} straight through PostgREST with the browser's
-- publishable key and self-approve, never touching the RPC. (Same hole let a client
-- point photo_path at another athlete's `<uid>/photo` and have the render helper
-- sign it as their own.) That defeats the hand-moderation stopgap the spec says
-- "must genuinely work".
--
-- RLS can't express "this column is read-only to clients" (a policy's WITH CHECK
-- can't compare OLD vs NEW to allow set_profile_photo's write while forbidding a
-- direct one). This migration lands the ENABLER; the enforcing block is the trigger
-- in 20260724171000_reject_client_photo_writes.sql. Two parts:
--
--   1. A column-level REVOKE of INSERT/UPDATE on (photo_path, photo_state) from the
--      two CLIENT roles. NOTE — this is DEFENCE IN DEPTH ONLY, not the fix: Supabase
--      grants `authenticated`/`anon` a TABLE-wide UPDATE, and a table-level grant
--      subsumes column-level ones, so a column REVOKE alone does NOT stop the direct
--      PATCH (the privilege still flows from the table grant). Revoking the whole
--      table UPDATE instead would break update_profile (SECURITY INVOKER, runs as the
--      caller). Hence the trigger in 171000 does the real enforcement; these REVOKEs
--      only matter if the grant model is ever tightened to column level. `service_role`
--      is deliberately untouched — it is the operator/dashboard path that flips
--      approved/rejected (and that the live e2e uses to stand in for the dashboard).
--
--   2. set_profile_photo() becomes SECURITY DEFINER — the load-bearing change. It now
--      runs as its owner (`postgres`), NOT the caller, which is what lets the 171000
--      trigger allow the RPC's write (owner role) while rejecting a direct client
--      write (authenticated/anon role). It is redefined identically otherwise — still
--      hardcodes state = 'pending' and the canonical `<uid>/photo` path, still derives
--      the row from (select auth.uid()) and raises for an anonymous caller, so the only
--      reachable transition remains "→ pending" and a caller can still only ever touch
--      their OWN row. profiles does not FORCE row-level security, so as the table owner
--      the definer bypasses RLS and that explicit `where id = v_uid` is what scopes the
--      write — the same guarantee the invoker version got from the owner-update policy.

-- 1. Column REVOKE (defence in depth; see note above — the trigger in 171000 enforces).
-- Idempotent (revoking a privilege that isn't held is a no-op), so this stays re-runnable.
revoke insert (photo_path, photo_state) on public.profiles from anon, authenticated;
revoke update (photo_path, photo_state) on public.profiles from anon, authenticated;

-- 2. Re-create set_profile_photo as SECURITY DEFINER. Body is byte-for-byte the
-- 20260724161500 version except `security invoker` → `security definer`; search_path
-- stays pinned empty and every name schema-qualified (the definer hardening rule).
create or replace function public.set_profile_photo()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null then
    raise exception 'set_profile_photo requires an authenticated caller';
  end if;

  update public.profiles
  set photo_path = v_uid::text || '/photo',
      photo_state = 'pending'
  where id = v_uid;
end;
$$;
