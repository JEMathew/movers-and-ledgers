/**
 * The owner-approved Phase 1 attribution line (docs/v2/phase1/ai-status-rule.md, "Attribution").
 * It is fixed copy and does not depend on AI_ASSISTANCE_STATUS: the Advisor and Reviewer keep their own
 * Planned badges, and hosted Gemini inference is not active in Phase 1.
 */
export const APPROVED_ATTRIBUTION = "Built on Google Cloud and powered by Gemini AI";

/** One quiet line; no logos, badges or supporting paragraph. */
export function Attribution({ className = "" }: { className?: string }) {
  return <p className={`v2-attribution ${className}`.trim()}>{APPROVED_ATTRIBUTION}</p>;
}
