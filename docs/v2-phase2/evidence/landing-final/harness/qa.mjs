// Usage: node qa.mjs <base> <outdir>
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "playwright-core";
import AxeBuilder from "@axe-core/playwright";
const CHROME = "/Users/jincenmathew/Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing";
const [base, out] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const report = { axe: [], layout: [], sticky: {}, journey: {}, video: {}, appearance: {}, links: [], errors: [] };
async function ctx(opts) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: "light", reducedMotion: "no-preference", ...opts });
  const page = await context.newPage();
  page.on("pageerror", e => report.errors.push(`pageerror ${e.message}`));
  page.on("console", m => { if (m.type() === "error") report.errors.push(`console ${m.text()}`); });
  return { context, page };
}

// 1. axe + overflow at desktop, mobile and 200% zoom (half-size CSS viewport), each stored theme.
for (const [name, viewport] of [["desktop", { width: 1440, height: 900 }], ["mobile", { width: 390, height: 844 }], ["zoom200", { width: 720, height: 450 }]]) {
  for (const theme of ["dark", "light", "system"]) {
    const { context, page } = await ctx({ viewport, reducedMotion: "reduce" });
    await context.addInitScript(v => { try { localStorage.setItem("theme", v); } catch {} }, theme);
    await page.goto(base + "/", { waitUntil: "networkidle" });
    await page.waitForTimeout(300);
    const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
    report.axe.push({ name, theme, violations: axe.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.slice(0, 4).map(n => n.target.join(" ")) })) });
    report.layout.push(await page.evaluate(([name, theme]) => ({ name, theme, hscroll: document.documentElement.scrollWidth > innerWidth + 1, htmlClass: document.documentElement.className, h1: document.querySelectorAll("h1").length, headerHeight: document.querySelector(".site-header-bar")?.getBoundingClientRect().height }), [name, theme]));
    if (name === "zoom200" && theme === "dark") await page.screenshot({ path: `${out}/zoom200-dark-full.png`, fullPage: true });
    await context.close();
  }
}

// 2. First visit default + persistence.
{
  const { context, page } = await ctx({ colorScheme: "light" });
  await page.goto(base + "/", { waitUntil: "networkidle" });
  report.appearance.firstVisitClass = await page.evaluate(() => document.documentElement.className);
  await page.click("button[aria-label='Change appearance']");
  await page.waitForTimeout(200);
  await page.screenshot({ path: `${out}/appearance-dropdown.png`, clip: { x: 840, y: 0, width: 600, height: 380 } });
  report.appearance.checked = await page.evaluate(() => document.querySelector(".appearance-panel input:checked")?.value);
  report.appearance.focused = await page.evaluate(() => document.activeElement?.value);
  await page.keyboard.press("ArrowDown"); // radio group: moves to Light and selects it
  await page.waitForTimeout(100);
  report.appearance.afterArrow = await page.evaluate(() => ({ cls: document.documentElement.className, stored: localStorage.getItem("theme") }));
  await page.keyboard.press("Escape");
  report.appearance.focusAfterEscape = await page.evaluate(() => document.activeElement?.getAttribute("aria-label"));
  await page.reload({ waitUntil: "networkidle" });
  report.appearance.afterReload = await page.evaluate(() => document.documentElement.className);
  // System follows the OS.
  await page.evaluate(() => localStorage.setItem("theme", "system"));
  await page.emulateMedia({ colorScheme: "dark" }); await page.reload({ waitUntil: "networkidle" });
  report.appearance.systemDark = await page.evaluate(() => document.documentElement.className);
  await page.emulateMedia({ colorScheme: "light" }); await page.waitForTimeout(200);
  report.appearance.systemLightLive = await page.evaluate(() => document.documentElement.className);
  await context.close();
}

