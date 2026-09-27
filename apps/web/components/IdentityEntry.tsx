"use client";
import { useEffect, useRef, useState } from "react";
import { cloudIdentity, firebaseAuth, safeDestination } from "@/lib/identity";
import { Button } from "@/components/ui";

export function IdentityEntry({ destination }: { destination: string }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const errorRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => { if (error) errorRef.current?.focus(); }, [error]);
  async function signIn() {
    setBusy(true); setError("");
    try {
      const { GoogleAuthProvider, signInWithPopup } = await import("firebase/auth");
      await signInWithPopup(await firebaseAuth(), new GoogleAuthProvider());
      window.location.assign(safeDestination(destination));
    } catch { setError("Google sign-in is unavailable or was cancelled. No demo sign-in occurred."); }
    finally { setBusy(false); }
  }
  return <>{cloudIdentity() ? <Button className="mt-7 w-full" disabled={busy} onClick={signIn}>Sign in with Google</Button> : process.env.NODE_ENV !== "production" ? <a className="button mt-7 w-full" href={`/api/auth/demo?next=${encodeURIComponent(safeDestination(destination))}`}>Enter local demo →</a> : <p role="status" className="mt-7">Sign-in is not configured. Demo access is disabled.</p>}
    {error && <p ref={errorRef} tabIndex={-1} role="alert" className="mt-4">{error}</p>}
    <p className="mt-4 text-xs text-muted">{cloudIdentity() ? "Cloud foundation Beta · synthetic workspaces only · not production-ready" : "Local demo identity · controlled de-identified test exports only"}</p></>;
}
