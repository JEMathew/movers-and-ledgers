"use client";
import Link from "next/link";
import { WatchGuide } from "@/components/academy/WatchGuide";
import { Alert, Button } from "@/components/ui";
import { IdentityEntry } from "@/components/IdentityEntry";
import { useIdentity } from "@/components/IdentityProvider";
import { cloudIdentity } from "@/lib/identity";
import { Surface } from "./Surface";
import { AnchoredDetails } from "./AnchoredDetails";
import { OperationalActivity } from "./OperationalActivity";
import { EvidenceRecords } from "./EvidenceRecords";
import { phases } from "./content";
import { isSessionId, useSessionView } from "./session";
import { projectJourney } from "@/components/journey/journey";
import { AiStatusBadge, RecoveryNotice, StageBar, v2Stages, WorkflowSummary } from "@/components/v2";
import type { Outstanding } from "@/components/v2";

export function Trust({ evidenceMode = false, session }: { evidenceMode?: boolean; session?: string }) {
  // Plain public Trust never mounts a session reader, including with a saved selection.
  if (evidenceMode) return cloudIdentity() ? <CloudEvidence session={session}/> : <Evidence key={session ?? "selected"} reference={session}/>;
  return <Surface compact eyebrow="Trust" title="A move you can inspect." intro="MoveBooks coordinates the work, rules verify financial facts, and people approve consequential decisions." action={<Link className="button" href="/workspace">Start a sample migration</Link>}>
    <WatchGuide lesson="08"/>
    <ul className="trust-principles v2-principles"><li><strong>People approve:</strong> consequential decisions are explicit and attributable.</li><li><strong>Rules verify:</strong> failed financial checks block progress.</li><li><strong>Workspaces are owned:</strong> the API verifies identity and access.</li><li className="v2-principle-planned"><span className="v2-principle-badge"><AiStatusBadge /></span><strong>AI is planned:</strong> the Advisor and independent Reviewer are not switched on in the Beta. When they are, they can only suggest; the same rules and approvals apply.</li></ul>
    <AnchoredDetails id="financial-controls" title="Financial controls and human approvals"><p>Versioned rules check counts, balances and relationships. The same inputs and rule versions produce the same financial result. An AI recommendation or human approval cannot waive a failed check.</p><p>People approve mappings, plan consent, bounded recovery, consequential settings, onboarding and first-task decisions. Decisions retain actor, time and evidence. Automated steps coordinate permitted discovery, batches and retries; they cannot approve their own proposals.</p></AnchoredDetails>
    <AnchoredDetails id="workspace-access" title="Identity, saved progress and evidence"><p>Google sign-in identifies your account; the API checks ownership and approval identity. Cloud synthetic workspaces and checkpoints persist. Local demo sessions may expire when the API restarts.</p><p>Open Evidence &amp; Results from your migration task to inspect its authorized snapshot. Public Trust does not read a stored migration pointer. Empty evidence is not a passed check; refresh reads a snapshot, not live monitoring. Raw financial payloads, prompts and hidden reasoning are excluded.</p><Link className="public-text-link" href="/guide#trust">How to inspect migration evidence</Link></AnchoredDetails>
    <AnchoredDetails id="ai-boundaries" title="AI limitations and fallback"><p>Current Beta guidance comes from deterministic rules. Planned AI guidance may explain mappings and remedies with uncertainty; confidence is never a guarantee or permission. Gemini guidance is implemented only for configured synthetic dev/test environments, labels its source and fallback, and does not make AI assistance available in this Beta. Google Cloud, Gemini and Google ADK describe the stack, not a live model call on every interaction; managed ADK remains disabled.</p><p>Optional Gemini receives a bounded repository-sample summary: plan stages, mapping concepts and candidates, failure classes, proposal states and onboarding checklist states. Uploaded exports, raw financial rows and amounts, actor identities, comments and credentials are excluded. Advice cannot approve, migrate, retry, post an invoice or declare Business ready · verified. Unavailable or invalid advice falls back within the same controls.</p><Link className="public-text-link" href="/learn#confidence">What confidence means</Link></AnchoredDetails>
    <AnchoredDetails id="beta-limitations" title="Beta limitations"><p>This is a bounded synthetic Beta, not a production or compliance-ready service. Business records, source/target operations and invoice posting stay synthetic. Real accounting-provider connections are unavailable.</p><p>Do not use real customer or production provider data, names, financial records, account or tax numbers, passwords or tokens. Cloud test-export uploads remain disabled, including for signed-in users. Only local evaluation accepts controlled synthetic or de-identified exports.</p><p>No production uptime or staffed-support commitment. This is not accounting, tax or legal advice. MoveBooks AI is independent and provider-neutral, with no accounting-provider affiliation.</p><Link className="public-text-link" href="/try-your-data">Local evaluation availability</Link></AnchoredDetails>
  </Surface>;
}
function CloudEvidence({ session }: { session?: string }) {
  const { identity } = useIdentity();
  const linked = session ?? null;
  if (linked !== null && !isSessionId(linked)) return <Surface compact eyebrow="Evidence" title="Evidence unavailable." intro="This migration reference is invalid."><p role="alert">Invalid session reference. No replacement migration was created.</p><Link className="public-text-link" href="/trust">Public trust principles</Link></Surface>;
  if (!identity) return <Surface compact eyebrow="Evidence" title="Sign in to inspect your migration." intro="Evidence belongs to an owner-protected synthetic workspace."><IdentityEntry destination={`/trust?view=evidence${linked ? `&session=${linked}` : ""}`}/><Link className="public-text-link" href="/trust">Public trust principles</Link></Surface>;
  return <Evidence key={`${identity.subject}:${session ?? "selected"}`} reference={session}/>;
}
function Evidence({ reference }: { reference?: string }) {
  const { view, loading, error, errorKind, readAt, selectedReference, refresh } = useSessionView(reference);
  const destination = `/trust?view=evidence${selectedReference ? `&session=${selectedReference}` : ""}`;
  const projection = view ? projectJourney({ status: view.status, mappingIssues: view.mappingIssues, readinessIssues: view.readinessIssues }) : null;
  const stages = projection ? v2Stages(projection.current, view?.status) : null;
  const complete = view?.status === "VERIFIED_FIRST_PRODUCTIVE_USE";
  const held = Boolean(view && /BLOCKED|PAUSED|RESOLVING|RETRY_PENDING/.test(view.status));
  const passed = view ? view.checks.filter(check => check.status === "VERIFIED").length : 0;
  const stageName = view ? phases[view.phase].name : "";
  const done = view ? [
    ...(view.decisions.length ? [`${view.decisions.length} ${view.decisions.length === 1 ? "decision" : "decisions"} recorded, each with who made it and when`] : []),
    ...(view.checks.length ? [`${passed} of ${view.checks.length} rule checks in this snapshot passed`] : []),
    ...(complete ? ["All five stages done"] : view.phase > 0 ? [`Stages done: ${phases.slice(0, view.phase).map(phase => phase.name).join(", ")}`] : []),
  ] : [];
  const outstanding: Outstanding[] = view ? [
    ...(view.mappingIssues === null ? [{ label: "Mapping review count unavailable", tone: "neutral" as const }] : view.mappingIssues > 0 ? [{ label: `${view.mappingIssues} mappings awaiting review in the supplied snapshot` }] : []),
    ...view.attention.slice(0, 4).map(item => ({ label: item.title, tone: held ? "blocked" as const : "review" as const })),
    ...(view.attention.length > 4 ? [{ label: `and ${view.attention.length - 4} more in the task`, tone: "neutral" as const }] : []),
    ...(!view.attentionComplete ? [{ label: "Attention evidence is partial. Missing sections cannot establish readiness or completion.", tone: "neutral" as const }] : []),
  ] : [];
  return <Surface compact sourceScope="Migration evidence · synthetic target" eyebrow="Evidence and results" title="What happened in this migration." intro="Rules verify financial facts. You make every consequential decision. Reading evidence approves nothing.">
    {loading ? <p role="status">Reading session evidence… No result is assumed.</p> : error ? <RecoveryNotice title="Evidence unavailable" action={<div className="flex flex-wrap items-center gap-3">{errorKind === "identity" ? <Link className="button" href={`/sign-in?next=${encodeURIComponent(destination)}`}>Verify access to this evidence</Link> : errorKind === "network" ? <Button onClick={refresh}>Read the same evidence again</Button> : <Link className="button" href="/workspace">Open my migration</Link>}<Link className="public-text-link" href={`/support${selectedReference ? `?session=${selectedReference}` : ""}`}>Help with unavailable evidence</Link></div>}><p>{error}</p><p>No approval, recovery or completion is inferred from a failed read.</p></RecoveryNotice> : !view ? <Alert tone="info" title="No migration selected"><p>Open an owned migration reference to inspect its actual evidence. No replacement migration was created.</p><Link className="button mt-3" href="/workspace">Open my migration</Link></Alert> : <>
      <section aria-label="Current evidence context" className="v2-evidence-context">
        <h2 className="type-section">Current stage: {complete ? "all five done" : stageName}</h2>
        {stages && <StageBar stages={stages} />}
      </section>
      <WorkflowSummary label="Evidence summary"
        recovery={held ? <RecoveryNotice title={`${stageName} needs your attention`} action={<Link className="public-text-link" href={`/support?session=${view.id}&stage=${view.phase}`}>Get contextual help</Link>}><p>Completed work is kept. Open {stageName} to review what stopped and the permitted next step; evidence cannot clear a blocker.</p></RecoveryNotice> : undefined}
        next={{
          title: complete ? "Every stage is done and verified" : `Continue in ${stageName}`,
          detail: "Decisions are made in the task, never on this page.",
          action: <><Link className="button" href={`${phases[view.phase].route}?session=${view.id}`}>Return to migration</Link><Button variant="secondary" onClick={refresh}>Refresh evidence</Button></>,
        }}
        done={done} outstanding={outstanding} />
      <p className="text-sm text-muted">Snapshot read at {readAt && <time dateTime={readAt}>{readAt}</time>}. Refresh only reads; it never retries a financial action.</p>
      <nav className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Evidence task links"><Link className="public-text-link" href={`/support?session=${view.id}&stage=${view.phase}`}>Get contextual help</Link>{view.phase >= 3 && <Link className="public-text-link" href={`/validate-configure?session=${view.id}`}>Open exact financial checks</Link>}{view.phase === 4 && <Link className="public-text-link" href={`/onboard-fpu?session=${view.id}`}>Open invoice and first-task evidence</Link>}<Link className="public-text-link" href="/guide#reconsideration">How reconsideration preserves decisions</Link></nav>
      {view.attention.length > 0 && <details className="public-disclosure"><summary>{view.attention.length} recorded attention items · inspect details</summary><ul className="public-detail space-y-3">{view.attention.map((item, i) => <li key={i}><strong>{item.title}</strong><p className="text-sm">Evidence: {item.evidence}</p></li>)}</ul></details>}
      <details className="public-disclosure"><summary>Migration reference and workflow status</summary><div className="public-detail"><p>{view.sourceKind}</p><p>Workflow status: {view.status.replaceAll("_", " ").toLowerCase()}</p><p>Session: {view.id}</p></div></details>
      <EvidenceRecords key={`${view.id}:${readAt}`} view={view}/>
      <OperationalActivity/>
    </>}
    <Link className="public-text-link" href="/trust">Public trust principles and Beta boundaries</Link>
  </Surface>;
}
