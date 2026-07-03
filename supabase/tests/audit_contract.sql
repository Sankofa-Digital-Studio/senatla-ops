begin;
create extension if not exists pgtap with schema extensions;
select plan(9);

set local session_replication_role = replica;
insert into public.profiles (id, username, display_name, role, is_active, organization_id)
values
  ('30000000-0000-4000-8000-000000000001', 'audit.office', 'Audit Office', 'office', true, '00000000-0000-4000-8000-000000000001'),
  ('30000000-0000-4000-8000-000000000002', 'audit.site', 'Audit Site', 'site', true, '00000000-0000-4000-8000-000000000001'),
  ('30000000-0000-4000-8000-000000000003', 'audit.other', 'Audit Other Site', 'site', true, '00000000-0000-4000-8000-000000000001');
insert into public.sites (id, name, location, manager_profile_id, is_active, organization_id)
values ('33000000-0000-4000-8000-000000000001', 'Audit Site', 'Test Yard', '30000000-0000-4000-8000-000000000002', true, '00000000-0000-4000-8000-000000000001');
set local session_replication_role = origin;

set local role authenticated;
set local "request.jwt.claims" = '{"sub":"30000000-0000-4000-8000-000000000002","role":"authenticated"}';

select lives_ok(
  $$ insert into public.attendance_audit_events (id, actor_id, actor_name, action, organization_id) values ('31000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', 'Spoofed Name', 'attendance_marked_present', '00000000-0000-4000-8000-000000000001') $$,
  'site manager can append an attendance audit event'
);
select is((select actor_id from public.attendance_audit_events where id = '31000000-0000-4000-8000-000000000001'), '30000000-0000-4000-8000-000000000002'::uuid, 'database derives attendance actor id from auth');
select is((select actor_name from public.attendance_audit_events where id = '31000000-0000-4000-8000-000000000001'), 'Audit Site', 'database derives attendance actor name from protected profile');
select throws_ok(
  $$ update public.attendance_audit_events set details = 'changed' where id = '31000000-0000-4000-8000-000000000001' $$,
  '42501', null, 'authenticated users cannot update attendance audit events'
);
select throws_ok(
  $$ insert into public.admin_audit_events (id, actor_id, actor_name, action, organization_id) values ('32000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000002', 'Audit Site', 'masked_payroll_export', '00000000-0000-4000-8000-000000000001') $$,
  '42501', null, 'site managers cannot append administrative audit events'
);

set local "request.jwt.claims" = '{"sub":"30000000-0000-4000-8000-000000000001","role":"authenticated"}';
select lives_ok(
  $$ insert into public.admin_audit_events (id, actor_id, actor_name, action, organization_id) values ('32000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000002', 'Spoofed Name', 'masked_payroll_export', '00000000-0000-4000-8000-000000000001') $$,
  'office administrator can append an administrative audit event'
);
select is((select actor_id from public.admin_audit_events where id = '32000000-0000-4000-8000-000000000001'), '30000000-0000-4000-8000-000000000001'::uuid, 'database derives administrative actor id from auth');
insert into public.attendance_audit_events (id, actor_id, actor_name, site_id, action, organization_id)
values ('31000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000001', 'Audit Office', '33000000-0000-4000-8000-000000000001', 'sync_submitted', '00000000-0000-4000-8000-000000000001');

set local "request.jwt.claims" = '{"sub":"30000000-0000-4000-8000-000000000002","role":"authenticated"}';
select is((select count(*) from public.attendance_audit_events where id = '31000000-0000-4000-8000-000000000002'), 1::bigint, 'assigned site manager can read the site audit slice');

set local "request.jwt.claims" = '{"sub":"30000000-0000-4000-8000-000000000003","role":"authenticated"}';
select is((select count(*) from public.attendance_audit_events where id = '31000000-0000-4000-8000-000000000002'), 0::bigint, 'other site managers cannot read the site audit slice');

select * from finish();
rollback;
