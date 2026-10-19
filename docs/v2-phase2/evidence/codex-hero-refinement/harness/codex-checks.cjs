const {createRequire}=require('node:module');
const {mkdirSync,writeFileSync}=require('node:fs');
const {join}=require('node:path');
const qa=createRequire(join(process.argv[2],'package.json'));
const {chromium}=qa('playwright-core');
const AxeBuilder=qa('@axe-core/playwright').default;
const out=process.argv[3]; mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:'/Users/jincenmathew/Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',headless:true});
 const report={cases:[],sticky:[],routes:[],errors:[]};
 for(const [width,height] of [[1440,900],[390,844],[720,450],[1024,768],[1180,900]]) for(const theme of ['dark','light']){
  const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});
  await context.addInitScript(v=>localStorage.setItem('theme',v),theme);
  const page=await context.newPage(); page.on('pageerror',e=>report.errors.push(e.message));
  await page.goto('http://localhost:3000',{waitUntil:'networkidle'});
  await page.evaluate(()=>document.fonts.ready);
  const metrics=await page.evaluate(()=>{
   const el=s=>document.querySelector(s), css=s=>getComputedStyle(el(s)), rect=s=>el(s).getBoundingClientRect().toJSON();
   const img=el('.lp-hero-picture img');
   return {hscroll:document.documentElement.scrollWidth>innerWidth,header:css('.site-header-bar').backgroundColor,hero:css('.lp-hero').backgroundColor,lower:css('.lp-journey').backgroundColor,lowerInk:css('.lp-phase-name').color,imageLoaded:img.complete&&img.naturalWidth===1536,image:rect('.lp-hero-picture'),play:rect('.lp-play'),heroRect:rect('.lp-hero'),font:css('h1').fontFamily,playCount:document.querySelectorAll('.lp-play').length,reducedAnimations:[...document.querySelectorAll('.lp-phases *')].filter(e=>getComputedStyle(e).animationName!=='none').length};
  });
  const audit=async()=> (await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']).analyze()).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}));
  const entry={width,height,theme,metrics,axe:await audit()};
  if(width<1024){await page.getByRole('button',{name:'Open navigation'}).click(); entry.menuAxe=await audit(); await page.getByRole('button',{name:'Change appearance'}).click(); entry.appearanceAxe=await audit(); if(width===390)await page.screenshot({path:join(out,`menu-mobile-${theme}.png`)}); entry.appearanceFits=await page.evaluate(()=>{const a=document.querySelector('.appearance-panel').getBoundingClientRect();const n=document.querySelector('.navigation-panel').getBoundingClientRect();return a.bottom<=n.bottom&&a.right<=n.right;}); await page.keyboard.press('Escape'); await page.keyboard.press('Escape');}
  else if(width===1440){await page.getByRole('button',{name:'Change appearance'}).click(); entry.appearanceAxe=await audit(); await page.screenshot({path:join(out,`appearance-desktop-${theme}.png`)});await page.keyboard.press('Escape');}
  if(width===390||width===1440){
   await page.locator('.lp-play').click(); await page.waitForFunction(()=>{const v=document.querySelector('video');return !v.paused&&v.currentTime>0;});
   entry.video=await page.evaluate(()=>({open:document.querySelector('.lp-video-dialog').open,playing:!document.querySelector('video').paused,time:document.querySelector('video').currentTime}));
   await page.keyboard.press('Escape'); await page.waitForFunction(()=>!document.querySelector('.lp-video-dialog').open&&document.querySelector('video').paused); entry.closed=await page.evaluate(()=>({closed:!document.querySelector('.lp-video-dialog').open,paused:document.querySelector('video').paused,focus:document.activeElement.className}));
  }
  report.cases.push(entry); await context.close();
 }
 for(const height of [900,720]){
  const context=await browser.newContext({viewport:{width:1440,height},reducedMotion:'reduce'});const page=await context.newPage();await page.goto('http://localhost:3000',{waitUntil:'networkidle'});
  const state=()=>page.evaluate(()=>({scroll:scrollY,maxScroll:document.documentElement.scrollHeight-innerHeight,cta:document.querySelector('[data-hero-cta]').getBoundingClientRect().toJSON(),visible:[...document.querySelectorAll('.site-header .header-cta')].filter(e=>e.getClientRects().length).length}));
  const atTop=await state();await page.evaluate(()=>scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'}));await page.waitForTimeout(150);const bottom=await state();await page.screenshot({path:join(out,`sticky-desktop-${height}.png`)});await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await page.waitForTimeout(150);report.sticky.push({height,atTop,bottom,return:await state()});await context.close();
 }
 // Confirm landing-only surface overrides do not follow client navigation to product/public routes.
 const context=await browser.newContext({viewport:{width:1440,height:900}});await context.addInitScript(()=>localStorage.setItem('theme','dark'));const page=await context.newPage();await page.goto('http://localhost:3000',{waitUntil:'networkidle'});
 for(const [label,path] of [['Explore Demo','/simulator'],['Try Your Data (Beta)','/try-your-data']]){await page.getByRole('link',{name:label,exact:true}).click();await page.waitForURL(url=>url.pathname===path||(path==='/try-your-data'&&url.pathname==='/sign-in')); await page.waitForTimeout(300); report.routes.push(await page.evaluate(()=>({path:location.pathname,landing:!!document.querySelector('.lp'),background:getComputedStyle(document.body).backgroundColor,primary:getComputedStyle(document.body).getPropertyValue('--primary')})));await page.goto('http://localhost:3000',{waitUntil:'networkidle'});}
 await context.close();
 writeFileSync(join(out,'codex-checks.json'),JSON.stringify(report,null,2));
 const failures=report.cases.flatMap(c=>[...(c.axe||[]),...(c.menuAxe||[]),...(c.appearanceAxe||[]),...(c.metrics.hscroll?[{id:'overflow'}]:[]),...(c.width===390&&!c.appearanceFits?[{id:'clipped-appearance'}]:[])]);
 for(const s of report.sticky)if(s.atTop.visible!==0||s.bottom.visible!==1||s.return.visible!==0)failures.push({id:'sticky',height:s.height});
 console.log(JSON.stringify({cases:report.cases.length,failures,sticky:report.sticky,routes:report.routes,errors:report.errors},null,2));await browser.close();if(failures.length||report.errors.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exit(1);});
