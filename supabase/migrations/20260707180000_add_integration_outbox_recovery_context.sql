alter table public.integration_outbox
  add column if not exists last_error text;

comment on column public.integration_outbox.last_error is
  'Latest processing error retained for operator recovery and escalation context.';
