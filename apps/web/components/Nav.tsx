"use client";
import Link from "next/link";
import { Menu } from "lucide-react";
import { AccountControls } from "@/components/AccountControls";
import { useIdentity } from "@/components/IdentityProvider";
import { memberLinks, publicLinks } from "@/components/public-surfaces/content";

export function Nav() {
  const { identity } = useIdentity();
  // Only an API-verified identity switches to the product navigation; a pending session keeps public links.
  const links = identity ? memberLinks : publicLinks;
  return <header className="shell relative flex min-h-20 flex-wrap items-center justify-between gap-3 py-4">
    <Link href="/" aria-label="MoveBooks AI home" className="flex items-center gap-3 font-black tracking-tight">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--primary)] text-[var(--on-primary)]">M</span>
      <span>MoveBooks <span className="font-semibold text-primary">AI</span></span>
    </Link>
    <div className="flex max-w-full flex-wrap items-center gap-2">
      <nav aria-label="Primary navigation" className="site-nav hidden items-center gap-1 text-sm font-semibold xl:flex">
        {links.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
      </nav>
      <AccountControls />
      <details className="mobile-nav xl:hidden">
        <summary className="button ghost icon-button" aria-label="Open navigation">
          <Menu aria-hidden="true" size={19} />
        </summary>
        <nav aria-label="Mobile primary navigation" className="mobile-nav-panel" onClick={event => { if ((event.target as HTMLElement).closest("a")) event.currentTarget.closest("details")?.removeAttribute("open"); }}>
          {links.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
        </nav>
      </details>
    </div>
  </header>;
}
