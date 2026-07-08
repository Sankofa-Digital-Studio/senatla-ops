create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.organization_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  role public.app_role not null,
  is_default boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, profile_id)
);

alter table public.profiles add column if not exists organization_id uuid references public.organizations (id) on delete set null;
alter table public.sites add column if not exists organization_id uuid references public.organizations (id) on delete set null;
alter table public.employees add column if not exists organization_id uuid references public.organizations (id) on delete set null;
alter table public.financial_types add column if not exists organization_id uuid references public.organizations (id) on delete set null;
alter table public.issues add column if not exists organization_id uuid references public.organizations (id) on delete set null;
alter table public.assets add column if not exists organization_id uuid references public.organizations (id) on delete set null;
alter table public.admin_activity_log add column if not exists organization_id uuid references public.organizations (id) on delete set null;
alter table public.payroll_periods add column if not exists organization_id uuid references public.organizations (id) on delete set null;
alter table public.payroll_exports add column if not exists organization_id uuid references public.organizations (id) on delete set null;
alter table public.approval_requests add column if not exists organization_id uuid references public.organizations (id) on delete set null;

create table if not exists public.saved_admin_views (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations (id) on delete cascade,
  created_by uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  filters jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.organizations enable row level security;
alter table public.organization_memberships enable row level security;
alter table public.saved_admin_views enable row level security;

drop policy if exists "organizations_read" on public.organizations;
create policy "organizations_read"
on public.organizations
for select
to authenticated
using (public.can_read_admin_workspace());

drop policy if exists "organization_memberships_read" on public.organization_memberships;
create policy "organization_memberships_read"
on public.organization_memberships
for select
to authenticated
using (public.can_read_admin_workspace());

drop policy if exists "saved_admin_views_read" on public.saved_admin_views;
create policy "saved_admin_views_read"
on public.saved_admin_views
for select
to authenticated
using (public.can_read_admin_workspace());

drop policy if exists "saved_admin_views_write" on public.saved_admin_views;
create policy "saved_admin_views_write"
on public.saved_admin_views
for all
to authenticated
using (public.is_office_admin())
with check (public.is_office_admin() and created_by = auth.uid());
