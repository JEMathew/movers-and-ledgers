import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EvidenceRecords } from "./EvidenceRecords";
import { Trust } from "./Trust";
import { Support } from "./Support";
import { projectSession } from "./session";
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams(window.location.search) }));
const identity = vi.hoisted(() => ({ value: null as { subject: string; email: string } | null }));
vi.mock("@/components/IdentityProvider", () => ({ useIdentity: () => ({ identity: identity.value, ready: false, busy: false, hasSession: false }) }));
vi.mock("@/lib/identity", async original => ({ ...await original<typeof import("@/lib/identity")>(), authHeaders: async () => ({ Authorization: "Bearer test-owner" }) }));
const id = "11111111-1111-4111-8111-111111111111";
const other = "22222222-2222-4222-8222-222222222222";
const raw = (count = 0) => ({ id, synthetic: true, workflow_status: "RESOLVING", activity: [], events: [], validation_reports: [], discovery: { findings: [] }, execution: { failures: [], resolutions: [] }, configuration: { proposals: [] }, onboarding: { tasks: [] }, mapping_review: { total: 11, pending: 2 },
 human_decisions: Array.from({length: count}, (_, i) => ({ id: `decision-${i}`, stage: "mapping", decision: i === 0 ? "REJECTED" : "APPROVED", actor: "recorded-owner", occurred_at: "2026-10-11", evidence: [`mapping-${i}`], selected_value: "PRIVATE_VALUE" })) });
