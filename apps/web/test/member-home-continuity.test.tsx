import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WorkspaceEntry } from "@/components/WorkspaceEntry";

const mocks=vi.hoisted(()=>({session:{ready:true,busy:false,hasSession:true,identity:{subject:'firebase:a',email:'a@example.test'} as {subject:string;email:string}|null,error:'',signIn:vi.fn(),signOut:vi.fn()}}));
vi.mock("@/components/IdentityProvider",()=>({useIdentity:()=>mocks.session}));
vi.mock("@/lib/identity",async original=>({...await original<typeof import('@/lib/identity')>(),authHeaders:async()=>({Authorization:`Bearer ${mocks.session.identity?.subject}`})}));
const a="11111111-1111-4111-8111-111111111111",b="22222222-2222-4222-8222-222222222222";
const evidence=(id=a,status="RESOLVING")=>({id,synthetic:true,workflow_status:status});
const response=(id=a,status="RESOLVING")=>new Response(JSON.stringify(evidence(id,status)));
beforeEach(()=>{vi.stubEnv('NEXT_PUBLIC_IDENTITY_MODE','firebase');mocks.session.identity={subject:'firebase:a',email:'a@example.test'};mocks.session.ready=true;mocks.session.hasSession=true;vi.clearAllMocks();});
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllEnvs();});

describe('verified member read continuity',()=>{
  it('clears private home immediately on identity loss and retains the safe deep-link destination',async()=>{
    const fetch=vi.spyOn(globalThis,'fetch').mockImplementation(()=>Promise.resolve(response()));const root=render(<WorkspaceEntry reference={a}/>);await screen.findByRole('link',{name:'Review recovery'});
    mocks.session.identity=null;mocks.session.ready=false;root.rerender(<WorkspaceEntry reference={a}/>);
    expect(screen.queryByText(/Selected migration/)).not.toBeInTheDocument();expect(screen.queryByRole('link',{name:'Evidence & Results'})).not.toBeInTheDocument();expect(screen.getByRole('heading',{name:'Sign in to continue your migration'})).toBeVisible();expect(fetch).toHaveBeenCalledTimes(1);
    mocks.session.hasSession=false;mocks.session.ready=true;root.rerender(<WorkspaceEntry reference={a}/>);fireEvent.click(screen.getByRole('button',{name:'Continue with Google'}));expect(mocks.session.signIn).toHaveBeenCalledWith(`/workspace?session=${a}`);
    mocks.session.hasSession=true;mocks.session.identity={subject:'firebase:a',email:'a@example.test'};root.rerender(<WorkspaceEntry reference={a}/>);await screen.findByRole('link',{name:'Review recovery'});expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch.mock.calls.every(call=>call[1]?.method===undefined)).toBe(true);
  });
  it('late old-account response cannot repopulate the new account or adopt its pointer',async()=>{
    let old!:(value:Response)=>void;sessionStorage.setItem('movebooks-migration-session',b);
    const fetch=vi.spyOn(globalThis,'fetch').mockImplementationOnce(()=>new Promise<Response>(resolve=>old=resolve)).mockResolvedValueOnce(new Response('{}',{status:404}));
    const root=render(<WorkspaceEntry reference={a}/>);await waitFor(()=>expect(fetch).toHaveBeenCalledTimes(1));
    mocks.session.identity={subject:'firebase:b',email:'b@example.test'};root.rerender(<WorkspaceEntry reference={a}/>);await screen.findByRole('heading',{name:'Migration unavailable'});
    await act(async()=>old(response()));expect(screen.queryByRole('link',{name:'Review recovery'})).not.toBeInTheDocument();expect(screen.queryByText(/Selected migration/)).not.toBeInTheDocument();expect(sessionStorage.getItem('movebooks-migration-session')).toBe(b);
    expect(fetch.mock.calls[0][1]?.signal?.aborted).toBe(true);expect(fetch.mock.calls[1][1]?.headers).toEqual({Authorization:'Bearer firebase:b'});
  });
  it('query/reference navigation drops the previous snapshot, ignores its response and resumes the new reference',async()=>{
    let old!:(value:Response)=>void;const fetch=vi.spyOn(globalThis,'fetch').mockImplementationOnce(()=>new Promise<Response>(resolve=>old=resolve)).mockResolvedValueOnce(response(b,'MIGRATION_COMPLETE'));
    const root=render(<WorkspaceEntry reference={a}/>);await waitFor(()=>expect(fetch).toHaveBeenCalledTimes(1));root.rerender(<WorkspaceEntry reference={b}/>);expect(screen.queryByText(/Selected migration/)).not.toBeInTheDocument();await screen.findByRole('link',{name:'Verify migrated books'});
    await act(async()=>old(response()));expect(screen.getByRole('link',{name:'Verify migrated books'})).toHaveAttribute('href',`/validate-configure?session=${b}`);expect(sessionStorage.getItem('movebooks-migration-session')).toBe(b);expect(screen.queryByRole('link',{name:'Review recovery'})).not.toBeInTheDocument();
  });
  it('pending/unverified identity exposes no protected home or session request',()=>{
    mocks.session.identity=null;mocks.session.ready=false;const fetch=vi.spyOn(globalThis,'fetch');render(<WorkspaceEntry reference={a}/>);expect(fetch).not.toHaveBeenCalled();expect(screen.queryByRole('navigation',{name:'Migration details'})).not.toBeInTheDocument();expect(screen.getByText('Verifying your account…')).toBeVisible();
  });
});
