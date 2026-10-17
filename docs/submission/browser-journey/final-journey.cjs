// Portable: PLAYWRIGHT_TEST points at a playwright/test install; CHROMIUM at a Chromium binary.
const { chromium, expect } = require(process.env.PLAYWRIGHT_TEST || 'playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const base=process.env.MB_WEB_BASE||'http://localhost:3000';
const root=path.resolve(__dirname, '../../..');
const record=process.argv.includes('--record');
const outArg=process.argv.find(a=>a.startsWith('--out='));
const output=outArg?path.resolve(outArg.slice(6)):path.join(__dirname,record?'recording':'dryrun'); fs.mkdirSync(output,{recursive:true});
const result={started_at:new Date().toISOString(),mode:record?'final-recording':'ui-dryrun',candidate:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),scope:'Real UI only; local synthetic demo identity; no direct financial API manipulation.',events:[],checks:[],screenshots:[],api_results:[],errors:[]};
const executablePath=process.env.CHROMIUM||undefined;
let page,browser,context,t0,session,intro_s=0;
const elapsed=()=>Math.round((Date.now()-t0)/100)/10;
const log=(event,extra={})=>{const item={at_seconds:elapsed(),event,...extra};result.events.push(item);console.log(JSON.stringify(item));};
const check=(name,extra={})=>{result.checks.push({name,passed:true,...extra});log(`PASS ${name}`,extra);};
async function pause(ms){if(record)await page.waitForTimeout(ms);}
async function click(name,scope=page){const control=scope.getByRole('button',{name,exact:true});await control.evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'}));await control.click();log(`Click ${name}`);await pause(250);await renderCaption().catch(()=>{});}
async function link(name){await page.getByRole('link',{name,exact:true}).click();log(`Open ${name}`);await page.waitForLoadState('networkidle');await clean();await renderCaption();}
async function goto(route){await page.goto(base+route,{waitUntil:'networkidle'});await clean();await renderCaption();log(`Open ${route.split('?')[0]}`);}
async function clean(){await page.addStyleTag({content:'nextjs-portal{display:none!important;}'});}
async function snap(name){await clean();const filename=`${name}.png`;await page.screenshot({path:path.join(output,filename),fullPage:!record,animations:'disabled'});result.screenshots.push(filename);}
async function state(name){log(name,{url:page.url(),headings:await page.getByRole('heading').allTextContents(),buttons:await page.getByRole('button').allTextContents()});}
let lastCaption=null;
async function renderCaption(){if(record&&lastCaption)await page.evaluate(text=>{let el=document.getElementById('demo-narration');if(!el){el=document.createElement('div');el.id='demo-narration';el.setAttribute('popover','manual');el.style.cssText='position:fixed;inset:auto 0 0 0;margin:0;width:100%;max-width:none;border:0;border-top:2px solid #78a7e1;z-index:2147483000;padding:14px 30px;background:rgba(9,26,38,.96);color:#fff;font:500 18px/1.5 Arial,sans-serif;text-align:center;pointer-events:none;';document.body.appendChild(el);document.body.style.paddingBottom='100px';/* top layer: re-raise above any modal dialog that opens later */new MutationObserver(()=>{if(document.querySelector('dialog[open]')&&el.matches(':popover-open')){el.hidePopover();el.showPopover();}}).observe(document.body,{subtree:true,attributes:true,attributeFilter:['open']});}el.textContent=text;if(!el.matches(':popover-open'))el.showPopover();},lastCaption);}
async function section(until,caption){log('Narration',{caption});lastCaption=caption;await renderCaption();result.events[result.events.length-1].planned_until=until;}
const pace=Number(process.env.MB_PACE||1); // scales the canonical journey's absolute hold points when recording
async function holdFor(seconds){if(record)await page.waitForTimeout(seconds*1000);}
const offset=Number(process.env.MB_HOLD_OFFSET||0); // seconds the skipped entry segment used to occupy
async function hold(until){until=Math.max(0,until-offset)*pace+intro_s;if(record){const remaining=until*1000-(Date.now()-t0);if(remaining>0)await page.waitForTimeout(remaining);}}
async function canonical(){
 await goto('/sign-in?next='+encodeURIComponent('/assess?sample=harbor-light-migrate-demo'));
 await link('Enter Demo Workspace →');
 await expect(page.getByRole('heading',{name:'Understand Your Books',exact:true})).toBeVisible();
 await expect(page.getByRole('combobox',{name:'Sample business',exact:true})).toHaveValue('harbor-light-migrate-demo');
 check('explicit_demo_sign_in_then_harbor_selection');
 await click('Check If My Books Are Ready to Migrate');
 await expect(page.getByRole('link',{name:'Create My Migration Plan',exact:true})).toBeVisible();
 session=new URL(page.url()).searchParams.get('session');result.session_id=session;
 await snap('understand-readiness');check('discovery_and_assessment_complete',{session_id:session});
 await section(87,'Explore Demo follows one synthetic business through Understand, Prepare, Move, Verify and Start. Discovery and readiness precede a versioned plan.');
 await hold(78);
 await link('Create My Migration Plan');await click('Create My Migration Plan');
 await expect(page.getByRole('heading',{name:'Migration Scope',exact:true})).toBeVisible();
 await snap('prepare-plan');await hold(87);
 await click('Review Mappings');
 const queue=page.locator('label').filter({hasText:'Mapping queue ·'}).locator('select');
 await expect(queue).toBeVisible();
 const options=await queue.locator('option').evaluateAll(els=>els.map(el=>({value:el.value,label:el.textContent})));
 result.mapping_count=options.length;
 const ambiguous=options.find(option=>/Misc Clearing/.test(option.label));expect(ambiguous).toBeTruthy();
 await queue.selectOption(ambiguous.value);await expect(page.getByRole('heading',{name:'1200 · Misc Clearing',exact:true})).toBeVisible();
 await section(110,'Account 1200, Misc Clearing, needs judgment. Request an independent second opinion and bounded advice; the displayed public Beta mode is deterministic fallback, not live Gemini.');
 await click('Request independent review');
 await expect(page.getByText('Independent deterministic review · not live AI',{exact:true})).toBeVisible();
 await page.getByText('Get a second opinion',{exact:true}).evaluate(el=>el.scrollIntoView({block:'start',behavior:'instant'}));await snap('prepare-independent-review');
 check('independent_second_opinion_1200_runtime_mode_visible');await hold(99);
 await page.getByText('Optional agent guidance · advisory only',{exact:true}).click();
 await click('Explain mapping');
 await expect(page.getByText(/Deterministic fallback — not live AI/)).toBeVisible();
 await page.getByText(/Deterministic fallback — not live AI/).evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'}));await snap('prepare-advice-fallback');check('user_requested_mapping_advice_fallback_labeled');await hold(110);
 await section(130,'The accountant reviews all mappings and separately approves the migration plan. Advice and second opinions cannot authorize financial writes.');
 for(const option of options){
   await queue.selectOption(option.value);
   const heading=page.getByRole('heading',{level:4}).first();await heading.scrollIntoViewIfNeeded();
   await pause(600);await click('Confirm Mapping');
   await expect(queue.locator(`option[value="${option.value}"]`)).toHaveText(/Reviewed/);
 }
 check('all_mappings_explicitly_reviewed',{count:options.length});
 await click('Review Migration Plan');
 await click('Approve Migration Plan');
 const approvalDialog=page.getByRole('dialog');await expect(approvalDialog).toBeVisible();
 await snap('prepare-plan-consent');await pause(1200);await click('Approve Migration Plan',approvalDialog);
 await expect(page.getByRole('link',{name:'Continue to Move',exact:true})).toBeVisible();
 check('separate_plan_approval_recorded');await hold(130);
 await link('Continue to Move');
 await section(151,'Deterministic tools move the approved synthetic manifest. A controlled duplicate stops the batch; completed checkpoints stay intact until a person reviews the remedy.');
 await click('Start Migration');
 await expect(page.getByRole('button',{name:'Review 1 Migration Issue',exact:true})).toBeVisible();
 await snap('move-paused-duplicate');
 if(await page.getByRole('dialog').isVisible().catch(()=>false))await click('Close dialog',page.getByRole('dialog'));
 await click('Review 1 Migration Issue');
 await expect(page.getByRole('dialog')).toBeVisible();await snap('move-resolution-review');await pause(1500);
 await click('Approve resolution',page.getByRole('dialog'));
 const retryButton=page.getByRole('button',{name:'Retry failed batch',exact:true});
 await expect(retryButton).toBeVisible();await click('Retry failed batch');
 await expect(page.getByText('Synthetic migration complete',{exact:true})).toBeVisible();
 await snap('move-complete');check('duplicate_resolution_authorized_checkpoint_retry_and_completion');await hold(151);
 await link('Verify My Books');
 await section(174,'Moving records is not proof. Deterministic reconciliation checks counts, relationships, balances and documents before reviewed configuration can be applied.');
 await click('Verify My Books');
 await expect(page.getByRole('button',{name:'Continue to configuration',exact:true})).toBeEnabled();
 await snap('verify-reconciliation');check('deterministic_financial_validation_verified');await hold(158);
 await click('Continue to configuration');
 const settingsQueue=page.locator('label').filter({hasText:'Settings queue ·'}).locator('select');
 await expect(settingsQueue).toBeVisible();
 const settings=await settingsQueue.locator('option').evaluateAll(els=>els.map(el=>({value:el.value,label:el.textContent})));
 result.configuration_count=settings.length;
 for(const setting of settings){
   await settingsQueue.selectOption(setting.value);
   const button=page.getByRole('button',{name:/^Approve /}).filter({hasText:/^Approve /}).first();
   if(await button.isVisible().catch(()=>false)&&await button.isEnabled()){
     await button.scrollIntoViewIfNeeded();await button.click();
     const dialog=page.getByRole('dialog');await expect(dialog).toBeVisible();
     if(/tax|role|currency/i.test(setting.label))await snap(`configure-${setting.label.split(' ·')[0].toLowerCase().replace(/[^a-z0-9]+/g,'-')}-review`);
     await pause(900);await click('Confirm approve',dialog);await expect(page.getByRole('dialog')).not.toBeVisible();
   }
 }
 await expect(page.getByRole('button',{name:'Apply reviewed configuration',exact:true})).toBeEnabled();
 await click('Apply reviewed configuration');
 await expect(page.getByRole('link',{name:'Complete Setup',exact:true})).toBeVisible();
 await snap('configure-complete');check('all_configuration_areas_reviewed_and_sensitive_approvals_recorded',{count:settings.length});await hold(174);
 await link('Complete Setup');
 await section(203,'Onboarding checks the governed prerequisites. The owner reviews invoice terms, approves posting, then runs the first synthetic task and verifies its accounting effect.');
 const startOnboard=page.getByRole('button',{name:'Start onboarding from configured evidence',exact:true});
 await expect(startOnboard).toBeVisible();await click('Start onboarding from configured evidence');
 await expect(page.getByRole('heading',{name:'Finish the Essentials',exact:true})).toBeVisible();
 const taskQueue=page.locator('label').filter({hasText:'Onboarding checklist ·'}).locator('select');
 const tasks=await taskQueue.locator('option').evaluateAll(els=>els.map(el=>({value:el.value,label:el.textContent})));
 result.onboarding_count=tasks.length;
 for(const task of tasks){
   if(/COMPLETED/.test(task.label))continue;
   if(await page.getByRole('button',{name:'Prepare invoice contract',exact:true}).isEnabled().catch(()=>false))break;
   await taskQueue.selectOption(task.value);
   const button=page.getByRole('button',{name:/^Approve /}).first();
   if(await button.isVisible().catch(()=>false)&&await button.isEnabled()){
     await button.scrollIntoViewIfNeeded();await button.click();await pause(500);await click('Confirm approve',page.getByRole('dialog'));await expect(page.getByRole('dialog')).not.toBeVisible();
   }
 }
 await page.getByRole('combobox',{name:'Migrated customer',exact:true}).selectOption('customer-001');
 await page.getByRole('combobox',{name:'Migrated service',exact:true}).selectOption('product-001');
 await page.getByLabel('Quantity',{exact:true}).fill('1');
 await page.getByLabel('Unit price (USD)',{exact:true}).fill('100.00');
 await click('Prepare invoice contract');await snap('start-invoice-contract');
 await click('Review invoice approval');await snap('start-invoice-consent');await pause(1000);
 await click('Confirm approve',page.getByRole('dialog'));await click('Post and verify invoice');
 await expect(page.getByRole('heading',{name:'Business Ready · Verified',exact:true})).toBeVisible({timeout:20000});
 await page.getByRole('heading',{name:'Business Ready · Verified',exact:true}).evaluate(el=>el.scrollIntoView({block:'start',behavior:'instant'}));
 await snap('start-verified-fpu');check('owner_approved_invoice_posted_and_verified_first_productive_use');
 await hold(193);
 await section(203,'The first productive invoice is verified against its approved contract and exact accounting effect: USD 100.00 plus 7.25 tax, total 107.25. This is synthetic verified use, not production readiness.');
 await page.getByText('Posted invoice, journal and accounting impact',{exact:true}).click();
 await page.getByText('Posted invoice, journal and accounting impact',{exact:true}).scrollIntoViewIfNeeded();await snap('start-posted-invoice-journal');
 await hold(203);
}
async function introduction(){
 await goto('/');
 await section(0,'Moving a business from desktop accounting to the cloud is high-risk and high-touch. MoveBooks AI guides one synthetic business from readiness to its first verified invoice.');
 await snap('landing');check('landing_page_renders');await holdFor(12);intro_s=elapsed();
}
async function continuity(){
 // Returning user: My Migration, a second migration, picker, switching, reload and a fresh device (no local memory).
 const first=session;
 await goto('/workspace');
 await expect(page.getByLabel('Next task')).toContainText('Complete');
 await snap('my-migration-complete');check('my_migration_shows_completed_state',{session_id:first});await holdFor(4);
 await section(0,'Evidence & Results lists every recorded human decision. AI activity is a separate, explicit read; locally it reports that tracking is off, which is not evidence of AI use.');
 await page.getByRole('navigation',{name:'Task help'}).getByRole('link',{name:'AI activity'}).click();await page.waitForLoadState('networkidle');await clean();await renderCaption();log('Open AI activity');
 await holdFor(3);
 const before=result.api_results.filter(e=>e.path.endsWith('/operations/activity')).length;
 await click('Check AI activity');await page.waitForLoadState('networkidle');await page.waitForTimeout(800);
 const reads=result.api_results.filter(e=>e.path.endsWith('/operations/activity')).slice(before);
 expect(reads.length).toBe(1);expect(reads[0].method).toBe('GET');expect(reads[0].status).toBe(200);
 await page.getByRole('heading',{name:'AI activity',exact:true}).evaluate(el=>el.scrollIntoView({block:'start',behavior:'instant'}));
 await snap('ai-activity');check('ai_activity_explicit_read_only_check',{request:reads[0],text:(await page.locator('section,div').filter({has:page.getByRole('heading',{name:'AI activity',exact:true})}).last().innerText()).slice(0,400)});await holdFor(7);
 await goto('/workspace');
 await section(0,'Returning users land on My Migration. A second sample migration shows how the owner-scoped list, picker and switching work.');
 await goto('/assess?sample=harbor-light-migrate-demo');
 await click('Check If My Books Are Ready to Migrate');
 await expect(page.getByRole('link',{name:'Create My Migration Plan',exact:true})).toBeVisible();
 const second=new URL(page.url()).searchParams.get('session');result.second_session_id=second;expect(second).not.toBe(first);
 check('second_migration_started',{session_id:second});
 await goto('/workspace?pick=1');
 const list=page.getByRole('list',{name:'Your migrations'});
 await expect(list.getByRole('listitem')).toHaveCount(2);
 await expect(list.locator(`a[href="/workspace?session=${first}"]`)).toBeVisible();
 await expect(list.locator(`a[href="/workspace?session=${second}"]`)).toBeVisible();
 await snap('picker-two-migrations');check('picker_lists_both_owner_migrations');await holdFor(5);
 await list.locator(`a[href="/workspace?session=${first}"]`).click();await page.waitForLoadState('networkidle');await clean();await renderCaption();log('Switch to first migration');
 await expect(page.getByLabel('Next task')).toContainText('Complete');
 await expect(page.getByText(`Migration ${first.slice(0,8)}`)).toBeVisible();
 check('switch_to_completed_migration');
 await page.reload({waitUntil:'networkidle'});await clean();await renderCaption();
 await expect(page.getByText(`Migration ${first.slice(0,8)}`)).toBeVisible();
 check('selection_restored_after_reload');await holdFor(3);
 await page.evaluate(()=>{localStorage.clear();sessionStorage.clear();});log('Clear browser-local memory');
 await goto('/workspace');
 await expect(page.getByRole('list',{name:'Your migrations'}).getByRole('listitem')).toHaveCount(2);
 check('cleared_local_memory_shows_owner_picker_not_a_guess');await holdFor(5);
 await section(0,'On a new device nothing is remembered locally, so the server-side owner list is the source of truth: both migrations are offered, never a guess.');
 const fresh=await browser.newContext({viewport:{width:1440,height:1000}});const other=await fresh.newPage();other.setDefaultTimeout(15000);
 await other.goto(base+'/sign-in?next='+encodeURIComponent('/workspace'),{waitUntil:'networkidle'});
 await other.getByRole('link',{name:'Enter Demo Workspace →',exact:true}).click();await other.waitForLoadState('networkidle');
 const freshList=other.getByRole('list',{name:'Your migrations'});
 await expect(freshList.getByRole('listitem')).toHaveCount(2);
 await other.addStyleTag({content:'nextjs-portal{display:none!important;}'});
 await other.screenshot({path:path.join(output,'fresh-device-picker.png'),fullPage:true,animations:'disabled'});result.screenshots.push('fresh-device-picker.png');
 await fresh.close();
 check('fresh_device_lists_owner_migrations_without_local_memory');
}
(async()=>{
 try{
  browser=await chromium.launch({headless:true,executablePath});result.browser_version=browser.version();
  context=await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true,...(record?{recordVideo:{dir:output,size:{width:1440,height:1000}}}:{})});
  // Hide the Next.js development badge on every document, including client-side navigations.
  await context.addInitScript(()=>{const add=()=>{if(document.getElementById('mb-hide-dev'))return;const st=document.createElement('style');st.id='mb-hide-dev';st.textContent='nextjs-portal{display:none!important}';(document.head||document.documentElement).appendChild(st);};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',add);else add();});
  page=await context.newPage();page.setDefaultTimeout(15000);t0=Date.now();
  page.on('pageerror',error=>result.errors.push({at_seconds:elapsed(),message:error.message}));
  page.on('response',async response=>{const url=new URL(response.url());if(!url.pathname.startsWith('/api/')&&!url.pathname.startsWith('/v1/'))return;const entry={at_seconds:elapsed(),method:response.request().method(),path:url.pathname.replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/g,':id'),status:response.status()};result.api_results.push(entry);});
  if(process.argv.includes('--entry'))await require('./entry-experiences.cjs')({page,goto,click,section,hold,snap,check,root,output,log,pause});
  await introduction();
  await canonical();
  await continuity();
  if(!record&&process.argv.includes('--operations')){
   await link('Review Verified Evidence');
   await expect(page.getByRole('heading',{name:'Advisory Operations',exact:true})).toBeVisible();
   const before=result.api_results.filter(event=>event.path.endsWith('/operations/activity'));
   expect(before).toHaveLength(0);
   await expect(page.getByText('No operational read requested. Refresh explicitly to read a snapshot.',{exact:true})).toBeVisible();
   check('trust_advisory_operations_does_not_read_automatically');
   await click('Refresh Advisory Operations');
   await expect(page.getByText('Operational Activity Is Disabled',{exact:true})).toBeVisible();
   const operational=result.api_results.filter(event=>event.path.endsWith('/operations/activity'));
   expect(operational).toHaveLength(1);expect(operational[0].method).toBe('GET');expect(operational[0].status).toBe(200);
   await snap('trust-explicit-disabled-advisory-operations');
   check('explicit_operations_read_returns_disabled_without_financial_claim',{request:operational[0]});
  }
  await page.goto('file://'+path.join(__dirname,'architecture-evidence.html'),{waitUntil:'load'});
  await section(0,'Source-grounded architecture assigns financial authority to Cloud SQL and bounded operational controls to Firestore. This recording exercised local deterministic fallbacks. The diagram is architecture evidence, not a live cloud console or a production claim.');
  await snap('architecture-source-status');await holdFor(12);
  check('architecture_segment_explicitly_labels_source_and_runtime_boundaries');
  expect(result.errors).toEqual([]);check('no_browser_runtime_errors');
  result.status='PASSED';result.finished_seconds=elapsed();
  const narration=result.events.filter(event=>event.event==='Narration');
  const stamp=value=>{const ms=Math.round(value*1000);return `${String(Math.floor(ms/3600000)).padStart(2,'0')}:${String(Math.floor(ms/60000)%60).padStart(2,'0')}:${String(Math.floor(ms/1000)%60).padStart(2,'0')},${String(ms%1000).padStart(3,'0')}`;};
  const srt=narration.map((event,index)=>`${index+1}\n${stamp(event.at_seconds)} --> ${stamp(narration[index+1]?.at_seconds??result.finished_seconds)}\n${event.caption}\n`).join('\n');
  fs.writeFileSync(path.join(output,'working-product-demo.srt'),srt);
  
 }catch(error){result.status='FAILED';result.error=error.stack;console.error(error);if(page){await state('Failure state').catch(()=>{});await snap('FAILURE').catch(()=>{});}process.exitCode=1;}
 finally{if(page&&record){result.raw_video=await page.video().path();}if(context)await context.close();if(browser)await browser.close();fs.writeFileSync(path.join(output,'browser-evidence.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({status:result.status,checks:result.checks.length,error:result.error},null,2));}
})();
