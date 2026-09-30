import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "firebase/auth";

const sdk = vi.hoisted(() => ({ getAuth: vi.fn(), persistence: vi.fn(), ready: vi.fn(), popup: vi.fn(), params: vi.fn(), listener: vi.fn(), signOut: vi.fn(), init: vi.fn() }));
vi.mock("firebase/app", () => ({ getApps: () => [], initializeApp: sdk.init }));
vi.mock("firebase/auth", () => ({
  getAuth: sdk.getAuth, setPersistence: sdk.persistence, browserSessionPersistence: "session-only",
  signInWithPopup: sdk.popup, signOut: sdk.signOut, onIdTokenChanged: sdk.listener,
  GoogleAuthProvider: class { setCustomParameters = sdk.params; },
}));
beforeEach(() => {
  vi.resetModules(); vi.clearAllMocks();
  vi.stubEnv("NEXT_PUBLIC_IDENTITY_MODE", "firebase");
  vi.stubEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID", "test-project");
  vi.stubEnv("NEXT_PUBLIC_FIREBASE_API_KEY", "test-public-config");
  vi.stubEnv("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", "test-project.firebaseapp.com");
  vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://beta.example.test/api");
  sdk.getAuth.mockReturnValue({ authStateReady: sdk.ready, currentUser: null });
  sdk.persistence.mockResolvedValue(undefined); sdk.ready.mockResolvedValue(undefined);
  sdk.popup.mockReturnValue(Promise.resolve());
});
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
describe("prepared Firebase runtime", () => {
  it("deduplicates initialization/persistence and waits for SDK readiness before exposing popup action", async () => {
    let release!: () => void;
    sdk.ready.mockReturnValue(new Promise<void>(resolve => { release = resolve; }));
    const identity = await import("@/lib/identity");
    const a = identity.prepareGoogleIdentity(); const b = identity.prepareGoogleIdentity();
    expect(a).toBe(b);
    let done = false; void a.then(() => { done = true; });
    await vi.waitFor(() => expect(sdk.ready).toHaveBeenCalledTimes(1));
    expect(done).toBe(false); expect(sdk.popup).not.toHaveBeenCalled();
    release(); const runtime = await a;
    expect(sdk.params).toHaveBeenCalledWith({ prompt: "select_account" });
    expect(sdk.persistence).toHaveBeenCalledWith(runtime.auth, "session-only");
    runtime.signIn(); expect(sdk.popup).toHaveBeenCalledTimes(1);
    await identity.firebaseAuth(); expect(sdk.persistence).toHaveBeenCalledTimes(1);
  });
  it("does not cache a failed initialization permanently", async () => {
    sdk.persistence.mockRejectedValueOnce(new Error("blocked storage"));
    const { prepareGoogleIdentity } = await import("@/lib/identity");
    await expect(prepareGoogleIdentity()).rejects.toThrow("blocked storage");
    await expect(prepareGoogleIdentity()).resolves.toBeDefined();
  });
  it("fails closed after sign-out and never returns demo headers", async () => {
    const { authHeaders } = await import("@/lib/identity");
    await expect(authHeaders()).rejects.toThrow("Sign in with Google");
  });
});

describe("server-verified identity display", () => {
  const user = { uid: "user-b", email: "do-not-trust@example.test", getIdToken: vi.fn().mockResolvedValue("synthetic-token") } as unknown as User;
  function delayedVerification(delay: number) {
    vi.useFakeTimers();
    // Model the actual AbortSignal deadline with the fake clock, not real sleeps.
    const timeout = vi.spyOn(AbortSignal, "timeout").mockImplementation(milliseconds => {
      const controller = new AbortController();
      setTimeout(() => controller.abort(new DOMException("Timed out", "TimeoutError")), milliseconds);
      return controller.signal;
    });
    const fetch = vi.fn().mockImplementation((_url: string, options: RequestInit) => new Promise((resolve, reject) => {
      const completion = setTimeout(() => resolve(Response.json({ subject: "firebase:user-b", email: "server@example.test" })), delay);
      options.signal?.addEventListener("abort", () => { clearTimeout(completion); reject(options.signal?.reason); }, { once: true });
    }));
    vi.stubGlobal("fetch", fetch);
    return { timeout, fetch };
  }
  it("accepts the observed 22.33s identity response instead of abandoning it at 15s", async () => {
    const { timeout, fetch } = delayedVerification(22_330);
    const { verifiedIdentity } = await import("@/lib/identity");
    let settled = false;
    const result = verifiedIdentity(user).then(value => { settled = true; return value; }, () => { settled = true; return null; });
    await vi.advanceTimersByTimeAsync(15_001);
    expect(settled).toBe(false);
    await vi.advanceTimersByTimeAsync(7_329);
    expect(await result).toEqual({ subject: "firebase:user-b", email: "server@example.test" });
    expect(timeout).toHaveBeenCalledWith(65_000);
    expect(fetch).toHaveBeenCalledTimes(1); // No automatic sign-in or verification retry.
  });
  it("still times out a stalled verification and never substitutes client identity", async () => {
    const { fetch } = delayedVerification(66_000);
    const { verifiedIdentity } = await import("@/lib/identity");
    const result = verifiedIdentity(user).then(() => "unexpected identity", error => error.name);
    await vi.advanceTimersByTimeAsync(65_000);
    expect(await result).toBe("TimeoutError");
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it("uses verified response subject/email via authenticated no-store request", async () => {
    const fetch = vi.fn().mockResolvedValue(Response.json({ subject: "firebase:user-b", email: "server@example.test" }));
    vi.stubGlobal("fetch", fetch);
    const { verifiedIdentity } = await import("@/lib/identity");
    expect(await verifiedIdentity(user)).toEqual({ subject: "firebase:user-b", email: "server@example.test" });
    expect(fetch).toHaveBeenCalledWith("https://beta.example.test/api/v1/identity", expect.objectContaining({
      headers: { Authorization: "Bearer synthetic-token" }, cache: "no-store", credentials: "omit", redirect: "error",
    }));
  });
  it.each([401, 403, 503])("rejects API %s without displaying a client identity", async status => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({}, { status })));
    const { verifiedIdentity } = await import("@/lib/identity");
    await expect(verifiedIdentity(user)).rejects.toThrow("Session verification failed");
  });
  it.each([
    { subject: "firebase:other-owner", email: "other@example.test" },
    { subject: "firebase:user-b", email: null }, { subject: "firebase:user-b", email: "" },
  ])("rejects mismatched or absent identity claims", async body => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(body)));
    const { verifiedIdentity } = await import("@/lib/identity");
    await expect(verifiedIdentity(user)).rejects.toThrow("Session identity mismatch");
  });
  it("does not send a token over HTTP", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "http://beta.example.test");
    const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
    const { verifiedIdentity } = await import("@/lib/identity");
    await expect(verifiedIdentity(user)).rejects.toThrow("Invalid identity endpoint");
    expect(fetch).not.toHaveBeenCalled();
  });
});
