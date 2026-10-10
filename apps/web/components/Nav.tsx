"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { AccountControls } from "@/components/AccountControls";
import { useIdentity } from "@/components/IdentityProvider";
import { memberLinks, publicLinks } from "@/components/public-surfaces/content";

export function Nav() {
  const { identity } = useIdentity();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  // Navigation reflects API-verified identity, including on public Play and Help.
  const links = identity ? memberLinks : publicLinks;
  useEffect(() => { setOpen(false); }, [pathname, identity?.subject]);
  useEffect(() => {
    if (!open) return;
    panel.current?.querySelector<HTMLAnchorElement>("nav a")?.focus();
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false);
    };
    const resize = () => { if (window.innerWidth >= 1024) setOpen(false); };
    window.addEventListener("resize", resize);
    document.addEventListener("pointerdown", outside);
    return () => { window.removeEventListener("resize", resize); document.removeEventListener("pointerdown", outside); };
  }, [open]);
  return <header ref={root} className="shell site-header" onKeyDown={event => {
    if (event.key === "Escape" && open) { event.preventDefault(); setOpen(false); trigger.current?.focus(); }
  }}>
    <Link href={identity ? "/workspace" : "/"} aria-label={identity ? "MoveBooks AI My Migration" : "MoveBooks AI home"} className="site-brand">
      <span className="brand-mark" aria-hidden="true">M</span>
      <span>MoveBooks <span className="font-semibold text-primary">AI</span></span>
    </Link>
    <div className="mobile-discovery-controls">
      <Link className="nav-link" href="/play" aria-current={pathname === "/play" ? "page" : undefined}>Play</Link>
      <button ref={trigger} type="button" className="button ghost icon-button" aria-label="Open navigation" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen(value => !value)}><Menu aria-hidden="true" size={20}/></button>
    </div>
    <div ref={panel} id={panelId} className={`navigation-panel${open ? " is-open" : ""}`} onClick={event => {
      if ((event.target as HTMLElement).closest("a")) setOpen(false);
    }} onBlur={event => {
      if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget) && event.relatedTarget !== trigger.current) setOpen(false);
    }}>
      <nav aria-label="Primary navigation" className="site-nav">
        {links.map(([label, href]) => <Link key={href} className={href === "/play" ? "desktop-play" : undefined} href={href} aria-current={pathname === href ? "page" : undefined}>{label}</Link>)}
      </nav>
      <div className="nav-utilities">
        <Link className="nav-link" href="/support" aria-current={pathname === "/support" ? "page" : undefined}>Help</Link>
        <AccountControls />
      </div>
    </div>
  </header>;
}
