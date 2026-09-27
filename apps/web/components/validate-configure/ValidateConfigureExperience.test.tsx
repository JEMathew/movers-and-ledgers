import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ValidateConfigureExperience } from "./ValidateConfigureExperience";
import type { Snapshot } from "./types";

const initial: Snapshot = { session_id: "session-vc", company_name: "Harbor Light Books", workflow_status: "MIGRATION_COMPLETE", repairs: [], resolutions: [], activity: [], ready_for_onboarding: false };
const blocked: Snapshot = { ...initial, workflow_status: "VALIDATION_BLOCKED", report: { id: "report", currency: "USD", status: "BLOCKED", blocking_discrepancies: 1, policy_version: "validation-v1", checks: [{ id: "ar", label: "A/R — open invoices", source: "420.00", target: "400.00", difference: "-20.00", status: "BLOCKED", evidence: ["source:checksum"], record_ids: ["invoice-001"], explanation: "Invoice mismatch", next_action: "Approve repair then revalidate." }, { id: "transformations", label: "Transformation integrity", source: "Source", target: "Changed", difference: "Mismatch", status: "BLOCKED", evidence: ["source:checksum"], record_ids: ["invoices:invoice-001"], explanation: "Payload changed", next_action: "Repair and revalidate" }] } };
const review: Snapshot = { ...initial, workflow_status: "CONFIGURATION_REVIEW_REQUIRED", report: { ...blocked.report!, status: "VERIFIED", blocking_discrepancies: 0, checks: [] }, configuration: { id: "plan", target_settings: {}, proposals: [{ id: "inventory", area: "inventory", label: "Inventory valuation", source_value: "WEIGHTED_AVERAGE", selected_value: "WEIGHTED_AVERAGE", alternatives: ["WEIGHTED_AVERAGE", "FIFO"], risk: "HIGH", approval_required: true, state: "REVIEW_REQUIRED", evidence: ["policy:configuration-v1"], policy_reason: "Attributable approval required", explanation: "Preserve valuation; modification requires human approval." }] } };
const response = (value: object, status = 200) => Promise.resolve(new Response(JSON.stringify(value), {status, headers: { "Content-Type": "application/json" }}));

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  HTMLDialogElement.prototype.close = function () { this.open = false; };
});
beforeEach(() => { sessionStorage.clear(); window.history.replaceState(null, "", "/validate-configure"); });
afterEach(() => vi.restoreAllMocks());

