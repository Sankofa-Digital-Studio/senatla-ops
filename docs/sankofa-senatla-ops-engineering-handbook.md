# Sankofa Senatla Ops Engineering Handbook

**Classification:** Confidential - Senatla Trading internal use  
**Owner:** Sankofa Digital Studio / Senatla Trading  
**Version:** 1.0  
**Status:** Controlled release baseline  
**Date:** 23 June 2026

## Document control

| Version | Date | Change | Approval |
|---|---|---|---|
| 1.0 | 23 June 2026 | Curated engineering, asset and operations release baseline | Pending Engineering, Operations and Finance |

## 1. Executive and product strategy

Senatla Ops is Senatla Trading's internal operational control system. It joins field attendance, safety talks, daily synchronization, workforce administration, payroll controls, issues, assets, maintenance and executive evidence. It is not a public website and it is not intended to duplicate a full enterprise resource planning suite.

The product's differentiator is an explainable operational heartbeat: exceptions involving people, sites, safety, payroll and equipment are visible in one governed workflow. Decisions must be traceable to source records. Rules and auditability take priority over opaque automation.

Release success means that a site action can be attributed to a user, synchronized reliably, reconciled by office staff, and examined by a director without simulated data. The asset pilot must identify every asset, preserve custody history and prevent unsafe return to service.

## 2. Product comparison and deliberate differentiation

| Product | Demonstrated strength | Senatla adoption | Deliberate exclusion |
|---|---|---|---|
| Fleetio | Asset dossiers, costs, utilization and replacement planning | Asset history, cost and repair-versus-replace evidence | Broad commercial fleet ecosystem |
| MaintainX | Cross-site work orders and recurring maintenance | Assignment, priority and inspection follow-up | AI recommendations before data quality is proven |
| Fiix | Date, meter, event and condition maintenance triggers | Date and meter triggers in the pilot | Enterprise CMMS breadth |
| HCSS Equipment360 | Heavy-equipment field, office and shop workflows | Engine hours, expiry alerts and field evidence | Telematics breadth in the first release |
| UpKeep | Mobile-first dispatch and reusable checklists | Mobile work requests and evidence-backed checklists | Generic marketplace positioning |

Senatla will compete through integration with its own workforce and control processes. Essential CMMS parity is adopted where it reduces risk. Full spares procurement, telematics and predictive AI remain deferred until the work-order and data-quality foundations are stable.

## 3. GitHub governance and engineering workflow

GitHub Issues authorize work; the project board records delivery status; pull requests contain evidence; `/docs` is the operating source of truth. Board states are Intake, Ready, Active, Review, Verification and Released.

Human branches use `feature/<issue>-description` or `fix/<issue>-description`. Codex branches use `codex/<issue>-description`. Commits follow `type(scope): description`. Main is protected by CI, CODEOWNER review and resolved conversations. Changes are squash merged and authors do not self-merge.

Every pull request states the business outcome, risk, migration effect, rollback procedure and evidence. UI work includes desktop and 390 px rendering. Database work includes a clean reset and negative RLS tests. No pull request may modify the public Senatla Trading website under this release.

## 4. Architecture and environment boundaries

The client is Ionic/Angular. Production persistence and authorization use Supabase Auth, Postgres, Storage and RLS. Local demo and Supabase gateways must satisfy the same behavioral contracts. Route guards improve navigation but never replace database authorization.

Local contains synthetic deterministic data. Preview uses an independent Supabase project and approved test data. Production contains Senatla Trading operational data. Service-role credentials are server-only. Review bypass is disabled outside local review. Applied migrations are immutable; corrections use new compensating migrations.

## 5. Roles, access and maker-checker controls

| Capability | Site manager | Office administrator | Director |
|---|---:|---:|---:|
| Capture attendance, safety and daily sync | Write own workflow | Review | Read |
| Workforce and site administration | No | Write | Read |
| Payroll detail and export | No | Write under controls | Read/approve as assigned |
| Asset register | No | Write | Read |
| Custody, compliance, meters and work orders | Submit field evidence later | Write | Read |
| Approvals | Request assigned actions | Request/review with separation | Review assigned actions |
| Executive analytics | No | Operational view | Read |

Inactive profiles have no effective role. Authorization reads protected profile data, not user-editable metadata. A requester cannot approve their own request. Completed decisions, custody transfers and locked payroll periods are immutable.

## 6. Workforce, payroll and operational heartbeat

Attendance records capture status, absence reason, comments and evidence. Safety talks preserve topic and completion evidence. Daily sync records actor, site, timing, attendance summary, late acknowledgement and signature. Retry uses an idempotency key so duplicate submission cannot duplicate the operational event.

