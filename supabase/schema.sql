-- Sejong Green: nền tảng đồng bộ tài khoản, tiến độ, nội dung và góp ý.
-- Chạy tệp này một lần trong Supabase SQL Editor khi dự án Supabase đã sẵn sàng.

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.learner_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  preferred_language text not null default 'vi'
    check (preferred_language in ('vi', 'en', 'zh')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.learner_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.content_items (
  id text primary key,
  kind text not null
    check (kind in ('vocabulary', 'shadowing', 'listening')),
  lesson smallint not null check (lesson > 0),
  payload jsonb not null,
  status text not null default 'draft'
    check (status in ('draft', 'published', 'archived')),
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists public.feedback_reports (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete set null,
  section text not null,
  message text not null check (char_length(message) between 1 and 5000),
  status text not null default 'new'
    check (status in ('new', 'reviewing', 'resolved', 'rejected')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists learner_state_user_id_idx
  on public.learner_state (user_id);
create index if not exists content_items_kind_lesson_idx
  on public.content_items (kind, lesson);
create index if not exists content_items_status_idx
  on public.content_items (status);
create index if not exists content_items_updated_by_idx
  on public.content_items (updated_by);
create index if not exists feedback_reports_user_id_idx
  on public.feedback_reports (user_id);
create index if not exists feedback_reports_status_created_at_idx
  on public.feedback_reports (status, created_at desc);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

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

drop trigger if exists learner_profiles_set_updated_at on public.learner_profiles;
create trigger learner_profiles_set_updated_at
before update on public.learner_profiles
for each row execute function public.set_updated_at();

drop trigger if exists learner_state_set_updated_at on public.learner_state;
create trigger learner_state_set_updated_at
before update on public.learner_state
for each row execute function public.set_updated_at();

drop trigger if exists content_items_set_updated_at on public.content_items;
create trigger content_items_set_updated_at
before update on public.content_items
for each row execute function public.set_updated_at();

drop trigger if exists feedback_reports_set_updated_at on public.feedback_reports;
create trigger feedback_reports_set_updated_at
before update on public.feedback_reports
for each row execute function public.set_updated_at();

alter table public.admin_users enable row level security;
alter table public.learner_profiles enable row level security;
alter table public.learner_state enable row level security;
alter table public.content_items enable row level security;
alter table public.feedback_reports enable row level security;

drop policy if exists "admins can read admin users" on public.admin_users;
create policy "admins can read admin users"
on public.admin_users for select
to authenticated
using ((select public.is_admin()));

drop policy if exists "learners manage own profile" on public.learner_profiles;
create policy "learners manage own profile"
on public.learner_profiles for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "admins read learner profiles" on public.learner_profiles;
create policy "admins read learner profiles"
on public.learner_profiles for select
to authenticated
using ((select public.is_admin()));

drop policy if exists "learners manage own state" on public.learner_state;
create policy "learners manage own state"
on public.learner_state for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "admins read learner state" on public.learner_state;
create policy "admins read learner state"
on public.learner_state for select
to authenticated
using ((select public.is_admin()));

drop policy if exists "everyone reads published content" on public.content_items;
create policy "everyone reads published content"
on public.content_items for select
to anon, authenticated
using (status = 'published' or (select public.is_admin()));

drop policy if exists "admins manage content" on public.content_items;
create policy "admins manage content"
on public.content_items for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "learners create own reports" on public.feedback_reports;
create policy "learners create own reports"
on public.feedback_reports for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "learners read own reports" on public.feedback_reports;
create policy "learners read own reports"
on public.feedback_reports for select
to authenticated
using ((select auth.uid()) = user_id or (select public.is_admin()));

drop policy if exists "admins manage reports" on public.feedback_reports;
create policy "admins manage reports"
on public.feedback_reports for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

grant usage on schema public to anon, authenticated;
grant select on public.content_items to anon, authenticated;
grant select, insert, update on public.learner_profiles to authenticated;
grant select, insert, update on public.learner_state to authenticated;
grant select, insert on public.feedback_reports to authenticated;
grant select, insert, update, delete on public.content_items to authenticated;
grant select, update, delete on public.feedback_reports to authenticated;
grant select on public.admin_users to authenticated;
grant usage, select on sequence public.feedback_reports_id_seq to authenticated;
