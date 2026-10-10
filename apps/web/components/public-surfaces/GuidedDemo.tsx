"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { demoPhases } from "./demo-content";
import { sampleEntry } from "./content";
import { AnchoredDetails } from "./AnchoredDetails";

export function GuidedDemo() {
  // Navigation through authored content only. Nothing is persisted or shared with the Beta.
  const [screen, setScreen] = useState(-1);
  const heading = useRef<HTMLHeadingElement>(null);
  const main = useRef<HTMLElement>(null);
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    main.current?.scrollIntoView?.({ block: "start", behavior: "instant" });
    heading.current?.focus({ preventScroll: true });
  }, [screen]);
  const phase = screen >= 0 && screen < demoPhases.length ? demoPhases[screen] : null;
  const debrief = screen === demoPhases.length;
  const title = phase?.title ?? (debrief ? "You’ve explored the five phases." : "See a move before you make one.");
  return <main ref={main} id="main-content" className="shell guided-demo">
    <header>
      <p className="eyebrow text-primary">MoveBooks AI · Explore Demo</p>
      <p className="demo-mode">Read-only guided demo · Synthetic</p>
      <h1 ref={heading} tabIndex={-1} className="type-page">{title}</h1>
      <p className="demo-scenario">{phase?.scenario ?? (debrief ? "No migration was created. No approvals, posting or verification occurred." : "Explore accounting migration and onboarding with Harbor Light Books, a fictional shop, in five short phases.")}</p>
    </header>
    {screen === -1 ? <>
      <p className="demo-caption">About 2–3 minutes · No sign-in · No workspace changes</p>
      <div className="demo-actions"><button className="button" onClick={() => setScreen(0)}>Start demo</button></div>
      <section className="demo-card" aria-label="What you will explore"><h2>From source records to a verified first task</h2><p>Understand → Prepare → Move → Verify → Start</p><p>See sample evidence, the decisions that need you, and why exact financial checks matter.</p></section>
    </> : <>
      <nav aria-label="Demo phase previews" className="demo-phase-nav"><ol>{demoPhases.map((item, index) => <li key={item.name}><button className="demo-phase-button" aria-label={`Preview ${item.name}, phase ${index + 1} of 5`} aria-current={screen === index ? "step" : undefined} onClick={() => setScreen(index)}><span aria-hidden="true">{index + 1}</span><span className="demo-phase-name" aria-hidden="true">{item.name}</span></button></li>)}</ol></nav>
      {phase ? <>
        <p className="demo-caption">{screen + 1}/5 · {phase.name} · Sample evidence</p>
        <section key={phase.name} className="demo-card" aria-label={`${phase.name} sample evidence`}>
          <dl className="demo-evidence">{phase.evidence.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
          <p className="demo-insight">{phase.insight}</p>
        </section>
        <div className="demo-actions"><button className="button" onClick={() => setScreen(screen + 1)}>{screen === 4 ? "Finish demo" : `Next: ${demoPhases[screen + 1].name}`}</button><button className="button ghost" onClick={() => setScreen(screen - 1)}>{screen === 0 ? "Back to introduction" : "Previous phase"}</button></div>
        <details key={`${phase.name}-guidance`} className="public-disclosure"><summary>How assistance and controls work</summary><div className="public-detail"><p>{phase.guidance}</p><Link className="public-text-link" href={`/learn#${phase.topic}`}>Learn about {phase.name.toLowerCase()}</Link></div></details>
      </> : <>
        <p id="demo-handoff" className="demo-caption">Sign in for Harbor Light, then explicitly start assessment. Demo progress grants no approval.</p>
        <div className="demo-actions"><Link className="button" href={`/sign-in?next=${encodeURIComponent(sampleEntry)}`} aria-describedby="demo-handoff">Try the Guided Migration</Link><button className="button ghost" onClick={() => setScreen(4)}>Previous phase</button><button className="button ghost" onClick={() => setScreen(-1)}>Restart demo</button></div>
        <section className="demo-card" aria-label="Demo debrief"><h2>Agents coordinate. Rules verify. You decide.</h2><p>The working Beta adds sign-in, owner-protected workspaces, explicit human decisions and server-authoritative progress.</p></section>
      </>}
    </>}
    <div className="demo-more">
      <AnchoredDetails id="sample-journey" title="Demo and Beta are different"><p>This Demo is an authored, read-only preview held only in page memory. It calls no migration APIs, records no decisions and does not measure migration results. Reloading resets it. Nothing is pre-approved when you enter the Beta.</p><p>The actual synthetic Beta retains all nine operational steps: Assess → Plan → Map → Approve → Migrate → Resolve → Validate → Set Up → Start Using.</p><Link className="public-text-link" href="/guide#journey">Follow the five-phase guide</Link><Link className="public-text-link" href={sampleEntry}>Already signed in? Open the sample assessment</Link></AnchoredDetails>
      <AnchoredDetails id="sample-boundaries" title="Synthetic Beta boundaries"><p>V1.0 Bounded Synthetic Public Beta. No real customer or production provider data, live provider migration or production readiness. Cloud Beta uses real Google sign-in and owner-protected synthetic workspaces; no accounting provider is contacted. Local demo workspace access is for development.</p></AnchoredDetails>
      <AnchoredDetails id="sample-success" title="What verified completion means"><p>Business Ready · Verified requires a server-verified first task after required checks, configuration, onboarding and an explicitly approved synthetic invoice. Moving records or posting alone is insufficient. Finishing this Demo is only completing a preview.</p><Link className="public-text-link" href="/learn#business-ready">Understand verified completion</Link></AnchoredDetails>
      <nav aria-label="Keep exploring" className="demo-related"><Link className="public-text-link" href="/">Back to Home</Link><Link className="public-text-link" href="/play">Practice three decisions in Play</Link><Link className="public-text-link" href="/learn">Learn</Link><Link className="public-text-link" href="/#product-vision">Conceptual Product Vision video</Link></nav>
    </div>
  </main>;
}
