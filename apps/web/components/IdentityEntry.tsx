"use client";
import { useEffect, useRef } from "react";
import { cloudIdentity, safeDestination } from "@/lib/identity";
import { Button } from "@/components/ui";
import { useIdentity } from "./IdentityProvider";

export function GoogleSignIn({ destination, compact = false }: { destination?: string; compact?: boolean }) {
  const { ready, busy, identity, signIn } = useIdentity();
  if (identity) return compact ? null : <a className="button mt-7" href={safeDestination(destination ?? "/workspace")}>Continue to workspace</a>;
  return <Button className={compact ? "underline" : "mt-7 w-full"} variant={compact ? "ghost" : "primary"}
    disabled={!ready || busy} onClick={() => signIn(destination ?? (window.location.pathname === "/sign-in"
      ? new URLSearchParams(window.location.search).get("next") ?? "/workspace"
      : `${window.location.pathname}${window.location.search}`))}>
    {!ready ? "Preparing Google sign-in…" : busy ? "Signing in…" : compact ? "Sign in" : "Sign in with Google"}
  </Button>;
}

export function IdentityFeedback() {
  const { error } = useIdentity();
  const errorRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => { if (error) errorRef.current?.focus(); }, [error]);
  return error ? <p ref={errorRef} tabIndex={-1} role="alert" className="mt-3">{error}</p> : null;
}

export function IdentityEntry({ destination }: { destination: string }) {
  return <>{cloudIdentity() ? <GoogleSignIn destination={destination} /> : process.env.NODE_ENV !== "production" ? <a className="button mt-7 w-full" href={`/api/auth/demo?next=${encodeURIComponent(safeDestination(destination))}`}>Enter local demo →</a> : <p role="status" className="mt-7">Sign-in is not configured. Demo access is disabled.</p>}
    <p className="mt-4 text-xs text-muted">{cloudIdentity() ? "Cloud foundation Beta · synthetic workspaces only · not production-ready" : "Local demo identity · controlled de-identified test exports only"}</p></>;
}
