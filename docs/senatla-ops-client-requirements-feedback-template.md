# Senatla Ops Requirements Confirmation Workbook

**Prepared for:** Mr Rubin Thoso, Senatla Trading  
**Prepared by:** Sankofa Digital Studio  
**Version:** 1.0  
**Date:** 23 June 2026  
**Status:** Client review and requirements confirmation  
**Classification:** Confidential

## How to use this workbook

This workbook exposes the proposed information objects, field names and operating rules behind Senatla Ops. Please mark each item as **Confirm**, **Change**, **Not needed** or **Later**, and add wording or examples where the proposed definition does not match Senatla Trading's practice.

The objective is not to approve technical implementation. It is to confirm what Senatla calls things, who owns the information, which fields are mandatory, who may see or change them, and which decisions require independent approval.

| Review result | Meaning |
|---|---|
| Confirm | Proposed field or rule is correct |
| Change | Keep the capability but revise its name, values or workflow |
| Not needed | Exclude it from the current product |
| Later | Useful, but defer it to a later phase |

## 1. Business structure and ownership

### Proposed organization object

| Proposed field | Purpose | Client confirmation or correction |
|---|---|---|
| Legal owner name | Current assumption: Senatla Trading |  |
| Trading name | Name displayed in the application |  |
| Registration number | Company/legal reference if required |  |
| Department | Functional label such as Engineering; not a separate owner yet |  |
| Operating region | Province, district or internal region |  |
| Default currency | Current assumption: South African rand |  |
| Time zone | Current assumption: Africa/Johannesburg |  |
| Active status | Prevents use without deleting history |  |

### Decisions required

- Confirm whether any assets, employees or sites belong to another legal entity.
- Confirm whether Engineering should remain a functional label for the first release.
- List the exact company names that may appear on reports or exports.
- Identify the Senatla executive who owns final data-policy decisions.

**Client notes:**  
________________________________________________________________________________  
________________________________________________________________________________

## 2. Sites, projects and operating locations

### Proposed site object

| Proposed field | Purpose | Client confirmation or correction |
|---|---|---|
| Site name | Human-readable operating location |  |
| Site code | Short unique reference used in reports and imports |  |
| Site type | Yard, project, mine, plant, office, workshop or other |  |
| Physical address | Official location description |  |
| GPS coordinates | Optional location verification and navigation |  |
| Client/project name | External client or contract associated with the site |  |
| Contract number | Optional commercial reference |  |
| Start and end dates | Project lifecycle |  |
| Site manager | Person responsible for daily submission |  |
| Backup manager | Person who acts when the manager is unavailable |  |
| Working days | Normal operating calendar |  |
| Daily cut-off time | Determines on-time, late and rollover submission |  |
| Active/archive status | Preserves history after closure |  |

### Decisions required

- Provide the initial pilot-site list, exact spellings and site codes.
- Confirm whether projects and physical sites are the same object or must be separate.
- Confirm whether GPS evidence is required, optional or prohibited.
- Define daily synchronization cut-off times and weekend/public-holiday rules.

**Pilot sites:**  
________________________________________________________________________________

## 3. Users, roles and authority

### Proposed user object

| Proposed field | Purpose | Client confirmation or correction |
|---|---|---|
| Full name | Display and audit identity |  |
| Email/username | Sign-in identity |  |
| Mobile number | Recovery or notification contact |  |
| Role | Site Manager, Office Administrator or Director |  |
| Functional team | Operations, Engineering, Finance or leadership |  |
| Assigned sites | Limits operational responsibility |  |
| Approval authority | Types and values the user may approve |  |
| Active/suspended status | Immediately removes effective access |  |
| Start/end access dates | Temporary or contractor access |  |

### Role confirmation

