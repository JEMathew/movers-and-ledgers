"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { authHeaders } from "@/lib/identity";
import { isSessionId } from "./session";

const capabilities: Record<string, string[]> = {
  "/plan-map-approve": ["planning", "mapping"],
  "/migrate-resolve": ["resolution"],
  "/validate-configure": ["configuration"],
  "/onboard-fpu": ["onboarding"],
};
const nextActions: Record<string, string> = {
  REVIEW_EXISTING_PROPOSAL: "Review the existing proposal",
  REQUEST_MORE_EVIDENCE: "Review missing evidence in the current task",
  ESCALATE: "Stop for human review in the current task",
};
type Result = {
  state: string; provider: string; model: string | null; requested_at: string;
  context_hash: string; failure_category: string | null; confidence_note: string;
  deterministic_results: string[];
  evidence?: {reference: string; observation: string}[];
  advice: null | { observation: string; inference: string; recommendation: string;
    rationale: string; evidence_references: string[]; confidence: number;
    uncertainty: string[]; alternatives: string[]; next_action: string };
};

export function ReasoningAdvice({ path }: { path: string }) {
  if (!capabilities[path]) return null;
  return <Suspense fallback={null}><SessionAdvice path={path}/></Suspense>;
}

function SessionAdvice({ path }: { path: string }) {
  const session = useSearchParams().get("session") ?? "";
  return <WorkspaceAdvice key={`${path}:${session}`} path={path} session={session}/>;
}

function WorkspaceAdvice({ path, session }: { path: string; session: string }) {
  const [result, setResult] = useState<Result>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (!capabilities[path]) return null;
  async function request(capability: string) {
    setBusy(true); setError(""); setResult(undefined);
    try {
      if (!isSessionId(session)) throw new Error("Open an existing synthetic workspace first.");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"}/v1/migration-sessions/${session}/reasoning/${capability}`, {
        method: "POST", headers: { ...await authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({request_id: crypto.randomUUID()}),
      });
      if (!response.ok) throw new Error("Reasoning is unavailable, not ready, or its budget is exhausted. Continue using the existing deterministic evidence; no action was approved.");
      const data: Result = await response.json();
      const current = new URLSearchParams(window.location.search).get("session");
      if (current !== session) throw new Error("Workspace changed; discarded the advisory response.");
      setResult(data);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Reasoning unavailable. No action was approved."); }
    finally { setBusy(false); }
  }
  return <section className="panel mt-4 p-5" aria-label="Optional reasoning guidance">
    <h2 className="type-card">Reasoning guidance · advisory only</h2>
    <p className="mt-2 text-sm text-secondary">Optional advice about the current proposal. It cannot approve, retry, post or verify. The public Beta uses deterministic fallback; live Gemini requires explicit operator configuration.</p>
    <div className="mt-3 flex flex-wrap gap-2">{capabilities[path].map(capability => <button className="button secondary small" type="button" key={capability} disabled={busy} onClick={() => request(capability)}>Explain {capability}</button>)}</div>
    <p role="status" className="mt-2 text-sm">{busy ? "Preparing bounded guidance…" : result ? `Guidance: ${result.state}` : "No reasoning requested."}</p>
    {error && <p role="alert" className="mt-3">{error}</p>}
    {result && <div className="mt-4 space-y-3 text-sm">
      <p className="font-semibold">{result.state === "UNAVAILABLE" ? "Guidance unavailable — no recommendation" : result.provider === "gemini-adk" && result.state !== "FALLBACK" ? "AI-generated recommendation" : "Deterministic fallback — not live AI"} · Human review required</p>
      <p>Snapshot from {result.requested_at}. Guidance is not a current approval or financial verification result; recheck the workflow before deciding.</p>
      {result.failure_category && <p>Fallback/unavailable category: {result.failure_category}</p>}
      {result.advice && result.state !== "UNAVAILABLE" && <>
        <p><strong>Recommendation:</strong> {result.advice.recommendation}</p>
        <p>Confidence: {result.advice.confidence}. {result.confidence_note}</p>
        <p>Uncertainty: {result.advice.uncertainty.join(" · ") || "Not supplied"}</p>
        <p>Next step: {nextActions[result.advice.next_action] ?? "Review the current task; no action is authorized by this advice"}</p>
        <details className="public-disclosure"><summary>Explanation and alternatives</summary><div className="public-detail">
          <p><strong>Observation:</strong> {result.advice.observation}</p>
          <p><strong>Inference:</strong> {result.advice.inference}</p>
          <p><strong>Why:</strong> {result.advice.rationale}</p>
          <p>Alternatives: {result.advice.alternatives.join(" · ")}</p>
        </div></details>
        <details className="public-disclosure"><summary>Evidence and deterministic boundaries</summary><div className="public-detail">
          <ul className="break-words">{result.advice.evidence_references.map(ref => <li key={ref}>{ref}{result.evidence?.find(fact => fact.reference === ref) ? ` — ${result.evidence.find(fact => fact.reference === ref)?.observation}` : ""}</li>)}</ul>
          <ul>{result.deterministic_results.map(item => <li key={item}>{item}</li>)}</ul>
          <p>Context reference: {result.context_hash || "Not supplied"}. Advice belongs to this snapshot; review fresh task evidence before any decision.</p>
          <p>Supplied next-action code: {result.advice.next_action || "Not supplied"}</p>
        </div></details>
      </>}
    </div>}
  </section>;
}
