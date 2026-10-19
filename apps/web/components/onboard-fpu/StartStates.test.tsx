import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { OnboardFpuExperience } from "./OnboardFpuExperience";
import type { Fpu, SessionEvidence, Snapshot, Task } from "./types";

// Deliberately not the Harbor Light sample, so nothing on screen can come from a hard-coded value.
const json = (body: unknown, status = 200) => Promise.resolve(new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } }));
const task = (id: string, label: string, status: Task["status"] = "COMPLETED", approval = false): Task => ({ id, label, status, explanation: `${label} explained`, next_action: `${label} next`, evidence: [], approval_required: approval, choices: ["A"], decision: approval && status === "COMPLETED" ? { actor: "owner-9", role: "OWNER", at: "t", action: "approve", selection: "A" } : null });
const fpu: Fpu = {
  id: "inv-1", status: "VERIFIED", checkpoint: "VERIFIED", attempts: 1, retry_limit: 3, contract_hash: "hash-1", idempotency_key: "key-1", posted_by: "owner-9", posted_at: "2026-03-04T05:06:07Z", verified_at: "2026-03-04T05:06:08Z",
  contract: { currency: "EUR", tax_code: "VAT-X", tax_rate: "0.072", payment_terms: "NET_15", receivable_account: "acct-recv", income_account: "acct-income", tax_account: "acct-vat", totals: { subtotal: "50.00", tax: "3.60", total: "53.60" } },
  inputs: { customer_id: "cust-7", product_id: "prod-3", quantity: 2, unit_price: "25.00" },
  decisions: [{ action: "approve", actor: "owner-9", at: "t1" }],
  checks: [{ id: "totals", passed: true, explanation: "ok", evidence: [] }, { id: "accounting_impact", passed: true, explanation: "ok", evidence: [] }],
  invoice: { number: "INV-1234", customer_id: "cust-7", product_id: "prod-3", quantity: 2, unit_price: "25.00", currency: "EUR", payment_terms: "NET_15", tax_code: "VAT-X", subtotal: "50.00", tax: "3.60", total: "53.60" },
  journal: { entries: [{ account_id: "acct-recv", debit: "53.60", credit: "0.00" }, { account_id: "acct-income", debit: "0.00", credit: "50.00" }, { account_id: "acct-vat", debit: "0.00", credit: "3.60" }] },
};
const verified: Snapshot = {
  session_id: "s-start", company_name: "Juniper Ledger Co", workflow_status: "VERIFIED_FIRST_PRODUCTIVE_USE", effective_status: "VERIFIED_FIRST_PRODUCTIVE_USE", ready: true, verified_fpu: true,
  tasks: [task("a", "Opening balances", "COMPLETED", true), task("b", "First report readiness")],
  onboarding: { faults: [], fpu }, customers: [{ id: "cust-7", display_name: "Willow Clinic", email: "ap@willow.example" }], products: [{ id: "prod-3", name: "Quarterly review" }], activity: [],
};
const evidence: SessionEvidence = {
  mappings: [{ state: "APPROVED", decided_by: "owner-9" }, { state: "MODIFIED", decided_by: "owner-9" }, { state: "APPROVED", decided_by: "someone-else" }],
  execution: { resolutions: [{ state: "APPLIED", decided_by: "owner-9" }] },
  configuration: { proposals: [{ state: "APPLIED", decided_by: "owner-9", decision: "approve" }, { state: "APPLIED", decided_by: null, decision: null }] },
  validation_reports: [{ currency: "EUR", status: "VERIFIED", checks: [
    { id: "count:customers", label: "Customers", status: "VERIFIED", difference: "0" },
    { id: "trial-balance", label: "Trial balance — per account", status: "VERIFIED", difference: "0.00" },
    { id: "ar", label: "A/R", status: "VERIFIED", difference: "0.00" },
  ] }],
  reasoning_records: [], review_records: [],
};
function serve(onboarding: Snapshot, session: SessionEvidence | null = evidence) {
  return vi.spyOn(globalThis, "fetch").mockImplementation(input => {
    const path = new URL(String(input), "http://x").pathname;
    if (path.endsWith("/onboarding")) return json(onboarding);
    if (path.endsWith("/migration-sessions/s-start")) return session ? json(session) : json({ detail: "x" }, 503);
    return json({ detail: "unexpected" }, 404);
  });
}

beforeAll(() => { HTMLDialogElement.prototype.showModal = function () { this.open = true; }; HTMLDialogElement.prototype.close = function () { this.open = false; }; });
beforeEach(() => { sessionStorage.clear(); window.history.replaceState(null, "", "/onboard-fpu?session=s-start"); });
afterEach(() => vi.restoreAllMocks());

