import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { AssistedAnalysis, type Analysis } from "./AssistedAnalysis";
import { MappingReview } from "./MappingReview";
import type { MappingProposal } from "./types";
import liveEvidence from "../../../../tests/fixtures/gemini-recorded-pair.json";
import { authHeaders, prepareGoogleIdentity, type GoogleIdentityRuntime } from "@/lib/identity";

vi.mock("@/lib/identity", () => ({
  authHeaders: vi.fn(async () => ({ Authorization: "test-only" })),
  cloudIdentity: () => process.env.NEXT_PUBLIC_IDENTITY_MODE === "firebase",
  prepareGoogleIdentity: vi.fn(),
}));
const id = "11111111-1111-4111-8111-111111111111";
// Keep the generation assertions scoped to POSTs; authenticated opening now reads history.
function mockFetch(fetcher: (url: RequestInfo | URL, init?: RequestInit) => Promise<unknown>) {
  vi.stubGlobal("fetch", (url: RequestInfo | URL, init?: RequestInit) => init?.method === "GET"
    ? Promise.resolve({ ok: true, json: async () => ({ id, synthetic: true,
      mappings: [{ id, source_id: "account-clearing" }], reasoning_records: [], review_records: [] }) } as Response)
    : fetcher(url, init));
}
const record = {
  request_id: id,
  state: "FALLBACK", provider: "deterministic-fallback", model: null,
  requested_at: "2026-10-20T08:00:00Z", context_hash: "test-snapshot",
  failure_category: "live_disabled", evidence: [{ reference: `mapping:${id}`, observation: "Source purpose absent" }],
};
const authority = { human_approval_required: true, financial_authority: false } as const;
const result: Analysis = {
  ...authority, case_id: "account-clearing",
  advisor: { ...record, advice: {
    ...authority,
    observation: "Misc Clearing candidate", recommendation: "Inspect source purpose.",
    rationale: "A compatible type does not establish purpose.", uncertainty: ["Settlement history absent."],
    evidence_references: [`mapping:${id}`],
  } },
  reviewer: { ...record, mapping_id: id, advisor_request_id: id, finding: {
    ...authority,
    recommendation_outcome: "QUESTION", outcome: "CHALLENGED", summary: "The candidate remains unproven.",
    concerns: ["Source evidence is missing."], uncertainty: ["Ask the accountant."],
    evidence_references: [`mapping:${id}`],
  } },
};
beforeEach(() => {
  window.history.replaceState(null, "", `/plan-map-approve?session=${id}`);
  vi.mocked(authHeaders).mockReset().mockResolvedValue({ Authorization: "test-only" });
  vi.mocked(prepareGoogleIdentity).mockReset();
});
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
  expect(screen.getByText(shown ? "Synthetic preview · explicit invocation" : "Live · limited evaluation · Gemini for approved synthetic accounts; Offline Judge stays deterministic")).toBeVisible();
  if (shown) expect(screen.queryByText("Live · limited evaluation · Gemini for approved synthetic accounts; Offline Judge stays deterministic")).not.toBeInTheDocument();
});

it("requires a click, sends explicit confirmation, and separates advisory results", async () => {
  const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => result });
  mockFetch(fetcher);
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
  expect(screen.queryByRole("button", { name: /request.*evidence/i })).toBeNull();
  expect(screen.getAllByText("Evidence supplied and cited")).toHaveLength(2);
});

it("labels genuine provider success separately from fallback without changing product status", async () => {
  mockFetch(vi.fn().mockResolvedValue({ ok: true, json: async () => ({
    ...result, advisor: { ...result.advisor, state: "ESCALATED", model: "gemini-test-model", provider: "gemini-adk", failure_category: null },
  }) }));
  render(<AssistedAnalysis mappingId={id} />);
  fireEvent.click(screen.getByRole("button", { name: "Run AI-Assisted Analysis" }));
  expect(await screen.findByText("Gemini · gemini-test-model · validated advisory output")).toBeVisible();
  expect(screen.getByText("Deterministic fallback · no accepted AI result")).toBeVisible();
});

