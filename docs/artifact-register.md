# Senatla Ops Artifact Register

Updated: 24 June 2026

## Approved client-review artifacts

| Artifact | Purpose | Status |
|---|---|---|
| `output/pdf/Senatla-Ops-Client-Review-Pack.pdf` | Ecosystem, role experiences, lifecycle and delivery discussion | Approved review pack; 10 pages |
| `output/pdf/Senatla-Ops-Client-Requirements-Feedback-Template.pdf` | Field names, workflows, authority and pilot decisions | Approved feedback workbook; 17 pages |
| `docs/visuals/senatla-ops-ecosystem.png` | Field-to-leadership ecosystem | Client-facing concept |
| `docs/visuals/senatla-ops-role-experiences.png` | Role-shaped application family | Client-facing concept |
| `docs/visuals/senatla-ops-asset-lifecycle-story.png` | Heavy-machinery lifecycle story | Client-facing concept |

The visual boards communicate product intent and handoffs. They contain illustrative interface content and are not pixel-accurate implementation specifications.

## Engineering artifacts

| Artifact | Purpose |
|---|---|
| `output/pdf/Sankofa-Senatla-Ops-Engineering-Handbook.pdf` | Architecture, governance and release rules |
| `output/pdf/engineering-asset-register-plan.pdf` | Asset-register engineering plan |
| `output/pdf/architecture.pdf` | Architecture boundary |
| `output/pdf/environments.pdf` | Environment and secret boundary |
| `output/pdf/testing.pdf` | Verification layers |
| `output/pdf/runbook.pdf` | Release, rollback and incident operations |
| `output/pdf/release-checklist.pdf` | Production-candidate evidence |

## Superseded or internal concepts

`senatla-ops-desktop-concept.png` and `senatla-ops-mobile-concept.png` are early screen studies. They must not be sent as the current client ecosystem proposal. Retain only while useful for internal comparison; otherwise remove them through the artifact-cleanup issue.

## Generation and quality rules

- Markdown is the editable source for narrative documents.
- Client-facing Markdown must have a matching PDF.
- Generated PDF and DOCX files must be reproducible through repository scripts.
- Render every PDF before release; check every page for clipping, overlap and trailing blank pages.
- Version, date and status must agree across source and generated artifacts.
- Do not commit credentials, personal data, production exports or unredacted client source spreadsheets.

