alter table public.profiles
  add column if not exists is_active boolean not null default true;

create or replace function public.current_app_role()
returns public.app_role
language sql
stable
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_office_admin()
returns boolean
language sql
stable
as $$
  select coalesce(public.current_app_role() = 'office', false)
$$;

create or replace function public.can_read_admin_workspace()
returns boolean
language sql
stable
as $$
  select coalesce(public.current_app_role() in ('office', 'director'), false)
$$;

create table if not exists public.sites (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text not null,
  manager_profile_id uuid references public.profiles (id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.employee_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  surname text not null,
  id_number text not null unique,
  role text not null,
  site_id uuid not null references public.sites (id) on delete restrict,
  group_id uuid references public.employee_groups (id) on delete set null,
  employment_status text not null default 'active',
  start_date date not null,
  basic_rate numeric(12,2) not null default 0,
  salary_advances numeric(12,2) not null default 0,
  financials jsonb not null default '{}'::jsonb,
  logs jsonb not null default '{}'::jsonb,
  adjustments jsonb not null default '{}'::jsonb,
  tax_ref_number text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.financial_types (
  id text primary key,
  name text not null,
  category text not null,
  is_active boolean not null default true,
  is_system boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.issues (
  id uuid primary key default gen_random_uuid(),
  site_id uuid references public.sites (id) on delete set null,
  reported_by text not null,
  category text not null,
  description text not null,
  status text not null default 'Open',
  severity text not null default 'medium',
  owner_profile_id uuid references public.profiles (id) on delete set null,
  due_at timestamptz,
  audit_trail jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  registration_number text,
  serial_number text,
  vin text not null,
  make text not null,
  model text not null,
  type text not null,
  license_expiry date not null,
  status text not null default 'Active',
  assigned_site_id uuid references public.sites (id) on delete set null,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists assets_registration_number_idx
  on public.assets (registration_number)
  where registration_number is not null;

create table if not exists public.admin_activity_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references public.profiles (id) on delete restrict,
  actor_name text not null,
  action text not null,
  entity_type text not null,
  entity_id text,
  details jsonb,
  occurred_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.payroll_periods (
  id uuid primary key default gen_random_uuid(),
  period_key text not null unique,
  month int not null,
  year int not null,
  status text not null default 'open',
  locked_at timestamptz,
  locked_by text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.payroll_exports (
  id uuid primary key default gen_random_uuid(),
  period_key text not null,
  include_full_ids boolean not null default false,
  requested_by text not null,
  file_name text not null,
  created_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists sites_set_updated_at on public.sites;
create trigger sites_set_updated_at
before update on public.sites
for each row
execute function public.set_updated_at();

drop trigger if exists employee_groups_set_updated_at on public.employee_groups;
create trigger employee_groups_set_updated_at
before update on public.employee_groups
for each row
execute function public.set_updated_at();

drop trigger if exists employees_set_updated_at on public.employees;
create trigger employees_set_updated_at
before update on public.employees
for each row
execute function public.set_updated_at();

drop trigger if exists financial_types_set_updated_at on public.financial_types;
create trigger financial_types_set_updated_at
before update on public.financial_types
for each row
execute function public.set_updated_at();

drop trigger if exists issues_set_updated_at on public.issues;
create trigger issues_set_updated_at
before update on public.issues
for each row
execute function public.set_updated_at();

drop trigger if exists assets_set_updated_at on public.assets;
create trigger assets_set_updated_at
before update on public.assets
for each row
execute function public.set_updated_at();

drop trigger if exists payroll_periods_set_updated_at on public.payroll_periods;
create trigger payroll_periods_set_updated_at
before update on public.payroll_periods
for each row
execute function public.set_updated_at();

alter table public.sites enable row level security;
alter table public.employee_groups enable row level security;
alter table public.employees enable row level security;
alter table public.financial_types enable row level security;
alter table public.issues enable row level security;
alter table public.assets enable row level security;
alter table public.admin_activity_log enable row level security;
alter table public.payroll_periods enable row level security;
alter table public.payroll_exports enable row level security;

drop policy if exists "profiles_admin_read" on public.profiles;
create policy "profiles_admin_read"
on public.profiles
for select
to authenticated
using (public.can_read_admin_workspace() or auth.uid() = id);

drop policy if exists "profiles_office_update" on public.profiles;
create policy "profiles_office_update"
on public.profiles
for update
to authenticated
using (public.is_office_admin())
with check (public.is_office_admin());

drop policy if exists "sites_read" on public.sites;
create policy "sites_read"
on public.sites
for select
to authenticated
using (public.can_read_admin_workspace());

drop policy if exists "sites_write" on public.sites;
create policy "sites_write"
on public.sites
for all
to authenticated
using (public.is_office_admin())
with check (public.is_office_admin());

drop policy if exists "employee_groups_read" on public.employee_groups;
create policy "employee_groups_read"
on public.employee_groups
for select
to authenticated
using (public.can_read_admin_workspace());

drop policy if exists "employee_groups_write" on public.employee_groups;
create policy "employee_groups_write"
on public.employee_groups
for all
to authenticated
using (public.is_office_admin())
with check (public.is_office_admin());

drop policy if exists "employees_read" on public.employees;
create policy "employees_read"
on public.employees
for select
to authenticated
using (public.can_read_admin_workspace());

drop policy if exists "employees_write" on public.employees;
create policy "employees_write"
on public.employees
for all
to authenticated
using (public.is_office_admin())
with check (public.is_office_admin());

drop policy if exists "financial_types_read" on public.financial_types;
create policy "financial_types_read"
on public.financial_types
for select
to authenticated
using (public.can_read_admin_workspace());

drop policy if exists "financial_types_write" on public.financial_types;
create policy "financial_types_write"
on public.financial_types
for all
to authenticated
using (public.is_office_admin())
with check (public.is_office_admin());

drop policy if exists "issues_read" on public.issues;
create policy "issues_read"
on public.issues
for select
to authenticated
using (public.can_read_admin_workspace());

drop policy if exists "issues_write" on public.issues;
create policy "issues_write"
on public.issues
for all
to authenticated
using (public.is_office_admin())
with check (public.is_office_admin());

drop policy if exists "assets_read" on public.assets;
create policy "assets_read"
on public.assets
for select
to authenticated
using (public.can_read_admin_workspace());

drop policy if exists "assets_write" on public.assets;
create policy "assets_write"
on public.assets
for all
to authenticated
using (public.is_office_admin())
with check (public.is_office_admin());

drop policy if exists "admin_activity_read" on public.admin_activity_log;
create policy "admin_activity_read"
on public.admin_activity_log
for select
to authenticated
using (public.can_read_admin_workspace());

drop policy if exists "admin_activity_insert" on public.admin_activity_log;
create policy "admin_activity_insert"
on public.admin_activity_log
for insert
to authenticated
with check (public.is_office_admin() and actor_id = auth.uid());

drop policy if exists "payroll_periods_read" on public.payroll_periods;
create policy "payroll_periods_read"
on public.payroll_periods
for select
to authenticated
using (public.can_read_admin_workspace());

drop policy if exists "payroll_periods_write" on public.payroll_periods;
create policy "payroll_periods_write"
on public.payroll_periods
for all
to authenticated
using (public.is_office_admin())
with check (public.is_office_admin());

drop policy if exists "payroll_exports_read" on public.payroll_exports;
create policy "payroll_exports_read"
on public.payroll_exports
for select
to authenticated
using (public.can_read_admin_workspace());

drop policy if exists "payroll_exports_insert" on public.payroll_exports;
create policy "payroll_exports_insert"
on public.payroll_exports
for insert
to authenticated
with check (public.is_office_admin());
