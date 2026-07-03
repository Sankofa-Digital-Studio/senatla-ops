from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
spec = spec_from_file_location("handbook_generator", ROOT / "scripts" / "generate-sankofa-handbook.py")
if spec is None or spec.loader is None:
    raise RuntimeError("Unable to load document generator")
engine = module_from_spec(spec)
spec.loader.exec_module(engine)

source = ROOT / "docs" / "senatla-ops-client-requirements-feedback-template.md"
html_out = ROOT / "docs" / "senatla-ops-client-requirements-feedback-template.html"
pdf_out = ROOT / "output" / "pdf" / "Senatla-Ops-Client-Requirements-Feedback-Template.pdf"
docx_out = ROOT / "output" / "doc" / "Senatla-Ops-Client-Requirements-Feedback-Template.docx"

engine.SOURCE = source
parsed = list(engine.blocks(source.read_text(encoding="utf-8")))
engine.build_html(
    parsed,
    output=html_out,
    page_title="Senatla Ops Requirements Confirmation Workbook",
    hero_title="Senatla Ops<br>Requirements Workbook",
    description="Proposed objects, field names, operating rules and client decisions for confirmation.",
)
engine.build_pdf(
    parsed,
    output=pdf_out,
    document_title="Senatla Ops",
    document_subtitle="Requirements Confirmation Workbook",
    description="Prepared for Mr Rubin Thoso to confirm field names, workflows, responsibilities, controls and pilot information.",
    footer_label="Requirements Workbook v1.0",
    cover_image=ROOT / "docs" / "visuals" / "senatla-ops-role-experiences.png",
)
engine.build_docx(
    parsed,
    output=docx_out,
    document_title="Senatla Ops",
    document_subtitle="Requirements Confirmation Workbook",
    description="Prepared for Mr Rubin Thoso to confirm field names, workflows, responsibilities, controls and pilot information.",
    footer_label="Requirements Workbook v1.0",
)
print(html_out)
print(pdf_out)
print(docx_out)

