import { render, screen, waitFor, within } from "@testing-library/react";
import type { ComponentType } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MigrateResolveExperience } from "@/components/migrate-resolve/MigrateResolveExperience";
import { OnboardFpuExperience } from "@/components/onboard-fpu/OnboardFpuExperience";
import { PlanMapApproveExperience } from "@/components/plan-map-approve/PlanMapApproveExperience";
import { ValidateConfigureExperience } from "@/components/validate-configure/ValidateConfigureExperience";

const id = "33333333-3333-4333-8333-333333333333";
const steps = () => within(screen.getByRole("list", { name: "Migration journey" })).getAllByRole("listitem");

afterEach(() => { vi.restoreAllMocks(); sessionStorage.clear(); window.history.replaceState(null, "", "/"); });

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
      expect(screen.getByText("Progress not confirmed · nothing is assumed")).toBeVisible();
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
      id, session_id: id, company_name: "Harbor Light Books", workflow_status: status, effective_status: status,
      activity: [], mappings: [], human_decisions: [], repairs: [], resolutions: [], tasks: [], customers: [], products: [],
      onboarding: null, ready: false, verified_fpu: false, ready_for_onboarding: false,
    }), { status: 200, headers: { "Content-Type": "application/json" } })));
    render(<Stage />);
    await waitFor(() => expect(steps()[expected]).toHaveAttribute("aria-current", "step"));
    expect(steps().filter(step => step.classList.contains("is-complete"))).toHaveLength(expected);
  });
});
