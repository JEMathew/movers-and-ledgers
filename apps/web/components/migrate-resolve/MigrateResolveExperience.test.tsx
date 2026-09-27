import "@testing-library/jest-dom/vitest";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { MigrateResolveExperience } from "./MigrateResolveExperience";

const jsonResponse = (body: object) => Promise.resolve(new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } }));

const session = { id: "session-1", company_name: "Harbor Light Books", workflow_status: "APPROVED", activity: [] };
const resolving = {
  id: "execution-1", version: "migration-execution-v1", status: "RESOLVING", manifest_version: "plan-v1",
  progress_percent: 25, current_batch_id: "batch-customers", current_agent: "resolution_agent", safe_to_validate: false,
  batches: [{ id: "batch-accounts", sequence: 1, entity: "accounts", record_count: 3, status: "COMPLETED", attempt_count: 1, retry_limit: 2, succeeded_count: 3, failed_count: 0, last_error: null }, { id: "batch-customers", sequence: 2, entity: "customers", record_count: 2, status: "FAILED", attempt_count: 1, retry_limit: 2, succeeded_count: 0, failed_count: 2, last_error: "needs resolution" }],
  failures: [{ id: "failure-1", batch_id: "batch-customers", kind: "DUPLICATE_CUSTOMER", code: "MB-DUPLICATE_CUSTOMER", summary: "Customers need resolution.", root_cause: "Declared synthetic scenario.", retryable: true, risk: "MEDIUM", evidence: ["batch:customers"], affected_record_ids: ["customer-1"], resolved: false, retry_count: 0 }],
  resolutions: [{ id: "resolution-1", failure_id: "failure-1", version: "resolution-policy-v1", specialist: "duplicate_resolution_specialist", action: "merge_duplicate_customer", rationale: "Compare evidence and preserve lineage.", evidence: ["batch:customers"], confidence: 0.96, risk: "MEDIUM", reversible: true, deterministic_fix_available: true, human_approval_required: true, escalation_rule: "Escalate if evidence changes.", state: "AWAITING_APPROVAL" }],
};

afterEach(() => vi.restoreAllMocks());

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function close() {
    this.open = false;
  };
});

describe("MigrateResolveExperience", () => {
  it("resumes the same paused session without loading or executing a demo", async () => {
    window.history.replaceState(null, "", "/migrate-resolve?session=session-1");
    const fetchMock = vi.spyOn(globalThis,"fetch").mockImplementation(() => jsonResponse({...session,execution:resolving}));
    render(<MigrateResolveExperience />);
    expect(await screen.findByText("Migration paused safely")).toBeVisible();
    expect(screen.queryByRole("button", {name:/load reviewed manifest/i})).not.toBeInTheDocument();
    const step = screen.getByText("Migrate", {selector:"strong"}).closest("li");
    expect(step).not.toHaveClass("is-complete");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][1]?.method).toBeUndefined();
  });
  it("shows the synthetic-only scope and journey before execution", () => {
    render(<MigrateResolveExperience />);
    expect(screen.getByRole("heading", { name: /execute visibly/i })).toBeInTheDocument();
    expect(screen.getByText(/no accounting-provider writes/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /load reviewed manifest/i })).toBeInTheDocument();
  });

  it("renders a controlled failure and opens the governed resolution dialog", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    fetchMock.mockImplementationOnce(() => jsonResponse(session));
    fetchMock.mockImplementationOnce(() => jsonResponse(resolving));
    fetchMock.mockImplementationOnce(() => jsonResponse([]));
    render(<MigrateResolveExperience />);
    fireEvent.click(screen.getByRole("button", { name: /load reviewed manifest/i }));
    await screen.findByRole("button", { name: /start migration/i });
    fireEvent.click(screen.getByRole("button", { name: /start migration/i }));
    await waitFor(() => expect(screen.getByText(/migration paused safely/i)).toBeInTheDocument());
    expect(screen.getByRole("dialog", { name: /review proposed resolution/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /approve resolution/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/25% migration progress/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", {name:"Close dialog"}));
    await waitFor(() => expect(screen.getByRole("heading", {name:/execute visibly/i})).toHaveFocus());
  });
});
