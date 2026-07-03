# Senatla Asset Register - Demo Readiness and Engineering Plan

**Prepared:** 21 June 2026  
**Audience:** Engineering Department, Parent Company Operations, Finance, IT and Executive Sponsors  
**Decision status:** High-level plan for validation; identifier integrity and local demo data are implemented.

## Executive summary

Senatla Ops can now demonstrate a shared asset register in which an asset is identified by at least one of: manufacturer serial number, VIN/chassis number, or number plate. Every identifier supplied for an asset is treated as unique. The demo includes engineering heavy machinery, a heavy vehicle and a parent-company light vehicle.

The recommended product direction is one multi-tenant asset platform with two controlled operating views:

- **Engineering register:** heavy machinery, yellow metal, plant, attachments and specialist equipment.
- **Parent-company register:** vehicles plus small and medium equipment.

Do not build two independent applications. A shared identity, audit, document and maintenance core avoids duplicate records and permits group reporting, while organization, business unit and permission boundaries preserve separation.

## Three-pass review

### Pass 1 - Baseline audit

The baseline had a dedicated asset route and new persistent admin service, but the screen captured only number plate and VIN. The serial-number field existed in the model and database but was not wired into either asset form. VIN was mandatory even for non-road equipment. Local demo mode opened with an empty admin workspace, and one list separator rendered as corrupted text.

### Pass 2 - Demo hardening

The asset screen now captures number plate, VIN, serial number, asset class, status, compliance date, site and notes. Local mode seeds three representative records and two sites. The service rejects records without an identifier and rejects duplicate populated identifiers. A Supabase migration makes VIN optional, requires at least one identifier, and creates case-insensitive unique indexes for serial number, VIN and number plate.

### Pass 3 - Critical comparison with Pass 2

Pass 2 closes the immediate demonstration gap but is not a complete enterprise register. The largest remaining weaknesses are organizational ownership, service/inspection history, documents, transfers, meter readings, mobile capture and reliable automated UI tests. The engineering plan below converts these gaps into staged work rather than presenting the demo as production-complete.

## Prioritized loose links

| Priority | Loose link | Evidence / impact | Required action |
|---|---|---|---|
| P0 | No organization or legal-owner field on assets | Engineering and parent-company records cannot be reliably separated or consolidated. | Add organization ID, business unit, custodian and row-level access policies before production data import. |
| P0 | Existing Supabase environments require the new identifier migration | Application validation and database validation otherwise disagree. | Apply and verify the 20260621 asset identifier migration; back up and deduplicate data first. |
| P0 | Rendered browser verification is blocked in the current environment | Production build passes, but desktop/mobile interactions were not exercised in this pass. | Restore the in-app browser runtime or install the approved agent-browser executable; run the demo script below. |
| P1 | Maintenance is only a status value | No work orders, defects, downtime, service intervals, costs or return-to-service control. | Build maintenance event and work-order modules with meter/date triggers. |
| P1 | Compliance is represented by one generic date | Licence, roadworthy, insurance, inspection and certification dates have different rules. | Add typed compliance records with evidence, owner and escalation rules. |
| P1 | No transfer/custody history | Assignment can change without a handover trail. | Add append-only custody events, acceptance and location history. |
| P1 | Local demo persistence is session-scoped | Records reset when the browser session ends; acceptable for demo, not operations. | Use Supabase mode for shared environments and make demo reset explicit. |
| P1 | Angular component tests use stale standalone configuration | Test files declare standalone components and are unlikely to run cleanly. | Convert specs to imports, provide gateway/config test doubles, then add asset identity contract tests. |
| P1 | Office Admin and dedicated Asset Register duplicate the asset form | Field drift has already occurred. | Extract one reusable asset form and identifier presentation component. |
| P1 | No import/export or duplicate-resolution workflow | Initial register migration will be slow and error-prone. | Add CSV template, dry-run validation, match report and controlled merge process. |
| P2 | No QR/barcode/NFC tag workflow | Field identification requires manual entry. | Generate internal asset tags and support mobile scan lookup; retain serial/VIN/plate as authoritative external identifiers. |
| P2 | No photos or document attachments | Condition, ownership and compliance evidence cannot be proven. | Add object storage, metadata, retention and signed access URLs. |
| P2 | No meter readings or utilisation | Preventive maintenance cannot be usage-based. | Add odometer/hour-meter readings with plausibility checks and source tracking. |
| P2 | No retirement/disposal workflow | Assets can remain active after sale, write-off or scrapping. | Add lifecycle states, approvals, disposal evidence and immutable financial history. |
| P2 | Backend provider supports only local and Supabase modes | Other configured API modes fail at startup. | Remove unsupported modes from configuration or implement them with a contract test. |
| P3 | No telematics, procurement, finance or fuel integration | Data will be manually re-entered at scale. | Define integration APIs after the core data model stabilizes. |

## Product scope

### Shared asset identity

Use an internal immutable UUID as the database primary key. External identifiers are alternate unique keys:

1. Serial number for plant and equipment.
2. VIN/chassis number for road vehicles and selected mobile machinery.
3. Number plate for road-going assets.
4. Internal QR asset tag for fast lookup, never as a replacement for manufacturer/legal identifiers.

At least one external identifier is required. Normalize case and whitespace. Each populated identifier must be unique within the agreed organization boundary. A controlled exception process is required for reused plates, replaced components and legacy records.

### Engineering register

- Heavy machinery, yellow metal, generators, compressors, trailers, pumps and attachments.
- Parent-child relationships between base machine and attachment.
- Hour meter, condition, site, operator/custodian and criticality.
- Pre-start inspections, defects, planned maintenance and downtime.
- Certificates, inspection dates, warranty and major-component history.

### Parent-company register

