"use client";
import { Alert, LoadingState } from "@/components/ui/feedback";
import { Button } from "@/components/ui/primitives";
import { MigrationJourney } from "./journey/MigrationJourney";
import { ActionLink } from "./journey/NextAction";
import { journeyHeldFor, journeyStepFor, nextActionFor, withSession } from "./journey/journey";
import { useSessionView } from "./public-surfaces/session";

/** The signed-in home: one journey, the current state and one dominant next action. Read-only. */
export function MyMigration() {
  const { view, loading, error, refresh } = useSessionView();
  // Progress comes only from an authoritative read; with no migration selected, the journey starts at Assess.
  const step = view ? journeyStepFor(view.status) : loading || error ? null : 0;
  const action = nextActionFor(view);
  return <main id="main-content" className="shell min-h-[70vh] py-12 sm:py-16">
    <header className="max-w-3xl">
      <h1 className="type-page">My Migration</h1>
      <p className="mt-4 text-lg leading-8 text-secondary">{view ? view.sourceKind : "One journey from readiness to your first productive task. You approve every consequential step."}</p>
    </header>
    <MigrationJourney current={step} held={view ? journeyHeldFor(view.status) : undefined} className="mt-10" />
    {loading && <div className="mt-8"><LoadingState label="Loading your migration" /></div>}
    {error && <div className="mt-8"><Alert tone="error" title="Migration unavailable"><p>{error}</p><p className="mt-1">No progress is assumed.</p><Button className="mt-3" size="small" variant="secondary" onClick={refresh}>Try again</Button></Alert></div>}
    {!loading && <section className="panel mt-8 p-6 sm:p-8" aria-labelledby="next-step-title">
      <p className="eyebrow text-primary">Your next step</p>
      <h2 id="next-step-title" className="type-section mt-2">{action.heading}</h2>
      <p className="mt-3 max-w-2xl leading-7 text-secondary">{action.detail}</p>
      <ActionLink className="mt-6" label={action.label} href={action.href} />
    </section>}
    {view && view.blockers.length > 0 && <section className="mt-8" aria-labelledby="attention-title">
      <h2 id="attention-title" className="type-card">What needs attention</h2>
      <ul className="mt-3 grid gap-2 text-sm leading-6 text-secondary">{view.blockers.slice(0, 5).map(item => <li key={item}>{item}</li>)}</ul>
      {view.blockers.length > 5 && <p className="mt-2 text-sm text-muted">{view.blockers.length - 5} more in the current step.</p>}
    </section>}
    {view && <p className="mt-8 text-sm"><a className="font-semibold text-primary underline" href={withSession("/trust", view.id)}>Review evidence and audit history</a></p>}
    <p className="mt-10 text-sm text-muted">Bounded synthetic Beta · No production customer data</p>
  </main>;
}
