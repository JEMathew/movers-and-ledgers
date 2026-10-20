/**
 * Factual marketing attribution approved 20 October 2026. Nav renders it only on /.
 * Separate from product identity; no provider logos, partnership or live-inference claim.
 * The Advisor/Reviewer Planned status and all execution boundaries remain unchanged.
 */
export const APPROVED_ATTRIBUTION = "Built on Google Cloud";

export function Attribution({ className = "" }: { className?: string }) {
  return <p className={`v2-attribution ${className}`.trim()}>{APPROVED_ATTRIBUTION}</p>;
}
