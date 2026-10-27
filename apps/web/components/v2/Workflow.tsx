import type { ReactNode } from "react";
import { phases } from "../public-surfaces/content";
import { GuideNote } from "./primitives";

/**
 * Shared V2 workflow pattern (Clear Ledger layout, Companion voice). Every primary workflow screen shows:
 * current stage, completed work, outstanding decisions, one recommended next action, relevant evidence and,
 * when blocked, a recovery path. These components only present what the page already read from the API;
 * they never compute a financial figure, infer progress or enable an action.
 */

/** "Prepare · stage 2 of 5 · map and approve", the page title and the Companion guide sentence. */
export function StageHeader({ stage, step, title, guide, children }: {
  /** 0 Understand … 4 Start. */
  stage: number; step?: string; title: ReactNode; guide?: ReactNode; children?: ReactNode;
}) {
  const name = phases[stage]?.name ?? "";
  return <header className="v2-stage-header">
    <p className="v2-stage-eyebrow"><strong>{name}</strong> · stage {stage + 1} of 5{step ? ` · ${step}` : ""}</p>
    <h1 className="v2-page-title">{title}</h1>
    {guide ? <GuideNote>{guide}</GuideNote> : null}
    {children}
  </header>;
}

export type Outstanding = { label: ReactNode; tone?: "review" | "blocked" | "neutral"; href?: string };

/** One recovery path for a blocked or rejected state: what happened, what is kept, what to do. */
export function RecoveryNotice({ title, children, action }: { title: ReactNode; children: ReactNode; action?: ReactNode }) {
  return <section className="v2-recovery" role="region" aria-label="How to recover">
    <h2 className="v2-recovery-title"><svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.5l7 12.5H1z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /><path d="M8 6v3.5M8 11.5v.5" stroke="currentColor" strokeWidth="1.6" /></svg>{title}</h2>
    <div className="v2-recovery-body">{children}</div>
    {action ? <div className="v2-recovery-action">{action}</div> : null}
  </section>;
}

/**
 * The status panel for a workflow screen. `next` holds the one recommended action; secondary links belong
 * elsewhere. `done` and `outstanding` are short sentences built from the page's own API read; an unknown
 * value should be said plainly ("Mapping count unavailable"), never shown as zero.
 */
export function WorkflowSummary({ next, done, outstanding, evidence, recovery, label = "Where this migration stands" }: {
  next?: { title: ReactNode; detail?: ReactNode; action?: ReactNode };
  done: ReactNode[];
  outstanding: Outstanding[];
  evidence?: { href: string; detail?: ReactNode; label?: string };
  recovery?: ReactNode;
  label?: string;
}) {
  return <section className="v2-summary" aria-label={label}>
    <div className="v2-summary-main">
      {recovery}
      {next ? <div className="v2-next" aria-label="Your next step" role="group">
        <p className="v2-next-label">Your next step</p>
        <h2 className="v2-next-title">{next.title}</h2>
        {next.detail ? <div className="v2-next-detail">{next.detail}</div> : null}
        {next.action ? <div className="v2-next-action">{next.action}</div> : null}
      </div> : null}
    </div>
    <aside className="v2-summary-side" aria-label="Progress and evidence">
      <div>
        <h2 className="v2-side-title">Waiting on you</h2>
        {outstanding.length ? <ul className="v2-list">{outstanding.map((item, index) => <li key={index} data-tone={item.tone ?? "review"}>{item.href ? <a href={item.href}>{item.label}</a> : item.label}</li>)}</ul> : <p className="v2-side-empty">Nothing is waiting on you here.</p>}
      </div>
      <div>
        <h2 className="v2-side-title">Done so far</h2>
        {done.length ? <ul className="v2-list v2-list-done">{done.map((item, index) => <li key={index}>{item}</li>)}</ul> : <p className="v2-side-empty">Nothing recorded yet.</p>}
      </div>
      {evidence ? <div>
        <h2 className="v2-side-title">Evidence</h2>
        {evidence.detail ? <p className="v2-side-empty">{evidence.detail}</p> : null}
        <a className="public-text-link" href={evidence.href}>{evidence.label ?? "Open evidence"}</a>
      </div> : null}
    </aside>
  </section>;
}
