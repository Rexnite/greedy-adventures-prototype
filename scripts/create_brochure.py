from io import BytesIO
from pathlib import Path

from PIL import Image
from reportlab.lib.colors import HexColor
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas

ROOT = Path(__file__).resolve().parents[1]
p = ROOT / "public/media/sea-view-demo-brochure.pdf"
c = canvas.Canvas(str(p), pagesize=(595, 842))
c.setTitle("Sea View Skydiving - Demo Experience Guide")
c.setFillColor(HexColor("#102c36"))
c.rect(0, 0, 595, 842, fill=1, stroke=0)
c.setFillColor(HexColor("#f46e3f"))
c.setFont("Helvetica-Bold", 10)
c.drawString(46, 785, "GREEDY ADVENTURES / EXPERIENCE GUIDE")
c.setFillColor(HexColor("#f6f5ee"))
c.setFont("Helvetica", 51)
c.drawString(43, 700, "A leap beyond")
c.drawString(43, 645, "the everyday.")
c.setFont("Helvetica", 12)
c.drawString(46, 600, "Sea View Tandem Skydiving / Thailand")
c.saveState()
clip = c.beginPath()
clip.rect(46, 306, 503, 255)
c.clipPath(clip, stroke=0)
photo_bytes = BytesIO()
Image.open(ROOT / "public/media/tandem-with-sea-view.webp").convert("RGB").save(
    photo_bytes, format="JPEG", quality=88
)
photo_bytes.seek(0)
c.drawImage(
    ImageReader(photo_bytes),
    46,
    215,
    width=503,
    height=503,
    mask="auto",
)
c.restoreState()
c.setFont("Helvetica-Bold", 11)
c.drawString(46, 275, "13,000 FT EXIT  /  ~60 SEC FREEFALL  /  5-7 MIN CANOPY")
c.setFont("Helvetica", 10)
for y, s in [
    (246, "ECO - THB 9,500: Standard tandem jump."),
    (225, "DELUXE - THB 12,500: Video and photos included."),
    (204, "VIP - THB 14,000: Personal cameraman and edited film."),
    (177, "All packages: instructor, briefing, aircraft ascent and certificate."),
    (152, "Source lists Pattaya and a Rayong address. Confirm meeting point."),
    (131, "Prices captured 1 November 2026. Confirm current details with operator."),
]:
    c.drawString(46, y, s)
c.setFillColor(HexColor("#ff9e77"))
c.setFont("Helvetica-Bold", 9)
c.drawString(46, 93, "DEMO BROCHURE - NOT AN OFFICIAL GREEDY ADVENTURES DOCUMENT")
c.setFillColor(HexColor("#c6d6d8"))
c.setFont("Helvetica", 8)
c.drawString(
    46,
    65,
    "Source & photography: Greedy Adventures. Open the official experience page:",
)
u = "https://www.greedyadventures.com/experiences/sea-view-skydiving"
c.drawString(46, 49, u)
c.linkURL(u, (46, 44, 550, 62), relative=0)
c.save()