describe("Start: verified first invoice", () => {
  it("leads with the API's posted invoice and joins its own strings for the totals line", async () => {
    serve(verified); render(<OnboardFpuExperience />);
    expect(await screen.findByRole("heading", { level: 1, name: "Juniper Ledger Co is ready to use" })).toBeVisible();
    expect(screen.getByText("Ready to use · Verified")).toBeInTheDocument();
    expect(screen.getByText("First invoice, Willow Clinic")).toBeInTheDocument();
    expect(screen.getByText("EUR 53.60", { selector: ".v2-money-value" })).toBeInTheDocument();
    expect(screen.getByText(/Posted and verified: 53\.60 = 50\.00 \+ 3\.60 tax/)).toBeInTheDocument();
    // Difference: the trial-balance check's own field, formatted with the report currency.
    await waitFor(() => expect(screen.getByText("Difference between old and new books").nextElementSibling).toHaveTextContent(/^EUR 0\.00$/));
    expect(screen.getByRole("heading", { name: "Verify: 3 of 3 checks matched" })).toBeInTheDocument();
    expect(screen.getByText(/The old and new books agree to the cent\./)).toBeInTheDocument();
  });

  it("shows the invoice document, journal and every count from API lists", async () => {
    serve(verified); render(<OnboardFpuExperience />);
    const invoice = await screen.findByRole("region", { name: "INV-1234" });
    expect(invoice).toHaveTextContent("Bill toWillow Clinicap@willow.example");
    expect(invoice).toHaveTextContent("FromJuniper Ledger Co");
    expect(invoice).toHaveTextContent("TermsNet 15");
    const rows = within(invoice).getAllByRole("row").map(row => row.textContent);
    expect(rows).toEqual(expect.arrayContaining(["Quarterly review225.0050.00", "Subtotal50.00", "Tax VAT-X at rate 0.0723.60", "TotalEUR 53.60", "acct-recv53.600.00"]));
    expect(screen.getByText("Journal entry: balanced, the rules checked debits equal credits")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("heading", { name: "Decisions by owner-9" })).toBeInTheDocument());
    const decisions = screen.getByRole("region", { name: "Decisions by owner-9" });
    await waitFor(() => expect(decisions).toHaveTextContent("Mappings approved or changed2"));
    expect(decisions).toHaveTextContent("Settings approved or changed1");
    expect(decisions).toHaveTextContent("Batch fix approved1");
    expect(decisions).toHaveTextContent("Essentials confirmed1");
    expect(decisions).toHaveTextContent("First invoice approved1");
    expect(decisions).toHaveTextContent("No AI advice was used. The Advisor and Reviewer are planned and not switched on in the Beta.");
    expect(within(decisions).getByText("Planned")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Start: ready for daily use" })).toHaveTextContent("Readiness checks2 of 2");
  });

  it("has one primary action, a real evidence route, and no download that does not exist", async () => {
    serve(verified); render(<OnboardFpuExperience />);
    const evidenceLink = await screen.findByRole("link", { name: "Review verified evidence" });
    expect(evidenceLink).toHaveAttribute("href", "/trust?view=evidence&session=s-start");
    expect(screen.getByRole("link", { name: "Back to my migrations" })).toHaveAttribute("href", "/workspace?session=s-start");
    expect(screen.queryByText(/Download evidence pack/)).not.toBeInTheDocument();
    const primary = Array.from(document.querySelectorAll<HTMLElement>(".button")).filter(el => !["secondary", "ghost", "danger", "icon-button"].some(c => el.classList.contains(c)));
    expect(primary).toEqual([evidenceLink]);
  });

  it("every amount it renders is an API string (contract test)", async () => {
    serve(verified); render(<OnboardFpuExperience />);
    await waitFor(() => expect(screen.getByText("Difference between old and new books").nextElementSibling).toHaveTextContent("EUR 0.00"));
    const api = JSON.stringify({ verified, evidence });
    // Every text node on the page, so adjacent table cells are never joined into one number.
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const amounts: string[] = [];
    for (let node = walker.nextNode(); node; node = walker.nextNode()) amounts.push(...(node.textContent?.match(/\d+\.\d{2}(?![\d.])/g) ?? []));
    expect(amounts.length).toBeGreaterThan(5);
    for (const amount of amounts) expect(api).toContain(`"${amount}"`);
  });

  it("says Not available, never zero, when the migration evidence cannot be read", async () => {
    serve(verified, null); render(<OnboardFpuExperience />);
    await screen.findByRole("heading", { level: 1, name: "Juniper Ledger Co is ready to use" });
    await waitFor(() => expect(screen.getByText("Difference between old and new books").nextElementSibling).toHaveTextContent(/^Not available$/));
    expect(screen.queryByText(/agree to the cent/)).not.toBeInTheDocument();
    expect(document.body).not.toHaveTextContent("EUR 0.00");
    expect(screen.getByRole("region", { name: "Decisions by owner-9" })).toHaveTextContent("Mappings approved or changedNot available");
  });
});

