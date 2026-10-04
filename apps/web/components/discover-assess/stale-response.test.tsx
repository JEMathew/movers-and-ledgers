import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DiscoverAssessExperience } from "./DiscoverAssessExperience";
import { MyMigration } from "@/components/MyMigration";
import { ValidateConfigureExperience } from "@/components/validate-configure/ValidateConfigureExperience";

const HARBOR = "11111111-1111-4111-8111-111111111111";
const NORTHSTAR = "22222222-2222-4222-8222-222222222222";
const json = (value: unknown, status = 200) => ({ ok: status < 400, status, json: async () => value });
const discovery = (company: string, blockers: number) => ({
  company_name: company, fixture_version: "v1", synthetic: true, profiles: [],
  findings: Array.from({ length: blockers }, (_, i) => ({ id: `f${i}`, category: "BLOCKER", title: "Invoices reference a missing customer", recommended_action: "Correct the invoice.", rule_code: "R1", affected_entity: "invoices", explanation: "", evidence: [], tool: "check", customer_action_required: true })),
});
const assessment = (blockers: number) => ({ readiness: blockers ? "BLOCKED" : "READY", blocker_count: blockers, warning_count: 0, decision_basis: [], recommended_next_actions: [], ready_areas: [], policy_version: "p1" });

afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); sessionStorage.clear(); window.history.replaceState(null, "", "/"); });

describe("superseded Assess responses", () => {
  it("never let a late read of an older migration replace the one just assessed", async () => {
    window.history.replaceState(null, "", `/assess?session=${HARBOR}`);
    let releaseHarbor: (value: unknown) => void = () => undefined;
    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      if (url.endsWith(`/migration-sessions/${HARBOR}`)) return new Promise(resolve => { releaseHarbor = resolve; });
      if (url.endsWith("/migration-sessions") && init?.method === "POST") return Promise.resolve(json({ id: NORTHSTAR }, 201));
      if (url.endsWith(`${NORTHSTAR}/discovery`)) return Promise.resolve(json(discovery("Northstar Supplies", 1)));
      if (url.endsWith(`${NORTHSTAR}/assessment`)) return Promise.resolve(json(assessment(1)));
      if (url.endsWith(`${NORTHSTAR}/activity`)) return Promise.resolve(json([]));
      throw new Error(`unexpected ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<DiscoverAssessExperience />);

    // While Harbor Light is still loading, the user starts a new Northstar assessment.
    fireEvent.click(screen.getByRole("button", { name: /Check If My Books Are Ready to Migrate/ }));
    expect(await screen.findByText("Northstar Supplies has 1 blocker to fix before migration.")).toBeVisible();

    // The old Harbor Light response finally arrives, and must change nothing.
    await act(async () => releaseHarbor(json({
      id: HARBOR, sample_company_id: "harbor-light-migrate-demo", workflow_status: "ASSESSED",
      discovery: discovery("Harbor Light Books", 0), assessment: assessment(0), activity: [],
    })));
    expect(screen.getByText("Northstar Supplies has 1 blocker to fix before migration.")).toBeVisible();
    expect(screen.queryByText(/Harbor Light Books (is ready|has)/)).not.toBeInTheDocument();
    expect(window.location.search).toBe(`?session=${NORTHSTAR}`);
    expect(sessionStorage.getItem("movebooks-migration-session")).toBe(NORTHSTAR);
    expect(screen.getAllByRole("listitem").find(item => item.textContent?.startsWith("Assess"))).toHaveTextContent("AssessBlocked");
    // A superseded request is not an error.
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    // The older request was cancelled.
    const harborCall = fetchMock.mock.calls.find(([url]) => String(url).endsWith(HARBOR));
    expect((harborCall?.[1] as RequestInit | undefined)?.signal?.aborted).toBe(true);

    // My Migration then opens Northstar, the migration the user chose last.
    cleanup();
    window.history.replaceState(null, "", "/workspace");
    const read = vi.fn<(url: string) => Promise<Response>>(() => Promise.resolve(new Response(JSON.stringify({ id: NORTHSTAR, synthetic: true, workflow_status: "ASSESSED", activity: [], human_decisions: [], events: [], validation_reports: [] }))));
    vi.stubGlobal("fetch", read);
    render(<MyMigration />);
    await waitFor(() => expect(read).toHaveBeenCalled());
    expect(String(read.mock.calls[0][0])).toContain(`/migration-sessions/${NORTHSTAR}/intake-trust`);
  });
});

describe("superseded stage reads", () => {
  it("ignore a late initial read once the user has loaded a different scenario", async () => {
    const OLD = "33333333-3333-4333-8333-333333333333";
    const NEW = "44444444-4444-4444-8444-444444444444";
    sessionStorage.setItem("movebooks-migration-session", OLD);
    const snapshot = (id: string, company: string) => ({ session_id: id, company_name: company, workflow_status: "MIGRATION_COMPLETE", repairs: [], resolutions: [], activity: [], ready_for_onboarding: false });
    let releaseOld: (value: unknown) => void = () => undefined;
    vi.stubGlobal("fetch", vi.fn((url: string) => url.includes(`/${OLD}/`)
      ? new Promise(resolve => { releaseOld = resolve; })
      : Promise.resolve(json(snapshot(NEW, "Scenario Books")))));
    render(<ValidateConfigureExperience />);
    fireEvent.click(screen.getByRole("button", { name: "Load discrepancy scenario" }));
    expect(await screen.findByText(/Scenario Books/)).toBeVisible();
    await act(async () => releaseOld(json(snapshot(OLD, "Old Books"))));
    expect(screen.getByText(/Scenario Books/)).toBeVisible();
    expect(screen.queryByText(/Old Books/)).not.toBeInTheDocument();
    expect(sessionStorage.getItem("movebooks-migration-session")).toBe(NEW);
  });
});
