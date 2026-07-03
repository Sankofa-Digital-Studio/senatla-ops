create extension if not exists "pgcrypto";

do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('site', 'office', 'director');
  end if;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique,
  display_name text not null,
  role public.app_role not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.app_state_snapshots (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  snapshot jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.admin_audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references public.profiles (id) on delete restrict,
  actor_name text not null,
  action text not null,
  details text,
  occurred_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.attendance_audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references public.profiles (id) on delete restrict,
  actor_name text not null,
  employee_id text,
  employee_name text,
  action text not null,
  details text,
  occurred_at timestamptz not null default timezone('utc', now())
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists app_state_snapshots_set_updated_at on public.app_state_snapshots;
create trigger app_state_snapshots_set_updated_at
before update on public.app_state_snapshots
for each row
execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.app_state_snapshots enable row level security;
alter table public.admin_audit_events enable row level security;
alter table public.attendance_audit_events enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "app_state_select_own" on public.app_state_snapshots;
create policy "app_state_select_own"
on public.app_state_snapshots
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "app_state_upsert_own" on public.app_state_snapshots;
create policy "app_state_upsert_own"
on public.app_state_snapshots
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "app_state_update_own" on public.app_state_snapshots;
create policy "app_state_update_own"
on public.app_state_snapshots
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "admin_audit_select_own" on public.admin_audit_events;
create policy "admin_audit_select_own"
on public.admin_audit_events
for select
to authenticated
using (auth.uid() = actor_id);

drop policy if exists "attendance_audit_select_own" on public.attendance_audit_events;
create policy "attendance_audit_select_own"
on public.attendance_audit_events
for select
to authenticated
using (auth.uid() = actor_id);

drop policy if exists "admin_audit_insert_own" on public.admin_audit_events;
create policy "admin_audit_insert_own"
on public.admin_audit_events
for insert
to authenticated
with check (auth.uid() = actor_id);

drop policy if exists "attendance_audit_insert_own" on public.attendance_audit_events;
create policy "attendance_audit_insert_own"
on public.attendance_audit_events
for insert
to authenticated
with check (auth.uid() = actor_id);
