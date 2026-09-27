import "@testing-library/jest-dom/vitest";

import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
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

  it.each([true, false])("keeps evidence governed while activity is pending and records approval=%s before any retry", async (approve) => {
    let finishActivity!: (response: Response) => void;
    const activityResponse = new Promise<Response>(resolve => { finishActivity = resolve; });
    const decided = {
      ...resolving,
      status: approve ? "RETRY_PENDING" : "BLOCKED",
      failures: resolving.failures.map(failure => ({ ...failure, resolved: approve })),
      resolutions: resolving.resolutions.map(proposal => ({ ...proposal, state: approve ? "APPROVED" : "REJECTED" })),
    };
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockImplementationOnce(() => jsonResponse(session))
      .mockImplementationOnce(() => jsonResponse(resolving))
      .mockImplementationOnce(() => activityResponse)
      .mockImplementationOnce(() => jsonResponse(decided))
      .mockImplementationOnce(() => jsonResponse([]))
      .mockImplementationOnce(() => jsonResponse({ ...decided, status: "MIGRATION_COMPLETE", progress_percent: 100 }))
      .mockImplementationOnce(() => jsonResponse([]));
    render(<MigrateResolveExperience />);
    fireEvent.click(screen.getByRole("button", { name: /load reviewed manifest/i }));
    fireEvent.click(await screen.findByRole("button", { name: /start migration/i }));
    const dialog = await screen.findByRole("dialog", { name: /review proposed resolution/i });
    expect(dialog).toBeVisible();
    expect(within(dialog).getByText("Compare evidence and preserve lineage.")).toBeVisible();
    expect(within(dialog).getByText(/batch:customers/)).toBeVisible();
    expect(within(dialog).getByRole("button", { name: "Approve resolution" })).toBeDisabled();
    expect(within(dialog).getByRole("button", { name: "Reject and block" })).toBeDisabled();
    expect(fetchMock).toHaveBeenCalledTimes(3);

    // Closing or Escape is not a decision, and a late read must not reopen it.
    fireEvent(dialog, new Event("cancel", { cancelable: true, bubbles: true }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /execute visibly/i })).toHaveFocus();
    await act(async () => { finishActivity(await jsonResponse([])); });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(screen.getByText("Migration paused safely")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Review Resolution Agent proposal" }));
    const reopened = screen.getByRole("dialog", { name: /review proposed resolution/i });
    const decision = within(reopened).getByRole("button", { name: approve ? "Approve resolution" : "Reject and block" });
    expect(decision).toBeEnabled();
    fireEvent.click(decision);
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(fetchMock.mock.calls[3][0]).toContain("/migration/resolutions/resolution-1/decision");
    expect(fetchMock.mock.calls[3][1]?.method).toBe("POST");
    expect(JSON.parse(fetchMock.mock.calls[3][1]?.body as string)).toMatchObject({ approve });
    expect(fetchMock).toHaveBeenCalledTimes(5);

    if (approve) {
      const retry = screen.getByRole("button", { name: /retry failed batch/i });
      await waitFor(() => expect(retry).toBeEnabled());
      fireEvent.click(retry);
      expect(await screen.findByText("Synthetic migration complete")).toBeVisible();
      expect(fetchMock.mock.calls[5][0]).toContain("/migration/resume");
      expect(fetchMock.mock.calls[5][1]?.method).toBe("POST");
      expect(fetchMock).toHaveBeenCalledTimes(7);
    } else {
      expect(screen.queryByRole("button", { name: /retry failed batch/i })).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Review Resolution Agent proposal" })).toBeDisabled();
      expect(screen.queryByText("Synthetic migration complete")).not.toBeInTheDocument();
    }
  });
});
