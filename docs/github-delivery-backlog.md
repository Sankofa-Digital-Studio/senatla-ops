# Senatla Ops GitHub Delivery Backlog

Updated: 24 June 2026

Issues are grouped by outcome and ordered by dependency. P0 issues form Gate 0/A/B and must complete before feature claims or a new production deployment.

| Order | Priority | Bundle | Issue outcome | Dependency |
|---:|---|---|---|---|
| 1 | P1 verification | Governance | Confirm GitHub and Vercel have propagated the agreed `main` branch | None; naming decision resolved |
| 2 | P0 | Quality | Restore deterministic lint, build and browser-test gates | 1 |
| 3 | P0 | Data security | Prove single-owner Supabase migrations and negative RLS contracts | 1 |
| 4 | P0 | Deployment | Restore Vercel project access and controlled browser QA | 1-2 |
| 5 | P0 | Baseline | Split, review and land the current security/release foundation | 1-4 |
| 6 | P0 | Requirements | Resolve client field, role, retention and pilot decisions | None; blocks schema freeze |
| 7 | P1 | Field operations | Complete attendance, safety and idempotent daily sync | 3, 5, 6 |
| 8 | P1 | Workforce control | Complete workforce, issue, payroll and maker-checker contracts | 3, 5, 6 |
| 9 | P1 | Asset pilot | Complete identity, CSV, custody, hierarchy and QR lookup | 3, 5, 6 |
| 10 | P1 | Maintenance | Complete pre-start, defect, work order and return-to-service flow | 9 |
| 11 | P1 | Executive evidence | Reconcile every dashboard metric to persisted source records | 7-10 |
| 12 | P1 | Resilience | Complete private evidence, offline outbox and recovery behavior | 7, 9, 10 |
| 13 | P2 | Artifacts | Version and automate client/engineering artifact generation | 5-6 |
| 14 | P0 | Production readiness | Backup/restore, monitoring, performance, security regression and UAT | 7-13 |

## Project board design

Recommended project: **Senatla Ops Release Programme**

Columns/statuses:

1. Intake
2. Ready
3. Active
4. Review
5. Verification
6. Released

Recommended fields: Priority, Bundle, Release Gate, Owner, Target iteration and Evidence status.

## Definition of done for every issue

- Linked pull request with a focused change set.
- Acceptance criteria demonstrated, not only described.
- Audit behavior verified for new mutations.
- Role-negative security tests for authorization changes.
- Desktop and 390 px proof for rendered changes.
- Migration/reset evidence for schema changes.
- Documentation and rollback notes updated.
- Public Senatla Trading website remains untouched.
