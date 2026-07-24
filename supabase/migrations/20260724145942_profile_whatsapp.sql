-- WhatsApp number + profile editing (issue #35, spec #29). Two additions, both
-- append-only over the profiles migration (ADR 0001 — never edit a pushed file):
--
--   1. profiles_private.whatsapp — the owner's WhatsApp number, stored once and
--      readable by NO other user. It lives in the private row, so the existing
--      owner-only RLS already hides it cross-account; this migration adds NO new
--      policy and NO reveal mechanism of any kind (that ships with the match/trade
--      reveal features, not here). Optional and E.164-normalised by the app; the
--      CHECK mirrors lib/auth/profile-form.ts WHATSAPP_PATTERN as defence in depth.
--
--   2. public.update_profile() — the Perfil tab's edit transaction, the sibling of
--      create_profile(): one atomic function that updates the editable public card
--      fields and the private show-me/WhatsApp fields together, so an edit can't
--      half-apply across the two rows.

-- Idempotent per the acceptance criteria ("adds the column if not already
-- present"): re-running is a no-op. E.164 = a leading '+', a non-zero country-code
-- digit, then up to 14 more digits (15 max). Postgres ARE reads \+ as a literal +
-- and \d as a digit under the default standard_conforming_strings.
alter table public.profiles_private
  add column if not exists whatsapp text
  check (whatsapp is null or whatsapp ~ '^\+[1-9]\d{1,14}$');

-- update_profile: the edit counterpart to create_profile. SECURITY INVOKER
-- (default) so both UPDATEs run as the caller and the owner-update RLS policies
-- authorise them; the id is auth.uid(), never a parameter, so a caller can only
-- ever edit their own rows. A function body is atomic, so the public and private
-- updates commit together or not at all. Locale is deliberately NOT updated here:
-- it is owned by the language toggle, which writes profiles.locale on its own.
-- search_path is pinned empty and every name schema-qualified, the recommended
-- hardening for a database function.
create function public.update_profile(
  p_display_name text,
  p_delegation text,
  p_sport text,
  p_gender text,
  p_bio text,
  p_show_me text,
  p_whatsapp text
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null then
    raise exception 'update_profile requires an authenticated caller';
  end if;

  update public.profiles
  set display_name = p_display_name,
      delegation = p_delegation,
      sport = p_sport,
      gender = p_gender,
      bio = p_bio
  where id = v_uid;

  update public.profiles_private
  set show_me = p_show_me,
      whatsapp = p_whatsapp
  where id = v_uid;
end;
$$;
