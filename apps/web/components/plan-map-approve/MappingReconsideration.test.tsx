import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MappingReconsideration } from "./MappingReconsideration";
import type { MappingHistoryDecision, MappingProposal, MappingReconsideration as Review } from "./types";

const original: MappingHistoryDecision = {id: "decision-original", affected_entity: "mapping-001", decision: "REJECTED", actor: "firebase:owner-a", occurred_at: "2026-09-28T13:00:00Z", selected_value: "Service"};
const mapping: MappingProposal = {id: "mapping-001", version: "mapping-policy-v1", area: "products_services", source_id: "service-001", source_label: "Catalog preparation", recommended_target: "Service", selected_target: "Service", confidence: 0.94, risk: "LOW", evidence: ["source:service-001"], rationale: "Declared service", alternatives: [], state: "REJECTED", approval_required: true, policy_reasons: [], deterministic_checks: ["PASSED"], specialist: "entity", decided_by: original.actor, decided_at: original.occurred_at, decision_comment: "Original rejection reason"};
const review: Review = {id: "request-001", prior_decision_id: original.id, prior_actor: original.actor, prior_timestamp: original.occurred_at, prior_reason: mapping.decision_comment!, prior_evidence: mapping.evidence, prior_target: "Service", requested_by: original.actor, requested_at: "2026-09-28T14:00:00Z", reason: "Human reconsidered synthetic mapping", proposed_target: "Service", state: "REVIEW_REQUIRED", reviewed_by: null, reviewed_at: null, decision_id: null};

describe("Mapping reconsideration", () => {
  it("requires a reason and sends an explicit request without actor or automatic approval", async () => {
    const submit = vi.fn().mockResolvedValue(undefined);
    render(<MappingReconsideration mapping={mapping} history={[original]} submit={submit} />);
    expect(screen.getByRole("button", {name: "Request Reconsideration"})).toBeDisabled();
    expect(screen.getByText(/Original rejection reason/)).toBeVisible();
    fireEvent.change(screen.getByLabelText("Reason for reconsideration"), {target: {value: "  "}});
    expect(screen.getByRole("button", {name: "Request Reconsideration"})).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Reason for reconsideration"), {target: {value: "Explicit human request"}});
    fireEvent.click(screen.getByRole("button", {name: "Request Reconsideration"}));
    await waitFor(() => expect(submit).toHaveBeenCalledOnce());
    expect(submit).toHaveBeenCalledWith("/reconsiderations", {request_id: expect.any(String), prior_decision_id: original.id, reason: "Explicit human request", proposed_target: "Service"});
    expect(screen.queryByRole("button", {name: "Approve Reconsideration"})).not.toBeInTheDocument();
  });

  it.each(["approve", "reject"])("requires a separate %s action and keeps original history visible", async action => {
    const submit = vi.fn().mockResolvedValue(undefined);
    const {rerender} = render(<MappingReconsideration mapping={{...mapping, reconsiderations: [review]}} history={[original]} submit={submit} />);
    expect(submit).not.toHaveBeenCalled();
    expect(screen.getByText(/Original rejection decision-original/)).toBeVisible();
    expect(screen.getByText(/Original evidence: source:service-001/)).toBeVisible();
    fireEvent.click(screen.getByRole("button", {name: action === "approve" ? "Approve Reconsideration" : "Reject Reconsideration"}));
    await waitFor(() => expect(submit).toHaveBeenCalledWith("/reconsiderations/request-001/review", {action, comment: expect.any(String)}));
    const state = action === "approve" ? "APPROVED" : "REJECTED";
    const newDecision = {...original, id: "decision-new", decision: state};
    rerender(<MappingReconsideration mapping={{...mapping, state, reconsiderations: [{...review, state, decision_id: newDecision.id, reviewed_by: original.actor, reviewed_at: "2026-09-28T14:01:00Z"}]}} history={[original, newDecision]} submit={submit} />);
    expect(screen.getByRole("heading", {name: "Prior Decision History"})).toHaveFocus();
    expect(within(screen.getByRole("list")).getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByText("Original reason: Original rejection reason", {exact: true})).toBeVisible();
    expect(screen.getByText(/New decision decision-new/)).toBeVisible();
  });

  it("retains the idempotency key after an ambiguous failure and never assumes success", async () => {
    const submit = vi.fn().mockRejectedValue(new Error("Connection interrupted"));
    render(<MappingReconsideration mapping={mapping} history={[original]} submit={submit} />);
    fireEvent.change(screen.getByLabelText("Reason for reconsideration"), {target: {value: "Retry same request"}});
    fireEvent.click(screen.getByRole("button", {name: "Request Reconsideration"}));
    expect(await screen.findByRole("alert")).toHaveTextContent("No approval is assumed");
    fireEvent.click(screen.getByRole("button", {name: "Request Reconsideration"}));
    await waitFor(() => expect(submit).toHaveBeenCalledTimes(2));
    expect(submit.mock.calls[1]).toEqual(submit.mock.calls[0]);
  });

  it("does not offer reconsideration for an already approved mapping", () => {
    render(<MappingReconsideration mapping={{...mapping, state: "APPROVED"}} history={[]} submit={vi.fn()} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
