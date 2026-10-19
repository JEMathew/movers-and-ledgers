"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/primitives";
import { ChecksTable } from "./journey/ChecksTable";
import { MigrationSnapshot } from "./journey/MigrationSnapshot";
import { ActionLink } from "./journey/NextAction";
import { MigrationJourney } from "./journey/MigrationJourney";
import { projectJourney } from "./journey/journey";
import { MemberProgress } from "./journey/MemberProgress";
import { memberHomeAction, memberHomeGuide, memberHomeLinks, memberHomePhase, memberHomeStageLines, memberHomeStep } from "./journey/member-home";
import { LAST_MIGRATION_PREFIX, useSessionView } from "./public-surfaces/session";
import { phases } from "./public-surfaces/content";
import { AiStatusBadge, GuideNote } from "./v2/primitives";
import { RecoveryNotice } from "./v2/Workflow";

const STAGE_STATE: Record<string, string> = { done: "Done", current: "Now", blocked: "Needs attention", locked: "Locked", unknown: "Not confirmed" };

/** Read-only navigation home. All consequential actions stay in the governed task. */
export function MyMigration({ reference, storageScope }: { reference?: string; storageScope?: string } = {}) {
  const { view, loading, error, errorKind, readAt, selectedReference, refresh } = useSessionView(reference);
  const [copyStatus, setCopyStatus] = useState("");
  // Remember the last migration this account read in this browser so closing the tab does not look like a new user.
  useEffect(() => {
    if (!storageScope) return;
    try {
      if (view) localStorage.setItem(`${LAST_MIGRATION_PREFIX}${storageScope}`, view.id);
      else if (error && selectedReference && errorKind !== "identity" && errorKind !== "network") localStorage.removeItem(`${LAST_MIGRATION_PREFIX}${storageScope}`);
    } catch { /* storage is a convenience only */ }
  }, [storageScope, view, error, errorKind, selectedReference]);
  const action = memberHomeAction(view);
  const complete = view?.status === "VERIFIED_FIRST_PRODUCTIVE_USE";
  const blocked = Boolean(view && /BLOCKED|PAUSED|RESOLVING|RETRY_PENDING/.test(view.status));
  const kicker = complete ? "Complete" : blocked ? "Needs your attention" : view && !["CREATED", "DISCOVERED"].includes(view.status) ? "Resume where you left off" : "Your next step";
  const operational = view ? projectJourney(view) : null;
  const phase = view ? memberHomePhase(view) : null;
  const destination = selectedReference ? `/workspace?session=${selectedReference}` : "/workspace";
  const help = view ? `/support?session=${view.id}&stage=${phase ?? view.phase}` : "/support";
  const links: [string, string][] = view ? [...memberHomeLinks(view), ...(complete ? [["Start another sample migration", "/assess?sample=harbor-light-migrate-demo"] as [string, string]] : []), ["Help with this task", help]] : [];
  async function copyLink() {
    if (!view) return;
    try { await navigator.clipboard.writeText(`${window.location.origin}/workspace?session=${view.id}`); setCopyStatus("Migration link copied. Access still requires owner verification."); }
    catch { setCopyStatus("Copy unavailable. Select the migration link below to copy it manually."); }
  }
  const title = loading ? "Reading your migration" : error ? errorKind === "identity" ? "Sign in to resume" : "Migration unavailable" : action.heading;

  return <main id="main-content" className="shell mm" aria-busy={loading || undefined}>
    <header className="mm-header">
      {view && phase !== null
        ? <p className="mm-eyebrow"><strong>{phases[phase].name}</strong> · stage {phase + 1} of 5 · {memberHomeStep(view)}</p>
        : <p className="mm-eyebrow"><strong>My migration</strong></p>}
      <h1 className="mm-title">{title}</h1>
      {view && <p className="mm-reference">Migration {view.id.slice(0, 8)}…{view.id.slice(-4)}{storageScope && <> · <a href="/workspace?pick=1">Switch migration</a></>}</p>}
    </header>

    {loading ? <p role="status" className="mm-status">Checking access and current state. No progress is assumed.</p>
    : error ? <section role="alert" className="mm-card mm-problem">
      <p>{error}</p><p className="mm-meta">No progress is assumed. Refresh reads the same reference; it never starts a replacement.</p>
      {errorKind === "identity" && <p className="mm-meta">If Account still shows a session, sign out there and reopen this saved migration link to sign in again.</p>}
      <div className="mm-actions">{errorKind === "identity" ? <ActionLink label="Sign in to resume" href={`/sign-in?next=${encodeURIComponent(destination)}`} /> : <Button onClick={refresh}>Try again</Button>}
        {errorKind === "unsupported" && selectedReference && <a className="public-text-link" href={`/assess?session=${selectedReference}`}>Read original workflow</a>}</div>
    </section>
    : view ? <>
      <MemberProgress view={view} />
      <GuideNote>{memberHomeGuide(view)}</GuideNote>
      <div className="mm-layout">
        <div className="mm-main">
          {blocked && view.blockers.length > 0 && <RecoveryNotice title="What happened and what is kept">
            <ul className="mm-bullets">{view.blockers.slice(0, 3).map((item, index) => <li key={index}>{item}</li>)}{view.blockers.length > 3 && <li>and {view.blockers.length - 3} more in the task</li>}</ul>
            <p>Completed work is kept. Open the task to review each issue and any permitted fix; nothing is retried or repaired for you.</p>
          </RecoveryNotice>}
          <section className="mm-next" data-tone={complete ? "success" : blocked ? "warning" : undefined} aria-label="Your next step">
            <p className="mm-next-label">{kicker}</p>
            <p className="mm-next-detail">{action.detail}</p>
            <div className="mm-actions"><ActionLink label={action.label} href={action.href} /></div>
            <p className="mm-freshness">Snapshot read {readAt ? <time dateTime={readAt}>{new Date(readAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time> : "just now"} · <button type="button" className="mm-text-button" onClick={refresh}>Refresh current state</button></p>
          </section>
          {!blocked && !(complete && !view.blockers.length) && <section className="mm-card mm-waiting" data-tone={view.blockers.length ? "warning" : "clear"} aria-labelledby="attention-title">
            <h2 id="attention-title" className="mm-card-title">Waiting on you</h2>
            {view.status === "AWAITING_APPROVAL" && <p className="mm-waiting-lead">{view.mappingIssues === null ? "Mapping review count unavailable; review mappings before plan consent." : view.mappingIssues === 0 ? "Every mapping is decided; the plan awaits your approval." : `${view.mappingIssues} mappings awaiting review.`}</p>}
            {view.blockers.length ? <><ul className="mm-bullets">{view.blockers.slice(0, 3).map((item, index) => <li key={index}>{item}</li>)}</ul><p className="mm-meta">{view.blockers.length} {view.blockers.length === 1 ? "item" : "items"} in this snapshot{view.blockers.length > 3 ? "; first 3 shown. Open the current task for details." : "."}</p></>
              : <p className="mm-meta">{view.attentionComplete ? `No ${view.status === "AWAITING_APPROVAL" ? "other " : ""}attention items in this snapshot. The current task checks all remaining requirements.` : "Attention details are incomplete. Open the current task to check requirements."}</p>}
          </section>}
          <section className="mm-card mm-going" aria-labelledby="going-title">
            <h2 id="going-title" className="mm-card-title">How this move is going</h2>
            <ol className="mm-lines">{memberHomeStageLines(view).map(line => <li key={line.name} data-state={line.state}>
              <span className="mm-line-name">{line.name}<span className="mm-line-state">{STAGE_STATE[line.state]}</span></span>
              <span className="mm-line-text">{line.text}</span>
            </li>)}</ol>
          </section>
          <ChecksTable view={view} />
        </div>
        <aside className="mm-side" aria-label="Migration details">
          <MigrationSnapshot view={view} />
          <section className="mm-card" aria-labelledby="evidence-title">
            <h2 id="evidence-title" className="mm-card-title">Evidence</h2>
            <p className="mm-meta">Every rule check and decision, with who made it and when.</p>
            <nav className="mm-links" aria-label="Task help">{links.map(([label, href]) => <a key={label} href={href}>{label}</a>)}</nav>
          </section>
          <section className="mm-card mm-planned" aria-labelledby="second-title">
            <div className="mm-card-head"><h2 id="second-title" className="mm-card-title">Second opinions</h2><AiStatusBadge /></div>
            <p className="mm-meta">The Advisor and the Reviewer are planned and not available in the Beta. They will explain and challenge; you approve every change, and advice never changes your books.</p>
          </section>
        </aside>
      </div>
      <details className="mm-details"><summary>Details</summary>
        <h2>Operational steps</h2>
        <MigrationJourney current={view.readinessKnown ? operational?.current ?? null : null} held={operational?.held} currentLabel={operational?.currentLabel}/>
        <p>{view.sourceKind}. This snapshot omits business names and raw financial values.</p>
        <label className="field-label">Owned migration link<input className="field-control" readOnly value={typeof window !== "undefined" ? `${window.location.origin}/workspace?session=${view.id}` : `/workspace?session=${view.id}`} onFocus={event => event.currentTarget.select()}/></label>
        <Button variant="secondary" onClick={copyLink}>Copy migration link</Button><p role="status">{copyStatus}</p>
        <h2>Recent recorded events</h2>{view.events.length ? <ol>{view.events.slice(-3).reverse().map((event, index) => <li key={index}>{event.title}{event.time && <> · <time dateTime={event.time}>{event.time}</time></>}</li>)}</ol> : <p>No events supplied in this snapshot. Absence is not completion evidence.</p>}
        <p>MoveBooks coordinates. Rules verify. You decide. All approvals and financial results remain in their original tasks.</p>
      </details>
    </>
    : <>
      <GuideNote>No migration is open yet. Start with a synthetic sample business: you check readiness, decide where every record goes, then move and verify. Nothing moves without your approval.</GuideNote>
      <section className="mm-next" aria-label="Your next step">
        <p className="mm-next-label">Your next step</p>
        <p className="mm-next-detail">{action.detail}</p>
        <div className="mm-actions"><ActionLink label={action.label} href={action.href} /></div>
      </section>
      <section className="mm-card mm-going" aria-labelledby="how-title">
        <h2 id="how-title" className="mm-card-title">How a migration goes</h2>
        <ol className="mm-lines" aria-label="What happens in a migration">{phases.map(stage => <li key={stage.name} data-state="locked"><span className="mm-line-name">{stage.name}</span><span className="mm-line-text">{stage.copy}</span></li>)}</ol>
      </section>
      <details className="mm-details"><summary>Resume a saved migration</summary><p>Use the reference from your saved migration link. Access is checked again; this does not list or create migrations.</p><form action="/workspace" method="get"><label className="field-label">Migration reference<input className="field-control" name="session" required pattern="[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}" placeholder="UUID from your migration link"/></label><Button variant="secondary" type="submit">Open reference</Button></form></details>
      <nav className="mm-links mm-links-inline" aria-label="Task help"><a href={help}>Help with this task</a></nav>
    </>}
    <footer className="mm-foot"><p className="mm-boundary">Bounded synthetic Beta · No production customer data</p></footer>
  </main>;
}
