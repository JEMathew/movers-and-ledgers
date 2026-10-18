import { render, screen, within } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ValidateConfigureExperience } from "./ValidateConfigureExperience";
import type { Check, Snapshot } from "./types";

const json = (body: unknown, status = 200) => Promise.resolve(new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } }));
const check = (id: string, label: string, difference: string, status: Check["status"] = "VERIFIED"): Check => ({ id, label, source: "s", target: "t", difference, status, evidence: [], record_ids: [], explanation: "x", next_action: "y" });
const base: Snapshot = { session_id: "s-verify", company_name: "Sample Books", workflow_status: "VALIDATED", repairs: [], resolutions: [], activity: [], ready_for_onboarding: false };
const report = (checks: Check[], status: Check["status"] = "VERIFIED") => ({ id: "r", currency: "CAD", status, blocking_discrepancies: 0, policy_version: "p-9", checks });
const read = (snapshot: Snapshot) => { vi.spyOn(globalThis, "fetch").mockImplementation(() => json(snapshot)); render(<ValidateConfigureExperience />); };

beforeAll(() => { HTMLDialogElement.prototype.showModal = function () { this.open = true; }; HTMLDialogElement.prototype.close = function () { this.open = false; }; });
beforeEach(() => { sessionStorage.clear(); window.history.replaceState(null, "", "/validate-configure?session=s-verify"); });
afterEach(() => vi.restoreAllMocks());

describe("Verify stage states", () => {
  it("reports a failed read without assuming progress", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(() => json({ detail: "x" }, 500));
    render(<ValidateConfigureExperience />);
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Can't reach MoveBooks");
    expect(within(alert).getByRole("link", { name: "Try again" })).toHaveAttribute("href", "/validate-configure?session=s-verify");
  });

  it("counts checks from the report and reads the trial balance difference from its check", async () => {
    read({ ...base, report: report([check("count:customers", "Customers", "0"), check("count:vendors", "Vendors", "0"), check("trial-balance", "Trial balance — per account", "12.30"), check("ar", "A/R", "0.00")]) });
    expect(await screen.findByRole("heading", { level: 1, name: "Your books match" })).toBeVisible();
    const facts = screen.getAllByRole("term").map(term => `${term.textContent}=${term.nextElementSibling?.textContent}`);
    expect(facts).toEqual(expect.arrayContaining(["Record counts=2 of 2", "Balances and integrity=2 of 2", "Trial balance difference=CAD 12.30"]));
    expect(screen.getByRole("heading", { name: "4 of 4 checks matched" })).toBeInTheDocument();
    expect(screen.getByText(/4 of 4 checks matched\. Next, review the settings/)).toBeVisible();
    expect(screen.getByRole("button", { name: "Continue to configuration" })).toBeEnabled();
  });

  it.each([
    ["a non-numeric difference in the API's words", [check("trial-balance", "Trial balance — per account", "None")], "None"],
    ["no trial balance check", [check("ar", "A/R", "0.00")], "Not available"],
  ])("shows %s, never a default zero", async (_name, checks, shown) => {
    read({ ...base, report: report(checks) });
    await screen.findByRole("heading", { level: 1, name: "Your books match" });
    const term = screen.getAllByRole("term").find(item => item.textContent === "Trial balance difference")!;
    expect(term.nextElementSibling).toHaveTextContent(new RegExp(`^${shown}$`));
    expect(document.body).not.toHaveTextContent("CAD 0.00");
  });

  it("keeps a blocked validation recoverable: what happened, what is kept, the way forward", async () => {
    read({ ...base, workflow_status: "VALIDATION_BLOCKED", report: report([check("ar", "A/R — open invoices", "-5.00", "BLOCKED"), check("count:customers", "Customers", "0")], "BLOCKED") });
    const recovery = await screen.findByRole("region", { name: "How to recover" });
    expect(recovery).toHaveTextContent("A/R — open invoices does not match the source.");
    expect(recovery).toHaveTextContent("Nothing is adjusted or written off to force a match.");
    expect(screen.getByRole("heading", { level: 1, name: "Your books don't match yet" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Continue to configuration" })).toBeDisabled();
    expect(screen.getByRole("region", { name: "Where verification stands" })).toHaveTextContent("1 check doesn't match");
  });

  it("explains a rejected setting as configuration review required, with the decision attributed", async () => {
    read({ ...base, workflow_status: "CONFIGURATION_REVIEW_REQUIRED", report: report([check("ar", "A/R", "0.00")]), configuration: { id: "c", target_settings: {}, proposals: [
      { id: "tax", area: "tax", label: "Tax setup", source_value: "A", selected_value: "A", alternatives: ["A", "B"], risk: "HIGH", approval_required: true, state: "REJECTED", evidence: [], policy_reason: "Needs approval", explanation: "e", decided_by: "owner-3", decided_at: "2026-02-03T04:05:06Z", decision: "reject" },
    ] } });
    const recovery = await screen.findByRole("region", { name: "How to recover" });
    expect(recovery).toHaveTextContent("Setup can't finish yet");
    expect(recovery).toHaveTextContent("Tax setup is rejected");
    expect(screen.getByText("Decision by owner-3: reject · 2026-02-03T04:05:06Z")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Apply reviewed configuration" })).toBeDisabled();
  });

  it("lists the applied settings once configuration is done", async () => {
    read({ ...base, workflow_status: "CONFIGURED", ready_for_onboarding: true, report: report([check("ar", "A/R", "0.00")]), configuration: { id: "c", target_settings: { payment_terms: "NET_15" }, proposals: [] } });
    const applied = await screen.findByRole("region", { name: "Settings applied to your new books" });
    expect(applied).toHaveTextContent("Payment termsNET_15");
    expect(screen.getByRole("link", { name: /Complete setup/ })).toHaveAttribute("href", "/onboard-fpu?session=s-verify");
  });
});
