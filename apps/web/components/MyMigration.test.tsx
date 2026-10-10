import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MyMigration } from "./MyMigration";

const id = "11111111-1111-4111-8111-111111111111";
const json = (value: unknown, status = 200) => Promise.resolve(new Response(JSON.stringify(value), { status }));
const evidence = {
  id, synthetic: true, workflow_status: "RESOLVING", mapping_review: { total: 5, pending: 0 },
  discovery: { findings: [] }, execution: { failures: [] }, validation_reports: [],
  configuration: { proposals: [] }, onboarding: { tasks: [], fpu: {} }, activity: [], human_decisions: [], events: [],
};
const main = () => screen.getByRole("main");
const primary = () => main().querySelectorAll("a.button:not(.secondary), button.button:not(.secondary)");
const phases = () => main().querySelector("ol[aria-label='Five-phase migration journey']")!;
afterEach(() => vi.restoreAllMocks());

describe("state-aware migration home", () => {
  it("offers explicit sample entry only when no selection exists; no request or created progress", async () => {
    const fetch = vi.spyOn(globalThis, "fetch"); render(<MyMigration/>);
    expect(await screen.findByRole("link", { name: "Start a sample migration" })).toHaveAttribute("href", "/assess?sample=harbor-light-migrate-demo");
    expect(primary()).toHaveLength(1); expect(fetch).not.toHaveBeenCalled();
    expect(screen.queryByRole("list", { name: "Five-phase migration journey" })).not.toBeInTheDocument();
    expect(screen.getByText(/Bounded synthetic Beta/)).toBeVisible();
  });
  it.each([
    ["CREATED",0,"Finish readiness check","/assess"], ["DISCOVERED",0,"Finish readiness check","/assess"],
    ["ASSESSED",1,"Prepare migration","/plan-map-approve"], ["PLANNED",1,"Review Mappings","/plan-map-approve"], ["MAPPING",1,"Review Mappings","/plan-map-approve"],
    ["AWAITING_APPROVAL",1,"Review plan","/plan-map-approve"], ["APPROVED",2,"Continue to Move","/migrate-resolve"], ["MIGRATION_READY",2,"Continue to Move","/migrate-resolve"],
    ["MIGRATING",2,"View migration progress","/migrate-resolve"], ["MIGRATION_PAUSED",2,"Review recovery","/migrate-resolve"], ["RESOLVING",2,"Review recovery","/migrate-resolve"], ["RETRY_PENDING",2,"Continue recovery","/migrate-resolve"], ["MIGRATION_BLOCKED",2,"Review migration issue","/migrate-resolve"],
    ["MIGRATION_COMPLETE",3,"Verify migrated books","/validate-configure"], ["VALIDATING",3,"View verification","/validate-configure"], ["VALIDATION_BLOCKED",3,"Review financial difference","/validate-configure"], ["VALIDATED",3,"Review settings","/validate-configure"], ["CONFIGURING",3,"Review settings","/validate-configure"], ["CONFIGURATION_REVIEW_REQUIRED",3,"Review settings","/validate-configure"],
    ["CONFIGURED",4,"Finish onboarding","/onboard-fpu"], ["ONBOARDING",4,"Finish onboarding","/onboard-fpu"], ["ONBOARDING_BLOCKED",4,"Review prerequisite","/onboard-fpu"], ["READY_FOR_FIRST_PRODUCTIVE_USE",4,"Prepare first task","/onboard-fpu"], ["FIRST_PRODUCTIVE_USE_IN_PROGRESS",4,"Continue first task","/onboard-fpu"], ["FIRST_PRODUCTIVE_USE_BLOCKED",4,"Review first-task issue","/onboard-fpu"], ["VERIFIED_FIRST_PRODUCTIVE_USE",4,"Review verified results","/trust"],
  ])("%s navigates to its governed task without mutation", async (status, phase, label, route) => {
    sessionStorage.setItem("movebooks-migration-session", id);
    const fetch = vi.spyOn(globalThis, "fetch").mockImplementation(() => json({ ...evidence, workflow_status: status }));
    render(<MyMigration/>);
    expect(await screen.findByRole("link", { name: String(label) })).toHaveAttribute("href", `${route}?${route === "/trust" ? "view=evidence&" : ""}session=${id}`);
    expect(primary()).toHaveLength(1);
    expect(fetch).toHaveBeenCalledTimes(1); expect(fetch.mock.calls[0][1]?.method).toBeUndefined();
    if (status === "VERIFIED_FIRST_PRODUCTIVE_USE") {
      expect(phases().querySelectorAll('[data-state="Completed"]')).toHaveLength(5);
      expect(phases().querySelector('[aria-current]')).toBeNull();
    } else {
      expect([...phases().children].findIndex(el => el.hasAttribute('aria-current'))).toBe(phase);
      expect(phases().querySelectorAll('a')).toHaveLength(Number(phase) + 1);
    }
    expect(within(screen.getByRole("navigation", { name: "Task help" })).getByRole("link", { name: "Help with this task" })).toHaveAttribute("href", `/support?session=${id}&stage=${phase}`);
    expect(screen.queryByText(/\d+%/)).not.toBeInTheDocument();
  });
  it.each([undefined, null, { pending:0 }, { total:0,pending:0 }, { total:2,pending:3 }])("does not infer eligible plan consent from missing/inconsistent mapping count %s", async review => {
    const fetch = vi.spyOn(globalThis, "fetch").mockImplementation(() => json({ ...evidence, workflow_status:"AWAITING_APPROVAL", mapping_review: review }));
    render(<MyMigration reference={id}/>);
    expect(await screen.findByRole("link", { name:"Review Mappings" })).toBeVisible();
    expect(screen.queryByRole("link",{name:"Review plan"})).not.toBeInTheDocument();
    expect(screen.getByText(/Mapping review count unavailable/)).toBeVisible(); expect(fetch).toHaveBeenCalledTimes(1);
  });
  it("retains readiness blocker and safe mapping review, without labeling Understand complete", async () => {
    vi.spyOn(globalThis,"fetch").mockImplementation(()=>json({...evidence,workflow_status:"AWAITING_APPROVAL",discovery:{findings:[{category:"BLOCKER",title:"Required source field"}]}}));
    render(<MyMigration reference={id}/>);
    expect(await screen.findByRole("link",{name:"Review 1 Readiness Issue"})).toBeVisible();
    expect(phases().firstElementChild).toHaveAttribute("data-state","Blocked"); expect(screen.queryByRole("link",{name:"Review plan"})).not.toBeInTheDocument();
  });
  it.each([403,404,500])("read failure %s preserves the selected reference and offers only refresh",async status=>{
    const selected="22222222-2222-4222-8222-222222222222";sessionStorage.setItem("movebooks-migration-session",selected);
    const fetch=vi.spyOn(globalThis,"fetch").mockImplementation(()=>json({secret:"FOREIGN_NAME"},status));render(<MyMigration reference={id}/>);
    expect(await screen.findByRole("heading",{name:"Migration unavailable"})).toBeVisible();
    expect(primary()).toHaveLength(1);expect(screen.queryByRole("link",{name:"Start a sample migration"})).not.toBeInTheDocument();
    expect(sessionStorage.getItem("movebooks-migration-session")).toBe(selected);expect(document.body).not.toHaveTextContent("FOREIGN_NAME");
    fireEvent.click(screen.getByRole("button",{name:"Try again"}));await waitFor(()=>expect(fetch).toHaveBeenCalledTimes(2));
    expect(fetch.mock.calls.every(call=>String(call[0]).includes(id))).toBe(true);
  });
  it("401 offers sign-in to the same destination, while an offline error does not claim expiry",async()=>{
    const fetch=vi.spyOn(globalThis,"fetch").mockImplementation(()=>json({},401));render(<MyMigration reference={id}/>);
    expect(await screen.findByRole("link",{name:"Sign in to resume"})).toHaveAttribute("href",`/sign-in?next=${encodeURIComponent('/workspace?session='+id)}`);
    expect(screen.queryByText(/No migration is selected/)).not.toBeInTheDocument();expect(fetch).toHaveBeenCalledTimes(1);
  });
  it.each(["", "../../private", "not-a-uuid"])("invalid reference %s performs no read and never substitutes a sample",async reference=>{
    const fetch=vi.spyOn(globalThis,"fetch");render(<MyMigration reference={reference}/>);expect(await screen.findByText(/Invalid session reference/)).toBeVisible();expect(fetch).not.toHaveBeenCalled();expect(screen.queryByRole("link",{name:"Start a sample migration"})).not.toBeInTheDocument();
  });
  it("unknown/mismatched/non-synthetic projections assume no progress and no new sample",async()=>{
    vi.spyOn(globalThis,"fetch").mockImplementation(()=>json({...evidence,workflow_status:"FUTURE_STATE"}));render(<MyMigration reference={id}/>);expect(await screen.findByText(/Unsupported session evidence/)).toBeVisible();expect(screen.getByRole("link",{name:"Read original workflow"})).toHaveAttribute("href",`/assess?session=${id}`);expect(screen.queryByRole("list",{name:"Five-phase migration journey"})).not.toBeInTheDocument();
  });
  it("missing attention evidence stays unknown, never zero or completed",async()=>{
    vi.spyOn(globalThis,"fetch").mockImplementation(()=>json({id,synthetic:true,workflow_status:"ASSESSED"}));render(<MyMigration reference={id}/>);expect(await screen.findByRole("link",{name:"Review readiness and plan"})).toBeVisible();expect(screen.getByText(/Attention details are incomplete/)).toBeVisible();expect(phases().firstElementChild).toHaveAttribute("data-state","Earlier phase");fireEvent.click(screen.getByText("Operational steps"));expect(screen.getByRole("list",{name:"Migration Journey"}).querySelector(".is-complete")).toBeNull();
  });
  it("shows only three attention previews with the actual supplied total",async()=>{
    vi.spyOn(globalThis,"fetch").mockImplementation(()=>json({...evidence,execution:{failures:Array.from({length:5},()=>({code:"MB-DUPLICATE_CUSTOMER",resolved:false}))}}));render(<MyMigration reference={id}/>);await screen.findByRole("link",{name:"Review recovery"});expect(within(screen.getByRole("region",{name:"Needs attention"})).getAllByRole("listitem")).toHaveLength(3);expect(screen.getByText(/5 items in the supplied snapshot; first 3 shown/)).toBeVisible();
  });
  it("adopts only authorized deep links, restores them on return, and clears old view while refreshing",async()=>{
    const fetch=vi.spyOn(globalThis,"fetch").mockImplementation(()=>json(evidence));const first=render(<MyMigration reference={id}/>);await screen.findByRole("link",{name:"Review recovery"});expect(sessionStorage.getItem("movebooks-migration-session")).toBe(id);first.unmount();render(<MyMigration/>);await screen.findByRole("link",{name:"Review recovery"});expect(fetch).toHaveBeenCalledTimes(2);
    let resolve!:(v:Response)=>void;fetch.mockImplementationOnce(()=>new Promise<Response>(done=>resolve=done));fireEvent.click(screen.getByRole("button",{name:"Refresh current state"}));expect(screen.queryByText(/Selected migration/)).not.toBeInTheDocument();expect(primary()).toHaveLength(0);await waitFor(()=>expect(fetch).toHaveBeenCalledTimes(3));await act(async()=>resolve(new Response(JSON.stringify(evidence))));await screen.findByRole("link",{name:"Review recovery"});
  });
});

