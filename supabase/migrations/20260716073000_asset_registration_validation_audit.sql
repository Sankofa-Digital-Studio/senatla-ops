alter table public.asset_registration_drafts
  add column if not exists validation_errors jsonb not null default '[]'::jsonb,
  add column if not exists verified_at timestamptz,
  add column if not exists verified_by uuid references public.profiles (id) on delete set null;

create index if not exists asset_registration_drafts_state_updated_idx
  on public.asset_registration_drafts (state, updated_at desc);

comment on column public.asset_registration_drafts.validation_errors is 'Latest server/client validation messages shown before final asset registration save.';
comment on column public.asset_registration_drafts.verified_at is 'Timestamp when the registering user confirmed OCR/manual details before final save.';
comment on column public.asset_registration_drafts.verified_by is 'Profile that confirmed captured evidence and registration values.';

drop policy if exists admin_activity_insert on public.admin_activity_log;
create policy admin_activity_insert
on public.admin_activity_log for insert to authenticated
with check (
  actor_id = (select auth.uid())
  and organization_id = private.current_organization_id()
  and (
    public.is_office_admin()
    or (
      private.current_app_role() in ('site', 'director')
      and entity_type in ('asset', 'asset_import', 'asset_registration', 'asset_compliance', 'asset_meter', 'asset_work_order', 'asset_maintenance_plan', 'approval_request')
    )
  )
);

drop policy if exists admin_activity_read on public.admin_activity_log;
create policy admin_activity_read
on public.admin_activity_log for select to authenticated
using (
  organization_id = private.current_organization_id()
  and (
    public.can_read_admin_workspace()
    or actor_id = (select auth.uid())
    or (private.current_app_role() = 'site' and entity_type like 'asset%')
  )
);
