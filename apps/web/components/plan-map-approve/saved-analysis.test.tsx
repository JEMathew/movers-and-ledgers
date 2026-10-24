import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import fixture from "../../../../tests/fixtures/gemini-recorded-pair.json";
import { authHeaders, prepareGoogleIdentity, type GoogleIdentityRuntime } from "@/lib/identity";
import { AssistedAnalysis } from "./AssistedAnalysis";
import { savedAnalysis } from "./saved-analysis";
vi.mock("@/lib/identity", () => ({ authHeaders: vi.fn(), cloudIdentity: () => true, prepareGoogleIdentity: vi.fn() }));
const session = "11111111-1111-4111-8111-111111111111";
const pair = fixture.evaluation.evidence_and_results;
const mapping = pair.reviewer.mapping_id;
function snapshot() {
  return { id: session, synthetic: true, mappings: [{ id: mapping, source_id: "account-clearing" }],
    reasoning_records: [{ ...structuredClone(pair.advisor), requested_by: "firebase:owner-a" }],
    review_records: [{ ...structuredClone(pair.reviewer), requested_by: "firebase:owner-a" }] };
}
let listener: (user: { uid: string } | null) => void;
let auth: { currentUser: { uid: string } | null };
beforeEach(() => {
  window.history.replaceState(null, "", `/plan-map-approve?session=${session}`);
  vi.mocked(authHeaders).mockReset().mockResolvedValue({ Authorization: "test-only" });
  auth = { currentUser: { uid: "owner-a" } };
  vi.mocked(prepareGoogleIdentity).mockResolvedValue({ auth, subscribe(callback: typeof listener) {
    listener = callback; callback(auth.currentUser); return () => {};
  } } as unknown as GoogleIdentityRuntime);
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
function switchAccount(uid: string | null, notify = true) {
  auth.currentUser = uid ? { uid } : null;
  if (notify) listener(auth.currentUser);
}
function response(body: unknown = snapshot()) { return { ok: true, json: async () => body }; }
it("selects the actual pair by reference despite shuffled unrelated records", () => {
  const body = snapshot();
  body.reasoning_records.unshift({ ...structuredClone(body.reasoning_records[0]), request_id: "older", requested_at: "2026-10-19T00:00:00Z" });
  body.review_records.unshift({ ...structuredClone(body.review_records[0]), advisor_request_id: "unrelated", mapping_id: "unrelated" });
  expect(savedAnalysis(body, session, mapping, "firebase:owner-a")?.advisor.request_id).toBe(pair.advisor.request_id);
  expect(savedAnalysis(body, session, mapping, "firebase:owner-a")?.reviewer?.finding).toEqual(pair.reviewer.finding);
});
it("allows genuinely empty history without inventing results", () => {
  expect(savedAnalysis({ ...snapshot(), reasoning_records: [], review_records: [] }, session, mapping, "firebase:owner-a")).toBeUndefined();
});
it.each(["session", "mapping", "source", "synthetic", "advisor-owner", "reviewer-owner", "missing-reviewer", "missing-advisor", "wrong-pair", "wrong-review-mapping", "wrong-version", "duplicate-review", "duplicate-advisor", "missing-collections", "null-record", "missing-advice", "missing-finding", "empty-uncertainty", "foreign-evidence", "financial-authority", "invalid-time", "reversed-time", "review-before-advisor", "latest-incomplete"])("rejects %s without partial or foreign history", failure => {
  const body = snapshot(), a = body.reasoning_records[0], r = body.review_records[0];
  if (failure === "session") body.id = "foreign-session";
  if (failure === "mapping") body.mappings[0].id = "foreign-mapping";
  if (failure === "source") body.mappings[0].source_id = "account-bank";
  if (failure === "synthetic") body.synthetic = false;
  if (failure === "advisor-owner") a.requested_by = "firebase:owner-b";
  if (failure === "reviewer-owner") r.requested_by = "firebase:owner-b";
  if (failure === "missing-reviewer") body.review_records = [];
  if (failure === "missing-advisor") body.reasoning_records = [];
  if (failure === "wrong-pair") r.advisor_request_id = "wrong";
  if (failure === "wrong-review-mapping") r.mapping_id = "wrong";
  if (failure === "wrong-version") r.version = "standalone-review";
  if (failure === "duplicate-review") body.review_records.push(structuredClone(r));
  if (failure === "duplicate-advisor") body.reasoning_records.push(structuredClone(a));
  if (failure === "missing-collections") Object.assign(body, { reasoning_records: undefined });
  if (failure === "null-record") Object.assign(body, { reasoning_records: [null] });
  if (failure === "missing-advice") Object.assign(a, { advice: null });
  if (failure === "missing-finding") Object.assign(r, { finding: null });
  if (failure === "empty-uncertainty") a.advice.uncertainty = [];
  if (failure === "foreign-evidence") r.finding.evidence_references = ["mapping:foreign"];
  if (failure === "financial-authority") a.advice.financial_authority = true;
  if (failure === "invalid-time") a.requested_at = "not-a-date";
  if (failure === "reversed-time") a.completed_at = "2026-10-19T00:00:00Z";
  if (failure === "review-before-advisor") r.requested_at = "2026-10-19T00:00:00Z";
  if (failure === "latest-incomplete") body.reasoning_records.push({ ...a, request_id: "new-unpaired", requested_at: "2026-10-21T00:00:00Z" });
  expect(() => savedAnalysis(body, session, mapping, "firebase:owner-a")).toThrow();
});
it("restores both roles, grounding and uncertainty on load and reopen with only GETs", async () => {
  const fetcher = vi.fn().mockResolvedValue(response()); vi.stubGlobal("fetch", fetcher);
  const view = render(<AssistedAnalysis mappingId={mapping} />);
  await screen.findByRole("region", { name: "Reviewer result" });
  expect(screen.getByText(pair.advisor.advice.recommendation, { exact: false })).toBeVisible();
  expect(screen.getByText(pair.reviewer.finding.summary, { exact: false })).toBeVisible();
  expect(screen.getByText(pair.advisor.advice.uncertainty.join(" · "), { exact: false })).toBeVisible();
  expect(screen.getByText(pair.reviewer.finding.uncertainty.join(" · "), { exact: false })).toBeVisible();
  expect(screen.getAllByText("Evidence supplied and cited")).toHaveLength(2);
  expect(screen.getByRole("status")).toHaveTextContent("Historical analysis restored. No model was called");
  expect(screen.getByText(/may not reflect later mapping changes/)).toBeVisible();
  expect(screen.queryByRole("button", { name: /approve|post|change mapping/i })).toBeNull();
  view.unmount(); render(<AssistedAnalysis mappingId={mapping} />);
  await screen.findByRole("region", { name: "Reviewer result" });
  expect(fetcher).toHaveBeenCalledTimes(2);
  for (const [url, init] of fetcher.mock.calls) {
    expect(url).toMatch(new RegExp(`/migration-sessions/${session}$`));
    expect(init.method).toBe("GET"); expect(init.body).toBeUndefined(); expect(init.cache).toBe("no-store");
  }
});
it("clears history immediately on account switch and refuses the old account payload", async () => {
  const fetcher = vi.fn().mockResolvedValue(response()); vi.stubGlobal("fetch", fetcher);
  render(<AssistedAnalysis mappingId={mapping} />); await screen.findByRole("region", { name: "Reviewer result" });
  act(() => switchAccount("owner-b")); expect(screen.queryByRole("region", { name: "Advisor result" })).toBeNull();
  await screen.findByRole("alert"); expect(screen.queryByRole("region", { name: "Reviewer result" })).toBeNull();
  act(() => switchAccount(null)); expect(screen.getByRole("button")).toBeDisabled();
  expect(fetcher.mock.calls.every(([, init]) => init.method === "GET")).toBe(true);
});
it("keeps history on same-account token refresh without extra calls", async () => {
  const fetcher = vi.fn().mockResolvedValue(response()); vi.stubGlobal("fetch", fetcher);
  render(<AssistedAnalysis mappingId={mapping} />); await screen.findByRole("region", { name: "Reviewer result" });
  act(() => switchAccount("owner-a")); expect(fetcher).toHaveBeenCalledOnce();
});
it.each(["signout", "account", "workspace", "unmount"])("discards late saved payload on %s", async kind => {
  let finish!: (value: unknown) => void;
  const fetcher = vi.fn(() => new Promise(resolve => { finish = resolve; })); vi.stubGlobal("fetch", fetcher);
  const view = render(<AssistedAnalysis mappingId={mapping} />); await waitFor(() => expect(fetcher).toHaveBeenCalledOnce());
  if (kind === "signout") act(() => switchAccount(null));
  if (kind === "account") switchAccount("owner-b", false);
  if (kind === "workspace") window.history.replaceState(null, "", "/plan-map-approve?session=22222222-2222-4222-8222-222222222222");
  if (kind === "unmount") view.unmount();
  await act(async () => finish(response()));
  expect(screen.queryByRole("region", { name: "Advisor result" })).toBeNull();
  expect(screen.queryByRole("region", { name: "Reviewer result" })).toBeNull();
});
it("checks account after credentials before dispatching the read", async () => {
  let finish!: (value: Record<string, string>) => void;
  vi.mocked(authHeaders).mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
  render(<AssistedAnalysis mappingId={mapping} />); await waitFor(() => expect(authHeaders).toHaveBeenCalledOnce());
  switchAccount("owner-b", false); await act(async () => finish({ Authorization: "test-only" }));
  expect(fetcher).not.toHaveBeenCalled();
});
it.each([401, 403, 404, 500])("handles HTTP %s without retry or inference", async status => {
  const fetcher = vi.fn().mockResolvedValue({ ok: false, status }); vi.stubGlobal("fetch", fetcher);
  render(<AssistedAnalysis mappingId={mapping} />); expect(await screen.findByRole("alert")).toHaveTextContent("No model was called");
  expect(fetcher).toHaveBeenCalledOnce(); expect(fetcher.mock.calls[0][1].method).toBe("GET");
});
it("does not invoke analysis while history is pending", async () => {
  const fetcher = vi.fn(() => new Promise(() => {})); vi.stubGlobal("fetch", fetcher);
  render(<AssistedAnalysis mappingId={mapping} />); await waitFor(() => expect(fetcher).toHaveBeenCalledOnce());
  expect(screen.getByRole("button")).toBeDisabled(); fireEvent.click(screen.getByRole("button")); expect(fetcher).toHaveBeenCalledOnce();
});
it("does not let an aborted account read replace a newer account's verified history", async () => {
  const pending: ((value: unknown) => void)[] = [];
  const fetcher = vi.fn(() => new Promise(resolve => pending.push(resolve))); vi.stubGlobal("fetch", fetcher);
  render(<AssistedAnalysis mappingId={mapping} />); await waitFor(() => expect(fetcher).toHaveBeenCalledOnce());
  act(() => switchAccount("owner-b")); await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));
  const body = snapshot(); body.reasoning_records[0].requested_by = "firebase:owner-b"; body.review_records[0].requested_by = "firebase:owner-b";
  body.reasoning_records[0].advice.recommendation = "Owner B saved recommendation";
  await act(async () => pending[1](response(body)));
  expect(screen.getByText(/Owner B saved recommendation/)).toBeVisible();
  await act(async () => pending[0](response()));
  expect(screen.getByText(/Owner B saved recommendation/)).toBeVisible();
  expect(screen.getByRole("status")).toHaveTextContent("Historical analysis restored");
});
it.each([null, {}, { ...snapshot(), reasoning_records: [{ capability: "mapping" }] }])("fails closed on malformed saved payload %j", async body => {
  const fetcher = vi.fn().mockResolvedValue(response(body)); vi.stubGlobal("fetch", fetcher);
  render(<AssistedAnalysis mappingId={mapping} />); await screen.findByRole("alert");
  expect(screen.queryByRole("region", { name: "Advisor result" })).toBeNull();
  expect(fetcher).toHaveBeenCalledOnce(); expect(fetcher.mock.calls[0][1].method).toBe("GET");
});
