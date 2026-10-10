"use client";
import { useEffect, useRef, type ReactNode } from "react";

/** Only a rendered, known section ID can open a disclosure. Context never changes workflow state. */
export function AnchoredDetails({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    function openRequested(hash = window.location.hash) {
      let requested: string;
      try { requested = decodeURIComponent(hash.slice(1)); } catch { return; }
      if (requested !== id || !ref.current) return;
      ref.current.open = true;
      ref.current.querySelector("summary")?.focus({ preventScroll: true });
      ref.current.scrollIntoView?.({ block: "start" });
    }
    const onHash = () => openRequested();
    function onLink(event: MouseEvent) {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const target = new URL(anchor.href);
      // Next Link may update a same-page fragment with pushState, which emits no hashchange.
      if (target.origin === window.location.origin && target.pathname === window.location.pathname && target.search === window.location.search) openRequested(target.hash);
    }
    openRequested();
    window.addEventListener("hashchange", onHash);
    window.addEventListener("popstate", onHash);
    document.addEventListener("click", onLink);
    return () => {
      window.removeEventListener("hashchange", onHash);
      window.removeEventListener("popstate", onHash);
      document.removeEventListener("click", onLink);
    };
  }, [id]);
  return <details ref={ref} id={id} aria-labelledby={`${id}-heading`} className="public-disclosure scroll-mt-6">
    <summary><h2 id={`${id}-heading`}>{title}</h2></summary><div className="public-detail">{children}</div>
  </details>;
}
