begin;

create table if not exists private.admin_invitation_codes (
  id uuid primary key default gen_random_uuid(),
  code_digest text not null unique,
  expires_at timestamptz not null,
  max_uses integer not null default 1 check (max_uses > 0),
  used_count integer not null default 0 check (used_count >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  last_used_at timestamptz
);

revoke all on private.admin_invitation_codes from public, anon, authenticated;

create or replace function private.provision_least_privilege_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  safe_display_name text;
begin
  safe_display_name := left(
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'New user'
    ),
    120
  );

  insert into public.profiles (
    id,
    username,
    display_name,
    role,
    is_active,
    organization_id
  )
  values (
    new.id,
    lower(new.email),
    safe_display_name,
    'site',
    true,
    '00000000-0000-4000-8000-000000000001'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke all on function private.provision_least_privilege_profile() from public, anon, authenticated;

drop trigger if exists auth_user_provision_least_privilege on auth.users;
create trigger auth_user_provision_least_privilege
after insert on auth.users
for each row execute function private.provision_least_privilege_profile();

create or replace function public.redeem_admin_invitation(invitation_code text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  invitation private.admin_invitation_codes%rowtype;
  normalized_digest text;
begin
  if auth.uid() is null or not private.auth_session_is_current() then
    raise exception 'Active authenticated profile required';
  end if;

  if invitation_code is null or length(trim(invitation_code)) < 12 then
    return false;
  end if;

  normalized_digest := encode(extensions.digest(lower(trim(invitation_code)), 'sha256'), 'hex');

  select * into invitation
  from private.admin_invitation_codes
  where code_digest = normalized_digest
    and is_active = true
    and expires_at > statement_timestamp()
    and used_count < max_uses
  for update;

  if invitation.id is null then
    return false;
  end if;

  update public.profiles
  set role = 'office', updated_at = timezone('utc', now())
  where id = auth.uid()
    and role = 'site'
    and is_active = true
    and organization_id = '00000000-0000-4000-8000-000000000001';

  if not found then
    return false;
  end if;

  update private.admin_invitation_codes
  set used_count = used_count + 1,
      last_used_at = timezone('utc', now()),
      is_active = (used_count + 1) < max_uses
  where id = invitation.id;

  return true;
end;
$$;

revoke all on function public.redeem_admin_invitation(text) from public, anon;
grant execute on function public.redeem_admin_invitation(text) to authenticated;

comment on function public.redeem_admin_invitation(text) is
  'Redeems a private one-time invitation for the current least-privileged profile. Codes are compared as digests and never stored in user metadata.';

commit;