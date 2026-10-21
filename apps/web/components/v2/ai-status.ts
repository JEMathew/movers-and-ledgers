/**
 * Single source for the Gemini Advisor / independent Reviewer status shown in the product.
 * Phase 1 rule (docs/v2/phase1/ai-status-rule.md): "planned" until a separate release acceptance gate records
 * real, authenticated, verified inference from the hosted product. Never derived from a runtime response.
 */
export type AiAssistanceStatus = "planned" | "prototype" | "live";

export const AI_ASSISTANCE_STATUS: AiAssistanceStatus = "planned";

export const AI_STATUS_LABEL: Record<AiAssistanceStatus, string> = {
  planned: "Planned",
  prototype: "Prototype",
  live: "Live · limited evaluation",
};

export const AI_STATUS_DETAIL: Record<AiAssistanceStatus, string> = {
  planned: "not available in the Beta",
  prototype: "scripted example, not live model output",
  live: "Gemini for approved synthetic accounts; Offline Judge stays deterministic",
};
