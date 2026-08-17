alter table public.sites add column if not exists team_name text;
alter table public.sites add column if not exists job_number text;
alter table public.sites add column if not exists estimated_duration text;
alter table public.sites add column if not exists compliance_checklist text[] not null default array[]::text[];

create table if not exists public.vendor_accounts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  name text not null check (length(trim(name)) > 0),
  description text not null default '',
  total_owing_amount numeric(14,2) not null default 0 check (total_owing_amount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vendor_invoice_records (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  vendor_id uuid not null references public.vendor_accounts(id) on delete restrict,
  invoice_date date not null,
  order_number text not null check (length(trim(order_number)) > 0),
  items_purchased text not null check (length(trim(items_purchased)) > 0),
  total numeric(14,2) not null check (total > 0),
  responsible_person text not null check (length(trim(responsible_person)) > 0),
  status text not null default 'pending_director' check (status in ('pending_director','approved','rejected','paid')),
  requested_by uuid not null references auth.users(id),
  requested_by_name text not null,
  director_reviewed_by uuid references auth.users(id),
  director_reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, vendor_id, order_number),
  check ((director_reviewed_by is null) = (director_reviewed_at is null))
);

create unique index if not exists vendor_accounts_org_lower_name_uidx on public.vendor_accounts(organization_id, lower(name));
create index if not exists vendor_accounts_org_name_idx on public.vendor_accounts(organization_id, name);
create index if not exists vendor_invoice_org_status_idx on public.vendor_invoice_records(organization_id, status, created_at desc);
create index if not exists vendor_invoice_vendor_idx on public.vendor_invoice_records(vendor_id, invoice_date desc);

alter table public.vendor_accounts enable row level security;
alter table public.vendor_invoice_records enable row level security;

grant select, insert, update on public.vendor_accounts to authenticated;
grant select, insert, update on public.vendor_invoice_records to authenticated;

drop policy if exists vendor_accounts_read on public.vendor_accounts;
create policy vendor_accounts_read on public.vendor_accounts for select to authenticated
using (organization_id = private.current_organization_id() and private.current_app_role() in ('office','director'));

drop policy if exists vendor_accounts_write on public.vendor_accounts;
create policy vendor_accounts_write on public.vendor_accounts for insert to authenticated
with check (organization_id = private.current_organization_id() and private.current_app_role() = 'office');

drop policy if exists vendor_accounts_update on public.vendor_accounts;
create policy vendor_accounts_update on public.vendor_accounts for update to authenticated
using (organization_id = private.current_organization_id() and private.current_app_role() in ('office','director'))
with check (organization_id = private.current_organization_id() and private.current_app_role() in ('office','director'));

drop policy if exists vendor_invoice_read on public.vendor_invoice_records;
create policy vendor_invoice_read on public.vendor_invoice_records for select to authenticated
using (organization_id = private.current_organization_id() and private.current_app_role() in ('office','director'));

drop policy if exists vendor_invoice_insert on public.vendor_invoice_records;
create policy vendor_invoice_insert on public.vendor_invoice_records for insert to authenticated
with check (organization_id = private.current_organization_id() and private.current_app_role() = 'office' and requested_by = (select auth.uid()) and status = 'pending_director');

drop policy if exists vendor_invoice_update on public.vendor_invoice_records;
create policy vendor_invoice_update on public.vendor_invoice_records for update to authenticated
using (organization_id = private.current_organization_id() and private.current_app_role() = 'director')
with check (organization_id = private.current_organization_id() and private.current_app_role() = 'director');
