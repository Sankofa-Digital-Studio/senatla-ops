begin;

alter table public.attendance_audit_events
  add column if not exists site_id uuid references public.sites (id) on delete restrict;

alter table public.admin_audit_events drop constraint if exists admin_audit_events_action_check;
alter table public.admin_audit_events add constraint admin_audit_events_action_check
  check (action in ('sensitive_ids_shown', 'sensitive_ids_hidden', 'masked_payroll_export', 'full_payroll_export')) not valid;

alter table public.attendance_audit_events drop constraint if exists attendance_audit_events_action_check;
alter table public.attendance_audit_events add constraint attendance_audit_events_action_check
  check (action in (
    'attendance_marked_present', 'attendance_marked_absent', 'attendance_marked_pending',
    'attendance_reason_updated', 'attendance_comment_updated', 'safety_talk_completed',
    'safety_talk_updated', 'sync_submitted'
  )) not valid;

create index if not exists admin_audit_events_actor_time_idx
  on public.admin_audit_events (actor_id, occurred_at desc);
create index if not exists attendance_audit_events_actor_time_idx
  on public.attendance_audit_events (actor_id, occurred_at desc);
create index if not exists attendance_audit_events_site_time_idx
  on public.attendance_audit_events (site_id, occurred_at desc)
  where site_id is not null;

create or replace function private.prepare_audit_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  audit_profile public.profiles%rowtype;
  employee_site_id uuid;
begin
  if auth.uid() is null then
    return new;
  end if;

  select * into audit_profile
  from public.profiles
  where id = auth.uid() and is_active = true;

  if audit_profile.id is null then
    raise exception 'An active authenticated profile is required';
  end if;

  new.actor_id := audit_profile.id;
  new.actor_name := audit_profile.display_name;
  new.organization_id := audit_profile.organization_id;
  new.occurred_at := timezone('utc', now());

  if tg_table_name = 'attendance_audit_events' then
    if new.employee_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
      select site_id into employee_site_id
      from public.employees
      where id = new.employee_id::uuid
        and organization_id = audit_profile.organization_id;
      new.site_id := coalesce(employee_site_id, new.site_id);
    end if;

    if new.site_id is not null and not exists (
      select 1 from public.sites
      where id = new.site_id and organization_id = audit_profile.organization_id
    ) then
      raise exception 'Audit site is outside the authenticated organization';
    end if;
  end if;

  return new;
end;
$$;

create or replace function private.reject_audit_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'Audit events are immutable';
end;
$$;

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
      and (
        profile.id = event_actor_id
        or profile.role in ('office', 'director')
        or (
          profile.role = 'site'
          and event_site_id is not null
          and exists (
            select 1 from public.sites site
            where site.id = event_site_id
              and site.organization_id = event_organization_id
              and site.manager_profile_id = profile.id
          )
        )
      )
  )
$$;

revoke all on function private.can_read_audit_event(uuid, uuid, uuid) from public, anon;
grant execute on function private.can_read_audit_event(uuid, uuid, uuid) to authenticated;

drop trigger if exists admin_audit_prepare_insert on public.admin_audit_events;
create trigger admin_audit_prepare_insert
before insert on public.admin_audit_events
for each row execute function private.prepare_audit_event();

drop trigger if exists attendance_audit_prepare_insert on public.attendance_audit_events;
create trigger attendance_audit_prepare_insert
before insert on public.attendance_audit_events
for each row execute function private.prepare_audit_event();

drop trigger if exists admin_audit_reject_mutation on public.admin_audit_events;
create trigger admin_audit_reject_mutation
before update or delete on public.admin_audit_events
for each row execute function private.reject_audit_mutation();

drop trigger if exists attendance_audit_reject_mutation on public.attendance_audit_events;
create trigger attendance_audit_reject_mutation
before update or delete on public.attendance_audit_events
for each row execute function private.reject_audit_mutation();

