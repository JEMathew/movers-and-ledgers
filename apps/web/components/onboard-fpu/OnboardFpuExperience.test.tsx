import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { OnboardFpuExperience } from "./OnboardFpuExperience";
import type { Fpu, Snapshot } from "./types";

const initial: Snapshot = {session_id:"fpu-session", company_name:"Harbor", workflow_status:"ONBOARDING", effective_status:"ONBOARDING", ready:false, verified_fpu:false, tasks:[{id:"role_access",label:"Invoice access",status:"REVIEW_REQUIRED",explanation:"Synthetic-only invoice permission",next_action:"Review and approve",evidence:["context:abc"],approval_required:true,choices:["SYNTHETIC_INVOICE_OPERATOR","READ_ONLY"]}],onboarding:{faults:[]},customers:[{id:"c1",display_name:"Cedar"}],products:[{id:"p1",name:"Catalog"}],activity:[]};
const task: Fpu = {id:"invoice1",status:"AWAITING_APPROVAL",checkpoint:"DRAFT",attempts:0,retry_limit:3,contract_hash:"hash",contract:{currency:"USD",tax_code:"CA-SALES",tax_rate:"0.0725",payment_terms:"NET_30",receivable_account:"ar",income_account:"sales",tax_account:"tax",totals:{subtotal:"100.00",tax:"7.25",total:"107.25"}},inputs:{customer_id:"c1",product_id:"p1",quantity:1,unit_price:"100.00"},decisions:[],checks:[]};
const prepared: Snapshot = {...initial,ready:true,tasks:[],onboarding:{faults:[],fpu:task}};
const response = (body: object, status=200) => Promise.resolve(new Response(JSON.stringify(body),{status}));
beforeAll(() => {HTMLDialogElement.prototype.showModal = function(){this.open=true;}; HTMLDialogElement.prototype.close = function(){this.open=false;};});
beforeEach(() => {sessionStorage.clear(); window.history.replaceState(null,"","/onboard-fpu");});
afterEach(() => vi.restoreAllMocks());
async function load(value=initial) {vi.spyOn(globalThis,"fetch").mockImplementation(() => response(value)); render(<OnboardFpuExperience/>); fireEvent.click(screen.getByRole("button",{name:"Load synthetic scenario"})); await screen.findByText("Finish the essentials");}

describe("governed onboarding and productive use", () => {
  it("shows scope and prevents preparation before prerequisites", async () => {
    await load();
    expect(screen.getByText(/No real provider writes/)).toBeInTheDocument();
    expect(screen.getByRole("button",{name:"Prepare invoice contract"})).toBeDisabled();
    expect(screen.queryByRole("heading",{name:"VERIFIED FIRST PRODUCTIVE USE"})).not.toBeInTheDocument();
  });
  it("attributes modified setup and sends only supported decision inputs", async () => {
    await load();
    fireEvent.click(screen.getByRole("button",{name:"Modify invoice access"}));
    fireEvent.change(screen.getByLabelText("Supported setup choice"),{target:{value:"READ_ONLY"}});
    fireEvent.click(screen.getByRole("button",{name:"Confirm modify"}));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    const call = vi.mocked(fetch).mock.calls.at(-1)!;
    expect(JSON.parse(call[1]!.body as string)).toEqual({action:"modify",selection:"READ_ONLY",comment:""});
  });
  it("requires explicit contract approval before posting and preserves dialog errors", async () => {
    await load(prepared);
    expect(screen.getByRole("button",{name:"Post and verify invoice"})).toBeDisabled();
    fireEvent.click(screen.getByRole("button",{name:"Review invoice approval"}));
    vi.mocked(fetch).mockImplementationOnce(() => response({detail:"Evidence changed"},409));
    fireEvent.click(screen.getByRole("button",{name:"Confirm approve"}));
    expect(await screen.findByRole("alert")).toHaveTextContent("Evidence changed");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.queryByRole("heading",{name:"VERIFIED FIRST PRODUCTIVE USE"})).not.toBeInTheDocument();
  });
  it("resumes a posted checkpoint with the original key and renders verified evidence only", async () => {
    const posted = {...task,checkpoint:"POSTED" as const,attempts:1,idempotency_key:"original",decisions:[{action:"approve",actor:"demo-user"}]};
    await load({...prepared,onboarding:{faults:[],fpu:posted}});
    vi.mocked(fetch).mockImplementationOnce(() => response({...prepared,verified_fpu:true,workflow_status:"VERIFIED_FIRST_PRODUCTIVE_USE",effective_status:"VERIFIED_FIRST_PRODUCTIVE_USE",onboarding:{faults:[],fpu:{...posted,checkpoint:"VERIFIED",posted_by:"demo-user",invoice:{total:"107.25"},checks:[{id:"posting",passed:true,explanation:"Matched",evidence:["invoice:hash"]}]}}}));
    fireEvent.click(screen.getByRole("button",{name:"Resume verification"}));
    await screen.findByRole("heading",{name:"VERIFIED FIRST PRODUCTIVE USE"});
    expect(screen.getByRole("link",{name:"Review Verified Evidence"}).getAttribute("href")).toMatch(/^\/trust\?session=/);
    expect(screen.getByRole("list",{name:"Migration Journey"})).toHaveTextContent("Start UsingCompleted");
    expect((vi.mocked(fetch).mock.calls.at(-1)![1]!.headers as Record<string,string>)["Idempotency-Key"]).toBe("original");
    expect(screen.getByText("Posted invoice, journal and accounting impact")).toBeInTheDocument();
  });
  it("requires human approval for synthetic repair and never calls execute implicitly", async () => {
    await load({...initial,onboarding:{faults:["missing_customer"]}});
    fireEvent.click(screen.getByRole("button",{name:"Review synthetic remediation"}));
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button",{name:"Confirm remediation"}));
    await waitFor(() => expect(vi.mocked(fetch)).toHaveBeenCalledTimes(2));
    expect(vi.mocked(fetch).mock.calls[1][0]).toContain("/onboarding/remediation");
  });
  it("keeps rejection explicit and disables posting while modifying a draft", async () => {
    await load({...prepared,onboarding:{faults:[],fpu:{...task,decisions:[{action:"approve",actor:"demo-user"}]}}});
    fireEvent.click(screen.getByRole("button",{name:"Reject invoice"}));
    fireEvent.click(screen.getByRole("button",{name:"Confirm reject"}));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(JSON.parse(vi.mocked(fetch).mock.calls.at(-1)![1]!.body as string).action).toBe("reject");
    fireEvent.click(screen.getByRole("button",{name:"Modify invoice"}));
    expect(screen.getByRole("button",{name:"Post and verify invoice"})).toBeDisabled();
  });
});
