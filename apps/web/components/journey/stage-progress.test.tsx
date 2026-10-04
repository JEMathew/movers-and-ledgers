import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { ComponentType } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MigrateResolveExperience } from "@/components/migrate-resolve/MigrateResolveExperience";
import { OnboardFpuExperience } from "@/components/onboard-fpu/OnboardFpuExperience";
import { PlanMapApproveExperience } from "@/components/plan-map-approve/PlanMapApproveExperience";
import { ValidateConfigureExperience } from "@/components/validate-configure/ValidateConfigureExperience";
import { DiscoverAssessExperience } from "@/components/discover-assess/DiscoverAssessExperience";
import { MyMigration } from "@/components/MyMigration";

const id = "33333333-3333-4333-8333-333333333333";
const steps = () => within(screen.getByRole("list", { name: "Migration Journey" })).getAllByRole("listitem");

afterEach(() => { vi.restoreAllMocks(); sessionStorage.clear(); window.history.replaceState(null, "", "/"); });

describe("failed deep links", () => {
  const expired = "44444444-4444-4444-8444-444444444444";
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
  const assertUnconfirmed = () => {
    expect(steps().some(step => step.hasAttribute("aria-current") || step.classList.contains("is-complete"))).toBe(false);
    expect(screen.getByText(/^(Checking your progress…|Progress unavailable · nothing is assumed)$/)).toBeVisible();
  };

  it.each([404, 500])("keeps the selected migration and prevents Plan advances after a failed read (%s)", async status => {
    sessionStorage.setItem("movebooks-migration-session", id);
    window.history.replaceState(null, "", `/plan-map-approve?session=${expired}`);
    let finishRead!: (response: Response) => void;
    const fetch = vi.spyOn(globalThis, "fetch")
      .mockImplementationOnce(() => new Promise<Response>(resolve => { finishRead = resolve; }))
      .mockResolvedValue(json({ id, synthetic: true, workflow_status: "ASSESSED" }));
    const plan = render(<PlanMapApproveExperience />);
    const advance = screen.getByRole("button", { name: "Create My Migration Plan" });
    assertUnconfirmed();
    expect(advance).toBeDisabled();
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    await act(async () => finishRead(json({ detail: "Session unavailable" }, status)));
    expect(await screen.findByRole("alert")).toHaveTextContent("Session unavailable");
    fireEvent.click(advance);
    assertUnconfirmed();
    expect(advance).toBeDisabled();
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(sessionStorage.getItem("movebooks-migration-session")).toBe(id);
    plan.unmount();
    window.history.replaceState(null, "", "/workspace");
    render(<MyMigration />);
    expect(await screen.findByRole("link", { name: "Create My Migration Plan" })).toHaveAttribute("href", `/plan-map-approve?session=${id}`);
    expect(String(fetch.mock.calls[1][0])).toContain(`/migration-sessions/${id}/intake-trust`);
  });

  it.each([
    { id: expired, synthetic: true, workflow_status: "UNRECOGNISED" },
    { id, synthetic: true, workflow_status: "ASSESSED" },
    { id: expired, synthetic: false, workflow_status: "ASSESSED" },
  ])("rejects unsupported Plan evidence without adopting it ($workflow_status / $id / $synthetic)", async evidence => {
    sessionStorage.setItem("movebooks-migration-session", id);
    window.history.replaceState(null, "", `/plan-map-approve?session=${expired}`);
    vi.spyOn(globalThis, "fetch").mockResolvedValue(json({ ...evidence, mappings: [], activity: [] }));
    render(<PlanMapApproveExperience />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Unsupported session evidence");
    expect(sessionStorage.getItem("movebooks-migration-session")).toBe(id);
    expect(screen.getByRole("button", { name: "Create My Migration Plan" })).toBeDisabled();
    assertUnconfirmed();
  });

  it("does not write the selected migration when Plan creation fails", async () => {
    window.history.replaceState(null, "", `/plan-map-approve?session=${id}`);
    const fetch = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(json({ id, synthetic: true, workflow_status: "ASSESSED", mappings: [], activity: [] }))
      .mockResolvedValueOnce(json({ detail: "Plan unavailable" }, 500));
    render(<PlanMapApproveExperience />);
    const advance = screen.getByRole("button", { name: "Create My Migration Plan" });
    await waitFor(() => expect(advance).toBeEnabled());
    // Another navigation may have selected a different valid migration since the read.
    sessionStorage.setItem("movebooks-migration-session", expired);
    fireEvent.click(advance);
    expect(await screen.findByRole("alert")).toHaveTextContent("Plan unavailable");
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(sessionStorage.getItem("movebooks-migration-session")).toBe(expired);
  });

  it.each([404, 500])("keeps Assess progress unconfirmed during loading and after a failed read (%s)", async status => {
    window.history.replaceState(null, "", `/assess?session=${expired}`);
    let finishRead!: (response: Response) => void;
    const fetch = vi.spyOn(globalThis, "fetch").mockImplementation(() => new Promise<Response>(resolve => { finishRead = resolve; }));
    render(<DiscoverAssessExperience />);
    assertUnconfirmed();
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    await act(async () => finishRead(json({ detail: "Session unavailable" }, status)));
    expect(await screen.findByRole("alert")).toHaveTextContent("Session unavailable");
    assertUnconfirmed();
  });
});

// Each stage used to show its own position, with every earlier step "Completed", before
// (or without) a successful session read. Progress now waits for authoritative evidence.
describe.each([
  ["Plan", PlanMapApproveExperience],
  ["Migrate", MigrateResolveExperience],
  ["Validate", ValidateConfigureExperience],
  ["Onboard", OnboardFpuExperience],
] as [string, ComponentType][])("%s stage journey", (_name, Stage) => {
  it.each([404, 500])("claims no progress while loading or when the session cannot be read (%s)", async status => {
    sessionStorage.setItem("movebooks-migration-session", id);
    const fetch = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ detail: "Session unavailable" }), { status }));
    render(<Stage />);
    const assertNoProgress = () => {
      expect(steps().some(step => step.hasAttribute("aria-current") || step.classList.contains("is-complete"))).toBe(false);
      expect(screen.getByText(/^(Checking your progress…|Progress unavailable · nothing is assumed)$/)).toBeVisible();
    };
    assertNoProgress();
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    await new Promise(resolve => setTimeout(resolve, 0));
    assertNoProgress();
    expect(screen.queryByText("Completed")).not.toBeInTheDocument();
  });
});

