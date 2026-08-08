# Senatla Ops GitHub Delivery Backlog

Updated: 6 August 2026

Issues are grouped by outcome and ordered by dependency. P0 issues form Gate 0/A/B and must complete before feature claims or a production deployment. Do not paste immutable Vercel preview URLs into durable docs, tickets or acceptance records as the canonical target; they go stale, create duplicate validation paths and can keep reviewers using old deployments. Use the latest GitHub deployment record, a branch alias when configured, or the production alias after promotion.

## Execution priorities

| Order | Priority | Bundle | Issue outcome | Dependency | Stale URL/resource control |
|---:|---|---|---|---|---|
| 1 | P0 | Deployment hygiene | Remove stale preview URLs from active handoff notes and issue comments; keep only the latest successful deployment evidence | None | Prevents reviewers testing old immutable previews and wasting deployment resources |
| 2 | P0 | Environment boundary | Confirm Vercel preview/prod env vars generate non-blank Supabase runtime config and fail fast when missing | 1 | Blocks broken previews before they consume QA time |
| 3 | P0 | Quality | Keep deterministic lint, type-check, build, unit and runtime-config gates passing in CI | 1-2 | Stops invalid artifacts before new previews are trusted |
| 4 | P0 | Data security | Prove single-owner Supabase migrations, role-negative RLS and server-enforced auth contracts | 2-3 | Avoids promoting UI-only success over real data safety |
| 5 | P0 | Browser QA | Capture desktop and 390 px evidence only against the latest successful deployment URL for the commit under review | 3-4 | Avoids duplicate QA runs against superseded previews |
| 6 | P0 | Baseline release | Split, review and land the current security/release foundation with rollback notes | 1-5 | One reviewed artifact becomes the baseline, not multiple stale previews |
| 7 | P0 | Requirements | Resolve client field, role, retention and pilot decisions | None; blocks schema freeze | Prevents building unsupported screens and storage paths |
| 8 | P1 | Field operations | Complete attendance, safety and idempotent daily sync | 4, 6, 7 | Reuse existing outbox/retry contracts; no duplicate queue logic |
| 9 | P1 | Workforce control | Complete workforce, issue, payroll and maker-checker contracts | 4, 6, 7 | Keep audit and approval paths shared across roles |
| 10 | P1 | Asset pilot | Complete identity, CSV, custody, hierarchy and QR lookup | 4, 6, 7 | Use controlled CSV dry-run before writes to reduce bad data cleanup |
| 11 | P1 | Maintenance | Complete pre-start, defect, work order and return-to-service flow | 10 | Reuse asset/work-order evidence instead of parallel maintenance state |
| 12 | P1 | Executive evidence | Reconcile every dashboard metric to persisted source records | 8-11 | Avoid derived dashboards becoming a second source of truth |
| 13 | P1 | Resilience | Complete private evidence, offline outbox and recovery behavior | 8, 10, 11 | Keep failed/pending recovery visible without silent deletion |
| 14 | P2 | Artifact automation | Version and automate client/engineering artifact generation | 6-7 | Regenerate docs from source instead of preserving stale links manually |
| 15 | P0 | Production readiness | Backup/restore, monitoring, performance, security regression and UAT | 8-14 | Promote one validated artifact and retire obsolete preview references |

## Deployment URL handling

| Rule | Operational reason | Enforcement point |
|---|---|---|
| Treat Vercel preview URLs as immutable evidence, not stable entry points | Every push creates a new artifact; old URLs can still render old code | PR description and issue comments must name the commit SHA with the preview URL |
| Do not reuse a preview URL after a newer commit is pushed | Reviewers may validate a known-bad build and report fixed errors again | Latest GitHub deployment for the SHA is the source of truth |
| Prefer a branch alias or production alias for repeated human QA when configured | One stable entry point reduces stale bookmarks and repeated resource use | Vercel project settings / deployment handoff |
| Keep stale preview URLs out of durable docs | Docs should describe how to find the latest deployment, not freeze a temporary URL | Documentation review checklist |
| If a stale URL was shared, post a superseding note instead of deleting evidence | Preserves audit trail while redirecting testers to the current artifact | GitHub issue or PR comment |

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
- Desktop and 390 px proof for rendered changes against the latest deployment for the reviewed SHA.
- Migration/reset evidence for schema changes.
- Documentation and rollback notes updated.
- No durable documentation or acceptance note depends on an old immutable Vercel preview URL.
- Public Senatla Trading website remains untouched.
