-- =====================================================================
-- Migration v1.2 → v1.3: account approval
--   * New accounts must be approved by an admin before they can use the app
--   * Admins (teachers) are marked with profiles.is_admin
--   * Enforced in the database (RLS), not only in the app:
--     unapproved users get no content and cannot save attempts,
--     and students cannot approve themselves
-- Run once in the Supabase SQL Editor.
-- =====================================================================

alter table profiles add column if not exists approved_at timestamptz;
alter table profiles add column if not exists is_admin    boolean not null default false;

-- Every existing user gets a profile row (normally created by the signup trigger)
insert into profiles (id) select id from auth.users on conflict (id) do nothing;

-- Students may only change their display name and avatar, never approval/admin
revoke update on profiles from authenticated;
grant update (display_name, avatar) on profiles to authenticated;

-- ---------------------------------------------------------------------
-- Helper functions (security definer: they read profiles regardless of RLS)
-- ---------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from profiles where id = auth.uid()), false);
$$;

create or replace function public.is_approved()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select approved_at is not null or is_admin from profiles where id = auth.uid()), false);
$$;

-- ---------------------------------------------------------------------
-- Content: only approved users (and admins) can read it
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['languages','topics','skills','verbs','verb_forms','markers',
                           'stories','exercises','bosses','daily_challenges','vocab_items']
  loop
    execute format('drop policy if exists read_content on %I', t);
    execute format('create policy read_content on %I for select to authenticated using (public.is_approved())', t);
  end loop;
end $$;

-- Saving progress also requires approval
drop policy if exists own_attempts_insert on attempts;
create policy own_attempts_insert on attempts for insert to authenticated
  with check (user_id = auth.uid() and public.is_approved());

drop policy if exists own_srs_all on srs_items;
create policy own_srs_all on srs_items for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid() and public.is_approved());

-- ---------------------------------------------------------------------
-- Admin functions, callable from the app; they refuse non-admins
-- ---------------------------------------------------------------------
create or replace function public.admin_list_users()
returns table (
  id uuid, email text, created_at timestamptz, last_sign_in_at timestamptz,
  approved_at timestamptz, is_admin boolean, points int, rounds bigint, last_played timestamptz
)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'Geen toegang: alleen voor beheerders';
  end if;
  return query
    select u.id, u.email::text, u.created_at, u.last_sign_in_at,
           p.approved_at, coalesce(p.is_admin, false),
           coalesce(lp.points, 0),
           (select count(*) from attempts a where a.user_id = u.id and a.finished_at is not null),
           (select max(a.finished_at) from attempts a where a.user_id = u.id)
    from auth.users u
    left join profiles p       on p.id = u.id
    left join league_points lp on lp.user_id = u.id and lp.language_code = 'es'
    order by (p.approved_at is not null or coalesce(p.is_admin, false)), u.created_at desc;
end;
$$;

create or replace function public.admin_set_approval(p_user uuid, p_approved boolean)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'Geen toegang: alleen voor beheerders';
  end if;
  update profiles
     set approved_at = case when p_approved then now() else null end
   where id = p_user
     and not is_admin;   -- admins cannot be revoked from the app
end;
$$;

revoke execute on function public.admin_list_users()                 from public, anon;
revoke execute on function public.admin_set_approval(uuid, boolean)  from public, anon;
grant  execute on function public.admin_list_users()                 to authenticated;
grant  execute on function public.admin_set_approval(uuid, boolean)  to authenticated;

-- ---------------------------------------------------------------------
-- Admins. Only these accounts can approve students.
-- Add another admin later with the same statement and her e-mail address.
-- ---------------------------------------------------------------------
update profiles
   set is_admin = true, approved_at = coalesce(approved_at, now())
 where id in (select id from auth.users where lower(email) in (
   'johandierckens@hotmail.com',
   'dierckens.helena@kla.be'
 ));
