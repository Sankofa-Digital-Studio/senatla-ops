begin;
create extension if not exists pgtap with schema extensions;
select plan(18);

set local session_replication_role = replica;
insert into public.profiles (id, username, display_name, role, is_active, organization_id)
values
  ('10000000-0000-4000-8000-000000000001', 'office.test', 'Office Test', 'office', true, '00000000-0000-4000-8000-000000000001'),
  ('10000000-0000-4000-8000-000000000002', 'director.test', 'Director Test', 'director', true, '00000000-0000-4000-8000-000000000001'),
  ('10000000-0000-4000-8000-000000000003', 'site.test', 'Site Test', 'site', true, '00000000-0000-4000-8000-000000000001'),
  ('10000000-0000-4000-8000-000000000004', 'inactive.test', 'Inactive Test', 'office', false, '00000000-0000-4000-8000-000000000001');

insert into public.sites (id, name, location, manager_profile_id, is_active, organization_id)
values
  ('11000000-0000-4000-8000-000000000001', 'Allowed Site', 'North', '10000000-0000-4000-8000-000000000003', true, '00000000-0000-4000-8000-000000000001'),
  ('11000000-0000-4000-8000-000000000002', 'Other Site', 'South', null, true, '00000000-0000-4000-8000-000000000001');

insert into public.profile_site_access (profile_id, site_id, organization_id)
values ('10000000-0000-4000-8000-000000000003', '11000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001');

insert into public.employees (id, first_name, surname, id_number, role, site_id, start_date, organization_id)
values
  ('12000000-0000-4000-8000-000000000001', 'Allowed', 'Worker', 'RLS-ALLOWED', 'Operator', '11000000-0000-4000-8000-000000000001', current_date, '00000000-0000-4000-8000-000000000001'),
  ('12000000-0000-4000-8000-000000000002', 'Other', 'Worker', 'RLS-OTHER', 'Operator', '11000000-0000-4000-8000-000000000002', current_date, '00000000-0000-4000-8000-000000000001');

insert into public.approval_requests (id, request_type, status, requested_by, requested_by_name, organization_id)
values ('20000000-0000-4000-8000-000000000001', 'user_suspension', 'pending', '10000000-0000-4000-8000-000000000001', 'Office Test', '00000000-0000-4000-8000-000000000001');
set local session_replication_role = origin;

set local role authenticated;
set local "request.jwt.claims" = '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated","exp":4102444800}';
select is(public.current_app_role()::text, 'office', 'active office role resolves from protected profile data');
select ok(public.is_office_admin(), 'office user receives office mutation capability');
select lives_ok($$ select count(*) from public.assets $$, 'office user can read assets');

set local "request.jwt.claims" = '{"sub":"10000000-0000-4000-8000-000000000002","role":"authenticated","exp":4102444800}';
select ok(public.can_read_admin_workspace(), 'director can read the administrative workspace');
select throws_ok(
  $$ insert into public.assets (registration_number, make, model, type, license_expiry, status, organization_id) values ('RLS TEST', 'Test', 'Test', 'Light Vehicle', current_date, 'Active', '00000000-0000-4000-8000-000000000001') $$,
  '42501', null, 'director cannot mutate assets'
);

set local "request.jwt.claims" = '{"sub":"10000000-0000-4000-8000-000000000003","role":"authenticated","exp":4102444800}';
select ok(not public.can_read_admin_workspace(), 'site role does not receive admin workspace access');
select is((select count(*) from public.employees where site_id = '11000000-0000-4000-8000-000000000001'), 1::bigint, 'site role can read employees at an assigned site');
select is((select count(*) from public.employees where site_id = '11000000-0000-4000-8000-000000000002'), 0::bigint, 'site role cannot read employees at another site');

set local "request.jwt.claims" = '{"sub":"10000000-0000-4000-8000-000000000004","role":"authenticated","exp":4102444800}';
select is(public.current_app_role(), null::public.app_role, 'inactive profile has no effective application role');
select is((select count(*) from public.assets), 0::bigint, 'inactive profile cannot read protected assets');

set local "request.jwt.claims" = '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated","exp":1}';
select is(public.current_app_role(), null::public.app_role, 'expired session has no effective application role');
select is((select count(*) from public.app_state_snapshots), 0::bigint, 'expired session cannot read application state');

set local "request.jwt.claims" = '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated","exp":4102444800}';
select throws_ok(
  $$ update public.profiles set role = 'director' where id = '10000000-0000-4000-8000-000000000001' $$,
  '42501', null, 'authenticated clients cannot change trusted profile roles'
);
select results_eq(
  $$ update public.approval_requests set status = 'approved', reviewed_by = '10000000-0000-4000-8000-000000000001' where id = '20000000-0000-4000-8000-000000000001' returning id $$,
  $$ values (null::uuid) limit 0 $$,
  'office users cannot perform director approval updates'
);

set local "request.jwt.claims" = '{"sub":"10000000-0000-4000-8000-000000000002","role":"authenticated","exp":4102444800}';
select results_eq(
  $$ update public.approval_requests set status = 'approved', reviewed_by = '10000000-0000-4000-8000-000000000002', reviewed_by_name = 'Director Test', reviewed_at = now() where id = '20000000-0000-4000-8000-000000000001' returning status $$,
  $$ values ('approved'::text) $$,
  'director can approve a request from a different user'
);

set local "request.jwt.claims" = '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated","exp":4102444800}';
select lives_ok(
  $$ insert into public.auth_activity_events (organization_id, actor_id, target_profile_id, event_type) values ('00000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'login') $$,
  'authenticated user can record their own login event'
);
select is((select count(*) from public.auth_activity_events where actor_id = '10000000-0000-4000-8000-000000000001'), 1::bigint, 'authentication event remains auditable');

reset role;
select is((select status from public.approval_requests where id = '20000000-0000-4000-8000-000000000001'), 'approved', 'director approval persisted');

select * from finish();
rollback;

