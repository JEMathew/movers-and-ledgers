import { AI_ASSISTANCE_STATUS } from "./ai-status";

/** The owner-approved positioning line, shown only once Gemini assistance is verified live in the product. */
export const APPROVED_ATTRIBUTION = "Built on Google Cloud and powered by Gemini AI";
/** Truthful form while the hosted Beta is deterministic-only (docs/v2/phase1/ai-status-rule.md). */
export const PLANNED_ATTRIBUTION = "Built on Google Cloud · Gemini AI planned";

export function attributionText(status = AI_ASSISTANCE_STATUS): string {
  return status === "live" ? APPROVED_ATTRIBUTION : PLANNED_ATTRIBUTION;
}

/** One quiet line; no logos, badges or supporting paragraph. */
export function Attribution({ className = "" }: { className?: string }) {
  return <p className={`v2-attribution ${className}`.trim()} data-ai-status={AI_ASSISTANCE_STATUS}>{attributionText()}</p>;
}
