-- Profile photos: the one-photo / one-state pending model (issue #36, spec #29,
-- issue #5). Three append-only additions over the profiles migration (ADR 0001 —
-- never edit a pushed file):
--
--   1. profiles.photo_path + photo_state — where a photo lives and its moderation
--      state. Both on the PUBLIC row: a viewer must know whether to render the
--      photo (approved) or the placeholder. photo_state is not sensitive — it is
--      the render gate, and the UI never shows a peer another athlete's pending/
--      rejected state; the generic rejection notice is the owner's alone.
--
--   2. public.set_profile_photo() — the ONLY in-app photo transition. It always
--      moves state to 'pending' and can never set 'approved'/'rejected': that
--      state machine belongs to cluster 5, and until the admin panel ships the two
--      terminal states are flipped by hand in the Supabase dashboard. The RPC
--      recomputes the canonical path itself, so the client never supplies one.
--
--   3. A private `profile-photos` Storage bucket + owner-only object RLS. No
--      client SELECT policy exists, so there are NO direct public/authenticated
--      reads: the sole read path is a short-lived signed URL minted by the
--      service role in lib/auth/profile.ts, gated by the visibility rule in
--      lib/auth/profile-photo.ts. The app also WRITES via the service role,
--      binding the object path to the session's user id, so a caller can only ever
--      write their own `<uid>/photo` (see the write-policy note below for why).

-- ADR 0004 (deletion completeness is structural): these are the app's first
-- user-owned Storage objects. The photo_path/photo_state columns live on
-- `profiles`, which cascades from auth.users, so the rows go on account deletion —
-- but the bucket OBJECT has no user FK and will NOT. When self-serve deletion
-- ships (cluster 5) its Storage purge MUST remove `<uid>/photo` from this bucket,
-- or a deleted athlete's photo outlives their account. Nothing writes such objects
-- before that feature except this one, so there is no orphan to backfill today.

-- 1. Photo columns. photo_path is the Storage object key; photo_state is the
-- moderation state (null = no photo). The state CHECK mirrors PHOTO_STATES in
-- lib/auth/profile-photo.ts. Idempotent per column (safe to re-run before the
-- consistency constraint is added below).
alter table public.profiles
  add column if not exists photo_path text,
  add column if not exists photo_state text
    check (photo_state is null or photo_state in ('pending', 'approved', 'rejected'));

-- Path and state move together: a photo is either wholly present (both set) or
-- wholly absent (both null) — never a path with no state, nor a state pointing at
-- nothing. Guarded by a catalog check so the whole migration stays re-runnable
-- (ADD CONSTRAINT has no IF NOT EXISTS form for table constraints).
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_photo_consistent'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_photo_consistent
      check ((photo_path is null) = (photo_state is null));
  end if;
end $$;

-- 2. set_profile_photo: the app's only path→state write, the sibling of
-- update_profile. SECURITY INVOKER (default) so the UPDATE runs as the caller and
-- the owner-update RLS policy authorises it; the id is auth.uid(), never a
-- parameter, so a caller can only ever touch their own row. It hardcodes
-- state = 'pending' and the canonical path `<uid>/photo` — the app literally
-- cannot set 'approved'/'rejected', and the path here MUST match
-- profilePhotoPath() in lib/auth/profile-photo.ts (the two halves the upload and
-- the render rely on agreeing). search_path pinned empty, every name qualified.
create or replace function public.set_profile_photo()
returns void
language plpgsql
security invoker
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

-- 3. The private bucket. Not public, so nothing is served without a signed URL.
-- file_size_limit / allowed_mime_types mirror MAX_PHOTO_BYTES and
-- ALLOWED_PHOTO_TYPES in lib/auth/profile-photo.ts — defence in depth behind the
-- app's own validation. Idempotent via ON CONFLICT.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-photos',
  'profile-photos',
  false,
  5242880, -- 5 MiB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- Owner-write object RLS, folder-scoped by auth id: the first path segment of the
-- object name must be the caller's uid, so a client — where the Storage API
-- authenticates it — can write ONLY its own `<uid>/photo`. INSERT covers the first
-- upload; UPDATE covers a replacement upsert. There is deliberately NO select or
-- delete policy for any client role — with RLS enabled and no read policy, direct
-- reads and listings are denied outright; the service role (which bypasses RLS) is
-- the only reader, and only to mint a signed URL. DROP … IF EXISTS keeps the
-- CREATEs re-runnable. (storage.objects already has RLS enabled by Supabase.)
--
-- IMPORTANT — why the app uploads via the service role, not the owner's client:
-- this project's Storage API does not verify end-user JWTs. It treats even a valid
-- authenticated upload as anonymous, so NO `to authenticated` policy ever admits a
-- real client write — an athlete's own client cannot write here at all. The app
-- therefore uploads through the service role (lib/auth/profile.ts) with the path
-- bound to the session's user id. These owner-write policies are kept as defence
-- in depth for a Storage service that DOES verify user JWTs (e.g. if that changes,
-- or on another project); there they enforce the same folder scoping. They use
-- `auth.jwt() ->> 'sub'` — the storage-safe way to read the subject — rather than
-- `auth.uid()`, which the profiles-table policies use but which is unreliable in
-- the Storage RLS context.
drop policy if exists "Owners can upload their own profile photo" on storage.objects;
create policy "Owners can upload their own profile photo"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = (select auth.jwt() ->> 'sub')
  );

drop policy if exists "Owners can replace their own profile photo" on storage.objects;
create policy "Owners can replace their own profile photo"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = (select auth.jwt() ->> 'sub')
  )
  with check (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = (select auth.jwt() ->> 'sub')
  );
