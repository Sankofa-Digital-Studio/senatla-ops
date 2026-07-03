create table if not exists public.approval_requests (
  id uuid primary key default gen_random_uuid(),
  request_type text not null,
  status text not null default 'pending',
  requested_by uuid not null references public.profiles (id) on delete restrict,
  requested_by_name text not null,
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_by_name text,
  payload jsonb not null default '{}'::jsonb,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  reviewed_at timestamptz
);

alter table public.approval_requests enable row level security;

drop policy if exists "approval_requests_read" on public.approval_requests;
create policy "approval_requests_read"
on public.approval_requests
for select
to authenticated
using (public.can_read_admin_workspace());

drop policy if exists "approval_requests_insert" on public.approval_requests;
create policy "approval_requests_insert"
on public.approval_requests
for insert
to authenticated
with check (
  public.is_office_admin()
  and requested_by = auth.uid()
  and status = 'pending'
);

drop policy if exists "approval_requests_update" on public.approval_requests;
create policy "approval_requests_update"
on public.approval_requests
for update
to authenticated
using (public.can_read_admin_workspace())
with check (
  public.can_read_admin_workspace()
  and (
    status = 'pending'
    or reviewed_by = auth.uid()
  )
);
