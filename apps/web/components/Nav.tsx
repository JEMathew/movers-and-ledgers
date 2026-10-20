"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Menu } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { AccountControls } from "@/components/AccountControls";
import { useIdentity } from "@/components/IdentityProvider";
import { memberLinks, publicLinks, visibleLinks } from "@/components/public-surfaces/content";
import { AppearanceMenu } from "@/components/theme/AppearanceMenu";
import { Attribution } from "@/components/v2/Attribution";
import { features } from "@/lib/features";

/** Owner-approved ledger-book (Option B). Option A is retained in baseline e7f1e28 and review evidence. */
export function BrandMark() {
  return <svg className="brand-mark" viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round">
    <path d="M7 3.5 16 6.5 25 3.5v22L16 29l-9-3.5z" />
    <path d="M7 7 3 6v23l13 2 13-2V6l-4 1M16 6.5V29M10 10l3 1M10 15l3 1M10 20l3 1M19 11l3-1M19 16l3-1M19 21l3-1" />
  </svg>;
}

/**
 * Shows the compact header Explore Demo only while the page's hero CTA (marked data-hero-cta) is scrolled
 * out of view, so the two primary buttons are never emphasised together.
 */
function useHeroCtaHidden(pathname: string | null) {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    setHidden(false);
    const cta = document.querySelector("[data-hero-cta]");
    if (!cta || typeof IntersectionObserver === "undefined") return;
    let observer: IntersectionObserver;
    function observe() {
      // The sticky header occludes part of the viewport. Treat a CTA behind it as hidden,
      // including on shorter pages, and recalculate when the responsive header changes size.
      const headerHeight = document.querySelector(".site-header-bar")?.getBoundingClientRect().height ?? 0;
      observer?.disconnect();
      observer = new IntersectionObserver(([entry]) => setHidden(!entry.isIntersecting && entry.boundingClientRect.top < headerHeight),
        { rootMargin: `-${headerHeight}px 0px 0px 0px` });
      observer.observe(cta!);
    }
    observe();
    window.addEventListener("resize", observe);
    return () => { observer.disconnect(); window.removeEventListener("resize", observe); };
  }, [pathname]);
  return hidden;
}

export function Nav() {
  const { identity } = useIdentity();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const showHeaderCta = useHeroCtaHidden(pathname);
  // Navigation reflects API-verified identity, including on public Play and Help.
  const links = visibleLinks(identity ? memberLinks : publicLinks, features.playInNavigation);
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
  const headerCta = showHeaderCta && <Link href="/simulator" className="header-cta">Explore Demo<ArrowRight size={16} aria-hidden="true" /></Link>;
  return <div className="site-header-bar" data-tone={pathname === "/" ? "navy" : undefined}>
    <header ref={root} className="shell site-header" onKeyDown={event => {
      if (event.key === "Escape" && open) { event.preventDefault(); setOpen(false); trigger.current?.focus(); }
    }}>
      <div className="site-brand-block" data-attribution={pathname === "/" ? "marketing" : "none"}>
        {/* The logo is Home: Public Home before sign-in, Member Home after. */}
        <Link href={identity ? "/workspace" : "/"} aria-label={identity ? "MoveBooks AI, member home" : "MoveBooks AI home"} className="site-brand">
          <BrandMark />
          <span>MoveBooks AI</span>
        </Link>
        {pathname === "/" && <Attribution className="site-attribution" />}
      </div>
      <div className="mobile-discovery-controls">
        {headerCta}
        {features.playInNavigation && <Link className="nav-link" href="/play" aria-current={pathname === "/play" ? "page" : undefined}>Play</Link>}
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
          <span className="desktop-header-cta">{headerCta}</span>
          <AppearanceMenu />
          <AccountControls />
        </div>
      </div>
    </header>
  </div>;
}
