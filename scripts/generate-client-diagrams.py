from pathlib import Path
from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "visuals"
OUT.mkdir(parents=True, exist_ok=True)

NAVY = "#0B172A"
BLUE = "#1E5AA8"
AMBER = "#D88700"
GREEN = "#17804A"
RED = "#C63232"
SLATE = "#536172"
LINE = "#B9C6D6"
LIGHT = "#F3F6FA"
WHITE = "#FFFFFF"


def font(size, bold=False):
    name = "seguisb.ttf" if bold else "segoeui.ttf"
    return ImageFont.truetype(str(Path("C:/Windows/Fonts") / name), size)


def arrow(draw, start, end, color=BLUE, width=5):
    draw.line([start, end], fill=color, width=width)
    x, y = end
    draw.polygon([(x, y), (x - 16, y - 10), (x - 16, y + 10)], fill=color)


def node(draw, box, title, detail, accent=BLUE):
    draw.rounded_rectangle(box, radius=18, fill=WHITE, outline=LINE, width=2)
    draw.rounded_rectangle((box[0], box[1], box[0] + 10, box[3]), radius=5, fill=accent)
    draw.text((box[0] + 26, box[1] + 23), title, font=font(23, True), fill=NAVY)
    draw.multiline_text((box[0] + 26, box[1] + 62), detail, font=font(16), fill=SLATE, spacing=5)


canvas = Image.new("RGB", (1800, 700), LIGHT)
draw = ImageDraw.Draw(canvas)
draw.text((70, 38), "Operational data transfer and accountability", font=font(34, True), fill=NAVY)
draw.text((70, 88), "One Senatla Trading record crosses role boundaries through explicit RLS, idempotency and audit controls.", font=font(19), fill=SLATE)

boxes = [
    (70, 190, 320, 350),
    (390, 190, 640, 350),
    (710, 190, 960, 350),
    (1030, 190, 1280, 350),
    (1350, 190, 1730, 350),
]
labels = [
    ("Site Manager", "Attendance, safety,\ninspection, signature", GREEN),
    ("Offline outbox", "Encrypted queue +\nidempotency key", AMBER),
    ("Supabase boundary", "Session, RLS, API,\nprivate storage", BLUE),
    ("Official records", "Senatla Trading\nsource of truth", NAVY),
    ("Office and Director", "Resolve exceptions,\ndrill down, approve", BLUE),
]
for box, values in zip(boxes, labels):
    node(draw, box, *values)
for left, right in zip(boxes, boxes[1:]):
    arrow(draw, (left[2] + 8, 270), (right[0] - 8, 270))

node(draw, (710, 470, 960, 620), "Private evidence", "Photos, signatures,\ncompliance documents", AMBER)
node(draw, (1030, 470, 1280, 620), "Immutable audit", "Actor, time, action,\nentity and outcome", RED)
draw.line([(835, 350), (835, 470)], fill=AMBER, width=5)
draw.polygon([(835, 470), (825, 454), (845, 454)], fill=AMBER)
draw.line([(1155, 350), (1155, 470)], fill=RED, width=5)
draw.polygon([(1155, 470), (1145, 454), (1165, 454)], fill=RED)
canvas.save(OUT / "role-data-flow.png", quality=92)

canvas = Image.new("RGB", (1600, 500), LIGHT)
draw = ImageDraw.Draw(canvas)
draw.text((65, 38), "Asset safety and lifecycle", font=font(34, True), fill=NAVY)
draw.text((65, 86), "Critical defects block operation until evidence and an independent return-to-service decision are complete.", font=font(19), fill=SLATE)
states = [
    ((65, 190, 300, 340), "Active", "Available and compliant", GREEN),
    ((390, 190, 660, 340), "Maintenance", "Planned work or defect", AMBER),
    ((750, 190, 1020, 340), "Blocked", "Critical work remains open", RED),
    ((1110, 190, 1535, 340), "Return decision", "Different reviewer approves\nonly after blockers close", BLUE),
]
for box, title, detail, accent in states:
    node(draw, box, title, detail, accent)
for left, right in zip(states, states[1:]):
    arrow(draw, (left[0][2] + 8, 265), (right[0][0] - 8, 265), color=right[3])
draw.arc((180, 320, 1300, 470), start=0, end=180, fill=GREEN, width=5)
draw.polygon([(180, 395), (198, 384), (198, 406)], fill=GREEN)
draw.text((575, 420), "Approved return creates an audit event and restores Active", font=font(18, True), fill=GREEN)
canvas.save(OUT / "asset-lifecycle-flow.png", quality=92)