it("does not display either result after evidence changes", async () => {
  mockFetch(vi.fn().mockResolvedValue({ ok: true, json: async () => ({
    ...result, advisor: { ...result.advisor, state: "UNAVAILABLE", advice: null },
    reviewer: { ...result.reviewer, state: "UNAVAILABLE", finding: null },
  }) }));
  render(<AssistedAnalysis mappingId={id} />);
  fireEvent.click(screen.getByRole("button", { name: "Run AI-Assisted Analysis" }));
  await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Evidence changed"));
  expect(screen.queryByRole("region", { name: "Advisor result" })).toBeNull();
  expect(screen.queryByRole("region", { name: "Reviewer result" })).toBeNull();
});

it("reuses request identity after uncertain failure and exposes safe recovery", async () => {
  const fetcher = vi.fn().mockRejectedValue(new Error("secret-canary"));
  mockFetch(fetcher);
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
  mockFetch(fetcher);
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
  mockFetch(fetcher);
  const view = render(<AssistedAnalysis mappingId={id} />);
  fireEvent.click(screen.getByRole("button", { name: "Run AI-Assisted Analysis" }));
  await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));
  view.unmount();
  const signal = (fetcher.mock.calls as unknown as [string, RequestInit][])[0][1].signal;
  expect(signal?.aborted).toBe(true);
});

it("renders the recorded live pair without treating ACCEPT as mapping approval", async () => {
  const recorded = liveEvidence.evaluation.evidence_and_results;
  const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => recorded });
  mockFetch(fetcher);
  render(<AssistedAnalysis mappingId={recorded.reviewer.mapping_id} />);
  expect(fetcher).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Run AI-Assisted Analysis" }));
  expect(await screen.findByText(/Recommendation assessment: ACCEPT/)).toBeVisible();
  expect(screen.getByText(/Mapping evidence: CHALLENGED/)).toHaveTextContent("never approval");
  expect(screen.getByText(/Escalate the mapping proposal/)).toBeVisible();
  expect(document.body).not.toHaveTextContent("85%");
  expect(fetcher).toHaveBeenCalledTimes(1);
});

it("keeps the existing human decision controls separate from analysis", async () => {
  vi.stubEnv("NEXT_PUBLIC_SYNTHETIC_ANALYSIS_ENABLED", "true");
  const decide = vi.fn(), reconsider = vi.fn(), runBulk = vi.fn();
  const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => result });
  mockFetch(fetcher);
  const mapping = {
    id, source_id: "account-clearing", source_label: "1200 · Misc Clearing",
    area: "chart_of_accounts", state: "REVIEW_REQUIRED", selected_target: "Other Current Asset",
    supported_targets: ["Other Current Asset"], evidence: [], policy_reasons: [],
    risk: "MEDIUM", confidence: 0.76,
  } as unknown as MappingProposal;
  render(<MappingReview mappings={[mapping]} history={[]} editable busy={false} planApproved={false}
    decide={decide} reconsider={reconsider} runBulk={runBulk} onReviewPlan={vi.fn()} />);
  expect(fetcher).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Run AI-Assisted Analysis" }));
  await screen.findByRole("region", { name: "Reviewer result" });
  expect(decide).not.toHaveBeenCalled();
  expect(reconsider).not.toHaveBeenCalled();
  expect(runBulk).not.toHaveBeenCalled();
  expect(screen.getByRole("button", { name: "Approve as Other Current Asset" })).toBeEnabled();
  expect(screen.getByRole("button", { name: /^Reject$/ })).toBeEnabled();
  expect(fetcher).toHaveBeenCalledTimes(1);
});

