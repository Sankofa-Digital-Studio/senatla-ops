begin;

insert into public.organizations (id, name, slug, is_active)
values ('00000000-0000-4000-8000-000000000001', 'Senatla Trading', 'senatla-trading', true)
on conflict (id) do update set name = excluded.name, slug = excluded.slug, is_active = true;

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select role
  from public.profiles
  where id = auth.uid() and is_active = true
$$;

revoke all on function private.current_app_role() from public, anon;
grant execute on function private.current_app_role() to authenticated;

create or replace function public.current_app_role()
returns public.app_role
language sql
stable
set search_path = ''
as $$ select private.current_app_role() $$;

create or replace function public.is_office_admin()
returns boolean
language sql
stable
set search_path = ''
as $$ select coalesce(private.current_app_role() = 'office', false) $$;

create or replace function public.can_read_admin_workspace()
returns boolean
language sql
stable
set search_path = ''
as $$ select coalesce(private.current_app_role() in ('office', 'director'), false) $$;

alter table public.employee_groups add column if not exists organization_id uuid references public.organizations (id) on delete restrict;
alter table public.saved_admin_views alter column organization_id set default '00000000-0000-4000-8000-000000000001';

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles','sites','employee_groups','employees','financial_types','issues','assets',
    'admin_activity_log','payroll_periods','payroll_exports','approval_requests','saved_admin_views'
  ] loop
    execute format('update public.%I set organization_id = $1 where organization_id is null', table_name)
      using '00000000-0000-4000-8000-000000000001'::uuid;
    execute format('alter table public.%I alter column organization_id set default %L::uuid', table_name, '00000000-0000-4000-8000-000000000001');
    execute format('alter table public.%I alter column organization_id set not null', table_name);
  end loop;
end $$;

alter table public.app_state_snapshots add column if not exists organization_id uuid not null default '00000000-0000-4000-8000-000000000001' references public.organizations (id) on delete restrict;
alter table public.admin_audit_events add column if not exists organization_id uuid not null default '00000000-0000-4000-8000-000000000001' references public.organizations (id) on delete restrict;
alter table public.attendance_audit_events add column if not exists organization_id uuid not null default '00000000-0000-4000-8000-000000000001' references public.organizations (id) on delete restrict;

alter table public.assets add column if not exists custodian_name text;
alter table public.assets add column if not exists asset_class text;
alter table public.assets add column if not exists lifecycle_state text not null default 'active';
alter table public.assets add column if not exists retired_at timestamptz;
alter table public.assets drop constraint if exists assets_lifecycle_state_check;
alter table public.assets add constraint assets_lifecycle_state_check check (lifecycle_state in ('active','maintenance','retired','disposed'));

create table if not exists public.asset_custody_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null default '00000000-0000-4000-8000-000000000001' references public.organizations (id) on delete restrict,
  asset_id uuid not null references public.assets (id) on delete restrict,
  from_site_id uuid references public.sites (id) on delete set null,
  to_site_id uuid references public.sites (id) on delete set null,
  from_custodian text,
  to_custodian text,
  accepted_by text,
  notes text,
  occurred_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.asset_compliance_records (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null default '00000000-0000-4000-8000-000000000001' references public.organizations (id) on delete restrict,
  asset_id uuid not null references public.assets (id) on delete cascade,
  compliance_type text not null check (compliance_type in ('licence','roadworthy','insurance','inspection','certification','warranty','other')),
  reference_number text,
  issued_at date,
  expires_at date,
  status text not null default 'valid' check (status in ('valid','due','expired','waived')),
  document_path text,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.asset_meter_readings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null default '00000000-0000-4000-8000-000000000001' references public.organizations (id) on delete restrict,
  asset_id uuid not null references public.assets (id) on delete cascade,
  meter_type text not null check (meter_type in ('odometer_km','engine_hours','cycles')),
  reading numeric(14,2) not null check (reading >= 0),
  recorded_at timestamptz not null default timezone('utc', now()),
  recorded_by text not null,
  source text not null default 'manual' check (source in ('manual','import','telematics'))
);

