import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { IndependentReview } from "./IndependentReview";
vi.mock("@/lib/identity", () => ({cloudIdentity: () => false, authHeaders: async () => ({})}));
const id = "11111111-1111-4111-8111-111111111111";
const review = { state: "FALLBACK", provider: "deterministic-fallback", requested_at:"2026-10-17", context_hash:"snapshot", evidence:[{reference:"mapping:1",observation:"source purpose absent"}], finding:{outcome:"CHALLENGED",summary:"Source purpose is not established", evidence_references:["mapping:1"],concerns:["Clearing name is ambiguous"],uncertainty:["Settlement history unavailable"],suggested_next_action:"INSPECT_SOURCE_PURPOSE"} };
beforeEach(() => window.history.replaceState(null,"",`/plan-map-approve?session=${id}`));
afterEach(() => {cleanup();vi.unstubAllGlobals();});
it("requests a separate review only on click and shows challenge and uncertainty",async () => {
  const fetcher=vi.fn().mockResolvedValue({ok:true,json:async()=>review});vi.stubGlobal("fetch",fetcher);
  render(<IndependentReview mappingId={id}/>);
  expect(fetcher).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button",{name:"Request independent review"}));
  expect(await screen.findByText(/Independent deterministic review · not live AI/)).toBeVisible();
  expect(screen.getByText(/Source purpose is not established/)).toBeVisible();
  expect(screen.getByText(/Settlement history unavailable/)).toBeVisible();
  expect(fetcher.mock.calls[0][0]).toContain(`/reviewer/mapping/${id}`);
  expect(Object.keys(JSON.parse(fetcher.mock.calls[0][1].body))).toEqual(["request_id"]);
  expect(screen.queryByRole("button",{name:/approve/i})).toBeNull();
});
it("shows unavailable response without the supplied finding", async()=>{
  vi.stubGlobal("fetch",vi.fn().mockResolvedValue({ok:true,json:async()=>({...review,state:"UNAVAILABLE"})}));
  render(<IndependentReview mappingId={id}/>);fireEvent.click(screen.getByRole("button",{name:"Request independent review"}));
  expect(await screen.findByText(/Evidence changed — review unavailable/)).toBeVisible();
  expect(screen.queryByText(/Source purpose is not established/)).toBeNull();
});
it("offers recovery on review failure without an approval control", async()=>{
  vi.stubGlobal("fetch",vi.fn().mockResolvedValue({ok:false}));render(<IndependentReview mappingId={id}/>);
  fireEvent.click(screen.getByRole("button",{name:"Request independent review"}));
  expect(await screen.findByRole("alert")).toHaveTextContent("request human review");
  expect(screen.getByRole("button",{name:"Request independent review"})).toBeEnabled();
});
