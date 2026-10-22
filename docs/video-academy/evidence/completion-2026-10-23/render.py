from pathlib import Path
import subprocess,json,concurrent.futures
p=Path(__file__).parent;root=p.parent;out=p/'rendered';out.mkdir(exist_ok=True)
plan={
'04':{'source':'a989085c.mp4','duration':105.8,'cuts':[[27.05,59.6],[61.95,63.18],[65.35,71.0],[84.98,87.55]],'scenes':[['entry',17,59.61],['advisor',59.61,77],['authority',77,102.5]],'reason':'Remove obsolete Explain Mapping invocation, old literal labels/confidence/alternatives instructions and old per-migration quota; replace planned/fallback product shots with existing released-product captures.'},
'05':{'source':'a676795e-1485-4f73-9c6e-febbad2ccf08.mp4','duration':103.08,'cuts':[[9.5,25.3],[32.2,45.4],[83.55,90.5]],'scenes':[['entry',9.5,32.2],['reviewer',32.2,70.5],['pair',70.5,83.55],['authority',83.55,101]],'reason':'Remove old separate rule-check invocation, never-reads-Advisor assertion, obsolete literal labels and three-review quota. Preserve independent assessment and human authority explanation.'},
'09':{'source':'92b7537f-29aa-4495-90fd-6c4ee5f015a3.mp4','duration':177.877,'cuts':[[41.3,42.25],[63.15,64.12],[72.5,79.45]],'scenes':[['entry',48,54.5],['advisor',54.5,71.6],['reviewer',71.6,88],['authority',88,96.8]],'reason':'Replace obsolete Gemini scenes; remove obsolete separate Reviewer request/never-reads claim and a short unintelligible duplicate phrase after Misc Clearing. Preserve the rest of the original full journey.'}}
for id,d in plan.items():
 keep=[];cur=0
 for a,b in d['cuts']:keep.append([cur,a]);cur=b
 keep.append([cur,d['duration']]);d['keep']=keep;d['finalDuration']=sum(b-a for a,b in keep)
(p/'edit-decisions.json').write_text(json.dumps(plan,indent=2)+'\n')
def render(item):
 id,d=item;cmd=['/opt/homebrew/bin/ffmpeg','-y','-hide_banner','-loglevel','warning','-i',str(root/d['source'])]
 for name,_,_ in d['scenes']:cmd+=['-loop','1','-framerate','30','-i',str(p/'cards'/f'{name}.png')]
 cmd+=['-loop','1','-framerate','30','-i',str(p/'cards/footer.png')]
 filt=[];prev='0:v'
 for i,(_,a,b) in enumerate(d['scenes'],1):
  filt.append(f"[{prev}][{i}:v]overlay=0:0:enable='between(t,{a},{b})':shortest=1[v{i}]");prev=f'v{i}'
 foot=len(d['scenes'])+1;filt.append(f'[{prev}][{foot}:v]overlay=0:1020:shortest=1[clean]')
 n=len(d['keep']);filt.append('[clean]split='+str(n)+''.join(f'[vsplit{i}]' for i in range(n)));filt.append('[0:a]asplit='+str(n)+''.join(f'[asplit{i}]' for i in range(n)))
 for i,(a,b) in enumerate(d['keep']):
  filt.append(f'[vsplit{i}]trim=start={a}:end={b},setpts=PTS-STARTPTS[vtrim{i}]')
  filt.append(f'[asplit{i}]atrim=start={a}:end={b},asetpts=PTS-STARTPTS,afade=t=in:d=0.008,afade=t=out:st={b-a-.008}:d=0.008[atrim{i}]')
 filt.append(''.join(f'[vtrim{i}][atrim{i}]' for i in range(n))+f'concat=n={n}:v=1:a=1[v][a]')
 filterfile=p/f'{id}-filter.txt';filterfile.write_text(';\n'.join(filt))
 cmd+=['-filter_complex_threads','2','-filter_complex',filterfile.read_text(),'-map','[v]','-map','[a]','-r','30','-c:v','libx264','-threads','2','-preset','fast','-crf','19','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-ar','48000','-movflags','+faststart',str(out/f'{id}.mp4')]
 (p/f'{id}-render-command.json').write_text(json.dumps(cmd,indent=2)+'\n')
 with (p/f'{id}-render.log').open('w') as log:r=subprocess.run(cmd,stdout=log,stderr=log)
 print(id,r.returncode,flush=True);assert r.returncode==0
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:list(pool.map(render,plan.items()))
