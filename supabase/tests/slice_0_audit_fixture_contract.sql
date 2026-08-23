begin;
create extension if not exists pgtap with schema extensions;
select plan(22);

select is((select count(*) from auth.users where id::text like '51000000-0000-4000-8000-00000000000%'), 5::bigint, 'five deterministic audit auth users exist');
select is((select count(*) from public.profiles where id::text like '51000000-0000-4000-8000-00000000000%' and is_active), 5::bigint, 'all five audit profiles are active');
select is((select count(*) from public.profiles where id in ('51000000-0000-4000-8000-000000000002','51000000-0000-4000-8000-000000000003') and role = 'office'), 2::bigint, 'two distinct office administrators exist');
select is((select role::text from public.profiles where id = '51000000-0000-4000-8000-000000000001'), 'director', 'director identity has director role');
select is((select count(*) from public.profiles where id in ('51000000-0000-4000-8000-000000000004','51000000-0000-4000-8000-000000000005') and role = 'site'), 2::bigint, 'two distinct site managers exist');
select is((select count(*) from public.sites where id in ('52000000-0000-4000-8000-000000000001','52000000-0000-4000-8000-000000000002')), 2::bigint, 'two deterministic audit sites exist');
select is((select count(*) from public.profile_site_access where profile_id = '51000000-0000-4000-8000-000000000004' and site_id = '52000000-0000-4000-8000-000000000001'), 1::bigint, 'site manager A is assigned only to north site');
select is((select count(*) from public.profile_site_access where profile_id = '51000000-0000-4000-8000-000000000005' and site_id = '52000000-0000-4000-8000-000000000002'), 1::bigint, 'site manager B is assigned only to south site');
select is((select count(*) from public.employee_onboarding_records where employee_id in ('53000000-0000-4000-8000-000000000001','53000000-0000-4000-8000-000000000002','53000000-0000-4000-8000-000000000003')), 3::bigint, 'ready warning and blocked employees have onboarding evidence');
select is((select count(*) from public.employee_onboarding_records where employee_id = '53000000-0000-4000-8000-000000000004'), 0::bigint, 'unknown employee intentionally has no onboarding evidence');

set local role authenticated;
set local "request.jwt.claims" = '{"sub":"51000000-0000-4000-8000-000000000004","role":"authenticated","exp":4102444800}';
select is((select count(*) from public.employees where site_id = '52000000-0000-4000-8000-000000000001'), 2::bigint, 'site manager A reads north employees');
select is((select count(*) from public.employees where site_id = '52000000-0000-4000-8000-000000000002'), 0::bigint, 'site manager A cannot read south employees');
select is((select count(*) from public.assets where assigned_site_id = '52000000-0000-4000-8000-000000000001'), 1::bigint, 'site manager A reads north assets');
select is((select count(*) from public.assets where assigned_site_id = '52000000-0000-4000-8000-000000000002'), 0::bigint, 'site manager A cannot read south assets');

set local "request.jwt.claims" = '{"sub":"51000000-0000-4000-8000-000000000005","role":"authenticated","exp":4102444800}';
select is((select count(*) from public.employees where site_id = '52000000-0000-4000-8000-000000000002'), 2::bigint, 'site manager B reads south employees');
select is((select count(*) from public.employees where site_id = '52000000-0000-4000-8000-000000000001'), 0::bigint, 'site manager B cannot read north employees');

set local "request.jwt.claims" = '{"sub":"51000000-0000-4000-8000-000000000002","role":"authenticated","exp":4102444800}';
select lives_ok(
  $$ insert into public.admin_audit_events (id, actor_id, actor_name, action, organization_id) values ('56000000-0000-4000-8000-000000000001', '51000000-0000-4000-8000-000000000003', 'Spoofed actor', 'masked_payroll_export', '00000000-0000-4000-8000-000000000001') $$,
  'office administrator A can append an administrative audit event'
);
select is((select actor_id from public.admin_audit_events where id = '56000000-0000-4000-8000-000000000001'), '51000000-0000-4000-8000-000000000002'::uuid, 'database records office administrator A as the authenticated actor');

set local "request.jwt.claims" = '{"sub":"51000000-0000-4000-8000-000000000003","role":"authenticated","exp":4102444800}';
select lives_ok(
  $$ insert into public.admin_audit_events (id, actor_id, actor_name, action, organization_id) values ('56000000-0000-4000-8000-000000000002', '51000000-0000-4000-8000-000000000002', 'Spoofed actor', 'masked_payroll_export', '00000000-0000-4000-8000-000000000001') $$,
  'office administrator B can append an administrative audit event'
);
select is((select actor_id from public.admin_audit_events where id = '56000000-0000-4000-8000-000000000002'), '51000000-0000-4000-8000-000000000003'::uuid, 'database records office administrator B as the authenticated actor');
select isnt(
  (select actor_id from public.admin_audit_events where id = '56000000-0000-4000-8000-000000000001'),
  (select actor_id from public.admin_audit_events where id = '56000000-0000-4000-8000-000000000002'),
  'same-role office actions remain attributable to distinct humans'
);

reset role;
select is((select count(distinct actor_id) from public.admin_audit_events where id in ('56000000-0000-4000-8000-000000000001','56000000-0000-4000-8000-000000000002')), 2::bigint, 'audit evidence persists two distinct actors');

select * from finish();
rollback;