| Capability | Site Manager | Office Administrator | Director/Reviewer | Client correction |
|---|---:|---:|---:|---|
| Capture site day | Yes | Review | Read |  |
| Manage employees/sites | No | Yes | Read |  |
| View payroll details | No | Yes | Confirm scope |  |
| Manage assets and work orders | Proposed: limited field capture | Yes | Read |  |
| Approve own request | Never | Never | Never |  |
| Export unmasked identifiers | No | Request only | Assigned approval |  |

### Decisions required

- Name the initial users and their exact roles.
- Identify independent reviewers for payroll, suspension and return-to-service decisions.
- Confirm whether Engineering requires a separate role in the pilot.
- Confirm password, session timeout and account-recovery expectations.

## 4. Employees and workforce records

### Proposed employee object

| Proposed field | Purpose | Client confirmation or correction |
|---|---|---|
| Employee number | Preferred internal unique reference |  |
| First name and surname | Official employee identity |  |
| ID/passport number | Sensitive identity field; masked by default |  |
| Tax reference | Payroll requirement if applicable |  |
| Job title/role | Operator, Driver, Foreman, Safety Rep or other |  |
| Employment type | Permanent, fixed-term, casual or contractor |  |
| Start/end dates | Employment lifecycle |  |
| Assigned site | Current primary work location |  |
| Work group/team | Bulk attendance and assignment |  |
| Basic rate | Payroll calculation input |  |
| Allowances/deductions | Configured financial items |  |
| Status | Active, suspended, inactive or archived |  |
| Emergency contact | Confirm whether required and who may see it |  |

### Decisions required

- Provide the official employee spreadsheet headings currently used.
- Confirm the preferred employee unique identifier.
- Confirm which personal fields are essential and their retention period.
- Provide the complete job-role and employment-type lists.
- Identify who may view full ID numbers and payroll rates.

## 5. Attendance, safety talks and daily synchronization

### Proposed attendance record

| Proposed field | Purpose | Client confirmation or correction |
|---|---|---|
| Employee | Person being recorded |  |
| Work date | Date of the shift |  |
| Status | Present, absent or pending |  |
| Absence reason | Sick, family, AWOL, confirm in office or client list |  |
| Comment | Context required by policy |  |
| Evidence | Optional photo/document with purpose control |  |
| Captured by/time | Audit evidence |  |
| Correction reason | Required if an official record changes |  |

### Proposed safety-talk record

| Proposed field | Purpose | Client confirmation or correction |
|---|---|---|
| Topic and version | Exact talk delivered |  |
| Site/date/time | Context of delivery |  |
| Delivered by | Responsible person |  |
| Attendees | People covered |  |
| Notes/evidence | Proof required by policy |  |
| Signature/acknowledgement | Confirmation method |  |

### Proposed daily synchronization record

| Proposed field | Purpose | Client confirmation or correction |
|---|---|---|
| Site and work date | Submission scope |  |
| Attendance summary | Present, absent, pending and flagged totals |  |
| Safety completion | Required talk/evidence status |  |
| Pre-start completion | Required equipment checks |  |
| Open exceptions | Items preventing clean completion |  |
| Submission status | On time, late, critical or rollover |  |
| Late acknowledgement | Reason and responsible user |  |
| Signature | Submission confirmation |  |
| Idempotency reference | Prevents duplicate offline submission |  |

### Decisions required

- Confirm attendance statuses and absence reasons.
- Confirm whether photos, signatures and location are mandatory, optional or not allowed.
- Define who may correct attendance after submission and how approval works.
- Define late, critical and rollover timing rules.
- Confirm whether a daily sync may proceed with unresolved exceptions.

## 6. Issues, exceptions and escalation

### Proposed issue object

| Proposed field | Purpose | Client confirmation or correction |
|---|---|---|
| Category | Safety, Payroll, Discipline, Operations or client list |  |
| Severity | Low, medium, high or critical |  |
| Site/asset/employee link | Record affected by the issue |  |
| Description | Problem statement without unnecessary personal data |  |
| Reported by/time | Attribution |  |
| Owner | Person responsible for resolution |  |
| Due date/SLA | Expected response time |  |
| Status | Open, escalated or resolved |  |
| Evidence | Supporting private files |  |
| Resolution and history | Complete trace |  |

