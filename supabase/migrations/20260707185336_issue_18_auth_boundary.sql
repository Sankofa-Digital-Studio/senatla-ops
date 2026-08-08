begin;

create or replace function private.auth_session_is_current()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    auth.uid() is not null
    and coalesce(nullif(auth.jwt() ->> 'exp', '')::bigint, 0) > extract(epoch from statement_timestamp())::bigint
$$;

revoke all on function private.auth_session_is_current() from public, anon;
grant execute on function private.auth_session_is_current() to authenticated;

create or replace function private.current_organization_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select profile.organization_id
  from public.profiles profile
  join public.organizations organization on organization.id = profile.organization_id and organization.is_active = true
  where profile.id = auth.uid()
    and profile.is_active = true
    and private.auth_session_is_current()
$$;

create or replace function private.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select profile.role
  from public.profiles profile
  join public.organizations organization on organization.id = profile.organization_id and organization.is_active = true
  where profile.id = auth.uid()
    and profile.is_active = true
    and private.auth_session_is_current()
$$;

revoke all on function private.current_organization_id() from public, anon;
grant execute on function private.current_organization_id() to authenticated;

create table if not exists public.profile_site_access (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  site_id uuid not null references public.sites (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (profile_id, site_id)
);

insert into public.profile_site_access (profile_id, site_id, organization_id)
select manager_profile_id, id, organization_id
from public.sites
where manager_profile_id is not null
on conflict (profile_id, site_id) do update set organization_id = excluded.organization_id;

create index if not exists profile_site_access_profile_idx
  on public.profile_site_access (profile_id, organization_id);

alter table public.profile_site_access enable row level security;
revoke all on public.profile_site_access from anon;
grant select, insert, update, delete on public.profile_site_access to authenticated;

create or replace function private.has_site_access(target_site_id uuid, target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profile_site_access access
    where access.profile_id = auth.uid()
      and access.site_id = target_site_id
      and access.organization_id = target_organization_id
      and access.organization_id = private.current_organization_id()
      and private.current_app_role() = 'site'
  )
$$;

revoke all on function private.has_site_access(uuid, uuid) from public, anon;
grant execute on function private.has_site_access(uuid, uuid) to authenticated;

drop policy if exists profile_site_access_read on public.profile_site_access;
create policy profile_site_access_read
on public.profile_site_access for select to authenticated
using (
  (profile_id = (select auth.uid()) and private.auth_session_is_current())
  or public.can_read_admin_workspace()
);

drop policy if exists profile_site_access_write on public.profile_site_access;
create policy profile_site_access_write
on public.profile_site_access for all to authenticated
using (public.is_office_admin())
with check (
  public.is_office_admin()
  and organization_id = private.current_organization_id()
  and exists (
    select 1 from public.profiles profile
    where profile.id = profile_site_access.profile_id
      and profile.role = 'site'
      and profile.is_active = true
      and profile.organization_id = profile_site_access.organization_id
  )
  and exists (
    select 1 from public.sites site
    where site.id = profile_site_access.site_id and site.organization_id = profile_site_access.organization_id
  )
);

drop policy if exists profiles_select_own on public.profiles;
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists profiles_admin_read on public.profiles;
drop policy if exists "profiles_admin_read" on public.profiles;
create policy profiles_read
on public.profiles for select to authenticated
using (
  private.auth_session_is_current()
  and is_active = true
  and (
    id = (select auth.uid())
    or public.can_read_admin_workspace()
  )
);

drop policy if exists profiles_update_own on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists profiles_insert_own on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists profiles_office_update on public.profiles;
drop policy if exists "profiles_office_update" on public.profiles;
revoke insert, update, delete, truncate on public.profiles from authenticated;
grant select on public.profiles to authenticated;

drop policy if exists app_state_select_own on public.app_state_snapshots;
drop policy if exists "app_state_select_own" on public.app_state_snapshots;
create policy app_state_select_own
on public.app_state_snapshots for select to authenticated
using (
  user_id = (select auth.uid())
  and organization_id = private.current_organization_id()
  and private.current_app_role() is not null
);

drop policy if exists app_state_upsert_own on public.app_state_snapshots;
drop policy if exists "app_state_upsert_own" on public.app_state_snapshots;
create policy app_state_insert_own
on public.app_state_snapshots for insert to authenticated
with check (
  user_id = (select auth.uid())
  and organization_id = private.current_organization_id()
  and private.current_app_role() is not null
);

drop policy if exists app_state_update_own on public.app_state_snapshots;
drop policy if exists "app_state_update_own" on public.app_state_snapshots;
create policy app_state_update_own
on public.app_state_snapshots for update to authenticated
using (
  user_id = (select auth.uid())
  and organization_id = private.current_organization_id()
  and private.current_app_role() is not null
)
with check (
  user_id = (select auth.uid())
  and organization_id = private.current_organization_id()
  and private.current_app_role() is not null
);

drop policy if exists sites_read on public.sites;
drop policy if exists "sites_read" on public.sites;
create policy sites_read
on public.sites for select to authenticated
using (
  organization_id = private.current_organization_id()
  and (
    public.can_read_admin_workspace()
    or private.has_site_access(id, organization_id)
  )
);

drop policy if exists employees_read on public.employees;
drop policy if exists "employees_read" on public.employees;
create policy employees_read
on public.employees for select to authenticated
using (
  organization_id = private.current_organization_id()
  and (
    public.can_read_admin_workspace()
    or private.has_site_access(site_id, organization_id)
  )
);

drop policy if exists issues_read on public.issues;
drop policy if exists "issues_read" on public.issues;
create policy issues_read
on public.issues for select to authenticated
using (
  organization_id = private.current_organization_id()
  and (
    public.can_read_admin_workspace()
    or (site_id is not null and private.has_site_access(site_id, organization_id))
  )
);

drop policy if exists queued_sync_own_read on public.queued_sync_submissions;
create policy queued_sync_own_read
on public.queued_sync_submissions for select to authenticated
using (
  organization_id = private.current_organization_id()
  and (
    (submitted_by = (select auth.uid()) and private.current_app_role() is not null)
    or public.can_read_admin_workspace()
  )
);

drop policy if exists queued_sync_own_insert on public.queued_sync_submissions;
create policy queued_sync_own_insert
on public.queued_sync_submissions for insert to authenticated
with check (
  submitted_by = (select auth.uid())
  and organization_id = private.current_organization_id()
  and private.current_app_role() = 'site'
);

drop policy if exists approval_requests_update on public.approval_requests;
drop policy if exists "approval_requests_update" on public.approval_requests;
create policy approval_requests_director_review
on public.approval_requests for update to authenticated
using (
  organization_id = private.current_organization_id()
  and private.current_app_role() = 'director'
  and status = 'pending'
  and requested_by <> (select auth.uid())
)
with check (
  organization_id = private.current_organization_id()
  and private.current_app_role() = 'director'
  and reviewed_by = (select auth.uid())
  and status in ('approved', 'rejected')
);

create table if not exists public.auth_activity_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  actor_id uuid not null references public.profiles (id) on delete restrict,
  target_profile_id uuid references public.profiles (id) on delete set null,
  event_type text not null check (event_type in ('login', 'logout', 'user_invited', 'role_changed', 'account_activated', 'account_deactivated', 'password_reset_requested')),
  details jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default timezone('utc', now())
);

