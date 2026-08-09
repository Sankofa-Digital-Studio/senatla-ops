begin;

alter table private.admin_invitation_codes
  add column if not exists organization_id uuid references public.organizations (id) on delete restrict,
  add column if not exists label text,
  add column if not exists code_suffix text,
  add column if not exists created_by uuid references public.profiles (id) on delete set null,
  add column if not exists revoked_at timestamptz,
  add column if not exists revoked_by uuid references public.profiles (id) on delete set null,
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

update private.admin_invitation_codes
set organization_id = '00000000-0000-4000-8000-000000000001',
    label = coalesce(label, 'Legacy administrator invitation'),
    code_suffix = coalesce(code_suffix, 'legacy')
where organization_id is null or label is null or code_suffix is null;

alter table private.admin_invitation_codes
  alter column organization_id set not null,
  alter column label set not null,
  alter column code_suffix set not null;

alter table private.admin_invitation_codes
  drop constraint if exists admin_invitation_codes_label_length,
  add constraint admin_invitation_codes_label_length check (char_length(label) between 3 and 80),
  drop constraint if exists admin_invitation_codes_code_suffix_length,
  add constraint admin_invitation_codes_code_suffix_length check (char_length(code_suffix) between 4 and 12),
  drop constraint if exists admin_invitation_codes_usage_bounds,
  add constraint admin_invitation_codes_usage_bounds check (used_count <= max_uses);

create index if not exists admin_invitation_codes_org_created_idx
  on private.admin_invitation_codes (organization_id, created_at desc);

alter table public.auth_activity_events drop constraint if exists auth_activity_events_event_type_check;
alter table public.auth_activity_events add constraint auth_activity_events_event_type_check check (event_type in (
  'login', 'logout', 'user_invited', 'role_changed', 'account_activated',
  'account_deactivated', 'password_reset_requested', 'admin_code_issued',
  'admin_code_revoked', 'admin_code_redeemed'
));

create or replace function private.assert_office_invitation_actor(p_actor_id uuid, p_organization_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.profiles p where p.id = p_actor_id
    and p.organization_id = p_organization_id and p.role = 'office' and p.is_active) then
    raise exception 'Only an active office administrator can manage invitation codes';
  end if;
end; $$;
revoke all on function private.assert_office_invitation_actor(uuid, uuid) from public, anon, authenticated;

create or replace function public.admin_issue_invitation_record(
  p_actor_id uuid, p_organization_id uuid, p_label text, p_digest text,
  p_suffix text, p_expires_at timestamptz, p_max_uses integer
) returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  perform private.assert_office_invitation_actor(p_actor_id, p_organization_id);
  if char_length(trim(p_label)) not between 3 and 80 or p_digest !~ '^[0-9a-f]{64}$'
    or char_length(p_suffix) not between 4 and 12 or p_expires_at <= statement_timestamp()
    or p_expires_at > statement_timestamp() + interval '30 days' or p_max_uses not between 1 and 25 then
    raise exception 'Invalid invitation parameters';
  end if;
  insert into private.admin_invitation_codes
    (organization_id, label, code_digest, code_suffix, expires_at, max_uses, created_by)
  values (p_organization_id, trim(p_label), p_digest, lower(p_suffix), p_expires_at, p_max_uses, p_actor_id)
  returning id into v_id;
  insert into public.auth_activity_events (organization_id, actor_id, target_profile_id, event_type, details)
  values (p_organization_id, p_actor_id, null, 'admin_code_issued',
    jsonb_build_object('invitationId', v_id, 'label', trim(p_label), 'suffix', lower(p_suffix),
      'expiresAt', p_expires_at, 'maxUses', p_max_uses));
  return v_id;
end; $$;

create or replace function public.admin_list_invitation_records(p_actor_id uuid, p_organization_id uuid)
returns table (id uuid, label text, code_suffix text, expires_at timestamptz, max_uses integer,
  used_count integer, status text, created_at timestamptz, created_by_name text,
  last_used_at timestamptz, revoked_at timestamptz)
