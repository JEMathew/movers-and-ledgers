import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PlanMapApproveExperience } from "./PlanMapApproveExperience";

const plan = {
  id: "plan-001",
  version: "migration-plan-v1",
  status: "READY_FOR_MAPPING",
  phases: [
    {
      id: "resolve-prerequisites",
      sequence: 1,
      name: "Phase 1 — Resolve prerequisites",
      objective: "Resolve blockers before execution preparation.",
      dependencies: [],
      status: "BLOCKED",
      risks: ["Invalid customer reference"],
      customer_action: "Repair the invalid reference.",
      agent_responsible: "Planning Agent",
      approval_checkpoint: "Customer confirms prerequisite disposition",
    },
    {
      id: "review-mappings",
      sequence: 2,
      name: "Phase 2 — Review mappings",
      objective: "Review proposals.",
      dependencies: ["resolve-prerequisites"],
      status: "READY",
      risks: [],
      customer_action: "Review every mapping.",
      agent_responsible: "Mapping Agent",
      approval_checkpoint: "Authorized mapping approval",
    },
    {
      id: "prepare-migration",
      sequence: 3,
      name: "Phase 3 — Prepare migration",
      objective: "Prepare a future manifest.",
      dependencies: ["review-mappings"],
      status: "FUTURE",
      risks: ["Not implemented in this slice"],
      customer_action: "Confirm the future execution window.",
      agent_responsible: "Migration Orchestrator",
      approval_checkpoint: "Execution authorization",
    },
  ],
  blockers: [],
  risks: [],
  checkpoints: ["Authorized mapping approval"],
  approvals_required: ["All mappings reviewed"],
  customer_actions: ["Review every mapping"],
  relative_complexity: "High",
  evidence_references: ["evidence:invoices:reference"],
};

const proposal = {
  id: "mapping-001",
  version: "mapping-policy-v1",
  area: "customers",
  source_id: "customer-001",
  source_label: "Northstar Retail",
  recommended_target: "Customer",
  selected_target: "Customer",
  confidence: 0.98,
  risk: "LOW",
  evidence: ["mapping-rule:mapping-policy-v1:customers:customer-001"],
  rationale: "The source party maps directly to the canonical customer role.",
  alternatives: [],
  state: "AUTO_ACCEPTABLE",
  approval_required: true,
  policy_reasons: ["Eligible for streamlined human approval."],
  deterministic_checks: ["PASSED"],
  specialist: "entity_mapping_specialist",
};

const activity = [{
  id: "activity-001",
  occurred_at: "2026-09-27T00:00:00Z",
  agent: "planning_agent",
  action: "Generated a dependency-checked migration plan",
  tool: "build_migration_plan",
  status: "COMPLETED",
  evidence_references: ["evidence:invoices:reference"],
  risk: "HIGH",
  provenance: "DETERMINISTIC",
  customer_action_required: true,
  human_approval_required: true,
}];

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  sessionStorage.clear();
});

describe("PlanMapApproveExperience", () => {
  it("requires an assessed session and never silently creates a different business", async () => {
    const fetchMock = vi.fn(); vi.stubGlobal("fetch", fetchMock);
    render(<PlanMapApproveExperience />);
    fireEvent.click(screen.getByRole("button", {name: /Build migration plan/}));
    expect(await screen.findByRole("alert")).toHaveTextContent("same business session");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("resumes the reviewed plan and approved mappings with a read-only request", async () => {
    window.history.replaceState(null, "", "/plan-map-approve?session=session-001");
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({id:"session-001",plan,mappings:[{...proposal,state:"APPROVED"}],activity}));
    vi.stubGlobal("fetch", fetchMock);
    render(<PlanMapApproveExperience />);
    expect(await screen.findByRole("link", {name:"Continue to Migrate → Resolve"})).toHaveAttribute("href", "/migrate-resolve?session=session-001");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][1].method).toBeUndefined();
  });
  it("shows the complete migration journey and a bounded start action", () => {
    render(<PlanMapApproveExperience />);
    expect(screen.getByRole("heading", { name: "Build the governed migration handoff" })).toBeVisible();
    expect(screen.getByRole("list", { name: "Complete migration journey" })).toHaveTextContent(
      "First Productive Use",
    );
    expect(screen.getByRole("button", { name: /Build migration plan/ })).toBeEnabled();
  });

  it("builds a plan, exposes mapping evidence, and requires a human decision", async () => {
    sessionStorage.setItem("movebooks-migration-session", "session-001");
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ id: "session-001", plan: null, mappings: [], activity: [] }))
      .mockResolvedValueOnce(jsonResponse(plan))
      .mockResolvedValueOnce(jsonResponse([proposal]))
      .mockResolvedValueOnce(jsonResponse(activity));
    vi.stubGlobal("fetch", fetchMock);
    render(<PlanMapApproveExperience />);

    fireEvent.click(screen.getByRole("button", { name: /Build migration plan/ }));

    expect(await screen.findByRole("heading", { name: "Seven-phase plan" })).toBeVisible();
    expect(screen.getByText("NOT STARTED")).toBeVisible();
    expect(screen.getByRole("heading", { name: "Review mapping proposals" })).toBeVisible();
    expect(screen.getByLabelText("Northstar Retail mapping")).toHaveTextContent("Confidence 98%");
    fireEvent.click(screen.getByRole("button", { name: "Ask for explanation" }));
    expect(screen.getByText(/mapping-rule:mapping-policy-v1/)).toBeVisible();
    expect(screen.getByText("Migration remains stopped")).toBeVisible();
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(fetchMock.mock.calls.every(([url]) => String(url).includes("/migration-sessions/session-001"))).toBe(true);
  });

  it("records an approval and shows a ready handoff without executing migration", async () => {
    sessionStorage.setItem("movebooks-migration-session", "session-001");
    const approved = { ...proposal, state: "APPROVED", decided_by: "demo-user" };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ id: "session-001", plan: null, mappings: [], activity: [] }))
      .mockResolvedValueOnce(jsonResponse(plan))
      .mockResolvedValueOnce(jsonResponse([proposal]))
      .mockResolvedValueOnce(jsonResponse(activity))
      .mockResolvedValueOnce(jsonResponse(approved))
      .mockResolvedValueOnce(jsonResponse(activity));
    vi.stubGlobal("fetch", fetchMock);
    render(<PlanMapApproveExperience />);
    fireEvent.click(screen.getByRole("button", { name: /Build migration plan/ }));
    await screen.findByRole("heading", { name: "Review mapping proposals" });

    fireEvent.click(screen.getByRole("button", { name: "Approve" }));

    expect(await screen.findByText("Approved manifest ready for handoff")).toBeVisible();
    expect(screen.getByRole("link", {name: "Continue to Migrate → Resolve"})).toHaveAttribute("href", "/migrate-resolve?session=session-001");
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(6));
  });

  it("shows an API failure as a safe stop", async () => {
    sessionStorage.setItem("movebooks-migration-session", "session-001");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ detail: "Policy unavailable" }, 503)));
    render(<PlanMapApproveExperience />);
    fireEvent.click(screen.getByRole("button", { name: /Build migration plan/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Policy unavailable");
    expect(screen.queryByRole("heading", { name: "Review mapping proposals" })).not.toBeInTheDocument();
  });
});
