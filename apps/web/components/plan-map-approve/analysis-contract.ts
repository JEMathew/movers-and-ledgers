/** Consumed API fields only. Extra server metadata is allowed; authority is never inferred. */
type Fact = { reference: string; observation: string };
export type RecordBase = {
  request_id: string;
  state: string; model: string | null; provider: string; requested_at: string;
  context_hash: string; failure_category: string | null; evidence: Fact[];
};
type Authority = { human_approval_required: true; financial_authority: false };
export type Analysis = Authority & {
  case_id: "account-clearing";
  advisor: RecordBase & { advice: null | (Authority & {
    observation: string; recommendation: string; rationale: string;
    uncertainty: string[]; evidence_references: string[];
  }) };
  reviewer: null | (RecordBase & { mapping_id: string; advisor_request_id: string; finding: null | (Authority & {
    recommendation_outcome: "ACCEPT" | "QUESTION" | "REJECT";
    outcome: string; summary: string; concerns: string[]; uncertainty: string[];
    evidence_references: string[];
  }) });
};

function object(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function text(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
function texts(value: unknown): value is string[] {
  return Array.isArray(value) && value.length > 0 && value.every(text);
}
function authority(value: Record<string, unknown>) {
  return value.human_approval_required === true && value.financial_authority === false;
}
function record(value: unknown): value is RecordBase & Record<string, unknown> {
  return object(value) && text(value.request_id) && text(value.provider) &&
    (value.model === null || text(value.model)) && text(value.requested_at) &&
    text(value.context_hash) && (value.failure_category === null || text(value.failure_category)) &&
    Array.isArray(value.evidence) &&
    value.evidence.every(fact => object(fact) && text(fact.reference) && text(fact.observation));
}
function grounded(value: Record<string, unknown>, evidence: Fact[]) {
  return authority(value) && texts(value.uncertainty) && texts(value.evidence_references) &&
    value.evidence_references.every(ref => evidence.some(fact => fact.reference === ref));
}

/** Fail closed on empty/malformed or mismatched results before rendering either role. */
export function parseAnalysis(value: unknown, mappingId: string): Analysis {
  const invalid = () => { throw new Error("Analysis response is unavailable"); };
  if (!object(value) || !authority(value) || value.case_id !== "account-clearing") return invalid();
  const advisor = value.advisor;
  if (!record(advisor) || !object(advisor) ||
    !advisor.evidence.every(fact => fact.reference === `mapping:${mappingId}`) ||
    !["COMPLETED", "ESCALATED", "FALLBACK", "UNAVAILABLE"].includes(advisor.state)) return invalid();
  const advice = advisor.advice;
  if (advisor.state === "UNAVAILABLE") {
    if (advice !== null) return invalid();
  } else if (!object(advice) || !grounded(advice, advisor.evidence) ||
    !["observation", "recommendation", "rationale"].every(key => text(advice[key]))) return invalid();
  const reviewer = value.reviewer;
  if (reviewer === null) {
    if (advisor.state !== "UNAVAILABLE") return invalid();
  } else {
    if (!record(reviewer) || !object(reviewer) || reviewer.mapping_id !== mappingId ||
      reviewer.advisor_request_id !== advisor.request_id ||
      !reviewer.evidence.every(fact => fact.reference === `mapping:${mappingId}`) ||
      (advisor.state === "UNAVAILABLE") !== (reviewer.state === "UNAVAILABLE") ||
      !["COMPLETED", "FALLBACK", "UNAVAILABLE"].includes(reviewer.state)) return invalid();
    if (reviewer.state === "UNAVAILABLE") {
      if (reviewer.finding !== null) return invalid();
    } else {
      const finding = reviewer.finding;
      if (!object(finding) || !grounded(finding, reviewer.evidence) || !text(finding.summary) ||
        !texts(finding.concerns) || !text(finding.recommendation_outcome) || !text(finding.outcome) ||
        !["ACCEPT", "QUESTION", "REJECT"].includes(finding.recommendation_outcome) ||
        !["CHALLENGED", "EVIDENCE_INCOMPLETE", "NO_CONTRADICTION_FOUND", "ESCALATE"].includes(finding.outcome)) return invalid();
    }
  }
  return value as Analysis;
}
