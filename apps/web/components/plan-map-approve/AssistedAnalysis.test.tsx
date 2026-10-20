import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { AssistedAnalysis, type Analysis } from "./AssistedAnalysis";
import { MappingReview } from "./MappingReview";
import type { MappingProposal } from "./types";

vi.mock("@/lib/identity", () => ({ authHeaders: async () => ({ Authorization: "test-only" }) }));
const id = "11111111-1111-4111-8111-111111111111";
const record = {
  state: "FALLBACK", provider: "deterministic-fallback", model: null,
  requested_at: "2026-10-20T08:00:00Z", context_hash: "test-snapshot",
  failure_category: "live_disabled", evidence: [{ reference: "mapping:1", observation: "Source purpose absent" }],
};
const result: Analysis = {
  advisor: { ...record, advice: {
    observation: "Misc Clearing candidate", recommendation: "Inspect source purpose.",
    rationale: "A compatible type does not establish purpose.", uncertainty: ["Settlement history absent."],
    evidence_references: ["mapping:1"],
  } },
  reviewer: { ...record, finding: {
    recommendation_outcome: "QUESTION", outcome: "CHALLENGED", summary: "The candidate remains unproven.",
    concerns: ["Source evidence is missing."], uncertainty: ["Ask the accountant."],
    evidence_references: ["mapping:1"],
  } },
};
beforeEach(() => window.history.replaceState(null, "", `/plan-map-approve?session=${id}`));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

it.each([
  [undefined, "account-clearing", false],
  ["true", "account-bank", false],
  ["true", "account-clearing", true],
] as const)("limits the panel to opt-in supported mapping (%s, %s)", (flag, source, shown) => {
  vi.stubEnv("NEXT_PUBLIC_SYNTHETIC_ANALYSIS_ENABLED", flag);
  const mapping = {
    id, source_id: source, source_label: "1200 · Misc Clearing", area: "chart_of_accounts",
    state: "REVIEW_REQUIRED", selected_target: "Other Current Asset", supported_targets: ["Other Current Asset"],
    evidence: [], policy_reasons: [], risk: "MEDIUM", confidence: 0.76,
  } as unknown as MappingProposal;
  render(<MappingReview mappings={[mapping]} history={[]} editable={false} busy={false} planApproved={false}
    decide={vi.fn()} reconsider={vi.fn()} runBulk={vi.fn()} onReviewPlan={vi.fn()} />);
  expect(screen.queryByRole("button", { name: "Run AI-Assisted Analysis" }) !== null).toBe(shown);
  expect(screen.getByText("Planned · not available in the Beta")).toBeVisible();
});

it("requires a click, sends explicit confirmation, and separates advisory results", async () => {
  const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => result });
  vi.stubGlobal("fetch", fetcher);
  render(<AssistedAnalysis mappingId={id} />);
  expect(fetcher).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Run AI-Assisted Analysis" }));
  const advisor = await screen.findByRole("region", { name: "Advisor result" });
  const reviewer = screen.getByRole("region", { name: "Reviewer result" });
  expect(within(advisor).getByText(/Inspect source purpose/)).toBeVisible();
  expect(within(reviewer).getByText(/Recommendation assessment: QUESTION/)).toBeVisible();
  expect(screen.getAllByText("Deterministic fallback · no accepted AI result")).toHaveLength(2);
  expect(screen.getByRole("status")).toHaveTextContent("Your approval is still required");
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(fetcher.mock.calls[0][0]).toContain(`/analysis/mapping/${id}`);
  expect(JSON.parse(fetcher.mock.calls[0][1].body)).toEqual({ request_id: expect.any(String), confirmed: true });
  expect(screen.queryByRole("button", { name: /approve|post|change mapping/i })).toBeNull();
  expect(screen.getAllByText("Evidence supplied and cited")).toHaveLength(2);
});

it("labels genuine provider success separately from fallback without changing product status", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({
    ...result, advisor: { ...result.advisor, state: "ESCALATED", model: "gemini-test-model", provider: "gemini-adk", failure_category: null },
  }) }));
  render(<AssistedAnalysis mappingId={id} />);
  fireEvent.click(screen.getByRole("button", { name: "Run AI-Assisted Analysis" }));
  expect(await screen.findByText("Gemini · gemini-test-model · validated advisory output")).toBeVisible();
  expect(screen.getByText("Deterministic fallback · no accepted AI result")).toBeVisible();
});

it("does not display either result after evidence changes", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({
    ...result, reviewer: { ...result.reviewer, state: "UNAVAILABLE" },
  }) }));
  render(<AssistedAnalysis mappingId={id} />);
  fireEvent.click(screen.getByRole("button", { name: "Run AI-Assisted Analysis" }));
  await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Evidence changed"));
  expect(screen.queryByRole("region", { name: "Advisor result" })).toBeNull();
  expect(screen.queryByRole("region", { name: "Reviewer result" })).toBeNull();
});

it("reuses request identity after uncertain failure and exposes safe recovery", async () => {
  const fetcher = vi.fn().mockRejectedValue(new Error("secret-canary"));
  vi.stubGlobal("fetch", fetcher);
  render(<AssistedAnalysis mappingId={id} />);
  fireEvent.click(screen.getByRole("button", { name: "Run AI-Assisted Analysis" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("request human review");
  fireEvent.click(screen.getByRole("button", { name: "Run AI-Assisted Analysis" }));
  await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));
  expect(fetcher.mock.calls[0][1].body).toEqual(fetcher.mock.calls[1][1].body);
  expect(document.body).not.toHaveTextContent("secret-canary");
});

it("discards an in-flight response when the workspace changes", async () => {
  let finish!: (value: unknown) => void;
  const fetcher = vi.fn(() => new Promise(resolve => { finish = resolve; }));
  vi.stubGlobal("fetch", fetcher);
  render(<AssistedAnalysis mappingId={id} />);
  fireEvent.click(screen.getByRole("button", { name: "Run AI-Assisted Analysis" }));
  await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));
  expect(screen.getByRole("button", { name: "Analyzing and reviewing…" })).toBeDisabled();
  window.history.replaceState(null, "", "/plan-map-approve?session=22222222-2222-4222-8222-222222222222");
  finish({ ok: true, json: async () => result });
  await waitFor(() => expect(screen.getByRole("button", { name: "Run AI-Assisted Analysis" })).toBeEnabled());
  expect(screen.queryByRole("region", { name: "Advisor result" })).toBeNull();
});

it("aborts the request on unmount", async () => {
  const fetcher = vi.fn(() => new Promise(() => {}));
  vi.stubGlobal("fetch", fetcher);
  const view = render(<AssistedAnalysis mappingId={id} />);
  fireEvent.click(screen.getByRole("button", { name: "Run AI-Assisted Analysis" }));
  await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));
  view.unmount();
  const signal = (fetcher.mock.calls as unknown as [string, RequestInit][])[0][1].signal;
  expect(signal?.aborted).toBe(true);
});
