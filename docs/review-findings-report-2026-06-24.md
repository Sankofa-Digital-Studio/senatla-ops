# Senatla Ops Repository, Artifact and Deployment Review

Review date: 24 June 2026  
Repository: `Sankofa-Digital-Studio/senatla-ops`  
Requested outcome: review documentation, images, Vercel deployment and product goals; document findings and create a delivery backlog.

## Overall assessment

Senatla Ops has a coherent product direction and a substantially stronger requirements and asset-management foundation than the deployed application. The ecosystem documents correctly position the product as Senatla Trading's internal operational heartbeat across Field, Office, Engineering, Finance and Leadership.

The main risk is evidence, not product intent. The current worktree, migrations and artifacts are materially ahead of the last verifiable Vercel production deployment, while build, browser and database gates remain incomplete or inaccessible.

## What is working well

### Product direction

- The one-owner Senatla Trading boundary is explicit.
- Asset identity uses serial number, VIN and registration plate correctly as alternate identifiers.
- The product differentiates itself by linking workforce, safety, payroll, assets and maintenance rather than copying a generic CMMS.
- Maker-checker, immutable history, private evidence and explainable analytics are appropriate control principles.
- Deferred items are sensible: AI, telematics, multi-company UI and full spares ERP should not precede a stable operational foundation.

### Client and engineering artifacts

- The 10-page ecosystem review communicates roles and handoffs clearly.
- The 17-page requirements workbook exposes proposed business objects and decisions in client-friendly language.
- The ecosystem, role-experience and heavy-machinery lifecycle images form a coherent client set.
- Markdown, HTML, DOCX and PDF generation is reproducible through repository scripts.
- The public Senatla Trading website is consistently excluded from the internal product scope.

### Repository foundation

- Auth/session, route-guard and provider-contract hardening exists locally.
- The asset register includes shared forms, identifier validation, CSV dry run, lifecycle and maintenance foundations.
- Supabase migrations include ownership, identifier, RLS, evidence and immutability controls.
- GitHub templates, CODEOWNERS, labels and a proposed CI workflow now exist locally.

## Findings requiring action

### P0 - Quality gate is not deterministic

Application and specification TypeScript compilation pass. The Angular build and Karma/ChromeHeadless processes have repeatedly stalled without completing, so the repository does not yet have a trustworthy release gate. Build success from an older deployment cannot validate the current worktree.

Recommendation: pin the runtime, repair or replace the hanging runner and require a CI artifact plus desktop/mobile browser smoke evidence.

### P0 - Production deployment is older than the product foundation

GitHub deployment metadata shows the latest successful production deployment at commit `e3cc7a4` on 4 April 2026. The local branch contains extensive later work that is not represented by that deployment.

Recommendation: split and review the worktree, prove tests and migrations, then deploy only an approved Git commit.

### P0 - Live Vercel QA is access-blocked

The production deployment redirects to Vercel Authentication. The connected Vercel app failed and the local Vercel CLI has no credentials. The deployment status is successful, but the rendered application could not be inspected.

Recommendation: restore project/team access and provide a controlled QA path for protected preview and production deployments.

### P0 - Supabase contracts are designed but not proven

The local configuration, migrations and pgTAP tests express the intended controls. No clean local database reset and role-negative test result was available in this review.

Recommendation: execute the pinned local Supabase reset and retain role-matrix evidence before schema claims are accepted.

### P0 - Client decisions still block schema freeze

Field names, site/project structure, payroll boundary, asset classes, custody acceptance, inspection rules, evidence retention and pilot data remain subject to Mr Rubin Thoso's requirements review.

Recommendation: complete the requirements workbook before locking the asset-pilot schema or reporting definitions.

### P1 - Worktree is too broad for one review

Authentication, data gateways, office workflows, payroll, assets, maintenance, governance and documents are mixed in one large dirty branch.

Recommendation: land focused, dependency-ordered pull requests with issue-linked evidence.

### P1 - Artifact governance needs completion

Approved ecosystem visuals coexist with earlier standalone dashboard/mobile concepts. Dates and statuses are embedded in generated artifacts and will drift after client feedback.

Recommendation: use the artifact register, remove or archive superseded concepts and automate source-to-PDF verification.

## Branch update

The agreed branch is now `main`, so branch naming is not a design blocker. During the final API refresh GitHub still reported `master` as the repository default. Treat this as a propagation or repository-setting verification task: confirm that GitHub default branch, CI push trigger and Vercel production branch all resolve to `main`.

## GitHub backlog created

Fourteen issues were created in `Sankofa-Digital-Studio/senatla-ops`, numbered #4 through #17.

P0 foundation issues:

- #4 Confirm repository/default-branch/CI/deployment alignment.
- #5 Restore deterministic lint, build and browser-test gates.
- #6 Prove Senatla Trading ownership and negative RLS contracts.
- #7 Restore Vercel access and controlled production QA.
- #8 Split and land the current security/release foundation.
- #9 Resolve client requirements and asset-pilot decisions.
- #17 Complete production readiness, recovery rehearsal and UAT.

P1/P2 delivery issues:

- #10 Offline-capable site-day workflow.
- #11 Workforce, issues, payroll and maker-checker controls.
- #12 Controlled asset identity and custody pilot.
- #13 Inspection-to-return maintenance safety workflow.
- #14 Reconciled executive analytics.
- #15 Private evidence, offline outbox and recovery.
- #16 Documentation and artifact automation.

## Project-board status

Issues were created and labelled successfully. They could not be added to a GitHub Project because:

- the active GitHub CLI token lacks `read:project` and `project` scopes;
- the organization projects page showed no visible project while unauthenticated;
- the attempted scope refresh did not complete.

Recommended board: **Senatla Ops Release Programme**, with Intake, Ready, Active, Review, Verification and Released statuses. Once project scopes are granted, add issues #4-#17 and populate Priority, Bundle, Release Gate, Owner and Evidence Status.

## Recommended execution order

1. Confirm `main` propagation across GitHub, CI and Vercel.
2. Repair the deterministic quality gate (#5).
3. Prove Supabase reset and negative RLS contracts (#6).
4. Restore Vercel QA access (#7).
5. Complete client decisions (#9).
6. Split and land the release foundation (#8).
7. Execute core operations, asset and maintenance issues (#10-#15).
8. Complete artifact automation (#16).
9. Run recovery, security and UAT gate (#17).

## Release recommendation

Do not deploy the current worktree directly. The product direction is viable and well documented, but the next release should be treated as a controlled baseline recovery followed by an asset pilot, not as a feature-complete production launch.

