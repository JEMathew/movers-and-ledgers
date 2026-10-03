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
