"use client";
import { useEffect, useRef } from "react";
import { cloudIdentity, demoEntry, safeDestination } from "@/lib/identity";
import { Button } from "@/components/ui";
import { useIdentity } from "./IdentityProvider";

export function GoogleSignIn({ destination, compact = false }: { destination?: string; compact?: boolean }) {
  const { ready, busy, identity, hasSession, error, signIn } = useIdentity();
  // The label is always the real action. Until the SDK is ready the button is disabled, never clickable,
  // so the first enabled click can open the popup synchronously (Safari). A failed start is not "busy".
  const preparing = !ready && !error;
  if (identity) return compact ? null : <a className="button mt-7" href={safeDestination(destination ?? "/workspace")}>Go to My Migration</a>;
  if (hasSession) return compact ? null : <p role="status" className="mt-7">{!ready || busy ? "Verifying your account…" : "Your session needs attention. Use the account control above to sign out and try again."}</p>;
  // The header shows a short "Sign in"; its accessible name still states the provider. Start my migration is the
  // header's primary action, so the compact sign-in stays visually secondary.
  return <Button className={compact ? undefined : "mt-7"} size={compact ? "small" : "default"} variant={compact ? "ghost" : "secondary"}
    aria-label={compact && !busy ? "Sign in with Google" : undefined}
    disabled={!ready || busy} aria-busy={preparing || undefined} title={preparing ? "Getting Google sign-in ready" : undefined} onClick={() => signIn(destination ?? (window.location.pathname === "/sign-in"
      ? new URLSearchParams(window.location.search).get("next") ?? "/workspace"
      : `${window.location.pathname}${window.location.search}`))}>
    {busy ? "Signing in…" : compact ? "Sign in" : "Continue with Google"}
  </Button>;
}

export function IdentityFeedback() {
  const { error } = useIdentity();
  const errorRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => { if (error) errorRef.current?.focus(); }, [error]);
  return error ? <p ref={errorRef} tabIndex={-1} role="alert" className="mt-3">{error}</p> : null;
}

export function IdentityEntry({ destination }: { destination: string }) {
  return <>{cloudIdentity() ? <GoogleSignIn destination={destination} /> : demoEntry() ? <a className="button mt-7 w-full" href={`/api/auth/demo?next=${encodeURIComponent(safeDestination(destination))}`}>Enter Demo Workspace →</a> : <p role="status" className="mt-7">Sign-in is not configured. Demo access is disabled.</p>}
    <p className="mt-4 text-xs text-muted">{cloudIdentity() ? "Bounded synthetic Beta · No production customer data" : "Synthetic Data Only"}</p></>;
}
