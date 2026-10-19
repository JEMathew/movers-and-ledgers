"use client";
import { ArrowRightLeft, ClipboardCheck, Rocket, ScanSearch, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export const landingPhases = [
  { name: "Understand", copy: "Discover and assess your current data", Icon: ScanSearch },
  { name: "Prepare", copy: "Plan, map and prepare for migration", Icon: ClipboardCheck },
  { name: "Move", copy: "Migrate and resolve exceptions", Icon: ArrowRightLeft },
  { name: "Verify", copy: "Validate, configure and onboard", Icon: ShieldCheck },
  { name: "Start", copy: "Get ready for your first productive day", Icon: Rocket },
] as const;

/**
 * The five-phase overview. Decorative motion only: it never reflects a real migration's status.
 * Server render and no-script show the complete static journey. Once mounted it waits ("ready") and plays once
 * ("playing") the first time it enters the viewport. The sequence itself lives in app/v2-landing.css, which runs it
 * only when the person's motion setting allows; otherwise the complete static journey stays.
 */
export function LandingJourney() {
  const list = useRef<HTMLOListElement>(null);
  const [state, setState] = useState<"static" | "ready" | "playing">("static");
  useEffect(() => {
    const element = list.current;
    if (!element || typeof IntersectionObserver === "undefined") return;
    setState("ready");
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setState("playing");
      observer.disconnect();
    }, { threshold: 0.4 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return <section className="lp-journey" aria-labelledby="lp-journey-heading">
    <div className="shell">
      <h2 id="lp-journey-heading" className="sr-only">Five phases of a migration</h2>
      <ol ref={list} className="lp-phases" data-state={state} aria-label="Journey overview, not live progress">
        {landingPhases.map(({ name, copy, Icon }, index) => <li key={name} className="lp-phase" style={{ "--i": index } as React.CSSProperties}>
          {index > 0 && <span className="lp-connector" aria-hidden="true"><span className="lp-connector-fill" /><span className="lp-connector-dot" /></span>}
          <span className="lp-phase-icon" aria-hidden="true"><Icon size={30} strokeWidth={1.9} /></span>
          <h3 className="lp-phase-name">{name}</h3>
          <p className="lp-phase-copy">{copy}</p>
        </li>)}
      </ol>
    </div>
  </section>;
}
