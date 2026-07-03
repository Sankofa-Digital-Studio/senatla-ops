create table if not exists public.asset_registration_drafts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  owner_id uuid not null references public.profiles (id) on delete restrict,
  owner_name text not null,
  state text not null default 'draft' check (state in ('draft', 'review_required', 'ready', 'completed')),
  asset_data jsonb not null default '{}'::jsonb,
  completed_asset_id uuid references public.assets (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.asset_registration_evidence (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  draft_id uuid not null references public.asset_registration_drafts (id) on delete cascade,
  uploaded_by uuid not null references public.profiles (id) on delete restrict,
  evidence_type text not null check (evidence_type in ('asset_photo', 'number_plate', 'licence_disc', 'registration_document', 'purchase_invoice', 'other')),
  file_name text not null,
  mime_type text not null,
  storage_path text not null unique,
  extraction_state text not null default 'not_applicable' check (extraction_state in ('not_applicable', 'pending', 'review_required', 'applied')),
  extracted_fields jsonb not null default '{}'::jsonb,
  raw_extraction text,
  created_at timestamptz not null default now()
);

create index if not exists asset_registration_drafts_owner_updated_idx
  on public.asset_registration_drafts (owner_id, updated_at desc)
  where state <> 'completed';

create index if not exists asset_registration_evidence_draft_created_idx
  on public.asset_registration_evidence (draft_id, created_at desc);

alter table public.asset_registration_drafts enable row level security;
alter table public.asset_registration_evidence enable row level security;

drop policy if exists asset_registration_drafts_read on public.asset_registration_drafts;
create policy asset_registration_drafts_read on public.asset_registration_drafts
for select to authenticated
using (owner_id = (select auth.uid()) or public.can_read_admin_workspace());

drop policy if exists asset_registration_drafts_insert on public.asset_registration_drafts;
create policy asset_registration_drafts_insert on public.asset_registration_drafts
for insert to authenticated
with check (
  owner_id = (select auth.uid())
  and organization_id = (select organization_id from public.profiles where id = (select auth.uid()) and is_active = true)
);

drop policy if exists asset_registration_drafts_update on public.asset_registration_drafts;
create policy asset_registration_drafts_update on public.asset_registration_drafts
for update to authenticated
using (owner_id = (select auth.uid()) or public.is_office_admin())
with check (owner_id = (select auth.uid()) or public.is_office_admin());

drop policy if exists asset_registration_evidence_read on public.asset_registration_evidence;
create policy asset_registration_evidence_read on public.asset_registration_evidence
for select to authenticated
using (
  uploaded_by = (select auth.uid())
  or exists (
    select 1 from public.asset_registration_drafts draft
    where draft.id = draft_id and (draft.owner_id = (select auth.uid()) or public.can_read_admin_workspace())
  )
);

drop policy if exists asset_registration_evidence_insert on public.asset_registration_evidence;
create policy asset_registration_evidence_insert on public.asset_registration_evidence
for insert to authenticated
with check (
  uploaded_by = (select auth.uid())
  and organization_id = (select organization_id from public.profiles where id = (select auth.uid()) and is_active = true)
  and exists (
    select 1 from public.asset_registration_drafts draft
    where draft.id = draft_id and draft.owner_id = (select auth.uid())
  )
);

drop policy if exists asset_evidence_read on storage.objects;
create policy asset_evidence_read on storage.objects
for select to authenticated
using (
  bucket_id = 'asset-evidence'
  and (
    public.can_read_admin_workspace()
    or (storage.foldername(name))[2] = (select auth.uid())::text
  )
);

drop policy if exists asset_evidence_insert on storage.objects;
create policy asset_evidence_insert on storage.objects
for insert to authenticated
with check (
  bucket_id = 'asset-evidence'
  and (storage.foldername(name))[1] = (select organization_id::text from public.profiles where id = (select auth.uid()) and is_active = true)
  and (storage.foldername(name))[2] = (select auth.uid())::text
);

comment on table public.asset_registration_drafts is 'User-owned, resumable asset intake records. Finalized assets remain in public.assets.';
comment on table public.asset_registration_evidence is 'Private photos, scans, documents and reviewed extraction metadata attached to an asset registration draft.';
