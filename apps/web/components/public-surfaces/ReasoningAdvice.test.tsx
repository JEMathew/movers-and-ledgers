import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ReasoningAdvice } from "./ReasoningAdvice";

vi.mock("@/lib/identity", () => ({ authHeaders: async () => ({}) }));
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams(window.location.search) }));
const id = "11111111-1111-4111-8111-111111111111";
const advice = { observation: "Existing proposal", inference: "Review is necessary",
  recommendation: "Inspect evidence", rationale: "Rules are authoritative",
  evidence_references: ["phase:plan"], confidence: 0.9, uncertainty: ["Human judgement"],
  alternatives: ["Escalate"], next_action: "REVIEW_EXISTING_PROPOSAL" };
function response(state = "COMPLETED") {
  return { state, provider: "gemini-adk", model: "gemini-test", requested_at: "2026-09-29",
    failure_category: state === "FALLBACK" ? "timeout" : null, confidence_note: "Uncalibrated",
    deterministic_results: ["Approvals remain required"], advice: state === "UNAVAILABLE" ? null : advice };
}
beforeEach(() => window.history.replaceState(null, "", `/plan-map-approve?session=${id}`));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); sessionStorage.clear(); });
describe("bounded reasoning guidance", () => {
  it("requires explicit request and exposes evidence without approval controls", async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => response() });
    vi.stubGlobal("fetch", fetcher);
    render(<ReasoningAdvice path="/plan-map-approve"/>);
    expect(fetcher).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", {name: "Explain planning"}));
    expect(await screen.findByText(/AI-generated recommendation/)).toBeVisible();
    expect(screen.getByText(/Human review required/)).toBeVisible();
    fireEvent.click(screen.getByText("Evidence and deterministic boundaries"));
    expect(screen.getByText("phase:plan")).toBeVisible();
    expect(screen.queryByRole("button", {name: /approve/i})).not.toBeInTheDocument();
    const body = JSON.parse(fetcher.mock.calls[0][1].body);
    expect(Object.keys(body)).toEqual(["request_id"]);
  });
  it.each(["FALLBACK", "UNAVAILABLE"])("labels %s without claiming live advice", async state => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ok: true, json: async () => response(state)}));
    render(<ReasoningAdvice path="/plan-map-approve"/>);
    fireEvent.click(screen.getByRole("button", {name: "Explain mapping"}));
    expect(await screen.findByText(state === "FALLBACK" ? /Deterministic fallback — not live AI/ : /Guidance unavailable — no recommendation/)).toBeVisible();
    expect(screen.queryByText(/AI-generated recommendation/)).not.toBeInTheDocument();
  });
  it("rejects failures visibly and renders no guidance on deterministic-only routes", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ok: false}));
    const view = render(<ReasoningAdvice path="/migrate-resolve"/>);
    fireEvent.click(screen.getByRole("button", {name: "Explain resolution"}));
    expect(await screen.findByRole("alert")).toHaveTextContent("no action was approved");
    view.rerender(<ReasoningAdvice path="/assess"/>);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
  it("discards displayed advice when the workspace changes on the same route", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ok: true, json: async () => response()}));
    const view = render(<ReasoningAdvice path="/plan-map-approve"/>);
    fireEvent.click(screen.getByRole("button", {name: "Explain planning"}));
    expect(await screen.findByText(/AI-generated recommendation/)).toBeVisible();
    window.history.replaceState(null, "", "/plan-map-approve?session=22222222-2222-4222-8222-222222222222");
    view.rerender(<ReasoningAdvice path="/plan-map-approve"/>);
    expect(screen.queryByText(/AI-generated recommendation/)).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("No reasoning requested");
  });
  it("keeps uncertainty visible while disclosing supplied explanation and alternatives", async () => {
    const fetcher = vi.fn().mockResolvedValue({ok: true, json: async () => ({...response("FALLBACK"), context_hash:"context:actual"})});
    vi.stubGlobal("fetch", fetcher); render(<ReasoningAdvice path="/plan-map-approve"/>);
    fireEvent.click(screen.getByRole("button", {name:"Explain planning"}));
    expect(await screen.findByText(/Confidence: 0.9. Uncalibrated/)).toBeVisible();
    expect(screen.getByText(/Uncertainty: Human judgement/)).toBeVisible();
    expect(screen.getByText(/Existing proposal/)).not.toBeVisible();
    fireEvent.click(screen.getByText("Explanation and alternatives"));
    expect(screen.getByText(/Existing proposal/)).toBeVisible();
    expect(screen.getByText(/Alternatives: Escalate/)).toBeVisible();
    fireEvent.click(screen.getByText("Evidence and deterministic boundaries"));
    expect(screen.getByText(/context:actual/)).toBeVisible();
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("does not display a recommendation if the supplied state says unavailable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ok:true,json:async()=>({...response("UNAVAILABLE"),advice})}));
    render(<ReasoningAdvice path="/plan-map-approve"/>);
    fireEvent.click(screen.getByRole("button",{name:"Explain planning"}));
    expect(await screen.findByText(/Guidance unavailable/)).toBeVisible();
    expect(screen.queryByText(/Recommendation:/)).not.toBeInTheDocument();
  });

});
