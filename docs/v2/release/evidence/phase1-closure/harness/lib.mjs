import { chromium } from "playwright-core";
export const CHROME = "/Users/jincenmathew/Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing";
export async function launch(opts = {}) {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const context = await browser.newContext({ viewport: opts.viewport || { width: 1440, height: 900 }, colorScheme: opts.colorScheme || "light", reducedMotion: opts.reducedMotion || "no-preference" });
  // The product defaults to light; dark is the person's explicit choice (next-themes, localStorage "theme").
  if (opts.colorScheme === "dark") await context.addInitScript(() => { try { localStorage.setItem("theme", "dark"); } catch {} });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(`pageerror ${page.url()} ${e.message}`));
  page.on("console", (m) => { if (m.type() === "error") errors.push(`console ${page.url()} ${m.text()}`); });
  page.on("response", (r) => { if (r.status() >= 400) errors.push(`http ${r.status()} ${r.url()}`); });
  return { browser, context, page, errors };
}
export async function controls(page) {
  return page.evaluate(() => {
    const vis = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== "hidden"; };
    const name = (el) => (el.getAttribute("aria-label") || el.innerText || el.value || "").trim().replace(/\s+/g, " ").slice(0, 90);
    return {
      h: [...document.querySelectorAll("h1,h2")].filter(vis).map((e) => `${e.tagName}:${name(e)}`),
      buttons: [...document.querySelectorAll("button")].filter(vis).map((e) => `${name(e)}${e.disabled ? " [disabled]" : ""}`),
      links: [...document.querySelectorAll("main a")].filter(vis).map((e) => `${name(e)} -> ${e.getAttribute("href")}`).slice(0, 40),
      inputs: [...document.querySelectorAll("main input, main select, main textarea")].filter(vis).map((e) => `${e.type}:${e.name || e.id}:${e.getAttribute("aria-label") || e.labels?.[0]?.innerText || ""}`),
    };
  });
}
