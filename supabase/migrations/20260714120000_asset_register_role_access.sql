begin;

create or replace function private.can_manage_asset_site(target_site_id uuid, target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    target_organization_id = private.current_organization_id()
    and (
      private.current_app_role() in ('office', 'director')
      or (
        target_site_id is not null
        and private.has_site_access(target_site_id, target_organization_id)
      )
    ),
    false
  )
$$;

revoke all on function private.can_manage_asset_site(uuid, uuid) from public, anon;
grant execute on function private.can_manage_asset_site(uuid, uuid) to authenticated;

create or replace function private.can_manage_asset(target_asset_id uuid, target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    exists (
      select 1
      from public.assets asset
      where asset.id = target_asset_id
        and asset.organization_id = target_organization_id
        and private.can_manage_asset_site(asset.assigned_site_id, asset.organization_id)
    ),
    false
  )
$$;

revoke all on function private.can_manage_asset(uuid, uuid) from public, anon;
grant execute on function private.can_manage_asset(uuid, uuid) to authenticated;

drop policy if exists "assets_read" on public.assets;
drop policy if exists assets_read on public.assets;
create policy assets_read
on public.assets for select to authenticated
using (
  organization_id = private.current_organization_id()
  and (
    public.can_read_admin_workspace()
    or private.can_manage_asset_site(assigned_site_id, organization_id)
  )
);

drop policy if exists "assets_write" on public.assets;
drop policy if exists assets_write on public.assets;
drop policy if exists assets_insert on public.assets;
create policy assets_insert
on public.assets for insert to authenticated
with check (
  organization_id = private.current_organization_id()
  and private.can_manage_asset_site(assigned_site_id, organization_id)
);

drop policy if exists assets_update on public.assets;
create policy assets_update
on public.assets for update to authenticated
using (
  organization_id = private.current_organization_id()
  and private.can_manage_asset_site(assigned_site_id, organization_id)
)
with check (
  organization_id = private.current_organization_id()
  and private.can_manage_asset_site(assigned_site_id, organization_id)
);

drop policy if exists assets_delete on public.assets;
create policy assets_delete
on public.assets for delete to authenticated
using (
  public.is_office_admin()
  and organization_id = private.current_organization_id()
);

drop policy if exists asset_custody_events_read on public.asset_custody_events;
create policy asset_custody_events_read
on public.asset_custody_events for select to authenticated
using (
  organization_id = private.current_organization_id()
  and private.can_manage_asset(asset_id, organization_id)
);

drop policy if exists asset_custody_events_write on public.asset_custody_events;
drop policy if exists asset_custody_events_insert on public.asset_custody_events;
create policy asset_custody_events_insert
on public.asset_custody_events for insert to authenticated
with check (
  organization_id = private.current_organization_id()
  and private.can_manage_asset(asset_id, organization_id)
  and (to_site_id is null or private.can_manage_asset_site(to_site_id, organization_id))
);

drop policy if exists asset_compliance_records_read on public.asset_compliance_records;
create policy asset_compliance_records_read
on public.asset_compliance_records for select to authenticated
using (
  organization_id = private.current_organization_id()
  and private.can_manage_asset(asset_id, organization_id)
);

drop policy if exists asset_compliance_records_write on public.asset_compliance_records;
drop policy if exists asset_compliance_records_upsert on public.asset_compliance_records;
drop policy if exists asset_compliance_records_insert on public.asset_compliance_records;
create policy asset_compliance_records_insert
on public.asset_compliance_records for insert to authenticated
with check (
  organization_id = private.current_organization_id()
  and private.can_manage_asset(asset_id, organization_id)
);

drop policy if exists asset_compliance_records_update on public.asset_compliance_records;
create policy asset_compliance_records_update
on public.asset_compliance_records for update to authenticated
using (
  organization_id = private.current_organization_id()
  and private.can_manage_asset(asset_id, organization_id)
)
with check (
  organization_id = private.current_organization_id()
  and private.can_manage_asset(asset_id, organization_id)
);

drop policy if exists asset_meter_readings_read on public.asset_meter_readings;
create policy asset_meter_readings_read
on public.asset_meter_readings for select to authenticated
using (
  organization_id = private.current_organization_id()
  and private.can_manage_asset(asset_id, organization_id)
);

