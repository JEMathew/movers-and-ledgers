"use client";
import Link from "next/link";
import { Alert, Button } from "@/components/ui";
import { IdentityEntry } from "@/components/IdentityEntry";
import { useIdentity } from "@/components/IdentityProvider";
import { cloudIdentity } from "@/lib/identity";
import { Surface } from "./Surface";
import { AnchoredDetails } from "./AnchoredDetails";
import { EvidenceRecords } from "./EvidenceRecords";
import { phases } from "./content";
import { isSessionId, useSessionView } from "./session";

export function Trust({ evidenceMode = false, session }: { evidenceMode?: boolean; session?: string }) {
  // Plain public Trust never mounts a session reader, including with a saved selection.
  if (evidenceMode) return cloudIdentity() ? <CloudEvidence session={session}/> : <Evidence key={session ?? "selected"} reference={session}/>;
  return <Surface compact eyebrow="Trust" title="A move you can inspect." intro="Agents coordinate, deterministic rules verify financial facts, and people approve consequential decisions." action={<Link className="button" href="/workspace">Try the Beta</Link>}>
    <ul className="trust-principles"><li><strong>People approve:</strong> consequential decisions are explicit and attributable.</li><li><strong>Rules verify:</strong> failed financial checks block progress.</li><li><strong>Workspaces are owned:</strong> the API verifies identity and access.</li><li><strong>AI is advisory:</strong> labeled fallback preserves the same controls.</li></ul>
    <AnchoredDetails id="financial-controls" title="Financial controls and human approvals"><p>Versioned rules check counts, balances and relationships. The same inputs and rule versions produce the same financial result. An AI recommendation or human approval cannot waive a failed check.</p><p>People approve mappings, plan consent, bounded recovery, consequential settings, onboarding and first-task decisions. Decisions retain actor, time and evidence. Agents coordinate permitted discovery, batches and retries; they cannot approve their own proposals.</p></AnchoredDetails>
    <AnchoredDetails id="workspace-access" title="Identity, saved progress and evidence"><p>Google sign-in identifies your account; the API checks ownership and approval identity. Cloud synthetic workspaces and checkpoints persist. Local demo sessions may expire when the API restarts.</p><p>Open Evidence &amp; Results from your migration task to inspect its authorized snapshot. Public Trust does not read a stored migration pointer. Empty evidence is not a passed check; refresh reads a snapshot, not live monitoring. Raw financial payloads, prompts and hidden reasoning are excluded.</p><Link className="public-text-link" href="/guide#trust">How to inspect migration evidence</Link></AnchoredDetails>
    <AnchoredDetails id="ai-boundaries" title="AI limitations and fallback"><p>AI predicts or explains mappings and remedies with uncertainty; confidence is not a guarantee or permission. Deterministic-only guidance is the public Beta default. Optional configured synthetic dev/test Gemini guidance labels its source and fallback. Google Cloud, Gemini and Google ADK describe the stack, not a live model call on every interaction; managed ADK remains disabled.</p><p>Optional Gemini receives a bounded repository-sample summary: plan stages, mapping concepts and candidates, failure classes, proposal states and onboarding checklist states. Uploaded exports, raw financial rows and amounts, actor identities, comments and credentials are excluded. Advice cannot approve, migrate, retry, post an invoice or declare Business Ready · Verified. Unavailable or invalid advice falls back within the same controls.</p><Link className="public-text-link" href="/learn#confidence">What confidence means</Link></AnchoredDetails>
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
  return <Surface compact sourceScope="Migration evidence · synthetic target" eyebrow="Evidence & Results" title="Review what happened." intro="Rules verify financial facts. Agents advise and coordinate. You make consequential decisions.">
    {loading ? <p role="status">Reading session evidence… No result is assumed.</p> : error ? <Alert tone="warning" title="Evidence unavailable"><p>{error}</p><p className="mt-2">No approval, recovery or completion is inferred from a failed read.</p><div className="mt-3 flex flex-wrap gap-3">{errorKind === "identity" ? <Link className="button" href={`/sign-in?next=${encodeURIComponent(destination)}`}>Verify access to this evidence</Link> : errorKind === "network" ? <Button onClick={refresh}>Read the same evidence again</Button> : <Link className="button" href="/workspace">Open My Migration</Link>}<Link className="public-text-link" href={`/support${selectedReference ? `?session=${selectedReference}` : ""}`}>Help with unavailable evidence</Link></div></Alert> : !view ? <Alert tone="info" title="No session selected"><p>Open an owned migration reference to inspect its actual evidence. No replacement migration was created.</p><Link className="button mt-3" href="/workspace">Open My Migration</Link></Alert> : <>
      <section aria-label="Current evidence context">
        <h2 className="type-section">Current journey stage: {phases[view.phase].name}</h2>
        <div className="mt-3 flex flex-wrap gap-3"><Link className="button" href={`${phases[view.phase].route}?session=${view.id}`}>Return to migration</Link><Button variant="secondary" onClick={refresh}>Refresh evidence</Button></div>
        <p className="mt-2 text-sm text-muted">Snapshot read at {readAt && <time dateTime={readAt}>{readAt}</time>}. Refresh only reads; it never retries a financial action.</p>
        <details className="public-disclosure mt-3"><summary>Migration reference and workflow status</summary><div className="public-detail"><p>{view.sourceKind}</p><p>Workflow status: {view.status.replaceAll("_", " ")}</p><p>Session: {view.id}</p></div></details>
      </section>
      <section aria-label="Attention summary"><h2 className="type-section">Blockers and decisions needing attention</h2>
        <p className="mt-2">{view.mappingIssues === null ? "Mapping review count unavailable." : `${view.mappingIssues} mappings awaiting review in the supplied snapshot.`} Decisions belong in the task; reading evidence approves nothing.</p>
        {!view.attentionComplete && <p className="mt-2 text-sm text-secondary">Attention evidence is partial. Missing sections cannot establish readiness or completion.</p>}
        {view.attention.length ? <details className="public-disclosure mt-3"><summary>{view.attention.length} recorded attention items · inspect details</summary><ul className="public-detail space-y-3">{view.attention.map((item, i) => <li key={i}><strong>{item.title}</strong><p className="text-sm">Evidence: {item.evidence}</p></li>)}</ul></details> : <p className="mt-2 text-secondary">No attention items supplied. This is not a readiness or completion determination; the workflow remains authoritative.</p>}
        <nav className="mt-3 flex flex-wrap gap-3" aria-label="Evidence task links"><Link className="public-text-link" href={`/support?session=${view.id}&stage=${view.phase}`}>Get contextual help</Link>{view.phase >= 3 && <Link className="public-text-link" href={`/validate-configure?session=${view.id}`}>Open exact financial checks</Link>}{view.phase === 4 && <Link className="public-text-link" href={`/onboard-fpu?session=${view.id}`}>Open invoice and first-task evidence</Link>}<Link className="public-text-link" href="/guide#reconsideration">How reconsideration preserves decisions</Link></nav>
      </section>
      <EvidenceRecords key={`${view.id}:${readAt}`} view={view}/>
    </>}
    <Link className="public-text-link" href="/trust">Public trust principles and Beta boundaries</Link>
  </Surface>;
}
