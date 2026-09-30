"use client";
import { cloudIdentity } from "@/lib/identity";
import { IdentityFeedback } from "./IdentityEntry";

function CloudNotice() {
  return <aside aria-label="Runtime scope" className="shell py-3 text-sm text-secondary">
    Cloud foundation Beta: synthetic workspaces use durable storage. Try Your Data remains local-only. Not production-ready. Approval identity is verified by the API.
    <IdentityFeedback />
  </aside>;
}
export function RuntimeNotice() { return cloudIdentity() ? <CloudNotice /> : null; }
