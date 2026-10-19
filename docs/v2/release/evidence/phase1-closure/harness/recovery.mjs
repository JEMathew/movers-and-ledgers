import AxeBuilder from "@axe-core/playwright";
import { launch } from "./lib.mjs";
const W = "http://localhost:3101", API = "http://127.0.0.1:8100", H = { Authorization: "Bearer demo-user" };
const which = process.argv[2]; const out = {};
const { browser, page, errors } = await launch();
const sid = () => new URL(page.url()).searchParams.get("session");
const api = async (p) => (await fetch(`${API}/v1/migration-sessions/${sid()}${p}`, { headers: H })).json();
const settle = async () => { await page.waitForLoadState("networkidle"); await page.waitForTimeout(700); };
const axe = async () => (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze()).violations.map((v) => v.id);
await page.goto(`${W}/sign-in`, { waitUntil: "networkidle" });
await page.getByRole("link", { name: /Enter demo workspace/ }).click(); await settle();
await page.getByRole("link", { name: /Start a sample migration/ }).click(); await settle();
if (which === "blocked") await page.locator("main select").first().selectOption({ label: /Northstar/.test("") ? "" : (await page.locator("main select option").allTextContents()).find((t) => /Northstar/.test(t)) });
await page.getByRole("button", { name: /Check if my books are ready/ }).click(); await settle(); await page.waitForTimeout(800);
if (which === "blocked") { out.assessLinks = await page.locator("main a:visible, main button:visible").allInnerTexts(); out.assessText = (await page.locator("main").innerText()).slice(0, 1500); await page.screenshot({ path: "evidence/blocked-understand-1440.png", fullPage: true }); }
const planLink = page.getByRole("link", { name: /Create my migration plan|Prepare|Continue/ }).first();
await planLink.click(); await settle();
await page.getByRole("button", { name: /^(Create my migration plan|Prepare your migration plan)$/ }).click(); await settle();
await page.getByRole("button", { name: /^Review mappings$/ }).click(); await settle();
if (which === "rejected") {
  await page.getByRole("button", { name: /Needs review/ }).first().click(); await settle();
  const label = (await page.locator("main h3, main h2").allInnerTexts()).join(" | ");
  await page.getByRole("button", { name: /^Reject$/ }).first().click(); await settle();
  out.afterReject = { planButtons: await page.getByRole("button", { name: /migration plan/i }).allInnerTexts() };
  // Approve every other mapping so only the rejection is outstanding.
  for (let i = 0; i < 20; i++) {
    const row = page.getByRole("button", { name: /Needs review/ }); if (!(await row.count())) break;
    await row.first().click(); await settle();
    const ap = page.getByRole("button", { name: /^Approve as / }); if (await ap.count()) { await ap.first().click(); await settle(); } else break;
  }
  const st = await api(""); out.statusWithRejection = st.workflow_status;
  out.planApprovalOfferedWhileRejected = await page.getByRole("button", { name: /^(Approve migration plan|Review migration plan)$/ }).count();
  await page.getByRole("button", { name: /Rejected/ }).first().click().catch(() => {}); await settle();
  await page.getByLabel("Reason for reconsideration").fill("Target confirmed with the bookkeeper after review"); await page.getByRole("button", { name: "Request reconsideration" }).click(); await settle();
  await page.screenshot({ path: "evidence/rejected-reconsideration-pending-1440.png", fullPage: true });
  await page.getByRole("button", { name: "Approve reconsideration" }).click(); await settle();
  await page.screenshot({ path: "evidence/rejected-reconsideration-approved-1440.png", fullPage: true });
  const session = await api("");
  const map = session.human_decisions;
  out.reconsiderations = (session.plan?.mappings || session.mappings || []).flatMap((m) => (m.reconsiderations || []).map((r) => ({ mapping: m.source_label, state: m.state, review: r.state })));
  out.statusAfter = session.workflow_status;
  const byEntity = {}; for (const d of map) (byEntity[d.affected_entity] ||= []).push(`${d.stage}:${d.decision}`);
  out.entityWithTwoDecisions = Object.entries(byEntity).filter(([, v]) => v.length > 1);
  out.planApprovalOfferedAfter = await page.getByRole("button", { name: /^(Approve migration plan|Review migration plan)$/ }).count();
  out.axe = await axe();
}
if (which === "blocked") {
  out.company = (await api("")).company_name;
  const rows = await page.getByRole("button", { name: /Blocked|Needs review/ }).allInnerTexts();
  out.rows = rows.map((r) => r.replace(/\s+/g, " "));
  const blockedRow = page.getByRole("button", { name: /Blocked/ }).first();
  if (await blockedRow.count()) { await blockedRow.click(); await settle(); }
  out.blockedControls = { approve: await page.getByRole("button", { name: /^Approve as / }).count(), reject: await page.getByRole("button", { name: /^Reject$/ }).count() };
  out.batchButtons = await page.getByRole("button", { name: /low-risk/i }).evaluateAll((els) => els.map((e) => `${e.innerText.trim()}${e.disabled ? " [disabled]" : ""}`));
  out.text = (await page.locator("main").innerText()).match(/[^\n]*(readiness|blocked|fix)[^\n]*/gi)?.slice(0, 6);
  await page.screenshot({ path: "evidence/blocked-recovery-1440.png", fullPage: true });
  out.axe = await axe();
}
out.errors = errors.filter((e) => !e.includes("favicon") && !e.includes("/sign-in Failed to load"));
console.log(JSON.stringify(out, null, 1));
await browser.close();
