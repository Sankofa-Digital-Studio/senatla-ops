from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
spec = spec_from_file_location("handbook_generator", ROOT / "scripts" / "generate-sankofa-handbook.py")
if spec is None or spec.loader is None:
    raise RuntimeError("Unable to load PDF generator")
engine = module_from_spec(spec)
spec.loader.exec_module(engine)

documents = {
    "architecture.md": ("Senatla Ops", "Architecture", "Application, trust boundary and domain architecture."),
    "artifact-register.md": ("Senatla Ops", "Artifact Register", "Approved, engineering and superseded document and image artifacts."),
    "backend-supabase-vercel.md": ("Senatla Ops", "Supabase and Vercel Guidance", "Backend, runtime configuration and deployment guidance."),
    "engineering-asset-register-plan.md": ("Senatla Ops", "Engineering Asset Register Plan", "Asset identity, lifecycle, maintenance and delivery plan."),
    "environments.md": ("Senatla Ops", "Environment Boundaries", "Local, preview and production data and credential boundaries."),
    "github-delivery-backlog.md": ("Senatla Ops", "GitHub Delivery Backlog", "Prioritized release bundles, dependencies and evidence expectations."),
    "release-checklist.md": ("Senatla Ops", "Production Candidate Checklist", "Release evidence and acceptance checklist."),
    "release-readiness-audit-2026-06-24.md": ("Senatla Ops", "Release-Readiness Audit", "Repository, deployment, artifact and verification findings as at 24 June 2026."),
    "review-findings-report-2026-06-24.md": ("Senatla Ops", "Review Findings Report", "Repository, artifact, deployment, product-goal and GitHub backlog findings."),
    "runbook.md": ("Senatla Ops", "Operations Runbook", "Release, rollback, incident and offline recovery guidance."),
    "testing.md": ("Senatla Ops", "Testing Strategy", "Static, database, browser, finance and recovery evidence gates."),
}

for filename, (title, subtitle, description) in documents.items():
    source = ROOT / "docs" / filename
    engine.SOURCE = source
    parsed = list(engine.blocks(source.read_text(encoding="utf-8")))
    output = ROOT / "output" / "pdf" / f"{source.stem}.pdf"
    engine.build_pdf(
        parsed,
        output=output,
        document_title=title,
        document_subtitle=subtitle,
        description=description,
        footer_label=f"{subtitle} v1.0",
    )
    print(output)
