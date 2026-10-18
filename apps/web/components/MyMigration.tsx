"use client";
import { useEffect, useState } from "react";
import { AlertTriangle, ArrowUpRight, BadgeCheck, CheckCircle2, ClipboardCheck, FileSearch, LifeBuoy, ListChecks, Play, Rocket, Search, ShieldCheck, Sparkles } from "lucide-react";
import { ChecksTable } from "./journey/ChecksTable";
import { LAST_MIGRATION_PREFIX } from "./public-surfaces/session";
import { MigrationSnapshot } from "./journey/MigrationSnapshot";
import { Button } from "@/components/ui/primitives";
import { ActionLink } from "./journey/NextAction";
import { MigrationJourney } from "./journey/MigrationJourney";
import { projectJourney } from "./journey/journey";
import { MemberProgress } from "./journey/MemberProgress";
import { memberHomeAction, memberHomeLinks, memberHomePhase } from "./journey/member-home";
import { useSessionView } from "./public-surfaces/session";
import { Attribution } from "./v2/Attribution";

const shortcutIcon = (label: string) => /another sample/i.test(label) ? Rocket : /AI activity/i.test(label) ? Sparkles : /help/i.test(label) ? LifeBuoy : /verification/i.test(label) ? ShieldCheck : /issue|recovery|difference/i.test(label) ? AlertTriangle : /evidence|results/i.test(label) ? FileSearch : /decision|settings|prerequisite/i.test(label) ? ClipboardCheck : ArrowUpRight;

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
  const kicker = !view ? "Welcome" : complete ? "Complete" : blocked ? "Needs your attention" : view && !["CREATED", "DISCOVERED"].includes(view.status) ? "Resume where you left off" : "Your next step";
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
      {view && <p className="member-reference">Migration {view.id.slice(0, 8)}…{view.id.slice(-4)}{storageScope && <> · <a href="/workspace?pick=1">Switch migration</a></>}</p>}
    </header>
    {loading ? <p role="status" className="member-status">Checking access and current state. No progress is assumed.</p> : error ? <section role="alert" className="member-task">
      <p>{error}</p><p>No progress is assumed. Refresh reads the same reference; it never starts a replacement.</p>
      {errorKind === "identity" && <p>If Account still shows a session, sign out there and reopen this saved migration link to sign in again.</p>}
      {errorKind === "identity" ? <ActionLink label="Sign in to resume" href={`/sign-in?next=${encodeURIComponent(destination)}`} /> : <Button onClick={refresh}>Try again</Button>}
      {errorKind === "unsupported" && selectedReference && <a className="public-text-link" href={`/assess?session=${selectedReference}`}>Read original workflow</a>}
    </section> : <>{view && <MigrationSnapshot view={view}/>}<div className="member-layout"><div className="member-main"><section className="member-task" data-tone={complete ? "success" : blocked ? "warning" : undefined} aria-label="Next task"><p className="member-kicker">{complete && <BadgeCheck size={16} aria-hidden="true"/>}{blocked && <AlertTriangle size={16} aria-hidden="true"/>}{kicker}</p><p>{action.detail}</p>{view && blocked && view.blockers.length > 0 && <ul className="member-blockers">{view.blockers.slice(0, 3).map((item, index) => <li key={index}>{item}</li>)}{view.blockers.length > 3 && <li>and {view.blockers.length - 3} more in the task</li>}</ul>}<ActionLink label={action.label} href={action.href} />
      {!view && !loading && <ol className="welcome-steps" aria-label="Three steps to your first verified migration"><li><span className="step-num" aria-hidden="true">1</span><Search size={18} aria-hidden="true"/>Check readiness</li><li><span className="step-num" aria-hidden="true">2</span><ListChecks size={18} aria-hidden="true"/>Review and approve</li><li><span className="step-num" aria-hidden="true">3</span><Play size={18} aria-hidden="true"/>Move and verify</li></ol>}
      {view && <p className="member-freshness">Snapshot read {readAt ? <time dateTime={readAt}>{new Date(readAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time> : "just now"} · <button className="member-text-button" onClick={refresh}>Refresh current state</button></p>}
    </section>
      {view && <nav className="member-actions" aria-label="Task help">{[...memberHomeLinks(view), ...(complete ? [["Start another sample migration", "/assess?sample=harbor-light-migrate-demo"] as [string, string]] : []), ["Help with this task", help] as [string, string]].map(([label, href]) => { const Icon = shortcutIcon(label); return <a key={label} href={href}><Icon size={18} aria-hidden="true"/>{label}</a>; })}</nav>}
      {view && !blocked && !(complete && !view.blockers.length) && <section className="member-attention" data-tone={view.blockers.length ? "warning" : "clear"} aria-labelledby="attention-title"><h2 id="attention-title">{view.blockers.length ? <AlertTriangle size={18} aria-hidden="true"/> : <CheckCircle2 size={18} aria-hidden="true"/>}Needs attention</h2>
        {view.blockers.length ? <><ul>{view.blockers.slice(0, 3).map((item, index) => <li key={index}>{item}</li>)}</ul><p>{view.blockers.length} {view.blockers.length === 1 ? "item" : "items"} in the supplied snapshot{view.blockers.length > 3 ? "; first 3 shown. Open the current task for details." : "."}</p></> : <p>{view.attentionComplete ? "No attention items in this snapshot. The current task checks all remaining requirements." : "Attention details are incomplete. Open the current task to check requirements."}</p>}
        {view.status === "AWAITING_APPROVAL" && <p>{view.mappingIssues === null ? "Mapping review count unavailable; review mappings before plan consent." : `${view.mappingIssues} mappings awaiting review.`}</p>}
      </section>}
      {view && <ChecksTable view={view}/>}
    </div>{view && <MemberProgress view={view}/>}</div></>}
    {view && !loading && !error && <>
      <details className="member-details"><summary>Details</summary>
        <h2>Operational steps</h2>
        <MigrationJourney current={view.readinessKnown ? operational?.current ?? null : null} held={operational?.held} currentLabel={operational?.currentLabel}/>
        <p>{view.sourceKind}. This snapshot omits business names and raw financial values.</p>
        <label className="field-label">Owned migration link<input className="field-control" readOnly value={typeof window !== "undefined" ? `${window.location.origin}/workspace?session=${view.id}` : `/workspace?session=${view.id}`} onFocus={event => event.currentTarget.select()}/></label>
        <Button variant="secondary" onClick={copyLink}>Copy migration link</Button><p role="status">{copyStatus}</p>
        <h2>Recent recorded events</h2>{view.events.length ? <ol>{view.events.slice(-3).reverse().map((event, index) => <li key={index}>{event.title}{event.time && <> · <time dateTime={event.time}>{event.time}</time></>}</li>)}</ol> : <p>No events supplied in this snapshot. Absence is not completion evidence.</p>}
        <p>MoveBooks coordinates. Rules verify. You decide. All approvals and financial results remain in their original tasks.</p>
      </details>
    </>}
    {!view && !loading && <details className="member-details"><summary>Resume a saved migration</summary><p>Use the reference from your saved migration link. Access is checked again; this does not list or create migrations.</p><form action="/workspace" method="get"><label className="field-label">Migration reference<input className="field-control" name="session" required pattern="[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}" placeholder="UUID from your migration link"/></label><Button variant="secondary" type="submit">Open reference</Button></form></details>}
    {!view && !loading && <nav className="member-actions" aria-label="Task help"><a href={help}><LifeBuoy size={18} aria-hidden="true"/>Help with this task</a></nav>}
    <p className="member-boundary">Bounded synthetic Beta · No production customer data</p>
    <Attribution />
  </main>;
}
