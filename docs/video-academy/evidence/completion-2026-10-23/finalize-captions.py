from pathlib import Path
import json,re,textwrap,hashlib,subprocess
p=Path(__file__).parent;out=p/'final-captions';out.mkdir(exist_ok=True)
replacements={r'\bHarbour\b':'Harbor',r'\bHarborlight\b':'Harbor Light',r'\bLightbooks\b':'Light Books',r'\bmisclearing\b':'Misc Clearing',r'\bMovebooks\b':'MoveBooks',r'\bMove Books\b':'MoveBooks',r'\bCA sales\b':'CA-SALES',r'\bcatalogue\b':'catalog',r'\bNorthstar supplies\b':'Northstar Supplies',r'\bcedar school\b':'Cedar School',r'\bcheck point\b':'checkpoint',r'\bto the (?:scent|sent)\b':'to the cent',r'\bHarbor light\b':'Harbor Light'}
def normalize(t):
 for a,b in replacements.items():t=re.sub(a,b,t,flags=re.I)
 return t.strip()
def stamp(t,sep):
 ms=round(t*1000);return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02}{sep}{ms%1000:03}'
reports=[]
for n in range(1,10):
 id=f'{n:02}';src=p/'captions'/f'{id}{"-rendered" if id in ["04","05","09"] else ""}.json';d=json.loads(src.read_text());words=[dict(w) for s in d['segments'] for w in s['words']];duration=d['duration']
 if id in ['04','05','09']:
  original=json.loads((p/'captions'/f'{id}-check.json').read_text());plan=json.loads((p/'edit-decisions.json').read_text())[id];words=[];offset=0
  for a,b in plan['keep']:
   for seg in original['segments']:
    if seg['end']-seg['start']<.25 and len(seg['words'])>4:continue
    for w in seg['words']:
     if a <= (w['start']+w['end'])/2 < b:
      words.append({**w,'start':offset+max(a,w['start'])-a,'end':offset+min(b,w['end'])-a})
   offset+=b-a
 # ASR orthography only. Never add new narration.
 for j,w in enumerate(words):
  if id=='01' and w['word'].strip().lower()=='resume' and j+1<len(words) and words[j+1]['word'].strip()=='is':w['word']=' resumes';words[j+1]['word']=''
  if w['word'].strip().lower().strip('.,') in ['scent','sent'] and id in ['01','09']:w['word']=w['word'].replace('scent','cent').replace('sent','cent')
 words=[w for w in words if w['word'].strip() and w['start']<duration]
 merged=[]
 for w in words:
  t=w['word'].strip()
  if merged and ((re.match(r'^\.\d',t) and re.search(r'\d$',merged[-1]['word'])) or t=='%'):
   merged[-1]['word']+=t;merged[-1]['end']=w['end']
  elif merged and merged[-1]['word'].strip().lower()=='check' and t.rstrip('.').lower()=='point':
   merged[-1]['word']=' checkpoint'+('.' if t.endswith('.') else '');merged[-1]['end']=w['end']
  else:merged.append(w)
 words=merged
 groups=[];current=[]
 for w in words:
  t=normalize(''.join(x['word'] for x in current+[w]))
  if current and (len(t)>78 or w['end']-current[0]['start']>4.3 or w['start']-current[-1]['end']>.55):groups.append(current);current=[]
  current.append(w)
  if w['word'].strip().endswith(('.', '?', '!')) and w['end']-current[0]['start']>=1.2:groups.append(current);current=[]
 if current:groups.append(current)
 cues=[]
 for j,g in enumerate(groups):
  start=max(0,g[0]['start']);end=max(g[-1]['end'],start+.5);nextstart=groups[j+1][0]['start'] if j+1<len(groups) else duration
  end=min(end,nextstart,duration)
  assert end>start,(id,j,start,end)
  text=normalize(''.join(w['word'] for w in g));parts=text.split();split=min(range(1,len(parts)),key=lambda k:max(len(' '.join(parts[:k])),len(' '.join(parts[k:])))) if len(parts)>1 else 1;lines=[text] if len(text)<=42 else [' '.join(parts[:split]),' '.join(parts[split:])]
  assert len(lines)<=2,(id,text)
  cues.append({'start':round(start,3),'end':round(end,3),'text':'\n'.join(lines)})
 for a,b in zip(cues,cues[1:]):assert a['end']<=b['start']
 srt='\n\n'.join(f'{i+1}\n{stamp(c["start"],",")} --> {stamp(c["end"],",")}\n{c["text"]}' for i,c in enumerate(cues))+'\n'
 vtt='WEBVTT\n\n'+'\n\n'.join(f'{stamp(c["start"],".")} --> {stamp(c["end"],".")}\n{c["text"]}' for c in cues)+'\n'
 transcript=' '.join(c['text'].replace('\n',' ') for c in cues)+'\n'
 for ext,data in [('srt',srt),('vtt',vtt),('txt',transcript)]: (out/f'{id}.{ext}').write_text(data)
 (out/f'{id}.json').write_text(json.dumps(cues,indent=2)+'\n')
 reports.append({'id':id,'sourceAlignment':str(src),'cues':len(cues),'words':len(words),'duration':duration,'firstSpeech':cues[0]['start'],'lastSpeech':cues[-1]['end'],'timestampBoundsAndOrdering':'PASS','maxLines':2,'provenance':'Local faster-whisper small.en CPU int8 word timestamps; corrected cuts retimed from original audio word alignment using exact edit intervals; compared with continuous-context and independent base.en passes; technical spelling normalized. No speech synthesis.'})
(out/'validation.json').write_text(json.dumps(reports,indent=2)+'\n')
print(json.dumps(reports,indent=2))
