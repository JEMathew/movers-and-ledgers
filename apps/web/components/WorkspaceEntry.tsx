"use client";
import { cloudIdentity } from "@/lib/identity";
import { IdentityEntry } from "./IdentityEntry";
import { useIdentity } from "./IdentityProvider";
import { MyMigration } from "./MyMigration";

function CloudWorkspace({ reference }: { reference?: string }) {
  const { identity } = useIdentity();
  // Key the read consumer by verified account and reference; stale reads unmount.
  const destination = reference !== undefined ? `/workspace?session=${encodeURIComponent(reference)}` : "/workspace";
  return identity ? <MyMigration key={`${identity.subject}:${reference ?? "selected"}`} reference={reference}/> : <main id="main-content" className="shell member-home">
    <h1 className="type-section">Sign in to continue your migration</h1>
    <p className="mt-3">Use your Google account to securely access your MoveBooks migration.</p>
    <IdentityEntry destination={destination} />
  </main>;
}
// /workspace is My Migration. The local demo is already behind the demo sign-in middleware.
export function WorkspaceEntry({ reference }: { reference?: string } = {}) { return cloudIdentity() ? <CloudWorkspace reference={reference}/> : <MyMigration key={reference ?? "selected"} reference={reference}/>; }
