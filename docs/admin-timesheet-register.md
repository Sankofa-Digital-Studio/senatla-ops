# Admin and Timesheet Register Scope

## Release boundary

This release has two operational surfaces:

- **Office Administrator:** administer users, people, sites, issues, assets, payroll and approvals; review and export a daily timesheet register.
- **Site Manager:** capture a daily timesheet register with explicit present, absent and pending states, absence reasons, comments, evidence and signed synchronization.

The shared register definition lives in `TimesheetRegisterService`. It projects the existing `Employee.logs` persistence contract into stable rows, completion totals and escaped CSV output. Both views must use this projection rather than implementing their own date or summary rules.

## Acceptance evidence

- Date, site and employee/role filters produce deterministic register rows.
- Present, absent and pending totals always reconcile to the displayed workforce total.
- Site Manager status changes are explicit; present capture requires evidence while absent and pending can be selected directly.
- Office Administrator export uses the currently filtered rows and masks no additional personal identifiers because ID numbers are excluded from this register.
- `npm run verify` remains the only release gate for lint, typecheck, build and browser-unit tests.

## Production persistence boundary

Local and component behavior use the same `Employee.logs` shape. In Supabase mode, the Office Administrator reads the shared `employees.logs` records, while the current Site Manager app-state snapshot is stored per user. The existing `queued_sync_submissions` table is the intended cross-role handoff, but processing that queue into shared employee logs is not yet implemented. Until that bridge and its RLS tests exist, rendered and unit evidence proves the register behavior but not cross-user production delivery.

Audit events are excluded from Supabase snapshots and now flow through a separate immutable evidence path. Office-admin activity uses `admin_activity_log`; administrative audit uses `admin_audit_events`; attendance audit uses `attendance_audit_events`. Those append-only tables derive actor, organization and event time from the authenticated protected profile, and the Angular site-manager activity panel now reads the normalized attendance feed directly instead of replaying snapshot state. Authenticated clients have select/insert privileges only; update and delete are blocked by privileges and immutable-table triggers. Attendance reads are restricted to the actor, the assigned site manager, or an office/director role in the same organization.
