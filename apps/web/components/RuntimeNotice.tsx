"use client";
import { cloudIdentity } from "@/lib/identity";
import { GoogleSignIn, IdentityFeedback } from "./IdentityEntry";
import { useIdentity } from "./IdentityProvider";

function CloudNotice() {
  const { identity, busy, hasSession, signOut } = useIdentity();
  return <aside aria-label="Runtime scope" className="shell py-3 text-sm text-secondary">
    Cloud foundation Beta: synthetic workspaces use durable storage. Try Your Data remains local-only. Not production-ready. Approval identity is verified by the API.
    <div className="mt-2 flex flex-wrap items-center gap-2">
      {identity ? <span role="status" className="break-all">Signed in as {identity.email}</span> : <GoogleSignIn compact />}
      {hasSession && <><span aria-hidden="true">·</span><button className="underline" disabled={busy} onClick={signOut}>Sign out</button></>}
    </div>
    <IdentityFeedback />
  </aside>;
}
export function RuntimeNotice() { return cloudIdentity() ? <CloudNotice /> : null; }
