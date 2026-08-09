begin;
create extension if not exists pgtap with schema extensions;
select plan(14);

select has_table('private', 'admin_invitation_codes', 'private invitation registry exists');
select has_trigger('auth', 'users', 'auth_user_provision_least_privilege', 'new auth users receive a trusted profile trigger');
select has_function('public', 'redeem_admin_invitation', array['text'], 'authenticated invitation redemption RPC exists');
select ok(not has_table_privilege('anon', 'private.admin_invitation_codes', 'select'), 'anonymous users cannot read invitation digests');
select ok(not has_table_privilege('authenticated', 'private.admin_invitation_codes', 'select'), 'authenticated users cannot read invitation digests');
select ok(not has_function_privilege('anon', 'public.redeem_admin_invitation(text)', 'execute'), 'anonymous users cannot redeem admin invitations');
select ok(has_function_privilege('authenticated', 'public.redeem_admin_invitation(text)', 'execute'), 'authenticated users may attempt controlled invitation redemption');

insert into auth.users (id, aud, role, email, raw_user_meta_data, created_at, updated_at)
values (
  '40000000-0000-4000-8000-000000000001',
  'authenticated',
  'authenticated',
  'new.user@example.com',
  '{"display_name":"New User","role":"director"}'::jsonb,
  timezone('utc', now()),
  timezone('utc', now())
);

select is((select display_name from public.profiles where id = '40000000-0000-4000-8000-000000000001'), 'New User', 'signup trigger accepts display text');
select is((select role::text from public.profiles where id = '40000000-0000-4000-8000-000000000001'), 'site', 'user metadata cannot self-select a privileged role');
select is((select organization_id from public.profiles where id = '40000000-0000-4000-8000-000000000001'), '00000000-0000-4000-8000-000000000001'::uuid, 'signup profile receives the active organization');
select is((select count(*) from public.profile_site_access where profile_id = '40000000-0000-4000-8000-000000000001'), 0::bigint, 'new profile receives no site assignment');

insert into private.admin_invitation_codes (organization_id, label, code_suffix, code_digest, expires_at)
values ('00000000-0000-4000-8000-000000000001', 'Registration contract', 't-0001', encode(extensions.digest('senatla-admin-test-0001', 'sha256'), 'hex'), now() + interval '10 minutes');

set local role authenticated;
set local "request.jwt.claims" = '{"sub":"40000000-0000-4000-8000-000000000001","role":"authenticated","exp":4102444800}';
select ok(public.redeem_admin_invitation('SENATLA-ADMIN-TEST-0001'), 'valid one-time code promotes the authenticated profile');
reset role;
select is((select role::text from public.profiles where id = '40000000-0000-4000-8000-000000000001'), 'office', 'validated code grants office administrator role');
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"40000000-0000-4000-8000-000000000001","role":"authenticated","exp":4102444800}';
select ok(not public.redeem_admin_invitation('SENATLA-ADMIN-TEST-0001'), 'one-time code cannot be reused');

select * from finish();
rollback;