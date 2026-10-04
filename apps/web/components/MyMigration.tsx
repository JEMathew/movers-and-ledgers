"use client";
import { Alert, LoadingState } from "@/components/ui/feedback";
import { Button } from "@/components/ui/primitives";
import { MigrationJourney } from "./journey/MigrationJourney";
import { ActionLink } from "./journey/NextAction";
import { JOURNEY_COMPLETE, journeyPosition, journeySteps, nextActionFor, projectJourney, withSession } from "./journey/journey";
import { useSessionView } from "./public-surfaces/session";

/** The signed-in home. It answers four questions from authoritative evidence only:
 *  Where am I? What needs my attention? What do I do next? What comes next? Read-only. */
export function MyMigration() {
  const { view, loading, error, refresh } = useSessionView();
  // Progress comes only from an authoritative read; with no migration selected, the journey starts at Assess.
  const projection = view ? projectJourney({ status: view.status, mappingIssues: view.mappingIssues, readinessIssues: view.readinessIssues }) : undefined;
  const step = journeyPosition({ selected: Boolean(view || loading || error), loading, failed: Boolean(error), step: projection?.current });
  const action = nextActionFor(view);
  const following = step === null ? undefined : step + 1 < JOURNEY_COMPLETE ? journeySteps[step + 1] : null;
  return <main id="main-content" className="shell min-h-[70vh] py-12 sm:py-16">
    <header className="max-w-3xl">
      <h1 className="type-page">My Migration</h1>
      <p className="mt-4 text-lg leading-8 text-secondary">See where your migration stands, what needs your attention, and what comes next.</p>
      <p className="mt-2 text-sm text-secondary">You stay in control of important migration decisions.{view ? ` ${view.sourceKind}.` : ""}</p>
    </header>
    <section className="mt-10" aria-labelledby="where-title">
      <h2 id="where-title" className="type-card">Where Am I?</h2>
      <MigrationJourney current={step} held={projection?.held} currentLabel={projection?.currentLabel} unknown={loading ? "loading" : "unavailable"} className="mt-3" />
    </section>
    {loading && <div className="mt-8"><LoadingState label="Loading your migration" /></div>}
    {error && <div className="mt-8"><Alert tone="error" title="Migration Unavailable"><p>{error}</p><p className="mt-1">No progress is assumed.</p><Button className="mt-3" size="small" variant="secondary" onClick={refresh}>Try Again</Button></Alert></div>}
    {view && <section className="mt-8" aria-labelledby="attention-title">
      <h2 id="attention-title" className="type-card">What Needs My Attention?</h2>
      {view.blockers.length > 0 ? <>
        <ul className="mt-3 grid gap-2 text-sm leading-6 text-secondary">{view.blockers.slice(0, 5).map(item => <li key={item}>{item}</li>)}</ul>
        {view.blockers.length > 5 && <p className="mt-2 text-sm text-muted">{view.blockers.length - 5} more in the current step.</p>}
      </> : <p className="mt-3 text-sm text-secondary">Nothing needs your attention right now.</p>}
    </section>}
    {!loading && <section className="panel mt-8 p-6 sm:p-8" aria-labelledby="next-step-title">
      <p className="eyebrow text-primary">What Do I Do Next?</p>
      <h2 id="next-step-title" className="type-section mt-2">{action.heading}</h2>
      <p className="mt-3 max-w-2xl leading-7 text-secondary">{action.detail}</p>
      <ActionLink className="mt-6" label={action.label} href={action.href} />
    </section>}
    {following !== undefined && <section className="mt-8" aria-labelledby="after-title">
      <h2 id="after-title" className="type-card">What Comes Next?</h2>
      <p className="mt-3 text-sm leading-6 text-secondary">{following ? <><strong className="text-[var(--foreground)]">{following.label}:</strong> {following.summary}</> : step !== null && step >= JOURNEY_COMPLETE ? "Every step is complete." : "This is the final step of your migration."}</p>
    </section>}
    {view && <p className="mt-8 text-sm"><a className="font-semibold text-primary underline" href={withSession("/trust", view.id)}>Review Evidence and Audit History</a></p>}
    <p className="mt-10 text-sm text-muted">Bounded synthetic Beta · No production customer data</p>
  </main>;
}
