"use client";

import { useAdvisoryRequest } from "@/lib/use-advisory-request";
import { isSessionId } from "@/components/public-surfaces/session";
import { Button } from "@/components/ui/primitives";
import { AiStatusBadge } from "@/components/v2/primitives";

type Review = {
  state: string; provider: string; context_hash: string; requested_at: string;
  failure_category: string | null;
  evidence: { reference: string; observation: string }[];
  finding: null | {
    outcome: string; summary: string; evidence_references: string[];
    concerns: string[]; uncertainty: string[]; suggested_next_action: string;
  };
};
const actions: Record<string, string> = {
  INSPECT_SOURCE_PURPOSE: "Inspect the source account purpose and settlement history before deciding.",
  REQUEST_MORE_EVIDENCE: "Request more source evidence before deciding.",
  HUMAN_REVIEW: "Ask a qualified accountant to review the current mapping.",
};
export function IndependentReview({ mappingId }: { mappingId: string }) {
  const session = typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("session") ?? "";
  return <ReviewPanel key={`${session}:${mappingId}`} session={session} mappingId={mappingId} />;
}
function ReviewPanel({ session, mappingId }: { session: string; mappingId: string }) {
  const { result, busy, error, ready, request: post } = useAdvisoryRequest<Review>(
    `${session}:${mappingId}`,
    "Review is unavailable, outdated, or its three-review limit is reached. Inspect the current evidence or request human review.",
  );
  function request() {
    return post(
      `${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"}/v1/migration-sessions/${session}/reviewer/mapping/${mappingId}`,
      () => isSessionId(session) && new URLSearchParams(window.location.search).get("session") === session,
    );
  }
  return <section className="pm-independent" aria-label="Independent mapping review">
    <div className="flex flex-wrap items-center gap-2"><h5 className="font-semibold">Independent rule check</h5><span className="pm-meta">Available now · rules only</span></div>
    <p className="mt-2 text-sm text-secondary">Available now: a separate deterministic check challenges this candidate from source evidence. It does not read the advisor’s response or change your mapping.</p>
    <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-secondary">A Gemini Reviewer for this check <AiStatusBadge /></p>
    <Button className="mt-3" size="small" variant="secondary" disabled={busy || !ready} onClick={() => void request()}>{busy ? "Reviewing evidence…" : "Request independent review"}</Button>
    <p role="status" className="mt-2 text-sm">{busy ? "Checking the proposal…" : result ? `Review: ${result.state}` : "No review requested."}</p>
    {error && <p role="alert" className="mt-3 text-sm">{error}</p>}
    {result && <div className="mt-4 space-y-3 text-sm">
      <p className="font-semibold">{result.state === "UNAVAILABLE" ? "Evidence changed — review unavailable" : result.provider === "gemini-adk" && result.state === "COMPLETED" ? "AI Reviewer · advisory only" : "Independent deterministic review · not live AI"}</p>
      <p>Snapshot: {result.requested_at}. A second opinion is not approval.</p>
      {result.state !== "UNAVAILABLE" && result.finding && <>
        <p><strong>{result.finding.outcome.replaceAll("_", " ")}:</strong> {result.finding.summary}</p>
        <ul className="list-disc pl-5">{result.finding.concerns.map(item => <li key={item}>{item}</li>)}</ul>
        <p><strong>Uncertainty:</strong> {result.finding.uncertainty.join(" · ")}</p>
        <p><strong>Your next step:</strong> {actions[result.finding.suggested_next_action] ?? "Review the current task evidence."}</p>
        <details><summary className="cursor-pointer font-semibold">Review evidence</summary><ul className="mt-2 break-words">{result.finding.evidence_references.map(ref => <li key={ref}>{ref} — {result.evidence.find(f => f.reference === ref)?.observation ?? "Recheck source evidence"}</li>)}</ul><p className="mt-2 break-all">Snapshot reference: {result.context_hash}</p></details>
      </>}
    </div>}
  </section>;
}
