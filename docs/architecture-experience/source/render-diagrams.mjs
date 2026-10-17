import fs from 'node:fs/promises';
import path from 'node:path';
import { instance } from '@viz-js/viz';
import sharp from 'sharp';
const root = path.resolve('docs/architecture-experience');
const data = JSON.parse(await fs.readFile(path.join(root,'source/diagrams.json'),'utf8'));
const viz = await instance();
const esc=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const wrap=(s,n=44)=>{let a=[],line='';for(const w of s.split(' ')){if((line+' '+w).length>n){a.push(line);line=w;}else line+=(line?' ':'')+w;}if(line)a.push(line);return a};
for(const d of data){
 let svg;
 if(d.kind==='swimlane'){
  const labelW=275,cw=285,rh=145,top=145,w=labelW+cw*d.columns.length+40,h=top+rh*d.lanes.length+75;
  let v=`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="100%" height="100%" fill="#fff"/><text x="30" y="44" font-family="Arial" font-size="30" font-weight="700" fill="#12233f">${esc(d.title)}</text>`;
  d.columns.forEach((c,i)=>v+=`<rect x="${labelW+i*cw}" y="80" width="${cw}" height="65" fill="#2563eb"/><text x="${labelW+i*cw+cw/2}" y="121" text-anchor="middle" fill="white" font-family="Arial" font-size="24" font-weight="700">${esc(c)}</text>`);
  d.lanes.forEach(([label,cells],r)=>{
   const y=top+r*rh;
   v+=`<rect x="25" y="${y}" width="${labelW-25}" height="${rh}" fill="#edf4ff" stroke="#ccd8e8"/>`;
   wrap(label,18).forEach((t,j)=>v+=`<text x="43" y="${y+50+j*28}" font-family="Arial" font-size="23" font-weight="700" fill="#12233f">${esc(t)}</text>`);
   cells.forEach((cell,c)=>{v+=`<rect x="${labelW+c*cw}" y="${y}" width="${cw}" height="${rh}" fill="${r%2?'#f8fbff':'#fff'}" stroke="#ccd8e8"/>`;wrap(cell,25).forEach((t,j)=>v+=`<text x="${labelW+c*cw+20}" y="${y+43+j*28}" font-family="Arial" font-size="22" fill="#263e5c">${esc(t)}</text>`);});
  });
  v+=`<text x="30" y="${h-25}" font-family="Arial" font-size="19" fill="#50657f">Bounded synthetic Beta. Read columns left to right. Cloud and candidate activation require independent evidence.</text></svg>`;
  svg=v;
 }else if(d.kind==='sequenceDiagram'){
  const margin=90,gap=260,w=margin*2+gap*(d.parties.length-1),h=170+d.steps.length*95;
  let s=`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="#2563eb"/></marker></defs><rect width="100%" height="100%" fill="#fff"/><text x="32" y="35" fill="#10233f" font-family="Arial" font-size="25" font-weight="700">${esc(d.title)}</text>`;
  d.parties.forEach((p,i)=>{const x=margin+i*gap;s+=`<rect x="${x-75}" y="65" width="150" height="45" rx="5" fill="#edf4ff" stroke="#2563eb"/><text x="${x}" y="94" text-anchor="middle" font-family="Arial" font-size="18" fill="#10233f">${esc(p)}</text><line x1="${x}" y1="110" x2="${x}" y2="${h-30}" stroke="#bac9db" stroke-dasharray="5 5"/>`;});
  d.steps.forEach(([a,b,label],i)=>{let x1=margin+d.parties.indexOf(a)*gap,x2=margin+d.parties.indexOf(b)*gap,y=170+i*95;let center=(x1+x2)/2;if(x1===x2){x2=x1+100;center=x1+115;s+=`<path d="M${x1},${y} h100 v25 h-100" fill="none" stroke="#2563eb" stroke-width="2" marker-end="url(#arrow)"/>`;}else{s+=`<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="#2563eb" stroke-width="2" marker-end="url(#arrow)"/>`;}
   const lines=wrap(`${i+1}. ${label}`,Math.max(30,Math.floor(Math.abs(x2-x1)/10)));
   lines.forEach((t,j)=>s+=`<text x="${center}" y="${y-12-(lines.length-j-1)*20}" text-anchor="middle" font-family="Arial" font-size="16" fill="#263e5c">${esc(t)}</text>`);
  }); svg=s+'</svg>';
 }else{
  const quote=s=>JSON.stringify(s);
  const dot=`digraph G {graph [rankdir=LR, bgcolor="white", pad=0.5, nodesep=0.5, ranksep=0.9, label=${quote(d.title)}, labelloc=t, fontname="Arial", fontsize=24]; node [shape=box, style="rounded,filled", fillcolor="#edf4ff", color="#2563eb", fontname="Arial", fontsize=17, margin="0.2,0.15"]; edge [color="#2563eb", fontname="Arial", fontsize=13, fontcolor="#334e70"]; ${d.nodes.map(([id,label])=>`${id} [label=${quote(wrap(label,32).join('\n'))}];`).join('\n')} ${d.edges.map(([a,b,l])=>`${a}->${b} [label=${quote(wrap(l,28).join('\n'))}];`).join('\n')}}`;
  svg=viz.renderString(dot,{format:'svg',engine:'dot'});
 }
 await fs.writeFile(path.join(root,'svg',d.name+'.svg'),svg);
 await sharp(Buffer.from(svg),{density:150}).resize({width:2400,withoutEnlargement:true}).png().toFile(path.join(root,'png',d.name+'.png'));
}
console.log('Rendered '+data.length+' editable SVG + PNG pairs.');
