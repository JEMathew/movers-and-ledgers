import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BulkApproval, consentReady } from "./BulkApproval";
import { PlanMapApproveExperience } from "./PlanMapApproveExperience";
import { bulkComment, bulkEligible, bulkIneligibility, bulkItem, runBulkApproval, STREAMLINED_REASON } from "./bulk-approval";
import type { MappingProposal } from "./types";

// Acceptance tests 1-6 from docs/v2/phase1/bulk-approval-requirements.md.

const base: MappingProposal = {
  id: "low-1", version: "mapping-policy-v1", area: "customers", source_id: "customer-001", source_label: "Cedar School",
  recommended_target: "Customer", selected_target: "Customer", confidence: 0.98, risk: "LOW",
  evidence: ["mapping-rule:mapping-policy-v1:customers:customer-001"], rationale: "The source party maps directly.", alternatives: [],
  state: "AUTO_ACCEPTABLE", approval_required: true, policy_reasons: [STREAMLINED_REASON], deterministic_checks: ["PASSED"], specialist: "entity_mapping_specialist",
};
const m = (id: string, extra: Partial<MappingProposal> = {}): MappingProposal => ({ ...base, id, source_id: id, source_label: id, ...extra });
const sensitive = "Sensitive accounting or tax mappings require human approval.";

/** Every kind of item the requirements name, plus the stricter rules this client adds. */
const fixture: MappingProposal[] = [
  m("low-auto"),
  m("low-review", { state: "REVIEW_REQUIRED" }),
  m("low-config", { area: "general_configuration", source_label: "fiscal_calendar", source_value: "calendar_year", recommended_target: "Calendar Year", selected_target: "Calendar Year" }),
  m("medium", { risk: "MEDIUM", state: "REVIEW_REQUIRED", confidence: 0.76 }),
  m("high", { risk: "HIGH", state: "REVIEW_REQUIRED" }),
  m("tax-area", { area: "tax_configuration", source_label: "CA-SALES", recommended_target: "California sales tax", selected_target: "California sales tax" }),
  m("tax-rate", { area: "general_configuration", source_label: "default_tax_rate", source_value: "7.25", recommended_target: "7.25", selected_target: "7.25" }),
  m("blocked", { state: "BLOCKED", policy_reasons: ["Required target evidence is missing for fields: display_name."] }),
  m("rejected", { state: "REJECTED" }),
  m("approved", { state: "APPROVED" }),
  m("modified", { state: "MODIFIED", selected_target: "Vendor" }),
  m("proposed", { state: "PROPOSED" }),
  m("changing", { selected_target: "Vendor" }),
  m("sensitive-account", { area: "chart_of_accounts", state: "REVIEW_REQUIRED", source_label: "Operating Bank", recommended_target: "Bank Account", selected_target: "Bank Account", policy_reasons: [sensitive] }),
  m("unknown-reason", { policy_reasons: ["A reason this client has never seen."] }),
  m("no-reason", { policy_reasons: [] }),
  m("failed-check", { deterministic_checks: ["FAILED"] }),
  m("reconsidering", { reconsiderations: [{ id: "r1", prior_decision_id: "d1", prior_actor: "a", prior_timestamp: "t", prior_reason: null, prior_evidence: [], prior_target: "Customer", requested_by: "a", requested_at: "t", reason: "x", proposed_target: "Customer", state: "REVIEW_REQUIRED", reviewed_by: null, reviewed_at: null, decision_id: null }] }),
];

beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); sessionStorage.clear(); });

