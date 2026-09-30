# Contributing to Senatla Ops

Senatla Ops is an internal Senatla Trading product. The public company website is frozen and outside this repository's delivery scope.

## Work authorization

1. Link every change to a GitHub issue with an operational outcome and acceptance evidence.
2. Use `feature/<issue>-description` or `fix/<issue>-description`; Codex branches use `codex/<issue>-description`.
3. Use `type(scope): description` commits.
4. Submit a focused pull request and complete the evidence checklist.
5. Squash merge only after CI and CODEOWNER review. Authors do not self-merge.
6. GitHub `dev` is the default integration and demo branch. `main` accepts only reviewed production release pull requests from validated `dev` commits. `master` is not a merge target.

## Definition of done

- Every operational record resolves to Senatla Trading.
- Every mutation creates an attributable audit event.
- Authorization is enforced in Supabase RLS, not only in the Angular client.
- UI changes are checked at desktop and 390 px widths.
- Migrations pass a clean local reset and negative RLS tests.
- No production personal information or service-role credential enters Git, logs, issues or screenshots.
- Rollback and recovery instructions are included for high-risk changes.

Run `npm run verify` before requesting review. That single application gate must show evidence for lint, typecheck, headless tests and build. Feature and fix pull requests target `dev`. A production release pull request targets `main`, identifies the validated `dev` commit and requires independent CODEOWNER review, passing CI and a recorded rollback target. Do not merge your own release pull request. Supabase changes also require `npx supabase@2.107.0 start`, `db reset --local`, and `test db`.