### Decisions required

- Confirm categories, severity meanings and response targets.
- Identify which issues automatically escalate and to whom.
- Confirm whether disciplinary matters require a restricted view.
- Define what constitutes resolution and who may close each category.

## 7. Payroll and financial controls

### Proposed payroll objects

| Proposed field or rule | Purpose | Client confirmation or correction |
|---|---|---|
| Payroll period | Month/year and open, locked or exported status |  |
| Basic rate | Approved employee rate |  |
| Attendance basis | Days/hours included in calculation |  |
| Allowance types | Travel, housing or client-defined values |  |
| Deduction types | Advance, absence or client-defined values |  |
| Manual adjustment | Amount, reason, maker and reviewer |  |
| Masked export | Default operational export |  |
| Full-ID export | Requires separate approval |  |
| Export history | File, period, requester and time |  |
| Locked-period rule | Completed period cannot reopen |  |

### Decisions required

- Provide current payroll calculations, spreadsheets and rounding rules.
- Confirm working-day, overtime, absence and public-holiday treatment.
- Provide the full allowance and deduction catalogue.
- Confirm who locks periods and who approves full-ID exports.
- Confirm whether Senatla Ops calculates payroll or only prepares verified inputs.

## 8. Asset register and identity

### Proposed asset object

| Proposed field | Purpose | Client confirmation or correction |
|---|---|---|
| Asset number | Optional Senatla internal reference |  |
| Serial number | Manufacturer/equipment unique identifier |  |
| VIN/chassis number | Vehicle identity where applicable |  |
| Registration plate | Road-vehicle identifier where applicable |  |
| QR code | Lookup convenience; not authoritative identity |  |
| Asset class | Excavator, truck, generator, tool or client list |  |
| Make/model/year | Equipment description |  |
| Ownership | Senatla-owned, financed, leased or hired |  |
| Supplier/finance reference | Commercial trace if required |  |
| Current site | Physical operating location |  |
| Custodian/operator | Accountable person or team |  |
| Lifecycle state | Active, maintenance, retired or disposed |  |
| Acquisition date/cost | Cost and replacement analysis |  |
| Replacement value | Planning input |  |
| Notes and documents | Controlled dossier evidence |  |
| Parent asset | Attachment or component relationship |  |

### Identity decisions required

- Confirm whether **one or a combination** of serial, VIN and registration plate is mandatory by asset class.
- Confirm the preferred Senatla asset-number format.
- Provide the complete asset-class and ownership-type lists.
- Confirm how trailers, attachments, tools and components relate to parent equipment.
- Provide the controlled pilot asset list and source spreadsheet headings.

## 9. Custody, compliance and meter records

### Proposed custody transfer

| Proposed field | Purpose | Client confirmation or correction |
|---|---|---|
| From/to site | Movement history |  |
| From/to custodian | Accountability handover |  |
| Transfer date/time | Effective movement time |  |
| Condition at handover | Damage/condition acknowledgement |  |
| Meter at handover | Usage reference |  |
| Accepted by | Receiving acknowledgement |  |
| Notes/evidence | Photos or documents |  |

### Proposed compliance record

| Proposed field | Purpose | Client confirmation or correction |
|---|---|---|
| Type | Licence, roadworthy, insurance, certification, warranty or other |  |
| Reference number | Document/certificate reference |  |
| Issue and expiry dates | Compliance period |  |
| Status | Valid, due, expired or waived |  |
| Issuer/provider | Source organization |  |
| Private document | Controlled evidence |  |
| Reminder period | Days before expiry |  |

### Proposed meter reading

