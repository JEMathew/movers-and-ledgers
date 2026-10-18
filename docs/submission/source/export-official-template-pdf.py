"""Export the rendered official-template review deck without modifying source/video."""

from pathlib import Path

from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas

root = Path.cwd()
slides = sorted((root / '.packaging-build/official-template').glob('filled-*.png'))
if len(slides) != 16:
    raise ValueError(f'Expected 16 rendered official-template slides, found {len(slides)}')
output = root / 'docs/submission/assets/movebooks-official-template-review.pdf'
canvas_ = canvas.Canvas(str(output), pagesize=(720, 405), pageCompression=1)
canvas_.setTitle('MoveBooks AI - Official AI Builder Cup template review')
canvas_.setAuthor('Movers & Ledgers')
for slide in slides:
    canvas_.drawImage(ImageReader(str(slide)), 0, 0, width=720, height=405)
    canvas_.showPage()
canvas_.save()
if output.stat().st_size > 5_000_000:
    raise ValueError(f'PDF exceeds portal limit: {output.stat().st_size} bytes')
print(output.stat().st_size)
