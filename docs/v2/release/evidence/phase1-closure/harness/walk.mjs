// Adaptive end-to-end walker for the V2 journey. Usage: node walk.mjs <width> <outdir>
import { mkdirSync, writeFileSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { launch } from "./lib.mjs";
const W = "http://localhost:3101", API = "http://127.0.0.1:8100";
const width = Number(process.argv[2] || 1440), out = process.argv[3] || `out-${width}`;
mkdirSync(out, { recursive: true });
const { browser, page, errors } = await launch({ viewport: { width, height: width < 600 ? 844 : 900 } });
const log = []; let shot = 0;
const state = async (sid) => sid ? (await (await fetch(`${API}/v1/migration-sessions/${sid}/fpu`, { headers: { Authorization: "Bearer demo-user" } })).json()) : null;
const sid = () => new URL(page.url()).searchParams.get("session");
async function capture(label) {
  const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  const hscroll = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  const file = `${String(++shot).padStart(2, "0")}-${label.replace(/[^a-z0-9]+/gi, "-").toLowerCase().slice(0, 50)}.png`;
  await page.screenshot({ path: `${out}/${file}`, fullPage: true });
  log.push({ shot: file, url: page.url(), axe: axe.violations.map((v) => `${v.id}(${v.nodes.length})`), hscroll });
}
const RULES = [
  // Confirmation dialogs first.
  { scope: "dialog", re: /^(Confirm|Approve this|Approve migration plan|Approve synthetic|Approve the plan|Yes)/i },
  { re: /^(Create my migration plan|Prepare your migration plan)$/i },
  { kind: "consent" },
  { re: /^Approve (\d+ )?low-risk mappings/i, last: true },
  { re: /^Approve as /i },
  { re: /Needs review/i },
  { re: /^(Review mappings|Review every mapping|Review your mappings)$/i },
  { re: /^(Review migration plan|Review your migration plan|Approve migration plan|Approve the plan)$/i },
  { re: /^Continue to Move/i, link: true },
  { re: /^(Start migration|Start moving your records)$/i },
  { re: /^(Approve resolution)$/i },
  { re: /^(Review proposed resolution|Review the proposed fix|Review 1 migration issue)$/i },
  { re: /^(Retry the paused batch|Retry failed batch)$/i },
  { re: /^(Go to Verify|Continue to Verify|Verify (my|your|the) (books|migration)|Run verification|Check (my|the) (new )?books)/i, link: true, both: true },
  { re: /^Continue to configuration/i },
  { re: /^Approve (?!as |reconsideration|\d|low-risk|the first|your first|migration plan|the plan)/i },
  { re: /^Approve$/ },
  { re: /^Review next setting$/i },
  { re: /^(Apply reviewed configuration|Apply the reviewed settings)$/i },
  { re: /^(Go to Start|Continue to Start|Start using your books|Complete setup)/i, link: true, both: true },
  { re: /^Start onboarding/i },
  { re: /^(Approve invoice access|Approve opening balances)$/i },
  { re: /^Review next prerequisite$/i },
  { re: /^(Prepare invoice contract|Prepare your first invoice)$/i },
  { re: /^(Review and approve the invoice|Review invoice approval|Review and approve)$/i },
  { re: /^(Approve the first invoice|Approve your first invoice)$/i },
  { re: /^(Post and verify (the |your )?(first )?invoice)$/i },
];
async function act() {
  for (const r of RULES) {
    if (r.kind === "consent") {
      const boxes = page.locator("main input[type=checkbox]:visible:not(:checked):not(:disabled)");
      if (await boxes.count()) { await boxes.first().check(); return "tick consent"; }
      continue;
    }
    const root = r.scope === "dialog" ? page.locator("[role=dialog]:visible, dialog[open]") : page.locator("main");
    if (r.scope === "dialog" && !(await root.count())) continue;
    const roles = r.both ? ["button", "link"] : r.link ? ["link", "button"] : ["button"];
    for (const role of roles) {
      const c = root.getByRole(role, { name: r.re });
      const n = await c.count();
      for (let j = 0; j < n; j++) {
        const el = c.nth(r.last ? n - 1 - j : j);
        if (await el.isVisible() && await el.isEnabled().catch(() => true)) {
          const label = (await el.innerText()).trim().replace(/\s+/g, " ");
          await el.click(); return `${role}: ${label}`;
        }
      }
    }
  }
  return null;
}
await page.goto(`${W}/sign-in`, { waitUntil: "networkidle" });
await page.getByRole("link", { name: /Enter demo workspace/ }).click();
await page.waitForLoadState("networkidle");
await capture("my-migration-new");
await page.getByRole("link", { name: /Start a sample migration/ }).click(); await page.waitForLoadState("networkidle");
await capture("understand");
await page.getByRole("button", { name: /Check if my books are ready/ }).click(); await page.waitForLoadState("networkidle"); await page.waitForTimeout(1200);
await capture("understand-result");
await page.getByRole("link", { name: /Create my migration plan/ }).first().click(); await page.waitForLoadState("networkidle");
let lastStatus = "", idle = 0;
for (let i = 0; i < 120; i++) {
  const s = await state(sid()).catch(() => null);
  const status = s?.workflow_status || "?";
  if (status !== lastStatus) { await capture(`status-${status}`); lastStatus = status; }
  if (status === "VERIFIED_FIRST_PRODUCTIVE_USE") break;
  const did = await act();
  log.push({ i, status, did, url: page.url().replace(W, "") });
  if (!did) {
    idle++;
    if (idle > 3) { await capture(`stuck-${status}`); log.push({ stuck: status, buttons: await page.locator("main button:visible").allInnerTexts(), links: await page.locator("main a:visible").allInnerTexts() }); break; }
    await page.waitForTimeout(1500); continue;
  }
  idle = 0;
  await page.waitForLoadState("networkidle"); await page.waitForTimeout(700);
}
const final = await state(sid());
await page.waitForTimeout(1000); await capture("final");
const summary = { width, session: sid(), workflow_status: final?.workflow_status, verified_fpu: final?.verified_fpu,
  invoice_total: final?.onboarding?.fpu?.invoice?.total, fpu_decisions: final?.onboarding?.fpu?.decisions?.length,
  checks: final?.onboarding?.fpu?.checks?.filter((c) => c.passed).length + "/" + final?.onboarding?.fpu?.checks?.length, errors };
log.push({ summary });
writeFileSync(`${out}/journey.json`, JSON.stringify(log, null, 1));
console.log(JSON.stringify(log.filter((l) => l.did || l.stuck || l.summary || (l.axe && (l.axe.length || l.hscroll))), null, 0).slice(0, 9000));
await browser.close();
