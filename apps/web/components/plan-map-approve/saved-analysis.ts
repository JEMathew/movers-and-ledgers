import { parseAnalysis, type Analysis } from "./analysis-contract";

function object(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function timestamp(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

/** Read only an owner-scoped session response. History is never current approval evidence. */
export function savedAnalysis(value: unknown, sessionId: string, mappingId: string, subject: string): Analysis | undefined {
  const invalid = () => { throw new Error("Saved analysis is unavailable"); };
  if (!subject || !object(value) || value.id !== sessionId || value.synthetic !== true ||
    !Array.isArray(value.mappings) || !value.mappings.some(mapping => object(mapping) &&
      mapping.id === mappingId && mapping.source_id === "account-clearing") ||
    !Array.isArray(value.reasoning_records) || !Array.isArray(value.review_records) ||
    !value.reasoning_records.every(object) || !value.review_records.every(object)) return invalid();
  if (value.reasoning_records.some(record => record.capability === "mapping" &&
    (!Array.isArray(record.evidence) || !record.evidence.length || !record.evidence.every(fact =>
      object(fact) && typeof fact.reference === "string")))) return invalid();
  const advisors = value.reasoning_records.filter(record => record.capability === "mapping" &&
    Array.isArray(record.evidence) && record.evidence.some(fact => object(fact) && fact.reference === `mapping:${mappingId}`));
  if (!advisors.length) {
    if (value.review_records.some(record => record.mapping_id === mappingId && record.advisor_request_id)) return invalid();
    return undefined;
  }
  if (!advisors.every(record => record.requested_by === subject && timestamp(record.requested_at)) ||
    new Set(advisors.map(record => record.request_id)).size !== advisors.length) return invalid();
  const advisor = [...advisors].sort((a, b) => Date.parse(b.requested_at as string) - Date.parse(a.requested_at as string))[0];
  // Never pair by array position or silently replace an incomplete latest result with an older one.
  const reviews = value.review_records.filter(record => record.advisor_request_id === advisor.request_id);
  if (reviews.length !== 1) return invalid();
  const reviewer = reviews[0];
  if (reviewer.requested_by !== subject || reviewer.version !== "mapping-recommendation-review-v1" ||
    ![advisor, reviewer].every(record => timestamp(record.requested_at) && timestamp(record.completed_at) &&
      Date.parse(record.completed_at) >= Date.parse(record.requested_at)) ||
    Date.parse(reviewer.requested_at as string) < Date.parse(advisor.completed_at as string)) return invalid();
  const analysis = parseAnalysis({ case_id: "account-clearing", human_approval_required: true,
    financial_authority: false, advisor, reviewer }, mappingId);
  if (!analysis.advisor.advice || !analysis.reviewer?.finding) return invalid();
  return analysis;
}
