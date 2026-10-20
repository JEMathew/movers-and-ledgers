"use client";

import { useEffect, useRef, useState } from "react";
import { authHeaders } from "@/lib/identity";
import { isSessionId } from "@/components/public-surfaces/session";
import { Button } from "@/components/ui/primitives";

type Fact = { reference: string; observation: string };
type RecordBase = {
  state: string; model: string | null; provider: string; requested_at: string;
  context_hash: string; failure_category: string | null; evidence: Fact[];
};
export type Analysis = {
  advisor: RecordBase & { advice: null | {
    observation: string; recommendation: string; rationale: string;
    uncertainty: string[]; evidence_references: string[];
  } };
  reviewer: null | (RecordBase & { finding: null | {
    recommendation_outcome: "ACCEPT" | "QUESTION" | "REJECT";
    outcome: string; summary: string; concerns: string[]; uncertainty: string[];
    evidence_references: string[];
  } });
};

function provenance(record: RecordBase) {
  return record.provider === "gemini-adk" && ["COMPLETED", "ESCALATED"].includes(record.state)
    ? `Gemini · ${record.model} · validated advisory output`
    : "Deterministic fallback · no accepted AI result";
}
function failureReason(category: string) {
  if (category === "live_disabled") return "No model was called.";
  if (category === "timeout") return "The model did not finish within the time limit.";
  if (["schema_validation", "invalid_output", "review_unavailable_or_invalid"].includes(category)) return "The model response did not pass validation.";
  return "Model analysis is unavailable under the current controls.";
}
function Evidence({ record, references }: { record: RecordBase; references: string[] }) {
  return <details>
    <summary className="cursor-pointer font-semibold">Evidence supplied and cited</summary>
    <ul className="mt-2 space-y-2">{references.map(ref => <li key={ref}>
      <strong>{ref}</strong> — {record.evidence.find(fact => fact.reference === ref)?.observation ?? "Evidence unavailable"}
    </li>)}</ul>
    <p className="mt-2">Requested: {record.requested_at}</p>
    <p className="break-all">Snapshot: {record.context_hash}</p>
  </details>;
}

export function AssistedAnalysis({ mappingId }: { mappingId: string }) {
  const [result, setResult] = useState<Analysis>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const requestId = useRef<string | null>(null);
  const active = useRef<AbortController | null>(null);
  useEffect(() => () => active.current?.abort(), []);

  async function analyze() {
    if (active.current) return;
    const controller = new AbortController();
    active.current = controller;
    setBusy(true); setError(""); setResult(undefined);
    const session = new URLSearchParams(window.location.search).get("session") ?? "";
    // A timed-out POST may have completed. Reuse its ID; never silently rebill a retry.
    requestId.current ??= crypto.randomUUID();
    const deadline = window.setTimeout(() => controller.abort(), 135_000);
    try {
      if (!isSessionId(session)) throw new Error("workspace");
      const headers = await authHeaders();
      if (controller.signal.aborted) return;
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"}/v1/migration-sessions/${session}/analysis/mapping/${mappingId}`, {
        method: "POST", headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ request_id: requestId.current, confirmed: true }),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error("unavailable");
      const analysis: Analysis = await response.json();
      if (controller.signal.aborted || new URLSearchParams(window.location.search).get("session") !== session) return;
      setResult(analysis);
    } catch {
      if (new URLSearchParams(window.location.search).get("session") === session) {
        setError("Analysis is unavailable or the evidence changed. Use the rule check or request human review. Retrying uses the same request and does not restart a pending model call.");
      }
    } finally {
      window.clearTimeout(deadline);
      active.current = null;
      setBusy(false);
    }
  }
  const stale = result?.advisor.state === "UNAVAILABLE" || result?.reviewer?.state === "UNAVAILABLE";
  const advice = !stale && result?.advisor.advice;
  const finding = !stale && result?.reviewer?.finding;
  return <section className="pm-independent space-y-3 text-sm" aria-label="Synthetic AI-assisted analysis" aria-busy={busy}>
    <h5 className="font-semibold">AI-Assisted Analysis · synthetic preview</h5>
    <p>Analyze only 1200 · Misc Clearing and its proposed destination. The Advisor explains the evidence; a separate Reviewer checks that recommendation against the source facts.</p>
    <p>No balances, uploaded records, or customer data are sent. Live Gemini requires operator authorization; otherwise this uses deterministic fallback.</p>
    <Button size="small" variant="secondary" disabled={busy} onClick={() => void analyze()}>
      {busy ? "Analyzing and reviewing…" : "Run AI-Assisted Analysis"}
    </Button>
    <p role="status">{busy ? "Advisor analysis, then independent review. This can take up to two minutes." : stale ? "Evidence changed — both results are unavailable. Reopen the current mapping." : result ? "Analysis finished. Your approval is still required." : "Nothing is sent until you request analysis."}</p>
    {error && <p role="alert">{error}</p>}
    {advice && result && <section aria-label="Advisor result" className="space-y-2">
      <h6 className="font-semibold">Advisor</h6>
      <p>{provenance(result.advisor)}</p>
      {result.advisor.failure_category && <p>{failureReason(result.advisor.failure_category)} Inspect the deterministic evidence below.</p>}
      <p><strong>Analyzed:</strong> {advice.observation}</p>
      <p><strong>Recommendation:</strong> {advice.recommendation}</p>
      <p><strong>Why:</strong> {advice.rationale}</p>
      <p><strong>Uncertainty:</strong> {advice.uncertainty.join(" · ")}</p>
      <Evidence record={result.advisor} references={advice.evidence_references} />
    </section>}
    {finding && result?.reviewer && <section aria-label="Reviewer result" className="space-y-2">
      <h6 className="font-semibold">Independent Reviewer</h6>
      <p>{provenance(result.reviewer)}</p>
      {result.reviewer.failure_category && <p>{failureReason(result.reviewer.failure_category)} The independent rule check is shown.</p>}
      <p><strong>Recommendation assessment: {finding.recommendation_outcome}.</strong> {finding.summary}</p>
      <p>Mapping evidence: {finding.outcome.replaceAll("_", " ")}. Accepting reasoning is never approval of the mapping.</p>
      <ul className="list-disc pl-5">{finding.concerns.map(item => <li key={item}>{item}</li>)}</ul>
      <p><strong>Uncertainty:</strong> {finding.uncertainty.join(" · ")}</p>
      <Evidence record={result.reviewer} references={finding.evidence_references} />
    </section>}
    <p className="font-semibold">Your decision: establish the account’s purpose and settlement history, then use the existing mapping controls. Analysis cannot approve, change, or post anything. Deterministic validation remains authoritative.</p>
  </section>;
}