describe("ValidateConfigureExperience", () => {
  it("exposes truthful scope and detects discrepancies without enabling configuration", async () => {
    const mock = vi.spyOn(globalThis, "fetch").mockImplementationOnce(() => response(initial)).mockImplementationOnce(() => response(blocked));
    render(<ValidateConfigureExperience />);
    expect(screen.getByText(/No production readiness claim/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", {name: "Load discrepancy scenario"}));
    fireEvent.click(await screen.findByRole("button", {name: "Run validation"}));
    expect(await screen.findByText("-20.00")).toBeInTheDocument();
    expect(screen.getByRole("button", {name: "Continue to configuration"})).toBeDisabled();
    expect(mock).toHaveBeenCalledTimes(2);
  });

  it("requires explicit repair approval and a separate revalidation", async () => {
    const proposed = { ...blocked, repairs: [{ resolution_id: "repair", record_id: "invoice-001", entity: "invoices", applied: false }], resolutions: [{id: "repair", rationale: "Restore approved source", evidence: ["source:checksum"]}] };
    const mock = vi.spyOn(globalThis, "fetch").mockImplementationOnce(() => response(blocked)).mockImplementationOnce(() => response(proposed)).mockImplementationOnce(() => response({...proposed, repairs: [{...proposed.repairs[0], applied: true}]}));
    render(<ValidateConfigureExperience />);
    fireEvent.click(screen.getByRole("button", {name: "Load discrepancy scenario"}));
    fireEvent.click(await screen.findByRole("button", {name: "Review repair: invoices:invoice-001"}));
    expect(await screen.findByRole("dialog", {name: "Approve synthetic record restoration?"})).toBeInTheDocument();
    expect(screen.getByRole("button", {name: "Revalidate migration"})).toBeDisabled();
    fireEvent.click(screen.getByRole("button", {name: "Approve restoration"}));
    await waitFor(() => expect(screen.getByRole("button", {name: "Revalidate migration"})).toBeEnabled());
    expect(screen.getByRole("button", {name: "Continue to configuration"})).toBeDisabled();
    expect(mock.mock.calls[2][0]).toContain("/validation/resolutions/repair/approve");
  });

  it("modifies high-risk configuration through a labeled, attributable review dialog", async () => {
    const modified = structuredClone(review);
    modified.configuration!.proposals[0].state = "MODIFIED";
    modified.configuration!.proposals[0].selected_value = "FIFO";
    const mock = vi.spyOn(globalThis, "fetch").mockImplementationOnce(() => response(review)).mockImplementationOnce(() => response(modified));
    render(<ValidateConfigureExperience />);
    fireEvent.click(screen.getByRole("button", {name: "Load reconciled scenario"}));
    fireEvent.click(await screen.findByRole("button", {name: "Modify inventory valuation"}));
    fireEvent.change(screen.getByLabelText("Supported target value"), { target: {value: "FIFO"} });
    fireEvent.change(screen.getByLabelText("Decision note (optional)"), {target: {value: "Reviewed synthetic policy"}});
    fireEvent.click(screen.getByRole("button", {name: "Confirm modify"}));
    await screen.findByText("MODIFIED");
    expect(JSON.parse(mock.mock.calls[1][1]!.body as string)).toEqual({action: "modify", value: "FIFO", comment: "Reviewed synthetic policy"});
    expect(screen.getByRole("button", {name: "Apply reviewed configuration"})).toBeEnabled();
  });

  it("keeps rejection blocked, then lets the user revise a decision", async () => {
    const rejected = structuredClone(review);
    rejected.configuration!.proposals[0].state = "REJECTED";
    vi.spyOn(globalThis, "fetch").mockImplementationOnce(() => response(review)).mockImplementationOnce(() => response(rejected));
    render(<ValidateConfigureExperience />);
    fireEvent.click(screen.getByRole("button", {name: "Load reconciled scenario"}));
    fireEvent.click(await screen.findByRole("button", {name: "Reject inventory valuation"}));
    fireEvent.click(screen.getByRole("button", {name: "Confirm reject"}));
    await screen.findByText("REJECTED");
    expect(screen.getByRole("button", {name: "Apply reviewed configuration"})).toBeDisabled();
    expect(screen.getByRole("button", {name: "Modify inventory valuation"})).toBeEnabled();
  });

  it("shows API errors inside the dialog and supports retry without false success", async () => {
    const accepted = structuredClone(review);
    accepted.configuration!.proposals[0].state = "APPROVED";
    vi.spyOn(globalThis, "fetch").mockImplementationOnce(() => response(review)).mockImplementationOnce(() => response({detail: "Evidence changed"}, 409)).mockImplementationOnce(() => response(accepted));
    render(<ValidateConfigureExperience />);
    fireEvent.click(screen.getByRole("button", {name: "Load reconciled scenario"}));
    fireEvent.click(await screen.findByRole("button", {name: "Approve inventory valuation"}));
    fireEvent.click(screen.getByRole("button", {name: "Confirm approve"}));
    expect(await screen.findByRole("alert")).toHaveTextContent("Evidence changed");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", {name: "Confirm approve"}));
    await screen.findByText("APPROVED");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("keeps keyboard focus inside the review dialog in both directions", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(() => response(review));
    vi.spyOn(HTMLElement.prototype, "getClientRects").mockReturnValue([{}] as unknown as DOMRectList);
    render(<ValidateConfigureExperience />);
    fireEvent.click(screen.getByRole("button", {name: "Load reconciled scenario"}));
    fireEvent.click(await screen.findByRole("button", {name: "Explain inventory valuation"}));
    const first = screen.getByRole("button", {name: "Close dialog"});
    const last = screen.getByRole("button", {name: "Close review"});
    first.focus();
    fireEvent.keyDown(first, {key: "Tab", shiftKey: true});
    expect(last).toHaveFocus();
    fireEvent.keyDown(last, {key: "Tab"});
    expect(first).toHaveFocus();
    fireEvent(screen.getByRole("dialog"), new Event("cancel", {bubbles: true, cancelable: true}));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
});