Issues have severity, owner, due date and resolution history. Payroll calculations are centralized, exports are recorded and full identifiers require approval. Locked periods cannot reopen; exported periods cannot change. Every mutation creates an attributable audit event.

The command view prioritizes unresolved critical issues, late synchronization, missing attendance evidence, payroll exceptions, expired asset compliance and safety-blocking work orders.

## 7. Asset identity and lifecycle

All assets belong to Senatla Trading. Department is descriptive and does not create a separate owner. At least one authoritative identifier is required: manufacturer serial number, VIN or registration plate. Every populated identifier is normalized and case-insensitively unique. QR lookup is an access convenience and never replaces authoritative identity.

The asset dossier records class, make, model, site, custodian, lifecycle state, evidence, compliance, meter readings, maintenance plans, work orders, costs and downtime. Heavy equipment may have parent and child attachments. CSV intake always performs a dry run and produces a conflict report before writing.

Custody transfer is append-only. Retirement and disposal preserve history. Return to service requires maker-checker approval and cannot proceed while high or critical work orders remain open.

## 8. Maintenance and offline evidence

The pilot supports date and meter maintenance plans. Pre-start checklist failures create defects; critical defects block operation and produce a work order. Work orders track priority, due date, status, cost and completion. Compliance records are typed and reference private evidence paths.

Offline mutations receive client-generated idempotency keys. The outbox records aggregate, event, payload, status, attempts and processing time. Failed records remain visible; silent deletion is prohibited. Conflict resolution preserves the original audit reference.

Evidence is stored privately and minimized for purpose. Capture time and actor are mandatory. Location is collected only when the operational policy requires it. Personal information is excluded from issue descriptions, logs and screenshots unless specifically authorized.

## 9. Supabase migrations, RLS and security

All exposed tables use RLS. Effective roles are derived from active protected profiles. Site managers cannot read the administrative asset register. Directors can read administrative records but cannot mutate assets. Office users can mutate approved domains within the fixed Senatla Trading organization.

The `asset-evidence` bucket is private. Insert and update policies require office access, and object paths begin with the organization identifier. Storage upsert requires explicit select, insert and update permissions. Security-definer role lookup is isolated in a non-exposed schema with an empty search path.

CI starts a pinned local Supabase stack, resets all migrations and runs pgTAP contracts. Negative tests are mandatory because a successful insert by an authorized role does not prove that unauthorized roles are blocked.

## 10. Testing, deployment and recovery

Application gates are lint, application/specification type-check, focused unit tests, production build and browser validation. Browser evidence checks page identity, meaningful content, console health, error overlays, interaction state, desktop layout and 390 px layout.

Release promotion requires preview validation, a database backup reference, migration evidence, rollback procedure and role smoke tests. Application regressions roll back to the prior immutable artifact. Schema regressions use compensating migrations. Database restore is a last-resort action approved with explicit data-loss analysis.

Incidents preserve logs and audit events. Exposed credentials are rotated immediately and affected sessions are revoked. Operational, Finance and technical owners receive impact-specific notification.

## 11. Release gates and ownership

| Gate | Outcome | Evidence owner |
|---|---|---|
| 0 - Baseline | Existing branch builds and tests without orphaned runners | Technical lead / QA |
| A - Governed | GitHub controls, CI and docs are active | Technical lead |
| B - Secure data | Single owner, clean reset and role-negative RLS pass | Backend/data |
| C - Core operations | Field, office, issues and payroll workflows pass | Frontend / QA / Finance |
| D - Asset pilot | Identity, custody, import and lifecycle pass | Engineering operations |
| E - Maintenance | Inspection through return-to-service is traceable | Engineering operations / QA |
| F - Production candidate | Monitoring, recovery and UAT are signed | Engineering / Operations / Finance |

No gate closes on build success alone. Unverified browser, database or restore evidence remains an open release risk.

## 12. Decisions, deferrals and approval

The release uses one owner, Senatla Trading. Engineering-department separation remains deferred without removing future organization support. Initial imports use controlled CSV rather than spreadsheet synchronization. AI, full spares ERP, telematics, public commerce and multi-company UI are deferred.

### Approval record

| Function | Name | Decision | Date |
|---|---|---|---|
| Engineering |  | Pending |  |
| Operations |  | Pending |  |
| Finance |  | Pending |  |

## References

- Fleetio asset management: https://www.fleetio.com/features/asset-management-software
- MaintainX work orders: https://www.getmaintainx.com/use-cases/work-order-management
- Fiix preventive maintenance: https://fiixsoftware.com/cmms/preventive-maintenance-software/
- HCSS Equipment360: https://www.hcss.com/equipment360/what-is-equipment360/
- UpKeep work orders: https://upkeep.com/product/work-order-software/
- Supabase security: https://supabase.com/docs/guides/security/product-security

