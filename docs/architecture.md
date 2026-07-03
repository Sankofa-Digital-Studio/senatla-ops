# Senatla Ops Architecture

Senatla Ops is an Ionic/Angular internal application backed by Supabase Auth, Postgres, Storage and row-level security. Local demo and Supabase gateways implement the same behavioral contracts.

The trust boundary is Supabase. Angular route guards improve navigation but never replace RLS. The release has one legal owner, Senatla Trading (`00000000-0000-4000-8000-000000000001`); department remains descriptive metadata.

Operational domains are workforce and sites, attendance and safety, synchronization, issues and approvals, payroll controls, assets and maintenance, and executive analytics. Assets use case-insensitive serial number, VIN and number plate alternate keys. Offline mutations carry idempotency keys through a durable outbox.

The public Senatla Trading website, commerce, telematics, AI recommendations and multi-company tenancy are explicitly outside the release boundary.

