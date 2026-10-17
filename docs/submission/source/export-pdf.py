from pathlib import Path

from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas

root=Path.cwd()
out=root/'docs/submission/assets/movebooks-submission-draft.pdf'
c=canvas.Canvas(str(out),pagesize=(960,540),pageCompression=1)
c.setTitle('MoveBooks AI submission content draft - official template pending')
c.setAuthor('Movers & Ledgers')
for f in sorted((root/'.packaging-build/slides').glob('slide-*.png')):
 c.drawImage(ImageReader(str(f)),0,0,width=960,height=540)
 c.showPage()
c.save()
assert out.stat().st_size<=5_000_000,out.stat().st_size
print(out.stat().st_size)
