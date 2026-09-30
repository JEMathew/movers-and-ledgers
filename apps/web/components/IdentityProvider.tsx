"use client";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { User } from "firebase/auth";
import { cloudIdentity, navigateAfterAuth, prepareGoogleIdentity, signInError, verifiedIdentity, type GoogleIdentityRuntime, type VerifiedIdentity } from "@/lib/identity";

type Session = {
  ready: boolean; busy: boolean; hasSession: boolean; identity: VerifiedIdentity | null; error: string;
  signIn: (destination: string) => void; signOut: () => void;
};
const IdentityContext = createContext<Session | null>(null);

export function useIdentity() {
  const session = useContext(IdentityContext);
  if (!session) throw new Error("IdentityProvider is required");
  return session;
}

export function IdentityProvider({ children }: { children: React.ReactNode }) {
  const runtime = useRef<GoogleIdentityRuntime | null>(null);
  const generation = useRef(0);
  const active = useRef(false);
  const operation = useRef(false);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [identity, setIdentity] = useState<VerifiedIdentity | null>(null);
  const [error, setError] = useState("");

  async function refresh(user: User | null) {
    const version = ++generation.current;
    setHasSession(!!user);
    setIdentity(null);
    setError("");
    if (!user) { setReady(true); return true; }
    setReady(false);
    try {
      const verified = await verifiedIdentity(user);
      if (!active.current || version !== generation.current) return false;
      setIdentity(verified); setReady(true); setError("");
      return true;
    } catch {
      if (active.current && version === generation.current) {
        setReady(true); setError("Your Google session could not be verified by the API. Sign out and sign in again, or contact the Beta operator.");
      }
      return false;
    }
  }

  useEffect(() => {
    if (!cloudIdentity()) return;
    active.current = true;
    let disposed = false;
    let unsubscribe: (() => void) | undefined;
    const invalidate = () => { ++generation.current; };
    void prepareGoogleIdentity().then(value => {
      if (disposed) return;
      runtime.current = value;
      // Popup completion verifies its returned user once. An SDK notification during
      // that same operation must not race it and cancel the destination navigation.
      unsubscribe = value.subscribe(user => { if (!disposed && !operation.current) void refresh(user); });
    }).catch(() => {
      if (!disposed) setError("Google sign-in initialization failed. Reload this page to retry. No demo sign-in occurred.");
    });
    return () => { disposed = true; active.current = false; invalidate(); unsubscribe?.(); };
  }, []);

  function signIn(destination: string) {
    if (!runtime.current || !ready || operation.current) return;
    operation.current = true; setBusy(true); setError("");
    // The SDK has already loaded and completed readiness. Preserve the click's activation.
    let popup: ReturnType<GoogleIdentityRuntime["signIn"]>;
    try { popup = runtime.current.signIn(); }
    catch (failure) { operation.current = false; setBusy(false); setError(signInError(failure)); return; }
    void popup.then(async result => {
      if (active.current && await refresh(result.user)) navigateAfterAuth(destination);
    }).catch(failure => { if (active.current) setError(signInError(failure)); })
      .finally(() => { operation.current = false; if (active.current) setBusy(false); });
  }

  function signOut() {
    if (!runtime.current || operation.current) return;
    operation.current = true; ++generation.current;
    setIdentity(null); setBusy(true); setError("");
    void runtime.current.signOut().then(() => {
      if (active.current) { setHasSession(false); setReady(true); }
      // Clear only UI references, never persisted workspace/approval data.
      for (const key of ["movebooks-migration-session", "movebooks-validation-session", "movebooks-onboarding-session"]) sessionStorage.removeItem(key);
      if (active.current) navigateAfterAuth("/sign-in");
    }).catch(() => {
      if (active.current) setError("Sign-out could not be confirmed. Try Sign out again; do not assume your session is cleared.");
    }).finally(() => { operation.current = false; if (active.current) setBusy(false); });
  }

  return <IdentityContext.Provider value={{ ready, busy, hasSession, identity, error, signIn, signOut }}>{children}</IdentityContext.Provider>;
}