language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_office_invitation_actor(p_actor_id, p_organization_id);
  return query select i.id, i.label, i.code_suffix, i.expires_at, i.max_uses, i.used_count,
    case when i.revoked_at is not null then 'revoked'
      when i.used_count >= i.max_uses then 'exhausted'
      when i.expires_at <= statement_timestamp() then 'expired'
      when not i.is_active then 'revoked' else 'active' end,
    i.created_at, coalesce(p.display_name, 'System'), i.last_used_at, i.revoked_at
  from private.admin_invitation_codes i left join public.profiles p on p.id = i.created_by
  where i.organization_id = p_organization_id order by i.created_at desc limit 100;
end; $$;

create or replace function public.admin_revoke_invitation_record(p_actor_id uuid, p_organization_id uuid, p_invitation_id uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
declare v_label text; v_suffix text;
begin
  perform private.assert_office_invitation_actor(p_actor_id, p_organization_id);
  update private.admin_invitation_codes set is_active = false, revoked_at = timezone('utc', now()),
    revoked_by = p_actor_id, updated_at = timezone('utc', now())
  where id = p_invitation_id and organization_id = p_organization_id and is_active and revoked_at is null
  returning label, code_suffix into v_label, v_suffix;
  if not found then return false; end if;
  insert into public.auth_activity_events (organization_id, actor_id, target_profile_id, event_type, details)
  values (p_organization_id, p_actor_id, null, 'admin_code_revoked',
    jsonb_build_object('invitationId', p_invitation_id, 'label', v_label, 'suffix', v_suffix));
  return true;
end; $$;

revoke all on function public.admin_issue_invitation_record(uuid, uuid, text, text, text, timestamptz, integer) from public, anon, authenticated;
revoke all on function public.admin_list_invitation_records(uuid, uuid) from public, anon, authenticated;
revoke all on function public.admin_revoke_invitation_record(uuid, uuid, uuid) from public, anon, authenticated;
grant execute on function public.admin_issue_invitation_record(uuid, uuid, text, text, text, timestamptz, integer) to service_role;
grant execute on function public.admin_list_invitation_records(uuid, uuid) to service_role;
grant execute on function public.admin_revoke_invitation_record(uuid, uuid, uuid) to service_role;

create or replace function public.redeem_admin_invitation(invitation_code text)
returns boolean language plpgsql security definer set search_path = '' as $$
declare v_invitation private.admin_invitation_codes%rowtype;
begin
  if auth.uid() is null or not private.auth_session_is_current() then raise exception 'Active authenticated profile required'; end if;
  if invitation_code is null or length(trim(invitation_code)) < 12 then return false; end if;
  select * into v_invitation from private.admin_invitation_codes
  where code_digest = encode(extensions.digest(lower(trim(invitation_code)), 'sha256'), 'hex')
    and is_active and revoked_at is null and expires_at > statement_timestamp() and used_count < max_uses for update;
  if v_invitation.id is null then return false; end if;
  update public.profiles set role = 'office', updated_at = timezone('utc', now())
  where id = auth.uid() and role = 'site' and is_active and organization_id = v_invitation.organization_id;
  if not found then return false; end if;
  update private.admin_invitation_codes set used_count = used_count + 1,
    last_used_at = timezone('utc', now()), updated_at = timezone('utc', now()),
    is_active = (used_count + 1) < max_uses where id = v_invitation.id;
  insert into public.auth_activity_events (organization_id, actor_id, target_profile_id, event_type, details)
  values (v_invitation.organization_id, auth.uid(), auth.uid(), 'admin_code_redeemed',
    jsonb_build_object('invitationId', v_invitation.id, 'label', v_invitation.label, 'suffix', v_invitation.code_suffix));
  return true;
end; $$;
revoke all on function public.redeem_admin_invitation(text) from public, anon;
grant execute on function public.redeem_admin_invitation(text) to authenticated;

commit;