- Passenger vehicles, light commercial vehicles and trucks.
- Small/medium equipment, tools and portable powered assets.
- Odometer, licence, roadworthy, insurance, service and allocation.
- Driver/custodian handover, fines/incident references and fuel/telematics integration points.

## Recommended architecture

| Layer | Recommendation | Why |
|---|---|---|
| Client | Continue Ionic/Angular responsive web app; package with Capacitor only after offline workflows are proven. | One codebase can serve desktop, Android and iOS-sized screens. |
| Identity | Supabase Auth with role and organization claims. | Existing integration path; central session and audit boundary. |
| Data | PostgreSQL/Supabase with organization-scoped row-level security. | Strong relational integrity for identifiers, assignments and lifecycle events. |
| Files | Private object storage with signed URLs and retention metadata. | Evidence must not be public or embedded in database rows. |
| Integration | Versioned REST/functions plus event/outbox records. | Keeps telematics, finance and procurement integrations decoupled. |
| Observability | Structured audit events, error monitoring and operational dashboards. | Asset changes must be attributable and supportable. |

Core entities: Organization, BusinessUnit, Site, Asset, AssetIdentifier, AssetClass, CustodyEvent, MeterReading, ComplianceRecord, Inspection, Defect, WorkOrder, MaintenancePlan, Document, Supplier and AuditEvent.

## Delivery roadmap

### Phase 0 - Discovery and data governance (1-2 weeks)

- Confirm legal owners, business units, sites and user roles.
- Inventory source spreadsheets and estimate duplicate/dirty-data rates.
- Agree identifier rules, plate reuse policy, retention and POPIA responsibilities.
- Define demo acceptance criteria and production non-functional requirements.

**Exit:** signed data dictionary, role matrix, migration sample and prioritized workflow map.

### Phase 1 - Production register foundation (3-4 weeks)

- Organization-scoped schema and row-level security.
- Shared asset form/component, identifier conflict service and audit history.
- Search, filters, pagination, CSV import dry run and export.
- Asset details, custody transfer and lifecycle status.
- Automated unit, service and database contract tests.

**Exit:** controlled pilot register with traceable imports and no unresolved identifier collisions.

### Phase 2 - Compliance and maintenance (4-6 weeks)

- Typed compliance records, documents and reminders.
- Inspections, defects, work orders, meter readings and preventive schedules.
- Downtime, costs, parts references and return-to-service approval.
- Role-specific dashboards for engineering, parent operations and executives.

**Exit:** teams can manage the asset lifecycle without parallel spreadsheets.

### Phase 3 - Field mobility and integrations (3-5 weeks)

- QR scan lookup, photo evidence and intermittent-connectivity design.
- Notifications and escalations.
- Fuel, telematics, finance/procurement and HR/custodian integration adapters.
- Performance, security, recovery and mobile-device testing.

**Exit:** measured field adoption, reliable sync and supportable integrations.

## Product viability comparison

The network environment prevented live verification of vendor pages on 21 June 2026. The comparison below is therefore a directional engineering comparison and must be refreshed during Phase 0 from official product documentation and pricing.

| Product category / example | Established strength to validate | Senatla should reuse as a pattern | Senatla differentiation |
|---|---|---|---|
| Fleet platforms such as Fleetio | Vehicle records, odometers, service, fuel and driver workflows | Familiar fleet lifecycle and exception dashboards | One register spanning parent vehicles and engineering machinery with local operating rules. |
| CMMS platforms such as Fiix | Asset hierarchy, preventive maintenance and work orders | Maintenance plans, work history and parts links | Simpler field workflow tied to Senatla attendance, sites and operational accountability. |
| Frontline maintenance tools such as MaintainX | Mobile inspections, procedures and work execution | Fast scan-to-task and evidence capture | Role-specific, low-friction workflows for mixed connectivity and company governance. |
| Asset operations tools such as UpKeep | Mobile asset records, work orders and reporting | Mobile-first maintenance and notification patterns | Group-wide identity integrity plus South African fleet/compliance context. |

The viable position is not another generic CMMS. It is a Senatla operations spine: one trusted asset identity connected to site accountability, compliance evidence and practical field execution. Procurement should still test buy/configure options. Build is justified only where shared engineering/parent workflows, integration with Senatla operations and local governance create measurable value.

Reference pages for Phase 0 verification:

- Fleetio vehicle management: <https://www.fleetio.com/features/vehicle-management>
- Fiix asset management: <https://www.fiixsoftware.com/maintenance-software/asset-management/>
- MaintainX asset management: <https://www.getmaintainx.com/features/asset-management>
- UpKeep asset management: <https://upkeep.com/product/asset-management/>

## Demo script and acceptance checks

1. Sign in with the office demo shortcut.
2. Open **Asset Register** from the secured navigation.
3. Show the three seeded records: serial-only excavator, plate+VIN truck and parent-company light vehicle.
4. Search for CAT-320 and confirm only the excavator remains.
5. Attempt to save a record with no serial/VIN/plate and confirm the blocking message.
6. Attempt to reuse CAT-320-EX-0042 and confirm duplicate rejection.
7. Add a new serial-only equipment record, assign it to Engineering Workshop and edit it.
8. Repeat the core flow at approximately 390 px width and verify no clipped controls or horizontal scroll.

## Definition of done for production pilot

- All imported assets have an owner organization and at least one validated external identifier.
- Zero unresolved duplicate serial/VIN/plate conflicts.
- Row-level access tests prove cross-organization isolation.
- Every mutation creates an attributable audit event.
- Compliance reminders and maintenance triggers are deterministic and tested.
- Desktop plus current Android/iOS-sized browser flows pass.
- Backup/restore rehearsal meets agreed RPO/RTO.
- Engineering and parent-company process owners sign off on pilot data and workflows.
