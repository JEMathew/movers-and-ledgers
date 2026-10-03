import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
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
    const journey = screen.getByRole("list", { name: "Migration journey" });
    expect(journey).toBeVisible();
    expect(journey.querySelector('[aria-current="step"]')).toBeNull();
    expect(screen.getByText("Progress not confirmed · nothing is assumed")).toBeVisible();
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

  it.each([
    ["CREATED", undefined],
    ["DISCOVERED", "discovered"],
  ])("resumes a %s migration in the same session instead of creating a new one", async (_status, found) => {
    sessionStorage.clear();
    window.history.replaceState(null, "", "?session=session-777");
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ id: "session-777", sample_company_id: "harbor-light-migrate-demo", activity: [], ...(found ? { discovery } : {}) }))
      .mockResolvedValueOnce(jsonResponse(discovery))
      .mockResolvedValueOnce(jsonResponse(assessment))
      .mockResolvedValueOnce(jsonResponse(activity));
    vi.stubGlobal("fetch", fetchMock);
    render(<DiscoverAssessExperience />);

    const resume = await screen.findByRole("button", { name: /Continue this assessment/ });
    expect(resume).not.toHaveClass("secondary");
    // Starting over stays available, but only as a separate, secondary action.
    expect(screen.getByRole("button", { name: /Start a new assessment/ })).toHaveClass("secondary");
    expect(screen.queryByRole("button", { name: /Assess this migration/ })).not.toBeInTheDocument();
    fireEvent.click(resume);

    expect(await screen.findByRole("heading", { name: "Migration readiness" })).toBeVisible();
    const urls = fetchMock.mock.calls.map(call => String(call[0]));
    expect(urls.slice(1)).toEqual([
      expect.stringMatching(/\/v1\/migration-sessions\/session-777\/discovery$/),
      expect.stringMatching(/\/v1\/migration-sessions\/session-777\/assessment$/),
      expect.stringMatching(/\/v1\/migration-sessions\/session-777\/activity$/),
    ]);
    expect(urls.some(url => url.endsWith("/v1/migration-sessions"))).toBe(false);
    expect(window.location.search).toBe("?session=session-777");
    expect(sessionStorage.getItem("movebooks-migration-session")).toBe("session-777");
    expect(screen.getByRole("link", { name: "Create my migration plan" })).toHaveAttribute("href", "/plan-map-approve?session=session-777");
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
    expect(screen.getByText("Northstar Supplies can move forward. 1 item needs your review first.")).toBeVisible();
    expect(screen.getAllByText("NEEDS ATTENTION").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Potential duplicate customers need review").length).toBeGreaterThan(0);
    // Technical evidence is available but secondary.
    expect(screen.getByRole("heading", { name: "Activity and evidence" })).not.toBeVisible();
    fireEvent.click(screen.getByText("Show technical evidence"));
    expect(screen.getByRole("heading", { name: "Activity and evidence" })).toBeVisible();

    const cta = screen.getByRole("link", { name: "Create my migration plan" });
    expect(cta).toHaveAttribute("href", "/plan-map-approve?session=session-001");
    cta.addEventListener("click", event => event.preventDefault());
    fireEvent.click(cta);
    expect(sessionStorage.getItem("movebooks-migration-session")).toBe("session-001");
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(5));
    expect(fetchMock.mock.calls[4][1]?.body).toContain("continue_to_plan_selected");
  });

  it("leads with outcome, readiness, blockers and one next action before any technical evidence", async () => {
    const blocker = { ...discovery.findings[0], id: "finding:002", category: "BLOCKER", title: "An invoice references a missing customer", recommended_action: "Restore the customer or correct the invoice." };
    window.history.replaceState(null, "", "?session=session-002");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({
      id: "session-002", sample_company_id: "northstar-supplies", activity,
      discovery: { ...discovery, findings: [discovery.findings[0], blocker] },
      assessment: { ...assessment, readiness: "BLOCKED", blocker_count: 1 },
    })));
    render(<DiscoverAssessExperience />);
    const readiness = await screen.findByRole("heading", { name: "Migration readiness" });
    expect(screen.getByText("Northstar Supplies has 1 readiness blocker to resolve before anything moves.")).toBeVisible();
    const issues = screen.getByRole("heading", { name: "What needs attention" });
    const cta = screen.getByRole("link", { name: "Review 1 readiness issue" });
    const evidence = screen.getByText("Show technical evidence");
    const source = screen.getByRole("heading", { name: "Assess another source" });
    const follows = (a: Element, b: Element) => Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
    expect(follows(readiness, issues) && follows(issues, cta) && follows(cta, evidence) && follows(evidence, source)).toBe(true);
    expect(cta).toHaveAttribute("href", "/plan-map-approve?session=session-002");
    expect(within(screen.getByRole("region", { name: "What needs attention" })).getByText("Restore the customer or correct the invoice.")).toBeVisible();
    // The CTA reviews blockers; it never claims a repair this product cannot perform.
    expect(screen.getByText(/Migration stays blocked until the source data is corrected; nothing here can waive a blocker/)).toBeVisible();
    expect(screen.queryByRole("link", { name: /^Resolve/ })).not.toBeInTheDocument();
    expect(screen.getByText("No mapping, target write or approval has happened yet.")).toBeVisible();
    expect(screen.getAllByRole("link").filter(link => link.classList.contains("button") && !link.classList.contains("secondary"))).toEqual([cta]);
    expect(screen.getByRole("button", { name: /Start a new assessment/ })).toHaveClass("secondary");
    expect(screen.getByRole("list", { name: "Migration journey" }).querySelector('[aria-current="step"]')).toHaveTextContent("PlanCurrent");
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