it.each(["REJECT", "QUESTION"] as const)("exposes reviewer %s without collapsing it into agreement", async outcome => {
  const value = structuredClone(result);
  value.reviewer!.finding!.recommendation_outcome = outcome;
  mockFetch(vi.fn().mockResolvedValue({ ok: true, json: async () => value }));
  render(<AssistedAnalysis mappingId={id} />);
  fireEvent.click(screen.getByRole("button", { name: "Run AI-Assisted Analysis" }));
  expect(await screen.findByText(new RegExp(`Recommendation assessment: ${outcome}`))).toBeVisible();
});

it.each(["empty", "empty-evidence", "authority", "wrong-mapping", "wrong-advisor", "missing-reviewer", "malformed-outcome", "foreign-evidence", "advisor-only-stale", "reviewer-only-stale"])(
  "fails closed on %s response without exposing a partial success", async failure => {
    const value = structuredClone(result);
    if (failure === "empty-evidence") value.advisor.evidence = [];
    if (failure === "authority") Object.assign(value, { financial_authority: true });
    if (failure === "wrong-mapping") value.reviewer!.mapping_id = "another-mapping";
    if (failure === "wrong-advisor") value.reviewer!.advisor_request_id = "another-request";
    if (failure === "missing-reviewer") value.reviewer = null;
    if (failure === "malformed-outcome") Object.assign(value.reviewer!.finding!, { recommendation_outcome: ["ACCEPT"] });
    if (failure === "foreign-evidence") {
      value.advisor.evidence[0].reference = "mapping:another-owner";
      value.advisor.advice!.evidence_references = ["mapping:another-owner"];
    }
    if (failure === "advisor-only-stale") Object.assign(value.advisor, { state: "UNAVAILABLE", advice: null });
    if (failure === "reviewer-only-stale") Object.assign(value.reviewer!, { state: "UNAVAILABLE", finding: null });
    mockFetch(vi.fn().mockResolvedValue({ ok: true, json: async () => failure === "empty" ? {} : value }));
    render(<AssistedAnalysis mappingId={id} />);
    fireEvent.click(screen.getByRole("button", { name: "Run AI-Assisted Analysis" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Analysis is unavailable");
    expect(screen.queryByRole("region", { name: "Advisor result" })).toBeNull();
    expect(screen.queryByRole("region", { name: "Reviewer result" })).toBeNull();
  },
);

it("clears completed results when the selected mapping changes without invoking a model", async () => {
  const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => result });
  mockFetch(fetcher);
  const view = render(<AssistedAnalysis mappingId={id} />);
  fireEvent.click(screen.getByRole("button", { name: "Run AI-Assisted Analysis" }));
  await screen.findByRole("region", { name: "Advisor result" });
  view.rerender(<AssistedAnalysis mappingId="22222222-2222-4222-8222-222222222222" />);
  expect(screen.queryByRole("region", { name: "Advisor result" })).toBeNull();
  expect(screen.getByRole("status")).toHaveTextContent("Nothing is sent");
  expect(fetcher).toHaveBeenCalledTimes(1);
});

it("does not reuse completed results or request IDs across workspace renders", async () => {
  const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => result });
  mockFetch(fetcher);
  const view = render(<AssistedAnalysis mappingId={id} />);
  fireEvent.click(screen.getByRole("button", { name: "Run AI-Assisted Analysis" }));
  await screen.findByRole("region", { name: "Advisor result" });
  window.history.replaceState(null, "", "/plan-map-approve?session=22222222-2222-4222-8222-222222222222");
  view.rerender(<AssistedAnalysis mappingId={id} />);
  expect(screen.queryByRole("region", { name: "Advisor result" })).toBeNull();
  expect(fetcher).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole("button", { name: "Run AI-Assisted Analysis" }));
  await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));
  expect(fetcher.mock.calls[1][0]).toContain("/22222222-2222-4222-8222-222222222222/analysis/");
  expect(fetcher.mock.calls[0][1].body).not.toEqual(fetcher.mock.calls[1][1].body);
});