it("an offline read offers same-reference refresh, sanitized errors and no sign-in or sample fallback",async()=>{
  sessionStorage.setItem("movebooks-migration-session",id);vi.spyOn(globalThis,"fetch").mockRejectedValue(new Error("PRIVATE_NETWORK_DETAIL"));render(<MyMigration/>);expect(await screen.findByRole("heading",{name:"Migration unavailable"})).toBeVisible();expect(screen.getByRole("button",{name:"Try again"})).toBeEnabled();expect(screen.queryByRole("link",{name:"Sign in to resume"})).not.toBeInTheDocument();expect(document.body).not.toHaveTextContent("PRIVATE_NETWORK_DETAIL");
});
it.each([{id:"22222222-2222-4222-8222-222222222222"},{synthetic:false}])("rejects mismatched or non-synthetic evidence %s",async change=>{
 vi.spyOn(globalThis,"fetch").mockImplementation(()=>json({...evidence,...change}));render(<MyMigration reference={id}/>);expect(await screen.findByText(/Unsupported session evidence/)).toBeVisible();expect(sessionStorage.getItem("movebooks-migration-session")).toBeNull();
});

it.each([false,true])("copying the owned link is explicit and handles unavailable clipboard (%s)",async unavailable=>{
  vi.spyOn(globalThis,"fetch").mockImplementation(()=>json(evidence));
  const writeText=vi.fn().mockImplementation(()=>unavailable ? Promise.reject(new Error("Clipboard unavailable")) : Promise.resolve());
  vi.stubGlobal("navigator",{...navigator,clipboard:{writeText}});
  try {
    render(<MyMigration reference={id}/>);await screen.findByRole("link",{name:"Review recovery"});
    expect(writeText).not.toHaveBeenCalled();fireEvent.click(screen.getByText("Migration link and recent history"));
    expect(screen.getByRole("textbox",{name:"Owned migration link"})).toHaveAttribute("readonly");
    fireEvent.click(screen.getByRole("button",{name:"Copy migration link"}));
    await screen.findByText(unavailable ? /Copy unavailable/ : /Migration link copied/);
    expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/workspace?session=${id}`);
    expect(primary()).toHaveLength(1);
  } finally { vi.unstubAllGlobals(); }
});
