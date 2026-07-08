# Senatla Ops Operations Runbook

## Release

1. Confirm the issue and approved pull request contain acceptance evidence.
2. Back up the production database and record the recovery point.
3. Apply migrations in preview and run role-negative tests.
4. Deploy the immutable web artifact with review bypass disabled.
5. Smoke-test each role, asset lookup and one read-only dashboard path.
6. Record version, migration identifiers, approvers and rollback point.

## Rollback

Stop new writes when data integrity is uncertain. Restore the prior web artifact first for application-only regressions. For schema failures, use the documented compensating migration; do not edit applied migration files. Restore from backup only after Operations and the technical lead confirm data-loss implications.

## Incident handling

Preserve logs and audit events, rotate exposed credentials immediately, revoke affected sessions, identify impacted organizations and records, and avoid placing personal information in tickets. Notify Operations, Finance and the technical lead according to impact.

## Offline recovery

Do not delete failed outbox records. Inspect idempotency key, attempt count and error; correct the underlying conflict; retry once; escalate repeated failures with the original audit reference.


## Authentication recovery

1. Confirm the user exists in Supabase Auth and has one active protected profile.
2. Confirm the profile organisation and profile_site_access assignments match approved access.
3. Use the office-admin server workflow to request password reset, change role, activate or deactivate an account.
4. Never edit role or active status from the browser client or user metadata.
5. Review auth_activity_events for successful application events and Supabase Auth audit logs for failed sign-ins.
6. For suspected token exposure, deactivate the profile, ban or revoke the Auth session, rotate affected credentials and preserve the audit reference.

Rollback authentication changes with a new compensating migration and the prior immutable web artifact. Never re-enable demo credentials or the removed review bypass.

