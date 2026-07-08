# ADR 0001: Supabase Auth and Database-Enforced Authorization

- **Status:** Accepted
- **Issue:** #18
- **Date:** 7 July 2026

## Decision

Senatla Ops uses one production authentication boundary: Supabase Auth issues and refreshes user sessions, while protected public.profiles records resolve organisation, role, active status and permitted sites. Angular route guards provide navigation guidance only. PostgreSQL Row Level Security remains authoritative for every direct data request.

Local application-state mode may use synthetic local records, but it still requires Supabase Auth and cannot read or write operational Supabase tables. Test authentication exists only through test dependency injection and is excluded from production bundles.

## Session model

1. The browser signs in through signInWithPassword.
2. The client verifies the returned identity through Supabase getUser.
3. The gateway loads an active protected profile and its profile_site_access rows.
4. Missing, inactive, expired, unassigned or cross-organisation identities are signed out.
5. RLS independently repeats active-session, organisation, role and site checks.

Authorization never reads user-editable metadata. Profile mutation is revoked from authenticated clients and account provisioning, role changes, activation, deactivation and reset requests pass through api/admin/users.ts, which verifies the bearer token and active office profile with the service-role key held server-side.

## Audit model

- Successful login and logout create immutable auth_activity_events.
- Invitations, role changes, activation, deactivation and password-reset requests are recorded by the server endpoint.
- Failed password sign-ins remain in Supabase Auth audit logs because no authenticated actor exists for an application-table insert.
- Audit rows cannot be updated or deleted by authenticated clients.

## Alternatives rejected

- **Browser demo users:** rejected because credentials and roles become client-trusted.
- **JWT user metadata roles:** rejected because users can edit user_metadata.
- **Angular guards as authorization:** rejected because direct API calls bypass routing.
- **A second custom token service:** rejected because it duplicates Supabase session lifecycle and increases failure modes.

## Rollout and rollback

Apply 20260707185336_issue_18_auth_boundary.sql in preview, run pgTAP contracts, provision unique Auth users, then promote the same migration and application artifact. Rollback uses a compensating migration and the prior immutable web artifact; do not restore the deleted browser credential gateway or weaken profile/RLS checks.