drop policy if exists asset_meter_readings_write on public.asset_meter_readings;
drop policy if exists asset_meter_readings_insert on public.asset_meter_readings;
create policy asset_meter_readings_insert
on public.asset_meter_readings for insert to authenticated
with check (
  organization_id = private.current_organization_id()
  and private.can_manage_asset(asset_id, organization_id)
);

drop policy if exists asset_work_orders_read on public.asset_work_orders;
create policy asset_work_orders_read
on public.asset_work_orders for select to authenticated
using (
  organization_id = private.current_organization_id()
  and private.can_manage_asset(asset_id, organization_id)
);

drop policy if exists asset_work_orders_write on public.asset_work_orders;
drop policy if exists asset_work_orders_upsert on public.asset_work_orders;
drop policy if exists asset_work_orders_insert on public.asset_work_orders;
create policy asset_work_orders_insert
on public.asset_work_orders for insert to authenticated
with check (
  organization_id = private.current_organization_id()
  and private.can_manage_asset(asset_id, organization_id)
);

drop policy if exists asset_work_orders_update on public.asset_work_orders;
create policy asset_work_orders_update
on public.asset_work_orders for update to authenticated
using (
  organization_id = private.current_organization_id()
  and private.can_manage_asset(asset_id, organization_id)
)
with check (
  organization_id = private.current_organization_id()
  and private.can_manage_asset(asset_id, organization_id)
);

drop policy if exists asset_maintenance_plans_read on public.asset_maintenance_plans;
create policy asset_maintenance_plans_read
on public.asset_maintenance_plans for select to authenticated
using (
  organization_id = private.current_organization_id()
  and private.can_manage_asset(asset_id, organization_id)
);

drop policy if exists asset_maintenance_plans_write on public.asset_maintenance_plans;
drop policy if exists asset_maintenance_plans_upsert on public.asset_maintenance_plans;
drop policy if exists asset_maintenance_plans_insert on public.asset_maintenance_plans;
create policy asset_maintenance_plans_insert
on public.asset_maintenance_plans for insert to authenticated
with check (
  organization_id = private.current_organization_id()
  and private.can_manage_asset(asset_id, organization_id)
);

drop policy if exists asset_maintenance_plans_update on public.asset_maintenance_plans;
create policy asset_maintenance_plans_update
on public.asset_maintenance_plans for update to authenticated
using (
  organization_id = private.current_organization_id()
  and private.can_manage_asset(asset_id, organization_id)
)
with check (
  organization_id = private.current_organization_id()
  and private.can_manage_asset(asset_id, organization_id)
);

drop policy if exists "admin_activity_insert" on public.admin_activity_log;
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
      and entity_type in ('asset', 'asset_import', 'asset_compliance', 'asset_meter', 'asset_work_order', 'asset_maintenance_plan', 'approval_request')
    )
  )
);

drop policy if exists "admin_activity_read" on public.admin_activity_log;
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

drop policy if exists "approval_requests_read" on public.approval_requests;
drop policy if exists approval_requests_read on public.approval_requests;
create policy approval_requests_read
on public.approval_requests for select to authenticated
using (
  organization_id = private.current_organization_id()
  and (
    public.can_read_admin_workspace()
    or requested_by = (select auth.uid())
    or (
      request_type = 'asset_return_to_service'
      and payload ->> 'assetId' ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      and private.can_manage_asset((payload ->> 'assetId')::uuid, organization_id)
    )
  )
);

drop policy if exists "approval_requests_insert" on public.approval_requests;
drop policy if exists approval_requests_insert on public.approval_requests;
create policy approval_requests_insert
on public.approval_requests for insert to authenticated
with check (
  organization_id = private.current_organization_id()
  and requested_by = (select auth.uid())
  and status = 'pending'
  and (
    public.is_office_admin()
    or (
      request_type = 'asset_return_to_service'
      and private.current_app_role() in ('site', 'director')
      and payload ->> 'assetId' ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      and private.can_manage_asset((payload ->> 'assetId')::uuid, organization_id)
    )
  )
);

comment on function private.can_manage_asset_site(uuid, uuid) is 'Asset-register role gate: office/director can manage organization assets; site can manage assets at permitted sites.';
comment on function private.can_manage_asset(uuid, uuid) is 'Asset-register table policy helper for records attached to an accessible asset.';

commit;
