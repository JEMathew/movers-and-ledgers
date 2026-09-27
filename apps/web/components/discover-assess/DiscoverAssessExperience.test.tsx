import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DiscoverAssessExperience } from "./DiscoverAssessExperience";

const discovery = {
  fixture_version: "northstar-supplies-v1",
  sample_company_id: "northstar-supplies",
  company_name: "Northstar Supplies",
  synthetic: true,
  tools_called: ["profile_dataset", "validate_schema"],
  profiles: [{
    dataset: "customers",
    label: "Customers",
    record_count: 3,
    missing_values: {},
    duplicate_candidates: 2,
    referential_integrity_issues: 0,
    unsupported_items: 0,
    status: "NEEDS ATTENTION",
    evidence_ids: ["evidence:customers:profile_dataset"],
  }],
  findings: [{
    id: "finding:001:duplicate_candidates",
    rule_code: "DUPLICATE_CANDIDATES",
    category: "WARNING",
    title: "Potential duplicate customers need review",
    explanation: "Two records share a deterministic canonical name.",
    affected_entity: "customers",
    affected_record_count: 2,
    evidence: ["evidence:customers:detect_duplicates", "customer-001 and customer-002"],
    recommended_action: "Review the candidate records.",
    provenance: "DETERMINISTIC",
    tool: "detect_duplicates",
    customer_action_required: true,
  }],
};

const assessment = {
  readiness: "NEEDS ATTENTION",
  policy_version: "discover-assess-readiness-v1",
  blocker_count: 0,
  warning_count: 1,
  ready_areas: [],
  unresolved_areas: ["Potential duplicate customers need review"],
  recommended_next_actions: ["Review the candidate records."],
  decision_basis: ["0 deterministic blocker(s)", "1 deterministic warning(s)"],
  target_assumptions: ["No target writes occur during Discover → Assess."],
  score: null,
};

const activity = [{
  id: "activity-001",
  occurred_at: "2026-09-27T00:00:00Z",
  agent: "discovery_agent",
  action: "Checked customers",
  tool: "detect_duplicates",
  status: "COMPLETED",
  evidence_references: ["evidence:customers:detect_duplicates"],
  risk: "MEDIUM",
  provenance: "DETERMINISTIC",
  customer_action_required: true,
  human_approval_required: false,
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

describe("DiscoverAssessExperience", () => {
  it("creates Harbor Light from discovery rather than a reviewed demo loader", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({id:"session-harbor"},201))
      .mockResolvedValueOnce(jsonResponse(discovery))
      .mockResolvedValueOnce(jsonResponse(assessment))
      .mockResolvedValueOnce(jsonResponse(activity));
    vi.stubGlobal("fetch",fetchMock);
    render(<DiscoverAssessExperience />);
    fireEvent.change(screen.getByRole("combobox",{name:"Synthetic business"}),{target:{value:"harbor-light-migrate-demo"}});
    fireEvent.click(screen.getByRole("button",{name:"Assess this migration"}));
    await screen.findByRole("heading",{name:"Migration readiness"});
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({sample_company_id:"harbor-light-migrate-demo"});
    expect(fetchMock.mock.calls[0][0]).toMatch(/\/v1\/migration-sessions$/);
  });
  it("starts with a synthetic company and routes uploads through controlled intake", () => {
    render(<DiscoverAssessExperience />);
    expect(screen.getByRole("heading", { name: "Assess My Migration" })).toBeVisible();
    expect(screen.getByRole("combobox", { name: "Synthetic business" })).toHaveValue("northstar-supplies");
    expect(screen.getByRole("link", { name: "Try Your Data" })).toHaveAttribute("href", "/try-your-data");
    expect(screen.getByRole("list", { name: "Assessment progress" })).toBeVisible();
  });

  it("labels uploaded source honestly and retries failed reads without creating a sample", async () => {
    window.history.replaceState(null, "", "?session=upload-session");
    const fetchMock = vi.fn().mockResolvedValueOnce(jsonResponse({ detail: "Temporarily unavailable" }, 503))
      .mockResolvedValueOnce(jsonResponse({ id: "upload-session", sample_company_id: "user-upload", discovery: { ...discovery, synthetic: false }, assessment, activity }));
    vi.stubGlobal("fetch", fetchMock);
    render(<DiscoverAssessExperience/>);
    await screen.findByText("Temporarily unavailable");
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    await screen.findByText("Current workspace: user-provided source");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls.every(call => call[0].endsWith("/migration-sessions/upload-session") && !call[1]?.method)).toBe(true);
    expect(screen.getByRole("combobox", {name: "Synthetic business"})).toHaveValue("northstar-supplies");
  });

  it("runs the API-backed journey and hands off to the governed planning workspace", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ id: "session-001" }, 201))
      .mockResolvedValueOnce(jsonResponse(discovery))
      .mockResolvedValueOnce(jsonResponse(assessment))
      .mockResolvedValueOnce(jsonResponse(activity))
      .mockResolvedValueOnce(jsonResponse({ id: "event-001" }, 201));
    vi.stubGlobal("fetch", fetchMock);
    render(<DiscoverAssessExperience />);

    fireEvent.click(screen.getByRole("button", { name: /Assess this migration/ }));

    expect(await screen.findByRole("heading", { name: "Migration readiness" })).toBeVisible();
    expect(screen.getAllByText("NEEDS ATTENTION").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Potential duplicate customers need review").length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: "Activity and evidence" })).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: /Continue to Planning/ }));
    expect(screen.getByText("Planning is the next governed phase")).toBeVisible();
    expect(screen.getByRole("link", { name: /Open Plan & Map workspace/ })).toHaveAttribute(
      "href",
      "/plan-map-approve?session=session-001",
    );
    expect(sessionStorage.getItem("movebooks-migration-session")).toBe("session-001");
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(5));
    expect(fetchMock.mock.calls[4][1]?.body).toContain("continue_to_plan_selected");
  });

  it("shows a recoverable error without inventing results", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ detail: "API unavailable" }, 503)));
    render(<DiscoverAssessExperience />);
    fireEvent.click(screen.getByRole("button", { name: /Assess this migration/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent("API unavailable");
    expect(screen.queryByRole("heading", { name: "Migration readiness" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeEnabled();
  });
});