describe("1 · eligibility comes from the API response and the strict rule", () => {
  it("offers only low-risk, undecided, unchanged, non-tax, non-sensitive mappings without open reconsideration", () => {
    expect(fixture.filter(bulkEligible).map(item => item.id)).toEqual(["low-auto", "low-review", "low-config"]);
  });
  it("names every rule an item fails", () => {
    const why = Object.fromEntries(fixture.map(item => [item.id, bulkIneligibility(item)]));
    expect(why).toMatchObject({
      "low-auto": [], "low-review": [], "low-config": [],
      medium: expect.arrayContaining(["risk"]), high: expect.arrayContaining(["risk"]),
      "tax-area": expect.arrayContaining(["tax"]), "tax-rate": expect.arrayContaining(["tax"]),
      blocked: expect.arrayContaining(["state"]), rejected: expect.arrayContaining(["state"]), approved: expect.arrayContaining(["state"]),
      modified: expect.arrayContaining(["state", "changed"]), proposed: expect.arrayContaining(["state"]), changing: ["changed"],
      "sensitive-account": ["sensitive"], "unknown-reason": ["sensitive"], "no-reason": ["sensitive"],
      "failed-check": ["checks"], reconsidering: ["reconsideration"],
    });
  });
  it("a REVIEW_REQUIRED low-risk mapping qualifies only with the streamlined reason alone", () => {
    expect(bulkEligible(m("x", { state: "REVIEW_REQUIRED" }))).toBe(true);
    expect(bulkEligible(m("x", { state: "REVIEW_REQUIRED", policy_reasons: [STREAMLINED_REASON, sensitive] }))).toBe(false);
  });
  it("the panel lists exactly the eligible items from the mappings it is given, in full", () => {
    render(<BulkApproval mappings={fixture} editable busy={false} run={vi.fn()} onClose={vi.fn()} />);
    const list = screen.getByRole("list", { name: "Mappings in this set: 3" });
    const rows = within(list).getAllByRole("listitem").filter(item => item.parentElement === list);
    expect(rows.map(row => row.querySelector(".pm-bulk-source")?.textContent)).toEqual(["low-auto", "low-review", "fiscal_calendar"]);
    // Source label, source value, selected target, risk, confidence and area are all shown.
    expect(rows[2]).toHaveTextContent("Source value: calendar_year");
    expect(rows[2]).toHaveTextContent("Calendar Year");
    expect(rows[2]).toHaveTextContent("Low risk · 98% match · General configuration");
    // Each row opens the same evidence view used for single decisions.
    expect(within(rows[0]).getByText(/Evidence for low-auto · 1 direct reference/)).toBeVisible();
  });
  it("shows none eligible honestly when nothing qualifies", () => {
    render(<BulkApproval mappings={fixture.filter(item => !bulkEligible(item))} editable busy={false} run={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByRole("status")).toHaveTextContent("No mapping qualifies for approval together right now");
    expect(screen.queryByRole("button", { name: /^Approve \d+ low-risk/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });
});

describe("2 · consent", () => {
  const three = [m("a"), m("b"), m("c")];
  it("stays disabled until the list is rendered and the unticked checkbox is ticked", async () => {
    render(<BulkApproval mappings={three} editable busy={false} run={vi.fn()} onClose={vi.fn()} />);
    const box = screen.getByRole("checkbox", { name: "I have reviewed these 3 mappings and approve each one as shown." });
    const button = screen.getByRole("button", { name: "Approve 3 low-risk mappings" });
    expect(box).not.toBeChecked();
    expect(button).toBeDisabled();
    fireEvent.click(box);
    await waitFor(() => expect(button).toBeEnabled());
    fireEvent.click(box);
    expect(button).toBeDisabled();
  });
  it("removing an item updates every count and clears consent", async () => {
    render(<BulkApproval mappings={three} editable busy={false} run={vi.fn()} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole("checkbox"));
    await waitFor(() => expect(screen.getByRole("button", { name: "Approve 3 low-risk mappings" })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: "Remove b from this set" }));
    expect(screen.getByRole("list", { name: "Mappings in this set: 2" })).toBeVisible();
    expect(screen.getByRole("checkbox", { name: "I have reviewed these 2 mappings and approve each one as shown." })).not.toBeChecked();
    expect(screen.getByRole("button", { name: "Approve 2 low-risk mappings" })).toBeDisabled();
    expect(screen.getByRole("heading", { name: "Removed from this set · 1" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Put b back in this set" }));
    expect(screen.getByRole("button", { name: "Approve 3 low-risk mappings" })).toBeDisabled();
  });
  it("a count mismatch between list, sentence and button keeps it disabled", () => {
    expect(consentReady({ consent: true, listed: 3, inSentence: 3, inButton: 3 })).toBe(true);
    expect(consentReady({ consent: false, listed: 3, inSentence: 3, inButton: 3 })).toBe(false);
    expect(consentReady({ consent: true, listed: 2, inSentence: 3, inButton: 3 })).toBe(false);
    expect(consentReady({ consent: true, listed: 3, inSentence: 3, inButton: 2 })).toBe(false);
    expect(consentReady({ consent: true, listed: 0, inSentence: 0, inButton: 0 })).toBe(false);
  });
  it("is disabled when the migration is not open for decisions", () => {
    render(<BulkApproval mappings={three} editable={false} busy={false} run={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByRole("checkbox")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Approve 3 low-risk mappings" })).toBeDisabled();
  });
});

describe("3 · stale data aborts with a named list", () => {
  it("compares version, state and selected target on a fresh read and sends nothing", async () => {
    const set = [m("a"), m("b"), m("c"), m("d")].map(bulkItem);
    const approve = vi.fn();
    const outcome = await runBulkApproval({ set, setId: "s1", approve, readFresh: async () => [
      m("a", { state: "APPROVED" }), m("b", { selected_target: "Vendor" }), m("c", { version: "mapping-policy-v2" }), m("d"),
    ] });
    expect(approve).not.toHaveBeenCalled();
    expect(outcome).toMatchObject({ kind: "aborted" });
    if (outcome.kind !== "aborted") throw new Error("expected abort");
    expect(outcome.stale.map(({ item, reason }) => `${item.id}: ${reason}`)).toEqual(["a: its state changed", "b: its target changed", "c: its rule version changed"]);
  });
  it("aborts when an item disappeared or no longer qualifies", async () => {
    const set = [m("a"), m("b")].map(bulkItem);
    const outcome = await runBulkApproval({ set, setId: "s1", approve: vi.fn(), readFresh: async () => [m("b", { policy_reasons: [sensitive] })] });
    expect(outcome.kind === "aborted" && outcome.stale.map(s => s.reason)).toEqual(["it is no longer in this migration", "it no longer qualifies for approval together"]);
  });
  it("sends nothing when the fresh read fails", async () => {
    const approve = vi.fn();
    const outcome = await runBulkApproval({ set: [bulkItem(m("a"))], setId: "s1", approve, readFresh: async () => { throw new Error("offline"); } });
    expect(outcome).toMatchObject({ kind: "unread", message: "offline" });
    expect(approve).not.toHaveBeenCalled();
  });
});

describe("4 · partial failure stops at the first refusal", () => {
  it("a 409 on item k stops at k, reports k-1 approved and sends no further calls", async () => {
    const set = ["a", "b", "c", "d"].map(id => bulkItem(m(id)));
    const approve = vi.fn().mockResolvedValueOnce({}).mockResolvedValueOnce({}).mockRejectedValueOnce(new Error("Mapping proposal already has a final decision."));
    const outcome = await runBulkApproval({ set, setId: "s1", approve, readFresh: async () => set.map(item => m(item.id)) });
    expect(approve).toHaveBeenCalledTimes(3);
    expect(approve.mock.calls.map(([item]) => item.id)).toEqual(["a", "b", "c"]);
    if (outcome.kind !== "done") throw new Error("expected done");
    expect(outcome.approved.map(item => item.id)).toEqual(["a", "b"]);
    expect(outcome.failed?.item.id).toBe("c");
    expect(outcome.notAttempted.map(item => item.id)).toEqual(["d"]);
  });
});

describe("5 · audit: one recorded call per item, each with the set comment", () => {
  it("uses the existing per-item approve body with only a comment", async () => {
    const set = ["a", "b", "c"].map(id => bulkItem(m(id)));
    const approve = vi.fn().mockResolvedValue({});
    await runBulkApproval({ set, setId: "set-42", approve, readFresh: async () => set.map(item => m(item.id)) });
    expect(approve.mock.calls.map(([, body]) => body)).toEqual(Array(3).fill({ comment: "Bulk approval set set-42: reviewed 3 low-risk mappings" }));
    expect(bulkComment("x", 1)).toBe("Bulk approval set x: reviewed 1 low-risk mappings");
  });
});

describe("through the Prepare screen", () => {
  const id = "33333333-3333-4333-8333-333333333333";
  const plan = { id: "plan-001", version: "v1", status: "READY_FOR_MAPPING", phases: [], blockers: [], risks: [], checkpoints: [], approvals_required: [], customer_actions: [], relative_complexity: "Low", evidence_references: [] };
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
  const mappings = [m("11111111-0000-4000-8000-000000000001", { source_label: "Cedar School" }), m("11111111-0000-4000-8000-000000000002", { source_label: "Maple Library" }), m("11111111-0000-4000-8000-000000000003", { source_label: "Independent Press" }),
    m("11111111-0000-4000-8000-000000000004", { source_label: "1200 · Misc Clearing", area: "chart_of_accounts", risk: "MEDIUM", state: "REVIEW_REQUIRED", confidence: 0.76, policy_reasons: [sensitive] })];
  const snapshot = (items = mappings, extra = {}) => ({ id, synthetic: true, workflow_status: "AWAITING_APPROVAL", plan, mappings: items, activity: [], human_decisions: [], ...extra });
  const approvedAll = (n: number): MappingProposal[] => mappings.map((item, index) => index < n ? { ...item, state: "APPROVED" as const, decided_by: "demo-user" } : item);
  async function openPanel(fetch: ReturnType<typeof vi.fn>) {
    sessionStorage.setItem("movebooks-migration-session", id);
    vi.stubGlobal("fetch", fetch);
    render(<PlanMapApproveExperience />);
    fireEvent.click(await screen.findByRole("button", { name: "Review mappings" }));
    fireEvent.click(await screen.findByRole("button", { name: "Approve 3 low-risk mappings" }));
    const panel = screen.getByRole("region", { name: "Approve low-risk mappings together" });
    fireEvent.click(within(panel).getByRole("checkbox", { name: "I have reviewed these 3 mappings and approve each one as shown." }));
    const submit = within(panel).getByRole("button", { name: "Approve 3 low-risk mappings" });
    await waitFor(() => expect(submit).toBeEnabled());
    return { panel, submit };
  }
  const posts = (fetch: ReturnType<typeof vi.fn>) => fetch.mock.calls.filter(([, init]) => init?.method === "POST");

  it("approves each item with its own call, in order, then reads the session and reports per item", async () => {
    let finalRead!: (response: Response) => void;
    const fetch = vi.fn()
      .mockResolvedValueOnce(json(snapshot()))          // initial read
      .mockResolvedValueOnce(json(snapshot()))          // fresh read at consent time
      .mockResolvedValueOnce(json({})).mockResolvedValueOnce(json({})).mockResolvedValueOnce(json({}))
      .mockReturnValueOnce(new Promise(resolve => { finalRead = resolve; }));
    const { submit } = await openPanel(fetch);
    fireEvent.click(submit);
    // The authoritative read after the approvals is still running: the panel and its result stay on screen.
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(6));
    await act(async () => finalRead(await json(snapshot(approvedAll(3), { human_decisions: approvedAll(3).slice(0, 3).map((item, index) => ({ id: `d${index}`, affected_entity: item.id, decision: "APPROVED", actor: "demo-user", occurred_at: "t", selected_value: "Customer" })) }))));
    const panel = screen.getByRole("region", { name: "Approve low-risk mappings together" });
    expect(await within(panel).findByText("3 approved, each recorded separately.")).toBeVisible();
    expect(within(panel).getAllByRole("status")[0]).toHaveTextContent("Cedar School → Customer: approved and recorded");
    expect(within(panel).getAllByRole("status")[1]).toHaveTextContent("No other mapping qualifies");
    const calls = posts(fetch);
    expect(calls.map(([url]) => String(url).replace(/^.*\/mappings\//, ""))).toEqual(mappings.slice(0, 3).map(item => `${item.id}/approve`));
    const comments = calls.map(([, init]) => JSON.parse(init.body));
    expect(new Set(comments.map(body => body.comment)).size).toBe(1);
    expect(comments[0]).toEqual({ comment: expect.stringMatching(/^Bulk approval set \S+: reviewed 3 low-risk mappings$/) });
    // The fresh read happens immediately before the first approval, and the final read after the last.
    expect(fetch.mock.calls[1][1]?.method).toBeUndefined();
    expect(fetch.mock.calls.at(-1)![1]?.method).toBeUndefined();
    // Medium risk was never part of the set.
    expect(calls.some(([url]) => String(url).includes("000000000004"))).toBe(false);
    expect(screen.getByText("Recorded decisions · 3")).toBeVisible();
  });

  it("aborts and names the changed item when the fresh read differs", async () => {
    const changed = mappings.map(item => item.source_label === "Maple Library" ? { ...item, state: "APPROVED" as const } : item);
    const fetch = vi.fn().mockResolvedValueOnce(json(snapshot())).mockResolvedValueOnce(json(snapshot(changed))).mockResolvedValue(json(snapshot(changed)));
    const { panel, submit } = await openPanel(fetch);
    fireEvent.click(submit);
    const alert = await within(panel).findByRole("alert");
    expect(alert).toHaveTextContent("Nothing was approved.");
    expect(alert).toHaveTextContent("Maple Library: its state changed.");
    expect(posts(fetch)).toHaveLength(0);
  });

  it("stops at a refused item, keeps earlier approvals and sends nothing after it", async () => {
    const fetch = vi.fn()
      .mockResolvedValueOnce(json(snapshot())).mockResolvedValueOnce(json(snapshot()))
      .mockResolvedValueOnce(json({}))
      .mockResolvedValueOnce(json({ detail: "Mapping proposal already has a final decision." }, 409))
      .mockResolvedValue(json(snapshot(approvedAll(1))));
    const { panel, submit } = await openPanel(fetch);
    fireEvent.click(submit);
    const alert = await within(panel).findByRole("alert");
    expect(alert).toHaveTextContent("Stopped at Maple Library. 1 approved, each recorded separately. 2 not approved.");
    expect(alert).toHaveTextContent("Mapping proposal already has a final decision.");
    expect(alert).toHaveTextContent("Cedar School → Customer: approved and recorded");
    expect(alert).toHaveTextContent("Maple Library → Customer: refused");
    expect(alert).toHaveTextContent("Independent Press → Customer: not sent");
    expect(posts(fetch)).toHaveLength(2);
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 20)); });
    expect(posts(fetch)).toHaveLength(2);
  });
});

describe("6 · accessibility", () => {
  it("passes axe, and the checkbox and button are labelled and reachable in keyboard order", async () => {
    const { container } = render(<main><BulkApproval mappings={[m("a"), m("b")]} editable busy={false} run={vi.fn()} onClose={vi.fn()} /></main>);
    const axe = (await import("axe-core")).default;
    // jsdom has no layout, so contrast is checked in the browser run instead.
    const result = await axe.run(container, { rules: { "color-contrast": { enabled: false } } });
    expect(result.violations.map(v => v.id)).toEqual([]);
    const box = screen.getByRole("checkbox", { name: "I have reviewed these 2 mappings and approve each one as shown." });
    const button = screen.getByRole("button", { name: "Approve 2 low-risk mappings" });
    const focusable = Array.from(container.querySelectorAll<HTMLElement>("button, input, summary, [href]")).filter(el => el.tabIndex >= 0);
    expect(focusable.indexOf(box)).toBeGreaterThan(-1);
    expect(focusable.indexOf(button)).toBe(focusable.indexOf(box) + 1);
    // The panel heading takes focus when it opens, so keyboard users start at the top of the list.
    expect(screen.getByRole("heading", { name: "Approve low-risk mappings together" })).toHaveFocus();
    box.focus(); expect(box).toHaveFocus();
  });
});
