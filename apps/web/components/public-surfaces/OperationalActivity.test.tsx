import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OperationalActivity } from "./OperationalActivity";
vi.mock("@/lib/identity", () => ({ authHeaders: vi.fn(async () => ({ Authorization: "Bearer verified-test-owner" })) }));
const fetchMock = vi.fn();
const event = { capability: "mapping", state: "RESERVED", created_at: "2026-10-17T10:30:00+00:00", reserved_calls: 2, reserved_microusd: 100000 };
const response = (status: string, events: unknown[] = []) => ({ ok: true, json: async () => ({ status, events }) });
const refresh = () => fireEvent.click(screen.getByRole("button", { name: "Check AI activity" }));
beforeEach(() => { vi.stubGlobal("fetch", fetchMock); fetchMock.mockReset(); });
afterEach(() => vi.unstubAllGlobals());
describe("read-only operational snapshot", () => {
  it("never reads automatically and fetches only a bounded authenticated GET after a click", async () => {
    fetchMock.mockResolvedValue(response("AVAILABLE", [event])); render(<OperationalActivity/>);
    expect(fetchMock).not.toHaveBeenCalled(); expect(screen.getByText(/Not checked yet/)).toBeVisible();
    refresh(); await screen.findByText("mapping · reserved");
    expect(fetchMock).toHaveBeenCalledTimes(1); const [url, options] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/v1\/operations\/activity$/); expect(options).toMatchObject({ method: "GET", cache: "no-store", credentials: "omit", redirect: "error", headers: { Authorization: "Bearer verified-test-owner" } });
    expect(options.body).toBeUndefined(); expect(options.signal).toBeDefined();
    expect(screen.getByText(/Reported model calls: unknown/)).toHaveTextContent("Input tokens: unknown");
    expect(screen.getByText(/Capacity was reserved/)).toBeVisible(); expect(sessionStorage.length).toBe(0);
  });
  it("shows plain-language reservation cost, anchor id and never implies a charge or model run", async () => {
    fetchMock.mockResolvedValue(response("AVAILABLE", [event])); render(<OperationalActivity/>);
    expect(document.querySelector("section#ai-activity")).not.toBeNull();
    expect(screen.getByRole("heading", { name: "AI activity" })).toBeVisible();
    refresh(); await screen.findByText("mapping · reserved");
    expect(screen.getByText(/Reserved: 2 model calls, \$0\.10\. A reservation is not a charge\./)).toBeVisible();
    expect(document.body).not.toHaveTextContent(/micro-USD|Advisory Operations/);
  });
  it("scrolls to and focuses the panel when opened from the AI activity shortcut", () => {
    const scroll = vi.fn(); Element.prototype.scrollIntoView = scroll; window.location.hash = "#ai-activity";
    render(<OperationalActivity/>);
    expect(scroll).toHaveBeenCalledTimes(1); expect(screen.getByRole("heading", { name: "AI activity" })).toHaveFocus();
    window.location.hash = "";
  });
  it("labels disabled backend explicitly without claiming model execution", async () => {
    fetchMock.mockResolvedValue(response("DISABLED")); render(<OperationalActivity/>); refresh();
    await screen.findByText("AI activity tracking is off");
    expect(screen.getByText(/not evidence of AI use/)).toBeVisible();
  });
  it("does not equate an empty snapshot with no operations or financial success", async () => {
    fetchMock.mockResolvedValue(response("AVAILABLE")); render(<OperationalActivity/>); refresh();
    await screen.findByText(/No AI activity recorded for your account/);
    expect(screen.getByText(/does not establish that none occurred earlier/)).toBeVisible();
  });
  it.each(["RESERVED", "COMPLETED", "FALLBACK", "UNAVAILABLE"])("shows controlled %s states without exposing response extras", async state => {
    fetchMock.mockResolvedValue(response("AVAILABLE", [{ ...event, state, model_calls: 0, tool_calls: 0, input_tokens: null, output_tokens: null, usage_status: "partial", payload: "secret-financial-payload", prompt: "private-prompt", owner_hash: "private-owner-hash", request_id: "private-request" }]));
    render(<OperationalActivity/>); refresh(); await screen.findByText(`mapping · ${state.toLowerCase()}`);
    expect(screen.getByText(/Reported model calls: 0/)).toHaveTextContent("Input tokens: unknown");
    expect(document.body).not.toHaveTextContent(/secret-financial-payload|private-prompt|private-owner-hash|private-request/);
  });
  it.each([
    { state: "APPROVED" }, { capability: "private-canary" }, { reserved_calls: true }, { reserved_microusd: -1 }, { created_at: "private-canary" },
  ])("rejects malformed event fields %s", async changes => {
    fetchMock.mockResolvedValue(response("AVAILABLE", [{ ...event, ...changes }])); render(<OperationalActivity/>); refresh();
    await screen.findByText("AI activity unavailable"); expect(document.body).not.toHaveTextContent("private-canary");
  });
  it("keeps unknown or invalid reported counts null rather than showing invented zeroes", async () => {
    fetchMock.mockResolvedValue(response("AVAILABLE", [{ ...event, model_calls: true, tool_calls: -1, input_tokens: 1000001, output_tokens: "private-canary", usage_status: "private-canary", completed_at: "private-canary" }]));
    render(<OperationalActivity/>); refresh(); await screen.findByText("mapping · reserved");
    expect(screen.getByText(/Reported model calls: unknown/)).toHaveTextContent("Tool calls: unknown · Input tokens: unknown · Output tokens: unknown · Usage: unknown");
    expect(document.body).not.toHaveTextContent("private-canary");
  });
  it("shows sanitized failure and supports an explicit same-read retry", async () => {
    fetchMock.mockRejectedValueOnce(new Error("private-credential-error")).mockResolvedValueOnce(response("AVAILABLE", [event]));
    render(<OperationalActivity/>); refresh(); await screen.findByText("AI activity unavailable");
    expect(document.body).not.toHaveTextContent("private-credential-error"); refresh(); await screen.findByText("mapping · reserved"); expect(fetchMock).toHaveBeenCalledTimes(2);
  });
  it("disables duplicate reads while one request is pending", async () => {
    let finish: (value: unknown) => void = () => undefined;
    fetchMock.mockReturnValue(new Promise(resolve => { finish = resolve; })); render(<OperationalActivity/>); refresh();
    await waitFor(() => expect(screen.getByRole("button", { name: "Checking AI activity…" })).toBeDisabled());
    expect(fetchMock).toHaveBeenCalledTimes(1); finish(response("UNAVAILABLE")); await screen.findByText("AI activity unavailable");
  });
});
