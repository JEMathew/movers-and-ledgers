"use client";
import Link from "next/link";
import { cloudIdentity, firebaseAuth } from "@/lib/identity";

export function RuntimeNotice() {
  if (!cloudIdentity()) return null;
  async function signOut() {
    try {
      const { signOut } = await import("firebase/auth");
      await signOut(await firebaseAuth());
      for (const key of ["movebooks-migration-session", "movebooks-validation-session", "movebooks-onboarding-session"]) sessionStorage.removeItem(key);
      window.location.assign("/sign-in");
    } catch { window.location.assign("/sign-in"); }
  }
  return <aside aria-label="Runtime scope" className="shell py-3 text-sm text-secondary">
    Cloud foundation Beta: synthetic workspaces use durable storage. Try Your Data remains local-only. Not production-ready. Approval identity is verified by the API. <Link className="underline" href="/sign-in">Sign in</Link> · <button className="underline" onClick={signOut}>Sign out</button>
  </aside>;
}
