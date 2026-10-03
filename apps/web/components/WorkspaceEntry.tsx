"use client";
import { cloudIdentity } from "@/lib/identity";
import { IdentityEntry } from "./IdentityEntry";
import { useIdentity } from "./IdentityProvider";
import { MyMigration } from "./MyMigration";

function CloudWorkspace() {
  const { identity } = useIdentity();
  return identity ? <MyMigration /> : <main className="shell py-16">
    <h1 className="type-section">Sign in to continue your migration</h1>
    <p className="mt-3">Use your Google account to securely access your MoveBooks migration.</p>
    <IdentityEntry destination="/workspace" />
  </main>;
}
// /workspace is My Migration. The local demo is already behind the demo sign-in middleware.
export function WorkspaceEntry() { return cloudIdentity() ? <CloudWorkspace /> : <MyMigration />; }
