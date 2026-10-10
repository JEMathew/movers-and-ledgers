"use client";
import { useState } from "react";
import { Button } from "@/components/ui/primitives";
import { ActionLink } from "./journey/NextAction";
import { MigrationJourney } from "./journey/MigrationJourney";
import { projectJourney } from "./journey/journey";
import { MemberProgress } from "./journey/MemberProgress";
import { memberHomeAction, memberHomeLinks, memberHomePhase } from "./journey/member-home";
import { useSessionView } from "./public-surfaces/session";

/** Read-only navigation home. All consequential actions stay in the governed task. */
export function MyMigration({ reference }: { reference?: string } = {}) {
  const { view, loading, error, errorKind, readAt, selectedReference, refresh } = useSessionView(reference);
  const [copyStatus, setCopyStatus] = useState("");
  const action = memberHomeAction(view);
  const operational = view ? projectJourney(view) : null;
  const phase = view ? memberHomePhase(view) : null;
  const destination = selectedReference ? `/workspace?session=${selectedReference}` : "/workspace";
  const help = view ? `/support?session=${view.id}&stage=${phase ?? view.phase}` : "/support";
  async function copyLink() {
    if (!view) return;
    try { await navigator.clipboard.writeText(`${window.location.origin}/workspace?session=${view.id}`); setCopyStatus("Migration link copied. Access still requires owner verification."); }
    catch { setCopyStatus("Copy unavailable. Select the migration link below to copy it manually."); }
  }
  return <main id="main-content" className="shell member-home">
    <header><p className="eyebrow">My Migration</p><h1 className="type-page">{loading ? "Reading your migration" : error ? errorKind === "identity" ? "Sign in to resume" : "Migration unavailable" : action.heading}</h1>
      {view && <p className="member-reference">Selected migration · {view.id.slice(0, 8)}…{view.id.slice(-4)}</p>}
    </header>
    {loading ? <p role="status" className="member-status">Checking access and current state. No progress is assumed.</p> : error ? <section role="alert" className="member-task">
      <p>{error}</p><p>No progress is assumed. Refresh reads the same reference; it never starts a replacement.</p>
      {errorKind === "identity" && <p>If Account still shows a session, sign out there and reopen this saved migration link to sign in again.</p>}
      {errorKind === "identity" ? <ActionLink label="Sign in to resume" href={`/sign-in?next=${encodeURIComponent(destination)}`} /> : <Button onClick={refresh}>Try again</Button>}
      {errorKind === "unsupported" && selectedReference && <a className="public-text-link" href={`/assess?session=${selectedReference}`}>Read original workflow</a>}
    </section> : <section className="member-task" aria-label="Next task"><p>{action.detail}</p><ActionLink label={action.label} href={action.href} />
      {view && <p className="member-freshness">Snapshot read {readAt ? <time dateTime={readAt}>{new Date(readAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time> : "just now"} · <button className="member-text-button" onClick={refresh}>Refresh current state</button></p>}
    </section>}
    {view && !loading && !error && <>
      <section className="member-attention" aria-labelledby="attention-title"><h2 id="attention-title">Needs attention</h2>
        {view.blockers.length ? <><ul>{view.blockers.slice(0, 3).map((item, index) => <li key={index}>{item}</li>)}</ul><p>{view.blockers.length} {view.blockers.length === 1 ? "item" : "items"} in the supplied snapshot{view.blockers.length > 3 ? "; first 3 shown. Open the current task for details." : "."}</p></> : <p>{view.attentionComplete ? "No attention items in this snapshot. The current task checks all remaining requirements." : "Attention details are incomplete. Open the current task to check requirements."}</p>}
        {view.status === "AWAITING_APPROVAL" && <p>{view.mappingIssues === null ? "Mapping review count unavailable; review mappings before plan consent." : `${view.mappingIssues} mappings awaiting review.`}</p>}
      </section>
      <MemberProgress view={view}/>
      <details className="member-details"><summary>Operational steps</summary><MigrationJourney current={view.readinessKnown ? operational?.current ?? null : null} held={operational?.held} currentLabel={operational?.currentLabel}/></details>
      <nav className="member-shortcuts" aria-label="Migration details">{memberHomeLinks(view).map(([label, href]) => <a key={label} href={href}>{label}</a>)}</nav>
      <details className="member-details"><summary>Migration link and recent history</summary>
        <p>{view.sourceKind}. This snapshot omits business names and raw financial values.</p>
        <label className="field-label">Owned migration link<input className="field-control" readOnly value={typeof window !== "undefined" ? `${window.location.origin}/workspace?session=${view.id}` : `/workspace?session=${view.id}`} onFocus={event => event.currentTarget.select()}/></label>
        <Button variant="secondary" onClick={copyLink}>Copy migration link</Button><p role="status">{copyStatus}</p>
        <h2>Recent recorded events</h2>{view.events.length ? <ol>{view.events.slice(-3).reverse().map((event, index) => <li key={index}>{event.title}{event.time && <> · <time dateTime={event.time}>{event.time}</time></>}</li>)}</ol> : <p>No events supplied in this snapshot. Absence is not completion evidence.</p>}
        <p>Agents coordinate. Rules verify. You decide. All approvals and financial results remain in their original tasks.</p>
      </details>
    </>}
    {!view && !loading && <details className="member-details"><summary>Open an owned migration reference</summary><p>Use the reference from your saved migration link. Access is checked again; this does not list or create migrations.</p><form action="/workspace" method="get"><label className="field-label">Migration reference<input className="field-control" name="session" required pattern="[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}" placeholder="UUID from your migration link"/></label><Button variant="secondary" type="submit">Open reference</Button></form></details>}
    <nav className="member-shortcuts" aria-label="Task help"><a href={help}>Help with this task</a>{view && <a href={`/workspace?session=${view.id}#progress`}>Current migration progress</a>}<a href="/play">MoveBooks Play</a></nav>
    <p className="member-boundary">Bounded synthetic Beta · No production customer data</p>
  </main>;
}
