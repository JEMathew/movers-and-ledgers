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
    <p className="mt-2 text-sm text-secondary">Optional explanations of existing synthetic proposals. Rules remain authoritative; approvals and workflow actions stay in the controls above. No uploads are sent. Live Gemini requires explicit operator configuration; otherwise versioned fallback guidance is shown.</p>
    <div className="mt-3 flex flex-wrap gap-2">{capabilities[path].map(capability => <button className="button secondary small" type="button" key={capability} disabled={busy} onClick={() => request(capability)}>Explain {capability}</button>)}</div>
    <p role="status" className="mt-2 text-sm">{busy ? "Preparing bounded guidance…" : result ? `Guidance: ${result.state}` : "No reasoning requested."}</p>
    {error && <p role="alert" className="mt-3">{error}</p>}
    {result && <div className="mt-4 space-y-3 text-sm">
      <p className="font-semibold">{result.state === "UNAVAILABLE" ? "Guidance unavailable — no recommendation" : result.provider === "gemini-adk" && result.state !== "FALLBACK" ? "AI-generated recommendation" : "Deterministic fallback — not live AI"} · Human review required</p>
      <p>Snapshot from {result.requested_at}. AI text is unverified guidance, not a current approval or financial verification result; recheck the workflow before deciding.</p>
      {result.failure_category && <p>Fallback/unavailable category: {result.failure_category}</p>}
      {result.advice && <>
        <p><strong>Observation:</strong> {result.advice.observation}</p>
        <p><strong>Inference:</strong> {result.advice.inference}</p>
        <p><strong>Recommendation:</strong> {result.advice.recommendation}</p>
        <p><strong>Why:</strong> {result.advice.rationale}</p>
        <p>Confidence: {result.advice.confidence}. {result.confidence_note}</p>
        <p>Next step: {result.advice.next_action.replaceAll("_", " ")}</p>
        <p>Uncertainty: {result.advice.uncertainty.join(" · ")}</p>
        <p>Alternatives: {result.advice.alternatives.join(" · ")}</p>
        <details><summary className="cursor-pointer">Evidence and deterministic boundaries</summary>
          <ul className="mt-2 break-words">{result.advice.evidence_references.map(ref => <li key={ref}>{ref}{result.evidence?.find(fact => fact.reference === ref) ? ` — ${result.evidence.find(fact => fact.reference === ref)?.observation}` : ""}</li>)}</ul>
          <ul className="mt-2">{result.deterministic_results.map(item => <li key={item}>{item}</li>)}</ul>
        </details>
      </>}
    </div>}
  </section>;
}
