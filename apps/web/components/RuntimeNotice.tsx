"use client";
import { cloudIdentity } from "@/lib/identity";
import { IdentityFeedback } from "./IdentityEntry";
import Link from "next/link";
import { usePathname } from "next/navigation";

function CloudNotice() {
  const path = usePathname();
  // These entry pages already state the Beta boundary next to their main action.
  const hasScopeNote = ["/", "/product", "/workspace", "/sign-in", "/simulator", "/guide", "/learn", "/trust", "/support", "/feedback", "/try-your-data"].includes(path ?? "");
  return <div className="shell text-sm text-secondary">
    {!hasScopeNote && <aside aria-label="Beta scope" className="py-3">
      <span className="font-semibold">MoveBooks AI Beta</span> · Explore the migration journey safely using synthetic data.{" "}
      <Link className="underline" href="/trust#beta-limitations">Beta Limitations</Link>
    </aside>}
    <IdentityFeedback />
  </div>;
}
export function RuntimeNotice() { return cloudIdentity() ? <CloudNotice /> : null; }
