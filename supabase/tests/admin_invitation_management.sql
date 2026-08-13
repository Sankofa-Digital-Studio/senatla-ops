begin;
create extension if not exists pgtap with schema extensions;
select plan(16);
select has_column('private', 'admin_invitation_codes', 'organization_id', 'invitations are organization-owned');
select has_column('private', 'admin_invitation_codes', 'code_suffix', 'only a safe suffix is retained for display');
select has_column('private', 'admin_invitation_codes', 'revoked_at', 'explicit revocation metadata exists');
select has_function('public', 'admin_issue_invitation_record', array['uuid','uuid','text','text','text','timestamp with time zone','integer'], 'service-only issuance function exists');
select has_function('public', 'admin_list_invitation_records', array['uuid','uuid'], 'service-only listing function exists');
select has_function('public', 'admin_revoke_invitation_record', array['uuid','uuid','uuid'], 'service-only revocation function exists');
select ok(not has_function_privilege('authenticated', 'public.admin_list_invitation_records(uuid,uuid)', 'execute'), 'browser clients cannot enumerate invitation records');
select ok(has_function_privilege('service_role', 'public.admin_list_invitation_records(uuid,uuid)', 'execute'), 'service role can use the protected listing contract');

set local session_replication_role = replica;
insert into public.profiles (id, username, display_name, role, is_active, organization_id) values
('51000000-0000-4000-8000-000000000001','issuer@example.com','Issuer','office',true,'00000000-0000-4000-8000-000000000001'),
('51000000-0000-4000-8000-000000000002','site@example.com','Site User','site',true,'00000000-0000-4000-8000-000000000001');
set local session_replication_role = origin;

select throws_ok($$select public.admin_issue_invitation_record(
  '51000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000001','Blocked issue',
  repeat('a',64),'aaaaaa',now()+interval '1 day',1)$$, 'P0001',
  'Only an active office administrator can manage invitation codes', 'site role cannot issue codes even through the service contract');

select lives_ok($$select public.admin_issue_invitation_record(
  '51000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001','August administrator',
  repeat('b',64),'bb1234',now()+interval '1 day',1)$$, 'office administrator can issue a bounded code');
select is((select count(*) from private.admin_invitation_codes where label='August administrator' and code_digest=repeat('b',64)),1::bigint,'issued record stores the digest, not plaintext');
select is((select status from public.admin_list_invitation_records('51000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001') where label='August administrator'),'active','protected register reports active status');
select ok(public.admin_revoke_invitation_record('51000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001',(select id from private.admin_invitation_codes where label='August administrator')),'active invitation can be revoked');
select ok(not public.admin_revoke_invitation_record('51000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001',(select id from private.admin_invitation_codes where label='August administrator')),'revocation is idempotently rejected after the first success');
select is((select status from public.admin_list_invitation_records('51000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001') where label='August administrator'),'revoked','protected register reports revoked status');
select is((select count(*) from public.auth_activity_events where actor_id='51000000-0000-4000-8000-000000000001' and event_type in ('admin_code_issued','admin_code_revoked')),2::bigint,'issuance and revocation leave audit evidence');
select * from finish();
rollback;
