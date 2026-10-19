// Usage: node shots.mjs <base> <outdir> <label>
// Captures the landing page at desktop and mobile in each appearance choice, full page and first viewport.
import { mkdirSync } from "node:fs";
import { chromium } from "playwright-core";
const CHROME = "/Users/jincenmathew/Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing";
const [base, out, label] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const cases = [
  { name: "desktop", viewport: { width: 1440, height: 900 } },
  { name: "mobile", viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
];
const themes = (process.env.THEMES || "default,light,dark,system-light,system-dark").split(",");
for (const c of cases) for (const theme of themes) {
  const colorScheme = theme === "system-dark" ? "dark" : "light";
  const context = await browser.newContext({ viewport: c.viewport, isMobile: c.isMobile, hasTouch: c.hasTouch, deviceScaleFactor: c.deviceScaleFactor ?? 1, colorScheme, reducedMotion: "reduce" });
  const stored = { light: "light", dark: "dark", "system-light": "system", "system-dark": "system" }[theme];
  if (stored) await context.addInitScript(v => { try { localStorage.setItem("theme", v); } catch {} }, stored);
  const page = await context.newPage();
  await page.goto(base + "/", { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${out}/${label}-${c.name}-${theme}-fold.png` });
  await page.screenshot({ path: `${out}/${label}-${c.name}-${theme}-full.png`, fullPage: true });
  await context.close();
}
await browser.close();