| Proposed field | Purpose | Client confirmation or correction |
|---|---|---|
| Meter type | Odometer km, engine hours or cycles |  |
| Reading | Non-decreasing measured value |  |
| Recorded date/time | Measurement time |  |
| Source | Manual, import or future telematics |  |
| Recorded by | Attribution |  |
| Evidence | Optional meter photo |  |

### Decisions required

- Confirm who may transfer custody and whether both parties must accept.
- Provide compliance types and reminder periods by asset class.
- Confirm which meter types apply to each asset class.
- Define how incorrect meter readings are corrected without deleting history.

## 10. Inspections, defects and maintenance

### Proposed pre-start inspection

| Proposed field | Purpose | Client confirmation or correction |
|---|---|---|
| Template and version | Checklist for the asset class |  |
| Asset/operator/site | Inspection context |  |
| Date/time and meter | Operational evidence |  |
| Checklist response | Pass, fail or not applicable |  |
| Comment/evidence | Required for failed items |  |
| Overall result | Safe, attention or critical |  |
| Signature | Operator acknowledgement |  |

### Proposed defect and work order

| Proposed field | Purpose | Client confirmation or correction |
|---|---|---|
| Defect category | Mechanical, electrical, hydraulic, safety or client list |  |
| Priority | Low, medium, high or critical |  |
| Safety block | Prevents use until cleared |  |
| Work required | Clear task description |  |
| Assigned technician/provider | Responsible party |  |
| Planned/due dates | Schedule |  |
| Status | Open, in progress, blocked, completed or cancelled |  |
| Labour/parts/external cost | Total repair cost |  |
| Downtime | Availability impact |  |
| Completion evidence | Work, parts, documents and signature |  |
| Return-to-service request | Maker request after blockers close |  |
| Independent reviewer | Different person approves safe return |  |

### Proposed maintenance plan

| Proposed field | Purpose | Client confirmation or correction |
|---|---|---|
| Plan name/template | Standard maintenance activity |  |
| Trigger | Date, engine hours, km or cycles |  |
| Interval | Frequency |  |
| Next due | Calculated due point |  |
| Grace/tolerance | Escalation threshold |  |
| Required evidence | Checklist, parts or certificate |  |

### Decisions required

- Provide current pre-start and service checklists by asset class.
- Define which failed checks automatically create critical defects.
- Confirm who may declare an asset unsafe and who may return it to service.
- Provide maintenance intervals and current supplier/service arrangements.
- Confirm required cost, downtime, labour and parts detail.

## 11. Approvals, audit and evidence

### Proposed approval object

| Proposed field | Purpose | Client confirmation or correction |
|---|---|---|
| Request type | Suspension, full-ID export, return to service or client list |  |
| Requested by/time | Maker evidence |  |
| Reason and linked records | Decision context |  |
| Reviewer | Checker; must differ from requester |  |
| Decision | Approved or rejected |  |
| Decision notes/time | Rationale |  |
| Executed status | Confirms approved action completed |  |

### Proposed audit event

| Proposed field | Purpose | Client confirmation or correction |
|---|---|---|
| Actor and role | Who performed the action |  |
| Date/time | When it occurred |  |
| Action | What changed or was requested |  |
| Record type and ID | Object affected |  |
| Organization/site | Business context |  |
| Before/after summary | Material change evidence where appropriate |  |
| Correlation/idempotency reference | Links retries and related actions |  |

### Decisions required

- Confirm every action requiring maker-checker approval.
- Define reviewer authority limits and escalation routes.
- Confirm audit-retention period and who may export audit evidence.
- Confirm evidence types, maximum file sizes and document-retention periods.

## 12. Privacy, offline use and notifications

| Topic | Proposed approach | Client confirmation or correction |
|---|---|---|
| Personal data | Collect only fields required for an approved purpose |  |
| ID numbers | Mask by default; full view/export controlled |  |
| Photos | Private storage; no public links |  |
| Location | Collect only when policy requires it |  |
| Retention | Rule by evidence and record type |  |
| Offline queue | Visible pending/failed state; no silent deletion |  |
| Duplicate prevention | Client-generated idempotency key |  |
| Conflict handling | Human-readable conflict and controlled correction |  |
| Notifications | Severity and role-based preferences |  |
| Escalation | Trigger only after defined unresolved thresholds |  |

