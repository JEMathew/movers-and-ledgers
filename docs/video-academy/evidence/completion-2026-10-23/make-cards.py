from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
p=Path(__file__).parent;c=p/'captures';out=p/'cards';out.mkdir(exist_ok=True)
font='/System/Library/Fonts/Supplemental/Arial.ttf';bold='/System/Library/Fonts/Supplemental/Arial Bold.ttf'
def f(size,b=False):return ImageFont.truetype(bold if b else font,size)
full=Image.open(c/'production-full.png')
full.crop((975,1260,1755,1530)).save(c/'entry.png')
full.crop((975,1525,1755,1864)).save(c/'advisor.png')
full.crop((975,1873,1755,2212)).save(c/'reviewer.png')
full.crop((975,2214,1755,2294)).save(c/'authority.png')
def base(title,subtitle):
 im=Image.new('RGB',(1920,1080),'#f8f9f4');d=ImageDraw.Draw(im)
 d.rectangle((100,80,109,116),fill='#087c63');d.text((130,79),'MoveBooks AI',font=f(34,True),fill='#182b2a')
 d.text((100,160),title,font=f(56,True),fill='#182b2a');d.text((100,238),subtitle,font=f(27),fill='#536563')
 d.text((100,990),'Actual released product capture · Existing synthetic result · No new model call',font=f(24),fill='#536563')
 return im
def panel(name,title,subtitle,source):
 im=base(title,subtitle);pic=Image.open(c/source).convert('RGB');pic.thumbnail((1640,640),Image.Resampling.LANCZOS)
 # Upscale source pixels uniformly; never change result text.
 scale=min(1640/pic.width,640/pic.height);pic=pic.resize((round(pic.width*scale),round(pic.height*scale)),Image.Resampling.LANCZOS)
 im.paste(pic,((1920-pic.width)//2,320+(640-pic.height)//2));im.save(out/f'{name}.png')
panel('advisor','The Advisor explains. You decide.','Read the recommendation, rationale and unresolved evidence.','advisor.png')
panel('reviewer','A separate assessment of the recommendation','The Reviewer checks the recommendation against the source facts.','reviewer.png')
panel('entry','Run AI-Assisted Analysis','Prepare → Mappings → 1200 · Misc Clearing. One explicit action returns both roles.','entry.png')
panel('authority','A second opinion is not approval','Your existing mapping decision remains separate from AI analysis.','authority.png')
im=base('Compare the two assessments','Agreement is support, not proof. Inspect the evidence before your decision.')
for name,x in [('advisor',90),('reviewer',980)]:
 pic=Image.open(c/f'{name}.png').convert('RGB');pic=pic.resize((850,round(pic.height*850/pic.width)),Image.Resampling.LANCZOS);im.paste(pic,(x,390))
im.save(out/'pair.png')
footer=Image.new('RGBA',(1920,60),'#f8f9f4');ImageDraw.Draw(footer).text((90,18),'MoveBooks AI Academy · Synthetic example · Human approval required',font=f(23),fill='#536563');footer.save(out/'footer.png')
