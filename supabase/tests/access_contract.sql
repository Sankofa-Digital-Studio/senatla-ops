begin;
create extension if not exists pgtap with schema extensions;
select plan(10);

set local session_replication_role = replica;
insert into public.profiles (id, username, display_name, role, is_active, organization_id)
values
  ('10000000-0000-4000-8000-000000000001', 'office.test', 'Office Test', 'office', true, '00000000-0000-4000-8000-000000000001'),
  ('10000000-0000-4000-8000-000000000002', 'director.test', 'Director Test', 'director', true, '00000000-0000-4000-8000-000000000001'),
  ('10000000-0000-4000-8000-000000000003', 'site.test', 'Site Test', 'site', true, '00000000-0000-4000-8000-000000000001'),
  ('10000000-0000-4000-8000-000000000004', 'inactive.test', 'Inactive Test', 'office', false, '00000000-0000-4000-8000-000000000001');
set local session_replication_role = origin;

set local role authenticated;
set local "request.jwt.claims" = '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}';
select is(public.current_app_role()::text, 'office', 'active office role resolves from protected profile data');
select ok(public.is_office_admin(), 'office user receives office mutation capability');
select lives_ok($$ select count(*) from public.assets $$, 'office user can read assets');

set local "request.jwt.claims" = '{"sub":"10000000-0000-4000-8000-000000000002","role":"authenticated"}';
select ok(public.can_read_admin_workspace(), 'director can read the administrative workspace');
select throws_ok(
  $$ insert into public.assets (registration_number, make, model, type, license_expiry, status, organization_id) values ('RLS TEST', 'Test', 'Test', 'Light Vehicle', current_date, 'Active', '00000000-0000-4000-8000-000000000001') $$,
  '42501', null, 'director cannot mutate assets'
);

set local "request.jwt.claims" = '{"sub":"10000000-0000-4000-8000-000000000003","role":"authenticated"}';
select is((select count(*) from public.assets), 0::bigint, 'site role cannot read the administrative asset register');
select ok(not public.can_read_admin_workspace(), 'site role does not receive admin workspace access');

set local "request.jwt.claims" = '{"sub":"10000000-0000-4000-8000-000000000004","role":"authenticated"}';
select is(public.current_app_role(), null::public.app_role, 'inactive profile has no effective application role');

reset role;
insert into public.approval_requests (id, request_type, status, requested_by, requested_by_name, organization_id)
values ('20000000-0000-4000-8000-000000000001', 'user_suspension', 'pending', '10000000-0000-4000-8000-000000000001', 'Office Test', '00000000-0000-4000-8000-000000000001');
select throws_ok(
  $$ update public.approval_requests set status = 'approved', reviewed_by = '10000000-0000-4000-8000-000000000001' where id = '20000000-0000-4000-8000-000000000001' $$,
  'P0001', 'Maker-checker requires a different reviewer', 'requester cannot approve their own request'
);
select lives_ok(
  $$ update public.approval_requests set status = 'approved', reviewed_by = '10000000-0000-4000-8000-000000000002' where id = '20000000-0000-4000-8000-000000000001' $$,
  'different reviewer can approve a pending request'
);

select * from finish();
rollback;

