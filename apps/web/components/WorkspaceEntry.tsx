"use client";
import { useEffect, useState } from "react";
import { cloudIdentity } from "@/lib/identity";
import { IdentityEntry } from "./IdentityEntry";
import { useIdentity } from "./IdentityProvider";
import { MyMigration } from "./MyMigration";
import { LAST_MIGRATION_PREFIX, SELECTED_SESSION_KEY } from "./public-surfaces/session";

/** Restores this account's last migration in a new tab. Scope is the verified account, so accounts never see each other's reference. */
function Remembered({ reference, scope }: { reference?: string; scope: string }) {
  const [remembered, setRemembered] = useState<string | null | undefined>(reference ? null : undefined);
  useEffect(() => {
    if (reference) return;
    try { setRemembered(sessionStorage.getItem(SELECTED_SESSION_KEY) ? null : localStorage.getItem(`${LAST_MIGRATION_PREFIX}${scope}`)); } catch { setRemembered(null); }
  }, [reference, scope]);
  if (remembered === undefined) return <main id="main-content" className="shell member-home" aria-busy="true"><p role="status">Opening your migration…</p></main>;
  return <MyMigration key={`${scope}:${reference ?? remembered ?? "selected"}`} reference={reference ?? remembered ?? undefined} storageScope={scope}/>;
}

function CloudWorkspace({ reference }: { reference?: string }) {
  const { identity } = useIdentity();
  // Key the read consumer by verified account and reference; stale reads unmount.
  const destination = reference !== undefined ? `/workspace?session=${encodeURIComponent(reference)}` : "/workspace";
  return identity ? <Remembered key={identity.subject} reference={reference} scope={identity.subject}/> : <main id="main-content" className="shell member-home">
    <h1 className="type-section">Sign in to continue your migration</h1>
    <p className="mt-3">Use your Google account to securely access your MoveBooks migration. New here? You start with a sample business. Returning? Your migration resumes where you left off.</p>
    <IdentityEntry destination={destination} />
  </main>;
}
// /workspace is My Migration. The local demo is already behind the demo sign-in middleware.
export function WorkspaceEntry({ reference }: { reference?: string } = {}) { return cloudIdentity() ? <CloudWorkspace reference={reference}/> : <Remembered reference={reference} scope="demo"/>; }
