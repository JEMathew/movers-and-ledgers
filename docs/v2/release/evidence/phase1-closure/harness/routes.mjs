// Route sweep on a running build. Usage: node routes.mjs <base> <outdir>
import { mkdirSync, writeFileSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { launch } from "./lib.mjs";
const base = process.argv[2], out = process.argv[3]; mkdirSync(out, { recursive: true });
const ROUTES = ["/", "/sign-in", "/trust", "/trust?view=evidence", "/learn", "/guide", "/simulator", "/support", "/feedback", "/design-system", "/play", "/plan-map-approve", "/migrate-resolve", "/validate-configure", "/onboard-fpu", "/product"];
const results = [];
for (const scheme of ["light", "dark"]) for (const width of [1440, 390]) {
  const { browser, page, errors } = await launch({ viewport: { width, height: width < 600 ? 844 : 900 }, colorScheme: scheme, reducedMotion: "reduce" });
  for (const route of ROUTES) {
    errors.length = 0;
    const res = await page.goto(base + route, { waitUntil: "networkidle" });
    await page.waitForTimeout(400);
    const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
    const facts = await page.evaluate(() => {
      const hs = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].filter((h) => h.getClientRects().length).map((h) => +h.tagName[1]);
      let skip = false; for (let i = 1; i < hs.length; i++) if (hs[i] > hs[i - 1] + 1) skip = true;
      const slow = [...document.querySelectorAll("*")].some((el) => { const s = getComputedStyle(el); const d = (v) => Math.max(...v.split(",").map((x) => parseFloat(x) * (x.includes("ms") ? 1 : 1000))); return d(s.animationDuration) > 50 && s.animationName !== "none" || d(s.transitionDuration) > 50; });
      return { h1: document.querySelectorAll("h1").length, skip, main: document.querySelectorAll("main").length, header: !!document.querySelector("header"), footer: !!document.querySelector("footer"), lang: document.documentElement.lang,
        hscroll: document.documentElement.scrollWidth > innerWidth + 1, playNav: !!document.querySelector('header a[href="/play"], nav a[href="/play"], footer a[href="/play"]'),
        attribution: [...document.querySelectorAll(".v2-attribution")].map((e) => e.textContent), slowMotion: slow,
        dark: document.documentElement.classList.contains("dark") || document.documentElement.dataset.theme === "dark" || getComputedStyle(document.body).backgroundColor };
    });
    // Keyboard: tab through up to 40 stops, record any stop without a visible focus indicator or that is hidden.
    await page.evaluate(() => document.activeElement?.blur()); await page.mouse.click(1, 1).catch(() => {});
    const focus = [];
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press("Tab");
      const f = await page.evaluate(() => { const el = document.activeElement; if (!el || el === document.body) return null; const s = getComputedStyle(el); const r = el.getBoundingClientRect();
        const has = (e) => { const t = getComputedStyle(e); return (t.outlineStyle !== "none" && parseFloat(t.outlineWidth) > 0) || (t.boxShadow && t.boxShadow !== "none"); };
        const frame = el.parentElement && getComputedStyle(el.parentElement); const ring = has(el) || (el.tagName === "VIDEO" && el.parentElement && el.parentElement.matches(":focus-within") && has(el.parentElement));
        return { tag: el.tagName, name: (el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 40), ring, hidden: r.width === 0 || r.height === 0 || s.visibility === "hidden" }; });
      if (!f) break; if (!f.ring || f.hidden) focus.push(f);
    }
    const shot = `${scheme}-${width}-${route.replace(/[^a-z0-9]+/gi, "_") || "home"}.png`;
    if (["/", "/trust", "/guide", "/sign-in", "/onboard-fpu", "/play"].includes(route)) await page.screenshot({ path: `${out}/${shot}`, fullPage: false });
    results.push({ scheme, width, route, status: res?.status(), axe: axe.violations.map((v) => `${v.id}(${v.nodes.length})`), ...facts, focusProblems: focus, errors: [...errors] });
  }
  await browser.close();
}
writeFileSync(`${out}/routes.json`, JSON.stringify(results, null, 1));
const bad = results.filter((r) => r.axe.length || r.hscroll || r.h1 !== 1 || r.skip || r.main !== 1 || r.playNav || r.focusProblems.length || r.errors.length || r.slowMotion || (r.status && r.status >= 400));
console.log(`${results.length} checks; ${bad.length} with findings`);
for (const b of bad) console.log(JSON.stringify({ s: b.scheme, w: b.width, r: b.route, st: b.status, axe: b.axe, h1: b.h1, skip: b.skip, main: b.main, hs: b.hscroll, play: b.playNav, motion: b.slowMotion, focus: b.focusProblems.slice(0, 3), err: b.errors.map((e) => e.slice(0, 120)).slice(0, 2) }));
console.log("attribution on /:", results.find((r) => r.route === "/").attribution);