// 3. Sticky CTA.
{
  const { context, page } = await ctx();
  await page.goto(base + "/", { waitUntil: "networkidle" });
  const visibleHeaderCta = () => page.evaluate(() => [...document.querySelectorAll(".site-header a.header-cta")].filter(a => a.getClientRects().length).length);
  report.sticky.atTop = await visibleHeaderCta();
  await page.mouse.wheel(0, 700); await page.waitForTimeout(500);
  report.sticky.scrolled = await visibleHeaderCta();
  report.sticky.headerTop = await page.evaluate(() => document.querySelector(".site-header-bar").getBoundingClientRect().top);
  await page.screenshot({ path: `${out}/sticky-header-scrolled.png`, clip: { x: 0, y: 0, width: 1440, height: 260 } });
  await page.mouse.wheel(0, -700); await page.waitForTimeout(500);
  report.sticky.backToTop = await visibleHeaderCta();
  await context.close();
  const m = await ctx({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await m.page.goto(base + "/", { waitUntil: "networkidle" });
  await m.page.evaluate(() => scrollTo(0, 900)); await m.page.waitForTimeout(500);
  report.sticky.mobileScrolled = await m.page.evaluate(() => [...document.querySelectorAll(".site-header a.header-cta")].filter(a => a.getClientRects().length).length);
  report.sticky.mobileHscroll = await m.page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
  await m.page.screenshot({ path: `${out}/mobile-sticky-header.png`, clip: { x: 0, y: 0, width: 390, height: 140 } });
  await m.context.close();
}

// 4. Journey frames (motion allowed), and reduced motion static.
{
  const { context, page } = await ctx({ viewport: { width: 1440, height: 900 } });
  await page.goto(base + "/", { waitUntil: "domcontentloaded" });
  const box = await page.evaluate(() => { const r = document.querySelector(".lp-journey").getBoundingClientRect(); return { y: r.top + scrollY, h: r.height }; });
  const frames = [];
  for (const t of [100, 900, 1700, 2500, 3600, 5000]) {
    await page.waitForTimeout(t - (frames.at(-1)?.t ?? 0));
    const state = await page.evaluate(() => ({ state: document.querySelector(".lp-phases").dataset.state, colors: [...document.querySelectorAll(".lp-phase-icon")].map(e => getComputedStyle(e).color), fills: [...document.querySelectorAll(".lp-connector-fill")].map(e => getComputedStyle(e).transform) }));
    frames.push({ t, ...state });
    await page.screenshot({ path: `${out}/journey-${t}ms.png`, clip: { x: 0, y: box.y, width: 1440, height: box.h } });
  }
  report.journey.frames = frames;
  await context.close();
  const r = await ctx({ reducedMotion: "reduce" });
  await r.page.goto(base + "/", { waitUntil: "networkidle" }); await r.page.waitForTimeout(400);
  report.journey.reduced = await r.page.evaluate(() => ({ state: document.querySelector(".lp-phases").dataset.state, colors: [...document.querySelectorAll(".lp-phase-icon")].map(e => getComputedStyle(e).color), fills: [...document.querySelectorAll(".lp-connector-fill")].map(e => getComputedStyle(e).transform), animations: [...document.querySelectorAll(".lp-phases *")].filter(e => getComputedStyle(e).animationName !== "none").length }));
  await r.context.close();
}

// 5. Video dialog via keyboard.
{
  const { context, page } = await ctx();
  await page.goto(base + "/", { waitUntil: "networkidle" });
  await page.focus(".lp-play"); await page.keyboard.press("Enter"); await page.waitForTimeout(800);
  report.video.open = await page.evaluate(() => { const d = document.querySelector("dialog.lp-video-dialog"); const v = d.querySelector("video"); return { open: d.open, modal: d.matches(":modal"), paused: v.paused, muted: v.muted, duration: v.duration, focus: document.activeElement?.getAttribute("aria-label") || document.activeElement?.tagName }; });
  await page.screenshot({ path: `${out}/video-dialog.png` });
  await page.keyboard.press("Escape"); await page.waitForTimeout(200);
  report.video.afterEscape = await page.evaluate(() => { const d = document.querySelector("dialog.lp-video-dialog"); return { open: d.open, paused: d.querySelector("video").paused, focus: document.activeElement?.className }; });
  await context.close();
}

// 6. Link destinations from the landing page and header.
{
  const { context, page } = await ctx();
  await page.goto(base + "/", { waitUntil: "networkidle" });
  const hrefs = await page.evaluate(() => [...new Set([...document.querySelectorAll("header a, main a, footer a")].map(a => `${a.textContent.trim()}|${a.getAttribute("href")}`))]);
  for (const entry of hrefs) {
    const [text, href] = entry.split("|");
    const res = await page.request.get(base + href.split("#")[0]);
    report.links.push({ text, href, status: res.status() });
  }
  await context.close();
}
writeFileSync(`${out}/qa-report.json`, JSON.stringify(report, null, 2));
await browser.close();
console.log(JSON.stringify({ axe: report.axe.map(a => `${a.name}/${a.theme}:${a.violations.map(v => v.id).join(",") || "0"}`), layout: report.layout, sticky: report.sticky, appearance: report.appearance, video: report.video, links: report.links, reduced: report.journey.reduced, frames: report.journey.frames.map(f => `${f.t}:${f.state}:${f.colors.join("/")}`), errors: report.errors.slice(0, 8) }, null, 1));
