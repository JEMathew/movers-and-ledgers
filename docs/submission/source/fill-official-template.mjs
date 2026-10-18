import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {FileBlob,PresentationFile} from '@oai/artifact-tool';
const root=process.cwd(),build=path.join(root,'.packaging-build/official-template');
const source=path.join(root,'docs/submission/source/Submission Template | AI Builder Cup.pptx');
const skill='/Users/jincenmathew/.codex/plugins/cache/openai-primary-runtime/presentations/26.1011.51657/skills/presentations';
const output=path.join(root,'docs/submission/assets/movebooks-official-template-review.pptx');
const sourceSha=createHash('sha256').update(await fs.readFile(source)).digest('hex');
if(sourceSha!=='9d4f6fc09dd68da4b38bffe3599cb6eb22951fe5a0f66c661005c3176b9c6bb4')throw new Error('Unexpected template version');
await fs.mkdir(build,{recursive:true});
const deck=await PresentationFile.importPptx(await FileBlob.load(source));
const ink='#202124',blue='#1a73e8',muted='#4d5156',font='Google Sans Flex';
function text(slide,value,x,y,w,h,size=21.33,color=ink,bold=false){const s=slide.shapes.add({geometry:'textbox',position:{left:x,top:y,width:w,height:h},fill:'none',line:{fill:'none',width:0}});s.text=value;s.text.style={typeface:font,fontSize:size,color,bold,verticalAlignment:'top'};s.text.insets=0;return s;}
function body(slide,items,y=155,gap=80,size=21.33){items.forEach((v,i)=>text(slide,v,38,y+i*gap,884,gap-10,size));}
function title(index,value){const s=deck.slides.items[index];const q=s.shapes.items.find(x=>x.text?.toString?.().trim());if(q){q.text=value;q.position={left:27.86,top:69.69,width:904.28,height:58.99};q.text.style={typeface:'Google Sans Flex Medium',fontSize:21.33,color:'#000000'};}return s;}
async function picture(slide,file,x,y,w,h){const b=await fs.readFile(path.join(root,file));slide.images.add({blob:b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),contentType:'image/png',alt:file,fit:'contain',position:{left:x,top:y,width:w,height:h}});}
function note(slide,value){slide.speakerNotes.text=value;}
// Trim only off-canvas source rectangles and title bounds; retain branded images/layouts.
for(const slide of deck.slides.items){for(const q of slide.shapes.items){const p=q.position;if(p && (p.left<0||p.top<0||p.left+p.width>960||p.top+p.height>540)){q.position={left:Math.max(0,p.left),top:Math.max(0,p.top),width:Math.min(960-Math.max(0,p.left),p.width),height:Math.min(540-Math.max(0,p.top),p.height)};}}}
let s=deck.slides.items[0];
const cover=deck.resolve('sh/kvqx0vqd');cover.text='Team Details: MoveBooks AI\nTeam name: MoveBooks AI\nTeam lead: Jincen E Mathew\nTeam member: Kunal Nangia\nContact: Pending owner input\nProblem: BFSI: Intelligent Risk, Fraud & Financial Experiences';cover.text.style={typeface:'Google Sans Flex SemiBold',fontSize:23,color:'#000000'};
note(s,'Original official template preserved. Product/company: MoveBooks AI by Movers & Ledgers. User-confirmed team name MoveBooks AI, team lead Jincen E Mathew, team member Kunal Nangia. Contact remains pending owner input. Selected BFSI title confirmed by user in docs/submission/problem-statement.md.');
s=deck.slides.items[1];
const scope=deck.resolve('sh/ihozedgj');scope.text='Bounded synthetic Beta.\n\nPlay, Explore Demo and local test-package validation.\n\nHumans approve. Deterministic tools verify.\n\nLive Gemini and operational readback remain gated.';
scope.text.style={typeface:'Google Sans Flex Medium',fontSize:14.67,color:'#FFFFFF',verticalAlignment:'top'};
const playBytes=await fs.readFile(path.join(root,'docs/submission/assets/play-local-candidate.png'));
deck.resolve('im/e9wz29wz').replace({blob:playBytes.buffer.slice(playBytes.byteOffset,playBytes.byteOffset+playBytes.byteLength),contentType:'image/png',fit:'contain',alt:'Accepted local Play opening mission'});
note(s,'The template download-instruction panel is repurposed in place as the scope statement. Its black layout and image/text frames are preserved. Screenshot is accepted local candidate, not deployed product or live AI.');
s=title(2,'Brief about the idea');
text(s,'MoveBooks AI',38,150,884,48,30,blue,true);
text(s,'Move your books. Keep your confidence.',38,207,884,44,26);
body(s,['Help accountants understand readiness, make informed mapping decisions and verify the first productive task after a migration.','Play teaches concepts. Explore Demo rehearses Harbor Light Books. Try Your Data validates permitted test CSV/JSON packages locally.'],285,100);
text(s,'Current boundary: synthetic information, synthetic target and approved first invoice. No real provider migration.',38,485,884,34,17,muted);
note(s,'Sources: docs/PRODUCT_CONSTITUTION.md; docs/working-backwards/; docs/product-management/. Value is a product hypothesis, not measured customer impact.');
s=title(3,'Opportunities');
body(s,['Financial handover risk: an import can finish while mappings, configuration or the first working task remain unresolved.','Proposed differentiation: one governed path from learning and readiness to approved decisions, reconciliation and verified productive use.','How it works: bounded AI explains evidence and uncertainty. An independent Reviewer challenges assumptions. Humans retain financial authority.','USP hypothesis: coherent, evidence-backed migration confidence. No competitor-superiority or measured impact claim.'],150,86,20.5);
note(s,'Sources: product constitution and Working Backwards internal FAQ. Customer needs and competitive wedge remain hypotheses, not completed research or comparative results.');
s=title(4,'List of features offered by the solution');
body(s,['Play: keyboard/touch office mission with evidence, a mapping puzzle and accessible alternatives.','Explore Demo: discovery, readiness, versioned plan, account 1200 mapping, human decisions and synthetic migration.','Try Your Data: local validation, actionable errors, replacement/revalidation and explicit review. Hosted handoff remains gated.','Reasoning and review: user-requested bounded advisor, independent challenge and clearly labeled deterministic fallback.','Trust: checkpoints, idempotency, controlled recovery, exact reconciliation, sensitive approval and verified synthetic FPU.'],150,69,20);
note(s,'Sources: feature contracts; accepted browser traces in browser-play and browser-journey. Explicit fallback labels do not establish live model execution.');
s=title(5,'Process flow diagram or Use-case diagram');
text(s,'Choose Play, Explore Demo or local test-package validation',38,145,884,35,22);
const phase=[['Understand','Discover / Assess'],['Prepare','Plan / Map / Approve'],['Move','Migrate / Resolve'],['Verify','Validate / Configure'],['Start','Onboard / FPU']];const nodes=[];
phase.forEach(([a,b],i)=>{const x=38+i*180;nodes.push(s.shapes.add({geometry:'rect',position:{left:x,top:225,width:160,height:105},fill:'#e8f0fe',line:{fill:blue,width:1}}));text(s,a,x+10,242,140,32,23,ink,true);text(s,b,x+10,282,140,35,16,muted);});
for(let i=0;i<4;i++)s.shapes.connect(nodes[i],nodes[i+1],{kind:'straight',fromSide:'right',toSide:'left',line:{fill:blue,width:2},tail:{type:'arrow'}});
text(s,'Consequential choices require the authorized human. Financial discrepancies block progress. Policy alone permits bounded transient retries.',38,370,884,70,22);
text(s,'Completion: required controls pass, then an approved synthetic invoice receives deterministic verification.',38,470,884,48,19,muted);
note(s,'Editable native process diagram. Source: canonical lifecycle in docs/PRODUCT_CONSTITUTION.md and apps/web/components/journey/journey.ts.');
s=title(6,'Wireframes/Mock diagrams of the proposed solution (optional)');
await picture(s,'docs/submission/assets/plan-local-candidate.png',38,145,590,335);
text(s,'Implemented decision UI',660,160,260,55,23,blue,true);
text(s,'Inspect account 1200.\n\nRequest independent review.\n\nSee uncertainty and evidence.\n\nApprove, reject or modify.',660,225,260,245,21.33);
text(s,'Authentic local candidate screenshot, not a simulated mockup or deployed-candidate claim.',38,495,884,28,17,muted);
note(s,'Source: docs/submission/browser-journey/dryrun/prepare-independent-review.png and the preserved crop in assets/plan-local-candidate.png. API1a24a2c full local UI acceptance17/17.');
s=title(7,'Architecture diagram of the proposed solution');
const defs=[['Accountant / UI',38,165],['Authenticated API',360,165],['Python workflow',682,165],['Human decisions',38,330],['Gemini / Reviewer',360,330],['Financial tools / SQL',682,330]];const arch=[];
for(const [label,x,y] of defs){arch.push(s.shapes.add({geometry:'rect',position:{left:x,top:y,width:240,height:75},fill:'#e8f0fe',line:{fill:blue,width:1}}));text(s,label==='Financial tools / SQL'?'Financial tools\nCloud SQL':label,x+12,label==='Financial tools / SQL'?y+12:y+24,216,label==='Financial tools / SQL'?60:42,label==='Financial tools / SQL'?21:22,ink,true);}
for(const [a,b,fromSide,toSide] of [[0,1,'right','left'],[1,2,'right','left'],[3,0,'top','bottom'],[1,4,'bottom','top'],[2,5,'bottom','top']])s.shapes.connect(arch[a],arch[b],{kind:'straight',fromSide,toSide,line:{fill:blue,width:2},tail:{type:'arrow'}});
text(s,'Advice returns to the accountant. Only authorized deterministic operations change financial state. Cloud SQL remains financial authority.',38,455,884,65,20);
note(s,'Editable native diagram. Sources: agents/orchestrator; agents/reviewer; services/api/src/movebooks_api/reasoning.py; runtime/persistence.py. Logical roles are deterministic components, not autonomous LLM delegation. Firestore operational state is separate from financial audit.');
s=title(8,'Technologies to be used in the solution');
body(s,['Application: Next.js / TypeScript UI and FastAPI / Python services, with Firebase Hosting, Cloud Run, Firebase Authentication and Cloud SQL boundaries.','AI source: bounded Vertex AI / Gemini and Google ADK advisory integration. Public API remains deterministic-only; model access/lifecycle and runtime evidence are gated.','Operational source: owner-scoped Firestore reservations and outcome readback. Dormant Singapore database, deny-client rules and index provisioned; both control flags false.','Supporting adapters: private Cloud Storage, allowlisted Secret Manager, sanitized Logging. Source presence does not prove active service use.'],150,88,20.5);
note(s,'Sources: architecture/deployment documents; cloud-inspection-2026-10-17.md; current user-approved dormant Phase A evidence. Phase A resource provisioning does not establish application activation, effective runtime IAM, live inference or live owner-isolation acceptance.');
s=title(9,'Estimated implementation cost (optional)');
body(s,['No measured implementation spend, current workload quote or commercial price is asserted.','Cost model: Cloud Run compute/time, SQL capacity/storage/backups, model input/output tokens, Firestore operations, storage/egress and logs.','Human effort includes financial review, support and recovery. Publish region, pricing date, workload assumptions and observed spend before a numerical estimate.','Controls bound exposure through owner quotas, conservative durable budget reservations and a kill switch. Resource free-tier metadata is not a guarantee of zero cost.'],155,85,20.5);
note(s,'Source: Working Backwards internal FAQ and model controls. No invented financial impact or price. Cost model intentionally remains unpriced until verified prices and workload inputs exist.');
s=title(10,'Snapshots of the prototype');
await picture(s,'docs/submission/assets/play-local-candidate.png',38,155,430,285);await picture(s,'docs/submission/assets/fpu-local-candidate.png',492,155,430,285);
text(s,'Playable office opening mission',38,455,430,40,21.33,blue,true);text(s,'Approved invoice and verified FPU',492,455,430,40,21.33,blue,true);
text(s,'Authentic local candidate captures. The synthetic invoice is USD 107.25 including tax.',38,505,884,25,17,muted);
note(s,'Source screenshots: browser-play/play-desktop-opening.png; browser-journey/dryrun/start-verified-fpu.png; accepted crops in assets/. Play14/14 checks, full journey17/17 on API1a24a2c. No real provider accounting effect claimed.');
s=title(11,'Prototype Performance report/Benchmarking');
text(s,'628 backend passed',38,155,430,52,31,blue,true);text(s,'674 frontend passed',492,155,430,52,31,blue,true);text(s,'71 skipped; source 6575004',38,215,430,40,21.33);text(s,'51 files; lint/types/build passed',492,215,430,40,21.33);
body(s,['Full backend suite: 628 passed / 71 skipped in 28.95 seconds. The 58 original optional/external checks remain unverified.','The 13 emulator skips passed separately in 3.04 seconds, plus 8 actual Firebase Web SDK denial checks. These are local, not cloud/IAM tests.','UI acceptance 17/17 belongs to 1a24a2c; video API fffd14c remains separate. Judge: 18 offline contract cases, not model-accuracy results.'],300,72,20);
note(s,'Current local backend source6575004: docs/submission/evidence/backend-phase-b-tests.txt, 628 passed /71 skipped in28.95seconds. Of71skips,13emulator tests passed separately13/13in3.04seconds;58original optional/external checks remain unverified.8actualFirebaseWebSDKdeny checks passed locally. Frontend674/51files unchanged. FullUI17/17is historical1a24a2c; video runtimefffd14c. Judge18offline contract cases are not accuracy. No cloud/IAM/inference claim.');
s=title(12,'Additional Details/Future Development (if any)');
body(s,['Now: complete the official-template package, complete the pending contact field, retain accepted synthetic journeys and finish local Phase B integration tests.','Next, release-gated: verify the operational runtime and model lifecycle/access, then obtain explicit deployment/publication authorization.','Hosted uploads require their independent parser-isolation, malware, identity/tenant, retention, abuse and negative-test gate. Local validation stays available.','Later: supported provider adapters, reviewed real-data handling, delegated roles and observed customer outcomes. No current real-provider migration is offered.'],150,88,20.5);
note(s,'Sources: product roadmap; release-authorization-plan.md. Hypothetical mature PR/FAQ never authorizes current cloud, upload or financial activation.');
s=title(13,'Provide links to your:');
text(s,'GitHub Public Repository',38,155,884,35,23,blue,true);text(s,'https://github.com/JEMathew/movers-and-ledgers',38,200,884,38,23);
text(s,'Demo Video Link',38,270,884,35,23,blue,true);text(s,'Public URL pending authorized publication. Accepted local file: working-product-demo.webm (3:51.88).',38,315,884,60,21.33);
text(s,'Final Product Link',38,405,884,35,23,blue,true);text(s,'https://movebooks-si.web.app',38,450,884,35,23);text(s,'Reachable public Beta. This does not prove the submission candidate is deployed.',38,497,884,25,17,muted);
note(s,'URLs verified public/reachable on17 October2026 by integration owner. Candidate publication and deployment remain separate. Accepted video API runtimefffd14c; full latest-source local acceptance1a24a2c recorded separately. Official template itself labels video3Minutes; user-provided portal requirement is3–4minutes, met by3:51.88.');
s=deck.slides.items[14];text(s,'Google Cloud implementation and release gates',27.86,69.69,904.28,58.99,21.33,ink,true);
await picture(s,'docs/architecture-experience/png/google-cloud-deployment.png',38,145,884,300);
text(s,'Dormant operations resources are provisioned. Both control flags remain false. Application activation, live inference and candidate deployment require separate evidence and authorization.',38,462,884,63,19,muted);
note(s,'Exact current root-rendered architecture PNG reused. Editable source: docs/architecture-experience/source/google-cloud-deployment.mmd and SVG export. Cloud SQL remains financial authority; operational readback is not financial audit or model-success proof.');
// Slide16 retains the supplied closing artwork untouched.
for(let i=0;i<deck.slides.items.length;i++){await fs.writeFile(path.join(build,`filled-${String(i+1).padStart(2,'0')}.png`),new Uint8Array(await(await deck.export({slide:deck.slides.items[i],format:'png',scale:1.5})).arrayBuffer()));}
await fs.writeFile(path.join(build,'filled-inspect.ndjson'),(await deck.inspect({kind:'slide,textbox,shape,image',maxChars:120000})).ndjson);
const candidate=path.join(build,'official-template-candidate.pptx');await(await PresentationFile.exportPptx(deck)).save(candidate);
const {finalizePresentation}=await import(pathToFileURL(path.join(skill,'container_tools/artifact_tool_utils.mjs')).href);
await finalizePresentation({workspaceDir:root,candidatePath:candidate,finalPath:output,pythonExecutable:'/Users/jincenmathew/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3',integrityValidatorPath:path.join(skill,'container_tools/inspect_presentation_package_integrity.py'),layoutValidatorPath:path.join(skill,'container_tools/inspect_presentation_layout_geometry.py'),layoutArgs:['--expected-slide-size-emu','9144000,5143500','--validate-bullet-geometry','--validate-heading-fit'],fontPolicy:{basis:'reference',families:['Google Sans Flex','Google Sans Flex Medium','Google Sans Flex SemiBold'],referencePath:source,referenceSha256:sourceSha},verifyArtifactToolImport:true,receiptPath:path.join(build,'official-finalization.json'),explicitTotalSlideCount:16});
console.log('Created',output);
