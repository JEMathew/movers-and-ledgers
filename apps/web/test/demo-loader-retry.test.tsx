import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { OnboardFpuExperience } from "@/components/onboard-fpu/OnboardFpuExperience";
import { ValidateConfigureExperience } from "@/components/validate-configure/ValidateConfigureExperience";

beforeEach(() => {
  sessionStorage.clear();
  window.history.replaceState(null, "", "/");
});
afterEach(() => vi.restoreAllMocks());

it.each([
  ["onboarding", OnboardFpuExperience, "Load synthetic scenario"],
  ["validation", ValidateConfigureExperience, "Load reconciled scenario"],
] as const)("%s loader retains an intent after a lost response", async (_, Component, label) => {
  const data = {
    session_id: "synthetic-session", company_name: "Synthetic", workflow_status: "MIGRATION_COMPLETE",
    effective_status: "ONBOARDING", ready: false, verified_fpu: false, tasks: [],
    customers: [], products: [], activity: [], repairs: [], resolutions: [], ready_for_onboarding: false,
  };
  const fetchMock = vi.spyOn(globalThis, "fetch")
    .mockResolvedValueOnce(new Response(JSON.stringify({ detail: "Temporary failure" }), { status: 503 }))
    .mockImplementation(() => Promise.resolve(new Response(JSON.stringify(data), { status: 201 })));
  render(<Component />);
  fireEvent.click(screen.getByRole("button", { name: label }));
  await screen.findByRole("alert");
  fireEvent.click(screen.getByRole("button", { name: label }));
  await waitFor(() => expect(screen.getByRole("button", { name: label })).toBeEnabled());
  const keys = () => fetchMock.mock.calls.map(call => new Headers(call[1]?.headers).get("Idempotency-Key"));
  expect(keys()[0]).toBeTruthy();
  expect(keys()[1]).toBe(keys()[0]);
  fireEvent.click(screen.getByRole("button", { name: label }));
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
  expect(keys()[2]).not.toBe(keys()[0]);
});
