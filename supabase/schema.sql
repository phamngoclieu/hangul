-- Sejong Green: tài khoản trực tuyến và đồng bộ tiến độ nhiều thiết bị.
-- Chạy bằng một migration trên dự án Supabase của ứng dụng.

create table if not exists public.learner_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 64),
  preferred_language text not null default 'vi'
    check (preferred_language in ('vi', 'en', 'zh')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.learner_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb
    check (octet_length(payload::text) <= 5242880),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_learner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.learner_profiles (user_id, display_name)
  values (
    new.id,
    left(coalesce(
      nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''),
      nullif(split_part(new.email, '@', 1), ''),
      'Học viên'
    ), 64)
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists learner_profiles_set_updated_at on public.learner_profiles;
create trigger learner_profiles_set_updated_at
before update on public.learner_profiles
for each row execute function public.set_updated_at();

drop trigger if exists learner_state_set_updated_at on public.learner_state;
create trigger learner_state_set_updated_at
before update on public.learner_state
for each row execute function public.set_updated_at();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_learner();

alter table public.learner_profiles enable row level security;
alter table public.learner_state enable row level security;

drop policy if exists "learners read own profile" on public.learner_profiles;
create policy "learners read own profile"
on public.learner_profiles for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "learners create own profile" on public.learner_profiles;
create policy "learners create own profile"
on public.learner_profiles for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "learners update own profile" on public.learner_profiles;
create policy "learners update own profile"
on public.learner_profiles for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "learners read own state" on public.learner_state;
create policy "learners read own state"
on public.learner_state for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "learners create own state" on public.learner_state;
create policy "learners create own state"
on public.learner_state for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "learners update own state" on public.learner_state;
create policy "learners update own state"
on public.learner_state for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

revoke all on public.learner_profiles from anon, authenticated;
revoke all on public.learner_state from anon, authenticated;
grant select, insert, update on public.learner_profiles to authenticated;
grant select, insert, update on public.learner_state to authenticated;

revoke all on function public.handle_new_learner() from public, anon, authenticated;
revoke all on function public.set_updated_at() from public, anon, authenticated;

do $$
begin
  alter publication supabase_realtime add table public.learner_state;
exception
  when duplicate_object then null;
end;
$$;
