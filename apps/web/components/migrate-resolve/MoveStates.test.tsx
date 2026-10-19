import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { MigrateResolveExperience } from "./MigrateResolveExperience";

const json = (body: unknown, status = 200) => Promise.resolve(new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } }));
const batch = (sequence: number, entity: string, status: string, records: number, succeeded: number) => ({ id: `b${sequence}`, sequence, entity, record_count: records, status, attempt_count: 1, retry_limit: 2, succeeded_count: succeeded, failed_count: records - succeeded, last_error: status === "FAILED" ? "needs resolution" : null });
const paused = {
  id: "e1", version: "v1", status: "RESOLVING", manifest_version: "plan-v3", progress_percent: 40, current_batch_id: "b2", current_agent: "resolution_agent", safe_to_validate: false,
  batches: [batch(1, "accounts", "COMPLETED", 4, 4), batch(2, "vendors", "FAILED", 3, 0), batch(3, "invoices", "PENDING", 6, 0)],
  failures: [{ id: "f1", batch_id: "b2", kind: "DUPLICATE_VENDOR", code: "MB-1", summary: "Vendors need a decision.", root_cause: "Declared scenario.", retryable: true, risk: "MEDIUM", evidence: [], affected_record_ids: [], resolved: false, retry_count: 0 }],
  resolutions: [{ id: "r1", failure_id: "f1", version: "v1", specialist: "duplicate_resolution_specialist", action: "merge", rationale: "Why", evidence: ["e"], confidence: 0.9, risk: "MEDIUM", reversible: true, deterministic_fix_available: true, human_approval_required: true, escalation_rule: "Escalate", state: "AWAITING_APPROVAL" }],
};
const session = (execution: unknown, workflow_status = "RESOLVING") => ({ id: "s-move", company_name: "Sample Books", workflow_status, activity: [], execution });

beforeAll(() => { HTMLDialogElement.prototype.showModal = function () { this.open = true; }; HTMLDialogElement.prototype.close = function () { this.open = false; }; });
beforeEach(() => { sessionStorage.clear(); window.history.replaceState(null, "", "/migrate-resolve?session=s-move"); });
afterEach(() => vi.restoreAllMocks());

describe("Move stage states", () => {
  it("says what happened, what is kept and the way forward when the read fails", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(() => json({ detail: "Down" }, 503));
    render(<MigrateResolveExperience />);
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Can't reach MoveBooks");
    expect(alert).toHaveTextContent("Nothing in your migration has changed");
    expect(within(alert).getByRole("link", { name: "Try again" })).toHaveAttribute("href", "/migrate-resolve?session=s-move");
    expect(screen.queryByRole("button", { name: "Start migration" })).not.toBeInTheDocument();
  });

  it("pauses one batch, not the move, and keeps completed batches", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(() => json(session(paused)));
    render(<MigrateResolveExperience />);
    expect(await screen.findByRole("heading", { level: 1, name: "A batch paused for your review" })).toBeVisible();
    expect(screen.getByText(/^Move$/, { selector: ".v2-stage-eyebrow strong" }).parentElement).toHaveTextContent("Move · stage 3 of 5 · move your records");
    expect(screen.getByText(/A problem pauses one batch, not the move\. Batch 2 \(vendors\) needs your decision/)).toBeVisible();
    const recovery = screen.getByRole("region", { name: "How to recover" });
    expect(recovery).toHaveTextContent("What is kept: 1 of 3 batches moved and stay in the new books.");
    expect(recovery).toHaveTextContent("review the proposed fix, approve or reject it, then retry the paused batch");
    const batches = screen.getByRole("list", { name: "Batches in order" });
    expect(within(batches).getAllByRole("listitem").map(item => item.textContent)).toEqual([
      "Batch 1 Accounts4 of 4 recordsMoved", "Batch 2 Vendors0 of 3 recordsPausedneeds resolution", "Batch 3 Invoices0 of 6 recordsWaiting",
    ]);
    const summary = screen.getByRole("region", { name: "Where the move stands" });
    expect(summary).toHaveTextContent("1 migration issue to review");
    expect(summary).toHaveTextContent("1 of 3 batches moved");
    expect(within(summary).getByRole("link", { name: "Open evidence" })).toHaveAttribute("href", "/trust?view=evidence&session=s-move");
    expect(screen.getByRole("group", { name: "40% migration progress" })).toBeInTheDocument();
    // TaskContext and the five-stage bar stay on the page.
    expect(screen.getByRole("navigation", { name: "Migration utilities" })).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Five-stage migration journey" })).toBeInTheDocument();
  });

  it("does not call a recorded decision a failure when only the activity refresh fails", async () => {
    const approved = { ...paused, status: "RETRY_PENDING", failures: paused.failures.map(f => ({ ...f, resolved: true })), resolutions: paused.resolutions.map(r => ({ ...r, state: "APPROVED", decided_by: "owner-7", decided_at: "2026-01-02T03:04:05Z" })) };
    let decided = false;
    vi.spyOn(globalThis, "fetch").mockImplementation((input, init) => {
      const url = String(input);
      if (init?.method === "POST" && url.endsWith("/decision")) { decided = true; return json(approved); }
      if (url.endsWith("/activity")) return decided ? json({ detail: "Down" }, 503) : json([]);
      return json(session(decided ? approved : paused, decided ? "RETRY_PENDING" : "RESOLVING"));
    });
    render(<MigrateResolveExperience />);
    fireEvent.click(await screen.findByRole("button", { name: "Review 1 migration issue" }));
    const approve = await screen.findByRole("button", { name: "Approve resolution" });
    expect(approve).toBeEnabled();
    fireEvent.click(approve);
    expect(await screen.findByText(/Your last action is recorded\. The activity list could not be refreshed/)).toBeVisible();
    expect(screen.queryByText(/That step was not completed/)).toBeNull();
  });

  it("names who approved the fix once the API records it", async () => {
    const approved = { ...paused, status: "RETRY_PENDING", failures: paused.failures.map(f => ({ ...f, resolved: true })), resolutions: paused.resolutions.map(r => ({ ...r, state: "APPROVED", decided_by: "owner-7", decided_at: "2026-01-02T03:04:05Z" })) };
    vi.spyOn(globalThis, "fetch").mockImplementation(() => json(session(approved, "RETRY_PENDING")));
    render(<MigrateResolveExperience />);
    expect(await screen.findByRole("button", { name: "Retry failed batch" })).toBeEnabled();
    expect(screen.getByRole("region", { name: "Where the move stands" })).toHaveTextContent("Fix approved by owner-7");
    expect(screen.getByText(/decided by owner-7 at 2026-01-02T03:04:05Z/)).toBeInTheDocument();
  });

  it("offers one primary action once every batch moved", async () => {
    const done = { ...paused, status: "MIGRATION_COMPLETE", safe_to_validate: true, progress_percent: 100, failures: [], resolutions: [], batches: paused.batches.map(b => ({ ...b, status: "COMPLETED", succeeded_count: b.record_count })) };
    vi.spyOn(globalThis, "fetch").mockImplementation(() => json(session(done, "MIGRATION_COMPLETE")));
    render(<MigrateResolveExperience />);
    const verify = await screen.findByRole("link", { name: "Verify my books" });
    expect(verify).toHaveAttribute("href", "/validate-configure?session=s-move");
    const primary = Array.from(document.querySelectorAll<HTMLElement>(".button")).filter(el => !["secondary", "ghost", "danger", "icon-button"].some(c => el.classList.contains(c)));
    expect(primary).toEqual([verify]);
    expect(screen.queryByRole("region", { name: "How to recover" })).not.toBeInTheDocument();
  });
});
