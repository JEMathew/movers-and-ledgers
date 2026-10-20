import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useAdvisoryRequest } from "./use-advisory-request";

const identity = vi.hoisted(() => ({ cloud: true, prepare: vi.fn(), headers: vi.fn() }));
vi.mock("./identity", () => ({
  cloudIdentity: () => identity.cloud, prepareGoogleIdentity: identity.prepare,
  authHeaders: identity.headers,
}));
let listener: (user: {uid: string} | null) => void;
let runtime: { auth: { currentUser: { uid: string } | null }; subscribe: ReturnType<typeof vi.fn> };
let unsubscribe: ReturnType<typeof vi.fn>;
const unavailable = "Guidance unavailable. No action was approved.";
const path = "/v1/migration-sessions/synthetic/reasoning/mapping";
const current = () => true;
const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(r => { resolve = r; });
  return { promise, resolve };
};
beforeEach(() => {
  identity.cloud = true; identity.headers.mockReset(); identity.headers.mockResolvedValue({});
  identity.prepare.mockReset(); unsubscribe = vi.fn();
  runtime = {auth: {currentUser: {uid: "A"}}, subscribe: vi.fn(callback => {
    listener = callback; callback(runtime.auth.currentUser); return unsubscribe;
  })};
  identity.prepare.mockResolvedValue(runtime);
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.useRealTimers(); });
async function mounted(scope = "workspace:mapping") {
  const hook = renderHook(({scope}) => useAdvisoryRequest<{value: string}>(scope, unavailable), {initialProps: {scope}});
  await waitFor(() => expect(hook.result.current.ready).toBe(true));
  return hook;
}
async function account(uid: string | null) {
  await act(async () => { runtime.auth.currentUser = uid ? {uid} : null; listener(runtime.auth.currentUser); });
}
it("does not invoke on mount; same-UID refresh retains displayed guidance", async () => {
  const fetcher = vi.fn().mockResolvedValue({ok:true, json: async () => ({value:"A"})}); vi.stubGlobal("fetch", fetcher);
  const hook = await mounted(); expect(fetcher).not.toHaveBeenCalled();
  await act(() => hook.result.current.request(path, current));
  await account("A"); expect(hook.result.current.result?.value).toBe("A"); expect(fetcher).toHaveBeenCalledTimes(1);
  await account("B"); expect(hook.result.current.result).toBeUndefined();
  await account(null); expect(hook.result.current.ready).toBe(false);
  await act(() => hook.result.current.request(path, current)); expect(fetcher).toHaveBeenCalledTimes(1);
});
it("aborts and suppresses late responses across account changes", async () => {
  const pending = deferred<unknown>(); const fetcher = vi.fn().mockReturnValue(pending.promise); vi.stubGlobal("fetch", fetcher);
  const hook = await mounted(); let operation!: Promise<void>;
  act(() => { operation = hook.result.current.request(path, current); });
  await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));
  const signal = fetcher.mock.calls[0][1].signal;
  await account("B"); expect(signal.aborted).toBe(true);
  await act(async () => {pending.resolve({ok:true, json: async () => ({value:"A private"})}); await operation;});
  expect(hook.result.current.result).toBeUndefined(); expect(hook.result.current.error).toBe("");
});
it("checks runtime identity after credential wait even before subscription fires", async () => {
  const headers = deferred<object>(); identity.headers.mockReturnValue(headers.promise);
  const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher); const hook = await mounted(); let operation!: Promise<void>;
  act(() => { operation = hook.result.current.request(path, current); });
  runtime.auth.currentUser = {uid:"B"};
  await act(async () => {headers.resolve({}); await operation;}); expect(fetcher).not.toHaveBeenCalled();
});
it("reuses uncertain POST identity and refuses double invocation", async () => {
  const pending = deferred<unknown>(); const fetcher = vi.fn().mockReturnValueOnce(pending.promise).mockResolvedValue({ok:false}); vi.stubGlobal("fetch", fetcher);
  const hook = await mounted(); let operation!: Promise<void>;
  act(() => {operation = hook.result.current.request(path, current); void hook.result.current.request(path, current);});
  await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));
  await act(async () => {pending.resolve({ok:false}); await operation;});
  await act(() => hook.result.current.request(path, current));
  expect(fetcher.mock.calls[0][1].body).toEqual(fetcher.mock.calls[1][1].body);
  await account("B"); await act(() => hook.result.current.request(path, current));
  expect(fetcher.mock.calls[2][1].body).not.toEqual(fetcher.mock.calls[0][1].body);
});
it("clears results on workspace/mapping scope change and unsubscribes", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ok:true, json:async () => ({value:"old"})}));
  const hook = await mounted(); await act(() => hook.result.current.request(path, current));
  hook.rerender({scope:"different:mapping"}); await waitFor(() => expect(hook.result.current.ready).toBe(true));
  expect(hook.result.current.result).toBeUndefined(); expect(unsubscribe).toHaveBeenCalled();
});
it("fails closed when identity initialization fails without exposing error text", async () => {
  identity.prepare.mockRejectedValue(new Error("private-credential-canary")); const fetcher=vi.fn(); vi.stubGlobal("fetch",fetcher);
  const hook=renderHook(() => useAdvisoryRequest("scope", unavailable));
  await waitFor(() => expect(hook.result.current.error).toBe(unavailable));
  expect(hook.result.current.ready).toBe(false); await act(() => hook.result.current.request(path,current)); expect(fetcher).not.toHaveBeenCalled();
});
it("an old finalizer cannot end the new account's pending request", async () => {
  const old=deferred<unknown>(); const fresh=deferred<unknown>(); const fetcher=vi.fn().mockReturnValueOnce(old.promise).mockReturnValueOnce(fresh.promise); vi.stubGlobal("fetch",fetcher);
  const hook=await mounted(); let first!:Promise<void>; let second!:Promise<void>;
  act(() => {first=hook.result.current.request(path,current);}); await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));
  await account("B"); act(() => {second=hook.result.current.request(path,current);}); await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));
  await act(async () => {old.resolve({ok:false}); await first;}); expect(hook.result.current.busy).toBe(true);
  await act(async () => {fresh.resolve({ok:true,json:async () => ({value:"B"})}); await second;}); expect(hook.result.current.result?.value).toBe("B");
});
it("discards results if navigation changes without waiting for a rerender", async () => {
  const pending=deferred<unknown>(); vi.stubGlobal("fetch",vi.fn().mockReturnValue(pending.promise));
  const hook=await mounted(); let here=true; let operation!:Promise<void>;
  act(() => {operation=hook.result.current.request(path,()=>here);}); await act(async () => {}); here=false;
  await act(async () => {pending.resolve({ok:true,json:async()=>({value:"old"})}); await operation;}); expect(hook.result.current.result).toBeUndefined();
});
it("times out without revealing raw transport errors", async () => {
  const hook=await mounted(); vi.useFakeTimers();
  const fetcher=vi.fn((_path, init) => new Promise((_resolve,reject) => {
    init.signal.addEventListener("abort", () => reject(new Error("private-transport-canary")));
  })); vi.stubGlobal("fetch",fetcher);
  let operation!:Promise<void>;
  act(() => {operation=hook.result.current.request(path,current);});
  await act(async () => {await Promise.resolve();});
  await act(async () => {await vi.advanceTimersByTimeAsync(75_000); await operation;});
  expect(fetcher.mock.calls[0][1].signal.aborted).toBe(true);
  expect(hook.result.current.error).toBe(unavailable); expect(hook.result.current.busy).toBe(false);
});
