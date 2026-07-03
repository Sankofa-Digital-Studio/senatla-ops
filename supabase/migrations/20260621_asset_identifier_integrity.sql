alter table public.assets
  alter column vin drop not null;

alter table public.assets
  drop constraint if exists assets_identifier_required;

alter table public.assets
  add constraint assets_identifier_required check (
    nullif(btrim(registration_number), '') is not null
    or nullif(btrim(serial_number), '') is not null
    or nullif(btrim(vin), '') is not null
  );

create unique index if not exists assets_serial_number_idx
  on public.assets (upper(btrim(serial_number)))
  where nullif(btrim(serial_number), '') is not null;

create unique index if not exists assets_vin_idx
  on public.assets (upper(btrim(vin)))
  where nullif(btrim(vin), '') is not null;

drop index if exists public.assets_registration_number_idx;

create unique index if not exists assets_registration_number_idx
  on public.assets (upper(btrim(registration_number)))
  where nullif(btrim(registration_number), '') is not null;