describe("Start: blocked states keep a way forward", () => {
  const draft: Fpu = { ...fpu, status: "AWAITING_APPROVAL", checkpoint: "DRAFT", attempts: 0, decisions: [], invoice: null, journal: null, checks: [], posted_by: undefined };
  const base: Snapshot = { ...verified, workflow_status: "FIRST_PRODUCTIVE_USE_IN_PROGRESS", effective_status: "FIRST_PRODUCTIVE_USE_IN_PROGRESS", verified_fpu: false };

  it("reports a failed read", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(() => json({ detail: "x" }, 500));
    render(<OnboardFpuExperience />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Can't reach MoveBooks");
  });

  it("stops at the evidence gate and points back to Verify", async () => {
    serve({ ...base, gate_error: "Configured evidence changed.", onboarding: { faults: [], fpu: draft } });
    render(<OnboardFpuExperience />);
    const recovery = await screen.findByRole("region", { name: "How to recover" });
    expect(recovery).toHaveTextContent("MoveBooks stopped before your first invoice");
    expect(recovery).toHaveTextContent("Configured evidence changed.");
    expect(within(recovery).getByRole("link", { name: "Open Verify" })).toHaveAttribute("href", "/validate-configure?session=s-start");
    expect(screen.getByRole("button", { name: "Review invoice approval" })).toBeDisabled();
  });

  it("keeps the prepared invoice when posting is blocked by a fault", async () => {
    serve({ ...base, onboarding: { faults: ["posting_failure"], fpu: { ...draft, decisions: [{ action: "approve", actor: "owner-9" }], attempts: 1 } } });
    render(<OnboardFpuExperience />);
    const recovery = await screen.findByRole("region", { name: "How to recover" });
    expect(recovery).toHaveTextContent("Your first invoice is blocked");
    expect(recovery).toHaveTextContent("the prepared invoice and its posting key");
    expect(within(recovery).getByRole("button", { name: "Review synthetic remediation" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Retry approved invoice" })).toHaveClass("secondary");
  });

  it("explains a blocked essential", async () => {
    serve({ ...base, ready: false, onboarding: { faults: [] }, tasks: [task("role", "Invoice access", "BLOCKED", true)] });
    render(<OnboardFpuExperience />);
    const recovery = await screen.findByRole("region", { name: "How to recover" });
    expect(recovery).toHaveTextContent("Onboarding is blocked");
    expect(recovery).toHaveTextContent("Invoice access: Invoice access explained");
    expect(screen.getByRole("heading", { level: 1, name: "Finish the essentials" })).toBeVisible();
  });

  it("shows an approval of these exact terms as recorded, never offers a second approval, and keeps withdrawal", async () => {
    serve({ ...base, onboarding: { faults: [], fpu: { ...draft, status: "APPROVED", decisions: [{ action: "approve", actor: "owner-9", at: "2026-03-04T05:00:00Z", evidence_hash: "hash-1" }] } } });
    render(<OnboardFpuExperience />);
    const recorded = await screen.findByText(/Invoice terms approved by owner-9/);
    expect(recorded).toHaveTextContent("2026-03-04T05:00:00Z");
    expect(screen.queryByRole("button", { name: "Review invoice approval" })).toBeNull();
    expect(screen.getByRole("button", { name: "Reject invoice" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Post and verify invoice" })).toBeEnabled();
  });

  it("does not offer a second approval for an essential already approved, but keeps change and reject", async () => {
    const approvedEssential: Task = { ...task("a", "Opening balances", "COMPLETED", true), decision: { actor: "owner-9", role: "OWNER", at: "t1", action: "approve", selection: "Use migrated balances" } };
    serve({ ...base, ready: false, onboarding: { faults: [] }, tasks: [approvedEssential, task("role", "Invoice access", "REVIEW_REQUIRED", true)] });
    render(<OnboardFpuExperience />);
    await screen.findByRole("heading", { level: 1 });
    fireEvent.change(screen.getByLabelText(/Onboarding checklist/), { target: { value: "a" } });
    expect(screen.queryByRole("button", { name: "Approve opening balances" })).toBeNull();
    expect(screen.getByRole("button", { name: "Modify opening balances" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Reject opening balances" })).toBeEnabled();
  });

  it("treats an approval of different terms as stale and asks for a fresh approval", async () => {
    serve({ ...base, onboarding: { faults: [], fpu: { ...draft, decisions: [{ action: "approve", actor: "owner-9", at: "t0", evidence_hash: "older-hash" }] } } });
    render(<OnboardFpuExperience />);
    expect(await screen.findByRole("button", { name: "Review invoice approval" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Post and verify invoice" })).toBeDisabled();
    expect(screen.queryByText(/Invoice terms approved by/)).toBeNull();
  });

  it("shows a prepared draft as a document with the customer's migrated name and one primary action", async () => {
    serve({ ...base, onboarding: { faults: [], fpu: draft } });
    render(<OnboardFpuExperience />);
    const review = await screen.findByRole("button", { name: "Review invoice approval" });
    expect(screen.getByRole("heading", { level: 1, name: "Approve your first invoice" })).toBeVisible();
    const invoice = screen.getByRole("region", { name: "Draft, not posted" });
    expect(invoice).toHaveTextContent("Bill toWillow Clinic");
    expect(invoice).toHaveTextContent("Draft · needs your approval");
    const primary = Array.from(document.querySelectorAll<HTMLElement>(".button")).filter(el => !["secondary", "ghost", "danger", "icon-button"].some(c => el.classList.contains(c)));
    expect(primary).toEqual([review]);
    expect(screen.getByRole("button", { name: "Post and verify invoice" })).toBeDisabled();
  });
});
