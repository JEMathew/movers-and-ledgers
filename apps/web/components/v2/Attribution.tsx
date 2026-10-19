/**
 * The owner-approved attribution line (docs/v2/phase1/ai-status-rule.md, "Attribution"), shown once per page
 * beneath the MoveBooks AI brand in the header. Fixed copy: one quiet line, no badges or logos. It states what
 * the product is built on, implies no endorsement or live AI capability, and does not depend on
 * AI_ASSISTANCE_STATUS: the Advisor and Reviewer keep their own Planned badges.
 */
export const APPROVED_ATTRIBUTION = "Built on Google Cloud and powered by Gemini AI";

export function Attribution({ className = "" }: { className?: string }) {
  return <p className={`v2-attribution ${className}`.trim()}>{APPROVED_ATTRIBUTION}</p>;
}