create table if not exists public.asset_work_orders (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null default '00000000-0000-4000-8000-000000000001' references public.organizations (id) on delete restrict,
  asset_id uuid not null references public.assets (id) on delete restrict,
  title text not null,
  description text,
  status text not null default 'open' check (status in ('open','in_progress','blocked','completed','cancelled')),
  priority text not null default 'medium' check (priority in ('low','medium','high','critical')),
  due_at timestamptz,
  completed_at timestamptz,
  cost numeric(14,2) not null default 0 check (cost >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.asset_maintenance_plans (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null default '00000000-0000-4000-8000-000000000001' references public.organizations (id) on delete restrict,
  asset_id uuid not null references public.assets (id) on delete cascade,
  name text not null,
  interval_days integer check (interval_days is null or interval_days > 0),
  interval_meter numeric(14,2) check (interval_meter is null or interval_meter > 0),
  meter_type text check (meter_type is null or meter_type in ('odometer_km','engine_hours','cycles')),
  next_due_at date,
  next_due_meter numeric(14,2),
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (interval_days is not null or interval_meter is not null)
);

create table if not exists public.integration_outbox (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null default '00000000-0000-4000-8000-000000000001' references public.organizations (id) on delete restrict,
  event_type text not null,
  aggregate_type text not null,
  aggregate_id text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending','processing','completed','failed')),
  idempotency_key text not null unique,
  attempts integer not null default 0 check (attempts >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  processed_at timestamptz
);

create table if not exists public.queued_sync_submissions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null default '00000000-0000-4000-8000-000000000001' references public.organizations (id) on delete restrict,
  submitted_by uuid not null references public.profiles (id) on delete restrict,
  idempotency_key text not null unique,
  payload jsonb not null,
  status text not null default 'pending' check (status in ('pending','processing','completed','failed')),
  attempts integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  processed_at timestamptz
);

create index if not exists asset_custody_asset_time_idx on public.asset_custody_events (asset_id, occurred_at desc);
create index if not exists asset_compliance_asset_expiry_idx on public.asset_compliance_records (asset_id, expires_at);
create index if not exists asset_meter_asset_time_idx on public.asset_meter_readings (asset_id, meter_type, recorded_at desc);
create index if not exists asset_work_order_asset_status_idx on public.asset_work_orders (asset_id, status, due_at);
create index if not exists asset_plan_asset_active_idx on public.asset_maintenance_plans (asset_id, is_active);
create index if not exists integration_outbox_pending_idx on public.integration_outbox (status, created_at) where status in ('pending','failed');

drop trigger if exists asset_compliance_set_updated_at on public.asset_compliance_records;
create trigger asset_compliance_set_updated_at before update on public.asset_compliance_records for each row execute function public.set_updated_at();
drop trigger if exists asset_work_orders_set_updated_at on public.asset_work_orders;
create trigger asset_work_orders_set_updated_at before update on public.asset_work_orders for each row execute function public.set_updated_at();
drop trigger if exists asset_maintenance_plans_set_updated_at on public.asset_maintenance_plans;
create trigger asset_maintenance_plans_set_updated_at before update on public.asset_maintenance_plans for each row execute function public.set_updated_at();

create or replace function public.prevent_payroll_period_reopen()
returns trigger language plpgsql as $$
begin
  if old.status = 'exported' and new.status <> 'exported' then raise exception 'Exported payroll periods are immutable'; end if;
  if old.status = 'locked' and new.status = 'open' then raise exception 'Locked payroll periods cannot be reopened'; end if;
  return new;
end $$;
drop trigger if exists payroll_period_transition_guard on public.payroll_periods;
create trigger payroll_period_transition_guard before update on public.payroll_periods for each row execute function public.prevent_payroll_period_reopen();

create or replace function public.prevent_approval_redecision()
returns trigger language plpgsql as $$
begin
  if new.requested_by <> old.requested_by then
    raise exception 'Approval requester is immutable';
  end if;
  if old.status = 'pending' and new.status in ('approved', 'rejected') and (new.reviewed_by is null or new.reviewed_by = old.requested_by) then
    raise exception 'Maker-checker requires a different reviewer';
  end if;
  if old.status <> 'pending' and not (old.status = 'approved' and new.status = 'executed') and new.status <> old.status then
    raise exception 'Completed approval decisions are immutable';
  end if;
  return new;
end $$;
drop trigger if exists approval_decision_guard on public.approval_requests;
create trigger approval_decision_guard before update on public.approval_requests for each row execute function public.prevent_approval_redecision();

alter table public.asset_custody_events enable row level security;
alter table public.asset_compliance_records enable row level security;
alter table public.asset_meter_readings enable row level security;
alter table public.asset_work_orders enable row level security;
alter table public.asset_maintenance_plans enable row level security;
alter table public.integration_outbox enable row level security;
alter table public.queued_sync_submissions enable row level security;

do $$
declare
  table_name text;
begin
  foreach table_name in array array['asset_custody_events','asset_compliance_records','asset_meter_readings','asset_work_orders','asset_maintenance_plans','integration_outbox'] loop
    execute format('drop policy if exists %I on public.%I', table_name || '_read', table_name);
    execute format('create policy %I on public.%I for select to authenticated using (public.can_read_admin_workspace())', table_name || '_read', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_write', table_name);
    execute format('create policy %I on public.%I for all to authenticated using (public.is_office_admin()) with check (public.is_office_admin() and organization_id = %L::uuid)', table_name || '_write', table_name, '00000000-0000-4000-8000-000000000001');
  end loop;
end $$;

drop policy if exists asset_custody_events_write on public.asset_custody_events;
create policy asset_custody_events_insert on public.asset_custody_events
for insert to authenticated
with check (public.is_office_admin() and organization_id = '00000000-0000-4000-8000-000000000001');

drop policy if exists asset_meter_readings_write on public.asset_meter_readings;
create policy asset_meter_readings_insert on public.asset_meter_readings
for insert to authenticated
with check (public.is_office_admin() and organization_id = '00000000-0000-4000-8000-000000000001');

drop policy if exists queued_sync_own_read on public.queued_sync_submissions;
create policy queued_sync_own_read on public.queued_sync_submissions for select to authenticated using (submitted_by = auth.uid() or public.can_read_admin_workspace());
drop policy if exists queued_sync_own_insert on public.queued_sync_submissions;
create policy queued_sync_own_insert on public.queued_sync_submissions for insert to authenticated with check (submitted_by = auth.uid() and organization_id = '00000000-0000-4000-8000-000000000001');

insert into storage.buckets (id, name, public)
values ('asset-evidence', 'asset-evidence', false)
on conflict (id) do update set public = false;

drop policy if exists asset_evidence_read on storage.objects;
create policy asset_evidence_read on storage.objects for select to authenticated using (bucket_id = 'asset-evidence' and public.can_read_admin_workspace());
drop policy if exists asset_evidence_insert on storage.objects;
create policy asset_evidence_insert on storage.objects for insert to authenticated with check (bucket_id = 'asset-evidence' and public.is_office_admin() and (storage.foldername(name))[1] = '00000000-0000-4000-8000-000000000001');
drop policy if exists asset_evidence_update on storage.objects;
create policy asset_evidence_update on storage.objects for update to authenticated using (bucket_id = 'asset-evidence' and public.is_office_admin()) with check (bucket_id = 'asset-evidence' and public.is_office_admin());

commit;