it("aborts and discards an in-flight response when the selected mapping changes", async () => {
  let finish!: (value: unknown) => void;
  const fetcher = vi.fn(() => new Promise(resolve => { finish = resolve; }));
  mockFetch(fetcher);
  const view = render(<AssistedAnalysis mappingId={id} />);
  fireEvent.click(screen.getByRole("button", { name: "Run AI-Assisted Analysis" }));
  await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));
  view.rerender(<AssistedAnalysis mappingId="22222222-2222-4222-8222-222222222222" />);
  expect((fetcher.mock.calls as unknown as [string, RequestInit][])[0][1].signal?.aborted).toBe(true);
  finish({ ok: true, json: async () => result });
  await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Nothing is sent"));
  expect(screen.queryByRole("region", { name: "Advisor result" })).toBeNull();
});

function mockIdentity() {
  vi.stubEnv("NEXT_PUBLIC_IDENTITY_MODE", "firebase");
  const auth = { currentUser: { uid: "owner-a" } as { uid: string } | null };
  let listener: ((user: { uid: string } | null) => void) | undefined;
  const unsubscribe = vi.fn();
  const runtime = {
    auth,
    subscribe: vi.fn((callback: typeof listener) => {
      listener = callback;
      callback!(auth.currentUser);
      return unsubscribe;
    }),
  };
  vi.mocked(prepareGoogleIdentity).mockResolvedValue(runtime as unknown as GoogleIdentityRuntime);
  return {
    runtime, unsubscribe,
    change(uid: string | null, notify = true) {
      auth.currentUser = uid === null ? null : { uid };
      if (notify) listener!(auth.currentUser);
    },
  };
}

it("clears completed private results and retry identity on an account change without remount", async () => {
  const identity = mockIdentity();
  const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => result });
  mockFetch(fetcher);
  render(<AssistedAnalysis mappingId={id} />);
  await waitFor(() => expect(screen.getByRole("button")).toBeEnabled());
  expect(fetcher).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button"));
  await screen.findByRole("region", { name: "Advisor result" });
  act(() => identity.change("owner-b"));
  expect(screen.queryByRole("region", { name: "Advisor result" })).toBeNull();
  expect(screen.queryByRole("region", { name: "Reviewer result" })).toBeNull();
  expect(fetcher).toHaveBeenCalledTimes(1);
  await waitFor(() => expect(screen.getByRole("button")).toBeEnabled());
  fireEvent.click(screen.getByRole("button"));
  await screen.findByRole("region", { name: "Advisor result" });
  expect(fetcher.mock.calls[0][1].body).not.toEqual(fetcher.mock.calls[1][1].body);
  act(() => identity.change(null));
  expect(screen.queryByRole("region", { name: "Advisor result" })).toBeNull();
  expect(screen.getByRole("button")).toBeDisabled();
});

it("aborts an old account request and cannot clear the new account's active request", async () => {
  const identity = mockIdentity();
  const pending: ((value: unknown) => void)[] = [];
  const fetcher = vi.fn(() => new Promise(resolve => pending.push(resolve)));
  mockFetch(fetcher);
  render(<AssistedAnalysis mappingId={id} />);
  await waitFor(() => expect(screen.getByRole("button")).toBeEnabled());
  fireEvent.click(screen.getByRole("button"));
  await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));
  act(() => identity.change("owner-b"));
  expect((fetcher.mock.calls as unknown as [string, RequestInit][])[0][1].signal?.aborted).toBe(true);
  await waitFor(() => expect(screen.getByRole("button")).toBeEnabled());
  fireEvent.click(screen.getByRole("button"));
  await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));
  await act(async () => pending[0]({ ok: true, json: async () => result }));
  expect(screen.queryByRole("region", { name: "Advisor result" })).toBeNull();
  expect(screen.getByRole("button", { name: "Analyzing and reviewing…" })).toBeDisabled();
  await act(async () => pending[1]({ ok: true, json: async () => result }));
  expect(screen.getByRole("region", { name: "Advisor result" })).toBeVisible();
});