revoke all on public.admin_audit_events from anon;
revoke all on public.attendance_audit_events from anon;
revoke update, delete, truncate on public.admin_audit_events from authenticated;
revoke update, delete, truncate on public.attendance_audit_events from authenticated;
grant select, insert on public.admin_audit_events to authenticated;
grant select, insert on public.attendance_audit_events to authenticated;

drop policy if exists "admin_audit_select_own" on public.admin_audit_events;
drop policy if exists "admin_audit_insert_own" on public.admin_audit_events;
drop policy if exists admin_audit_read on public.admin_audit_events;
drop policy if exists admin_audit_insert on public.admin_audit_events;

create policy admin_audit_read
on public.admin_audit_events
for select to authenticated
using (
  (select private.can_read_audit_event(actor_id, organization_id, null))
);

create policy admin_audit_insert
on public.admin_audit_events
for insert to authenticated
with check (
  (select auth.uid()) is not null
  and actor_id = (select auth.uid())
  and organization_id = (select organization_id from public.profiles where id = (select auth.uid()))
  and (select public.is_office_admin())
);

drop policy if exists "attendance_audit_select_own" on public.attendance_audit_events;
drop policy if exists "attendance_audit_insert_own" on public.attendance_audit_events;
drop policy if exists attendance_audit_read on public.attendance_audit_events;
drop policy if exists attendance_audit_insert on public.attendance_audit_events;

create policy attendance_audit_read
on public.attendance_audit_events
for select to authenticated
using (
  (select private.can_read_audit_event(actor_id, organization_id, site_id))
);

create policy attendance_audit_insert
on public.attendance_audit_events
for insert to authenticated
with check (
  (select auth.uid()) is not null
  and actor_id = (select auth.uid())
  and organization_id = (select organization_id from public.profiles where id = (select auth.uid()))
  and (select public.current_app_role()) in ('site', 'office')
);

insert into public.admin_audit_events (id, actor_id, actor_name, action, details, occurred_at, organization_id)
select
  case when event->>'id' ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then (event->>'id')::uuid else gen_random_uuid() end,
  snapshots.user_id,
  coalesce(nullif(event->>'actor', ''), profiles.display_name),
  event->>'action',
  nullif(event->>'details', ''),
  case when event->>'occurredAt' ~ '^[0-9]{4}-' then (event->>'occurredAt')::timestamptz else timezone('utc', now()) end,
  snapshots.organization_id
from public.app_state_snapshots snapshots
join public.profiles profiles on profiles.id = snapshots.user_id
cross join lateral jsonb_array_elements(coalesce(snapshots.snapshot->'adminAuditTrail', '[]'::jsonb)) event
where nullif(event->>'action', '') is not null
on conflict (id) do nothing;

insert into public.attendance_audit_events (id, actor_id, actor_name, employee_id, employee_name, action, details, occurred_at, organization_id)
select
  case when event->>'id' ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then (event->>'id')::uuid else gen_random_uuid() end,
  snapshots.user_id,
  coalesce(nullif(event->>'actor', ''), profiles.display_name),
  nullif(event->>'employeeId', ''),
  nullif(event->>'employeeName', ''),
  event->>'action',
  nullif(event->>'details', ''),
  case when event->>'occurredAt' ~ '^[0-9]{4}-' then (event->>'occurredAt')::timestamptz else timezone('utc', now()) end,
  snapshots.organization_id
from public.app_state_snapshots snapshots
join public.profiles profiles on profiles.id = snapshots.user_id
cross join lateral jsonb_array_elements(coalesce(snapshots.snapshot->'attendanceAuditTrail', '[]'::jsonb)) event
where nullif(event->>'action', '') is not null
on conflict (id) do nothing;

update public.app_state_snapshots
set snapshot = snapshot - 'adminAuditTrail' - 'attendanceAuditTrail';

alter table public.admin_audit_events validate constraint admin_audit_events_action_check;
alter table public.attendance_audit_events validate constraint attendance_audit_events_action_check;

commit;