const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status });
beforeEach(() => { identity.value = null; sessionStorage.clear(); window.history.replaceState(null,"",`/trust?view=evidence&session=${id}`); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllEnvs(); sessionStorage.clear(); });
describe("supplied evidence and human governance", () => {
  it("makes all supplied records reachable, retaining rejection, actor, time and reference", () => {
    const fetch = vi.spyOn(globalThis,"fetch"); render(<EvidenceRecords view={projectSession(raw(35),id)}/>);
    expect(screen.getByRole("status")).toHaveTextContent("1–8 of 35 supplied records · page 1 of 5");
    for(let i=0;i<4;i++) fireEvent.click(screen.getByRole("button",{name:"Next records"}));
    expect(screen.getByRole("status")).toHaveTextContent("33–35 of 35");
    const record = screen.getByText("REJECTED · recorded-owner").closest("details")!;
    fireEvent.click(record.querySelector("summary")!);
    for(const text of ["Audit: decision-0","mapping-0","2026-10-11"]) expect(record).toHaveTextContent(text);
    expect(screen.getByRole("heading",{name:"Human approvals and decisions"})).toHaveFocus();
    expect(screen.getByRole("button",{name:"Next records"})).toBeDisabled();
    expect(document.body.textContent).not.toContain("PRIVATE_VALUE"); expect(fetch).not.toHaveBeenCalled();
  });
  it("resets paging when filtering and distinguishes empty evidence from approval", () => {
    render(<EvidenceRecords view={projectSession(raw(20),id)}/>);
    fireEvent.click(screen.getByRole("button",{name:"Next records"}));
    fireEvent.change(screen.getByLabelText("Evidence category"),{target:{value:"checks"}});
    expect(screen.getByRole("status")).toHaveTextContent("Absence is not a passed check or an approval");
    expect(screen.getByRole("button",{name:"Previous records"})).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Evidence category"),{target:{value:"decisions"}});
    expect(screen.getByRole("status")).toHaveTextContent("1–8 of 20");
  });
  it("does not invent provenance or missing check outcomes", () => {
    const v=projectSession({...raw(),activity:[{id:"unknown",action:"Unattributed"},{id:"model",provenance:"GENAI",action:"Proposed"}],onboarding:{fpu:{checks:[{id:"unknown-check"}]}}},id);
    expect(v.activity.map(r=>r.kind)).toEqual(["Provenance not supplied","AI recommendation"]); expect(v.checks[0].status).toBe("UNCONFIRMED");
  });
  it("reports partial attention and unknown mapping counts without success", async () => {
    vi.spyOn(globalThis,"fetch").mockResolvedValue(json({id,synthetic:true,workflow_status:"VALIDATED"})); render(<Trust evidenceMode session={id}/>);
    expect(await screen.findByText(/Mapping review count unavailable/)).toBeVisible();
    expect(screen.getByText(/Attention evidence is partial/)).toBeVisible();
    expect(screen.getByRole("link",{name:"Open exact financial checks"})).toHaveAttribute("href",`/validate-configure?session=${id}`);
    expect(screen.queryByRole("link",{name:"Open invoice and first-task evidence"})).not.toBeInTheDocument();
  });
  it("refreshes only the same authorized read and timestamps the snapshot", async () => {
    const fetch=vi.spyOn(globalThis,"fetch").mockImplementation(async()=>json(raw(1))); render(<Trust evidenceMode session={id}/>);
    await screen.findByRole("button",{name:"Refresh evidence"}); expect(screen.getByText(/Snapshot read at/)).toBeVisible();
    fireEvent.click(screen.getByRole("button",{name:"Refresh evidence"})); await waitFor(()=>expect(fetch).toHaveBeenCalledTimes(2));
    expect(fetch.mock.calls.every(([url,options])=>String(url).endsWith(`${id}/intake-trust`)&&!options?.method)).toBe(true);
    expect(screen.queryByRole("button",{name:/approve|retry|post/i})).not.toBeInTheDocument();
  });
});
describe("read recovery and private view boundaries", () => {
  it.each([401,403,404,500])("gives a safe next step for HTTP %i without replay", async status => {
    const fetch=vi.spyOn(globalThis,"fetch").mockResolvedValue(json({},status)); render(<Trust evidenceMode session={id}/>);
    expect(await screen.findByText("Evidence unavailable")).toBeVisible(); expect(screen.queryByLabelText("Evidence category")).not.toBeInTheDocument();
    if(status===401) expect(screen.getByRole("link",{name:"Verify access to this evidence"})).toHaveAttribute("href",`/sign-in?next=${encodeURIComponent(`/trust?view=evidence&session=${id}`)}`);
    else if(status===500) expect(screen.getByRole("button",{name:"Read the same evidence again"})).toBeEnabled();
    else expect(screen.getByRole("link",{name:"Open My Migration"})).toHaveAttribute("href","/workspace");
    expect(fetch).toHaveBeenCalledTimes(1); expect(sessionStorage.getItem("movebooks-migration-session")).toBeNull();
  });
  it("clears evidence on verified account change and discards the late read", async () => {
    vi.stubEnv("NEXT_PUBLIC_IDENTITY_MODE","firebase"); identity.value={subject:"owner-a",email:"a@example.test"};
    let resolveOld!: (response:Response)=>void;
    const fetch=vi.spyOn(globalThis,"fetch").mockImplementationOnce(()=>new Promise<Response>(resolve=>{resolveOld=resolve;})).mockResolvedValueOnce(json({},403));
    const rendered=render(<Trust evidenceMode session={id}/>); await waitFor(()=>expect(fetch).toHaveBeenCalledTimes(1));
    identity.value={subject:"owner-b",email:"b@example.test"}; rendered.rerender(<Trust evidenceMode session={id}/>);
    expect(await screen.findByText("Evidence unavailable")).toBeVisible(); resolveOld(json(raw(1)));
    await waitFor(()=>expect(screen.queryByLabelText("Evidence category")).not.toBeInTheDocument());
    expect(sessionStorage.getItem("movebooks-migration-session")).toBeNull();
    identity.value=null; rendered.rerender(<Trust evidenceMode session={id}/>); expect(screen.getByRole("heading",{level:1})).toHaveTextContent("Sign in to inspect");
  });
  it("reads changed explicit references rather than retaining an old view", async () => {
    vi.spyOn(globalThis,"fetch").mockResolvedValueOnce(json(raw(1))).mockResolvedValueOnce(json({...raw(),id:other}));
    const rendered=render(<Trust evidenceMode session={id}/>); await screen.findByText(/2 mappings awaiting review/);
    rendered.rerender(<Trust evidenceMode session={other}/>); await waitFor(()=>expect(sessionStorage.getItem("movebooks-migration-session")).toBe(other));
    expect(screen.queryByText("REJECTED · recorded-owner")).not.toBeInTheDocument();
  });
});
describe("phase Help with navigation-only context", () => {
  it.each([0,1,2,3,4])("preserves phase %i through issue and learning detours", stage => {
    window.history.replaceState(null,"",`/support?session=${id}&stage=${stage}&raw_data=PRIVATE_PAYLOAD`);
    const fetch=vi.spyOn(globalThis,"fetch"); render(<Support/>);
    fireEvent.change(screen.getByLabelText("What do you need help with?"),{target:{value:"1"}});
    const routes=["/assess","/plan-map-approve","/migrate-resolve","/validate-configure","/onboard-fpu"];
    expect(screen.getByRole("link",{name:/Open .* for this issue/})).toHaveAttribute("href",`${routes[stage]}?session=${id}`);
    expect(screen.getByRole("link",{name:"Return to original task"})).toHaveAttribute("href",`${routes[stage]}?session=${id}`);
    expect(screen.getByRole("link",{name:"Learn about this step"})).toHaveAttribute("href",`/learn?session=${id}&stage=${stage}#approvals`);
    expect(screen.getByRole("link",{name:"Reconsider a rejected mapping"})).toHaveAttribute("href","/guide#reconsideration");
    fireEvent.click(screen.getByText("Interrupted, blocked or uncertain result?")); expect(screen.getByText(/read its current state first/)).toBeVisible();
    expect(document.body.textContent).not.toContain("PRIVATE_PAYLOAD"); expect(fetch).not.toHaveBeenCalled();
  });
  it("does not replace explicit invalid context with stored selection", () => {
    sessionStorage.setItem("movebooks-migration-session",id); window.history.replaceState(null,"","/support?session=invalid&stage=99"); render(<Support/>);
    expect(screen.getByRole("link",{name:"Read related concept"})).toHaveAttribute("href","/learn#mappings");
    expect(screen.queryByRole("link",{name:"Return to original task"})).not.toBeInTheDocument();
  });
  it("updates same-page context without retaining an old phase or reference", () => {
    window.history.replaceState(null,"",`/support?session=${id}&stage=2`);
    const rendered=render(<Support/>);
    expect(screen.getByRole("link",{name:"Return to original task"})).toHaveAttribute("href",`/migrate-resolve?session=${id}`);
    window.history.replaceState(null,"",`/support?session=${other}&stage=4`); rendered.rerender(<Support/>);
    expect(screen.getByRole("link",{name:"Return to original task"})).toHaveAttribute("href",`/onboard-fpu?session=${other}`);
    expect(screen.queryByRole("heading",{name:"Migration paused"})).not.toBeInTheDocument();
  });

});