it("does not dispatch if the account changes while authorization headers are pending", async () => {
  const identity = mockIdentity();
  let finish!: (headers: Record<string, string>) => void;
  const fetcher = vi.fn();
  mockFetch(fetcher);
  render(<AssistedAnalysis mappingId={id} />);
  await waitFor(() => expect(screen.getByRole("button")).toBeEnabled());
  vi.mocked(authHeaders).mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  fireEvent.click(screen.getByRole("button"));
  // Simulate the interval before the existing Firebase subscription delivers its event.
  identity.change("owner-b", false);
  await act(async () => finish({ Authorization: "new-account-test-only" }));
  expect(fetcher).not.toHaveBeenCalled();
});

it("keeps results on same-account token refresh without an extra analysis call", async () => {
  const identity = mockIdentity();
  const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => result });
  mockFetch(fetcher);
  const view = render(<AssistedAnalysis mappingId={id} />);
  await waitFor(() => expect(screen.getByRole("button")).toBeEnabled());
  fireEvent.click(screen.getByRole("button"));
  await screen.findByRole("region", { name: "Advisor result" });
  act(() => identity.change("owner-a"));
  expect(screen.getByRole("region", { name: "Advisor result" })).toBeVisible();
  expect(fetcher).toHaveBeenCalledTimes(1);
  view.unmount();
  expect(identity.unsubscribe).toHaveBeenCalledOnce();
});

it("fails closed when identity setup fails without exposing its error", async () => {
  mockIdentity();
  vi.mocked(prepareGoogleIdentity).mockRejectedValue(new Error("private-auth-canary"));
  const fetcher = vi.fn();
  mockFetch(fetcher);
  render(<AssistedAnalysis mappingId={id} />);
  expect(await screen.findByRole("alert")).toHaveTextContent("sign-in could not be established");
  expect(screen.getByRole("button")).toBeDisabled();
  expect(document.body).not.toHaveTextContent("private-auth-canary");
  expect(fetcher).not.toHaveBeenCalled();
});

it("does not subscribe after unmount during identity initialization", async () => {
  const identity = mockIdentity();
  let finish!: (runtime: GoogleIdentityRuntime) => void;
  vi.mocked(prepareGoogleIdentity).mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  const view = render(<AssistedAnalysis mappingId={id} />);
  view.unmount();
  await act(async () => finish(identity.runtime as unknown as GoogleIdentityRuntime));
  expect(identity.runtime.subscribe).not.toHaveBeenCalled();
});

it("prevents duplicate clicks while credentials are pending", async () => {
  let finish!: (headers: Record<string, string>) => void;
  vi.mocked(authHeaders).mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => result });
  mockFetch(fetcher);
  render(<AssistedAnalysis mappingId={id} />);
  fireEvent.click(screen.getByRole("button"));
  fireEvent.click(screen.getByRole("button"));
  expect(authHeaders).toHaveBeenCalledOnce();
  await act(async () => finish({ Authorization: "test-only" }));
  expect(fetcher).toHaveBeenCalledOnce();
});

it.each([401, 403, 404, 409, 500])("keeps HTTP %s failures non-authoritative and does not auto-retry", async status => {
  const fetcher = vi.fn().mockResolvedValue({ ok: false, status, json: async () => result });
  mockFetch(fetcher);
  render(<AssistedAnalysis mappingId={id} />);
  fireEvent.click(screen.getByRole("button"));
  expect(await screen.findByRole("alert")).toHaveTextContent("Analysis is unavailable");
  expect(screen.queryByRole("region", { name: "Advisor result" })).toBeNull();
  expect(screen.queryByRole("region", { name: "Reviewer result" })).toBeNull();
  expect(fetcher).toHaveBeenCalledOnce();
});