create index if not exists auth_activity_events_actor_time_idx
  on public.auth_activity_events (actor_id, occurred_at desc);

alter table public.auth_activity_events enable row level security;
revoke all on public.auth_activity_events from anon;
revoke update, delete, truncate on public.auth_activity_events from authenticated;
grant select, insert on public.auth_activity_events to authenticated;

create or replace function private.prepare_auth_activity_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_profile public.profiles%rowtype;
begin
  if auth.uid() is not null then
    select * into actor_profile
    from public.profiles
    where id = auth.uid() and is_active = true;

    if actor_profile.id is null or not private.auth_session_is_current() then
      raise exception 'Active authenticated profile required';
    end if;

    new.actor_id := actor_profile.id;
    new.organization_id := actor_profile.organization_id;
    new.occurred_at := timezone('utc', now());
  end if;
  return new;
end;
$$;

drop trigger if exists auth_activity_prepare_insert on public.auth_activity_events;
create trigger auth_activity_prepare_insert
before insert on public.auth_activity_events
for each row execute function private.prepare_auth_activity_event();

drop policy if exists auth_activity_read on public.auth_activity_events;
create policy auth_activity_read
on public.auth_activity_events for select to authenticated
using (
  organization_id = private.current_organization_id()
  and (actor_id = (select auth.uid()) or public.can_read_admin_workspace())
);

drop policy if exists auth_activity_insert_own on public.auth_activity_events;
create policy auth_activity_insert_own
on public.auth_activity_events for insert to authenticated
with check (
  actor_id = (select auth.uid())
  and target_profile_id = (select auth.uid())
  and organization_id = private.current_organization_id()
  and event_type in ('login', 'logout')
);

create or replace function private.can_read_audit_event(
  event_actor_id uuid,
  event_organization_id uuid,
  event_site_id uuid default null
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles profile
    where profile.id = auth.uid()
      and profile.is_active = true
      and profile.organization_id = event_organization_id
      and private.auth_session_is_current()
      and (
        profile.id = event_actor_id
        or profile.role in ('office', 'director')
        or (
          profile.role = 'site'
          and event_site_id is not null
          and private.has_site_access(event_site_id, event_organization_id)
        )
      )
  )
$$;


grant select, insert, update, delete on public.app_state_snapshots to authenticated;
grant select, insert, update, delete on public.sites to authenticated;
grant select, insert, update, delete on public.employee_groups to authenticated;
grant select, insert, update, delete on public.employees to authenticated;
grant select, insert, update, delete on public.financial_types to authenticated;
grant select, insert, update, delete on public.issues to authenticated;
grant select, insert, update, delete on public.assets to authenticated;
grant select, insert, update, delete on public.admin_activity_log to authenticated;
grant select, insert, update, delete on public.payroll_periods to authenticated;
grant select, insert, update, delete on public.payroll_exports to authenticated;
grant select, insert, update, delete on public.approval_requests to authenticated;
grant select, insert, update, delete on public.saved_admin_views to authenticated;
grant select on public.organizations, public.organization_memberships to authenticated;
grant select, insert, update, delete on public.asset_custody_events to authenticated;
grant select, insert, update, delete on public.asset_compliance_records to authenticated;
grant select, insert, update, delete on public.asset_meter_readings to authenticated;
grant select, insert, update, delete on public.asset_work_orders to authenticated;
grant select, insert, update, delete on public.asset_maintenance_plans to authenticated;
grant select, insert, update, delete on public.integration_outbox to authenticated;
grant select, insert, update, delete on public.queued_sync_submissions to authenticated;
grant select, insert, update, delete on public.asset_registration_drafts to authenticated;
grant select, insert, update, delete on public.asset_registration_evidence to authenticated;

commit;