### Decisions required

- Confirm devices, network conditions and expected offline duration at pilot sites.
- Confirm whether devices are company-owned or personal.
- Define email, SMS, WhatsApp or in-app notification preferences; external messaging is a later integration unless approved.
- Identify POPIA/privacy owner and required retention/deletion rules.
- Confirm incident-notification contacts.

## 13. Reports, dashboards and management questions

| Proposed output | Business question | Client confirmation or correction |
|---|---|---|
| Operational heartbeat | What requires action today? |  |
| Site-day completion | Which sites have completed attendance, safety and sync? |  |
| Workforce exceptions | Where are attendance or assignment records incomplete? |  |
| Payroll reconciliation | Do calculated totals match approved inputs? |  |
| Asset readiness | Which assets are safe, compliant and available? |  |
| Maintenance due | What is due by date or meter? |  |
| Downtime and cost | Which assets consume the most repair cost or downtime? |  |
| Compliance expiry | Which documents expire soon? |  |
| Issue SLA | Which critical issues are overdue? |  |
| Audit evidence | Who changed or approved a record? |  |

### Decisions required

- Rank the five most important management questions.
- Provide examples of current weekly/monthly reports.
- Confirm reporting periods, site grouping and export formats.
- Confirm which values are actual, projected or targets.
- Define how asset readiness should be explained to leadership.

## 14. Imports, integrations and migration

| Source/system | Proposed first-release treatment | Client confirmation or correction |
|---|---|---|
| Employee spreadsheet | Controlled CSV dry run and conflict report |  |
| Asset spreadsheet | Controlled CSV dry run and identifier validation |  |
| Payroll spreadsheet/system | Confirm export/import boundary |  |
| Document folders | Selective upload with classification |  |
| Telematics | Deferred pending coverage and ROI |  |
| WhatsApp/email | Deferred or notification-only after approval |  |
| Accounting/ERP | Confirm whether any system must receive outputs |  |

### Information required

- Sample employee, site, asset, maintenance and payroll files with sensitive values removed where possible.
- Column definitions and examples for every import field.
- Known duplicate, missing or inconsistent data problems.
- Current systems, vendors and contract limitations.
- Required export consumers and formats.

## 15. Pilot, training and acceptance

| Decision | Client response |
|---|---|
| Pilot sites |  |
| Pilot asset classes and approximate asset count |  |
| Pilot users and roles |  |
| Training audience and preferred format |  |
| Target pilot period |  |
| Success measures |  |
| UAT approvers |  |
| Support contact and escalation |  |
| Go-live decision authority |  |

### Recommended success measures

- All pilot assets have at least one verified unique identifier.
- Daily site submissions are complete, attributable and recover from offline operation.
- Critical pre-start failures create traceable defects and work orders.
- No requester approves their own controlled action.
- Payroll totals reconcile to agreed source data.
- Every displayed management metric links to source records.
- Backup, restore and rollback procedures are rehearsed.

## 16. Final client feedback

### Most important outcome Senatla Ops must achieve

________________________________________________________________________________  
________________________________________________________________________________  
________________________________________________________________________________

### Features or workflows that do not match Senatla Trading

________________________________________________________________________________  
________________________________________________________________________________  
________________________________________________________________________________

### Missing information, roles or processes

________________________________________________________________________________  
________________________________________________________________________________  
________________________________________________________________________________

### Risks or concerns before the pilot

________________________________________________________________________________  
________________________________________________________________________________  
________________________________________________________________________________

### Review confirmation

| Reviewer | Decision | Signature/date |
|---|---|---|
| Mr Rubin Thoso | Confirm / Changes required / Further discussion |  |

