from importlib.util import module_from_spec, spec_from_file_location
import runpy
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
runpy.run_path(str(ROOT / "scripts" / "generate-client-diagrams.py"), run_name="__main__")
engine_path = ROOT / "scripts" / "generate-sankofa-handbook.py"
spec = spec_from_file_location("handbook_generator", engine_path)
if spec is None or spec.loader is None:
    raise RuntimeError("Unable to load handbook generator")
engine = module_from_spec(spec)
spec.loader.exec_module(engine)

source = ROOT / "docs" / "client-senatla-ops-planning-requirements-guidance.md"
html_out = ROOT / "docs" / "client-senatla-ops-planning-requirements-guidance.html"
pdf_out = ROOT / "output" / "pdf" / "Senatla-Ops-Client-Review-Pack.pdf"
docx_out = ROOT / "output" / "doc" / "Senatla-Ops-Client-Review-Pack.docx"

engine.SOURCE = source
parsed = list(engine.blocks(source.read_text(encoding="utf-8")))
engine.build_html(
    parsed,
    output=html_out,
    page_title="Senatla Ops Client Planning, Requirements and Guidance",
    hero_title="Senatla Ops<br>Client Blueprint",
    description="Planning, requirements, screen concepts, data transfer and phased client guidance.",
)
engine.build_pdf(
    parsed,
    output=pdf_out,
    document_title="Senatla Ops",
    document_subtitle="Client Ecosystem Review Pack",
    description="Ecosystem, role experiences, asset lifecycle, requirements, delivery gates and client decisions prepared by Sankofa Digital Studio.",
    footer_label="Client Review Pack v1.0",
    cover_image=ROOT / "docs" / "visuals" / "senatla-ops-ecosystem.png",
)
engine.build_docx(
    parsed,
    output=docx_out,
    document_title="Senatla Ops",
    document_subtitle="Client Ecosystem Review Pack",
    description="Ecosystem, role experiences, asset lifecycle, requirements, delivery gates and client decisions prepared by Sankofa Digital Studio.",
    footer_label="Client Review Pack v1.0",
)
print(html_out)
print(pdf_out)
print(docx_out)