// A successful read of an earlier-stage migration must not let a later stage page claim its own position.
describe.each([
  ["Plan", PlanMapApproveExperience, "CREATED", 0],
  ["Migrate", MigrateResolveExperience, "ASSESSED", 1],
  ["Validate", ValidateConfigureExperience, "ASSESSED", 1],
  ["Onboard", OnboardFpuExperience, "ASSESSED", 1],
] as [string, ComponentType, string, number][])("%s stage with an earlier migration", (_name, Stage, status, expected) => {
  it(`shows the migration's actual step for ${status}`, async () => {
    sessionStorage.setItem("movebooks-migration-session", id);
    vi.spyOn(globalThis, "fetch").mockImplementation(() => Promise.resolve(new Response(JSON.stringify({
      id, synthetic: true, session_id: id, company_name: "Harbor Light Books", workflow_status: status, effective_status: status,
      activity: [], mappings: [], human_decisions: [], repairs: [], resolutions: [], tasks: [], customers: [], products: [],
      onboarding: null, ready: false, verified_fpu: false, ready_for_onboarding: false,
    }), { status: 200, headers: { "Content-Type": "application/json" } })));
    render(<Stage />);
    await waitFor(() => expect(steps()[expected]).toHaveAttribute("aria-current", "step"));
    expect(steps().filter(step => step.classList.contains("is-complete"))).toHaveLength(expected);
  });
});
