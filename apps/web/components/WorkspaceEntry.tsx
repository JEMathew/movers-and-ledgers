"use client";
import { cloudIdentity } from "@/lib/identity";
import { IdentityEntry } from "./IdentityEntry";
import { useIdentity } from "./IdentityProvider";
import { ProductEntry } from "./public-surfaces/ProductEntry";

function CloudWorkspace() {
  const { identity } = useIdentity();
  return identity ? <ProductEntry /> : <main className="shell py-16">
    <h1 className="type-section">Sign in to continue your migration</h1>
    <p className="mt-3">Use your Google account to securely access your MoveBooks migration.</p>
    <IdentityEntry destination="/workspace" />
  </main>;
}
export function WorkspaceEntry() { return cloudIdentity() ? <CloudWorkspace /> : <ProductEntry />; }
