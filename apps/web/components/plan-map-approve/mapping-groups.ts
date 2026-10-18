import type { V2MappingStatus } from "@/components/v2/mapping-status";
import { bulkEligible } from "./bulk-approval";
import type { MappingProposal } from "./types";

/**
 * The review queue for Map and approve, riskiest first. Display only: grouping decides nothing,
 * and every group still uses the same per-item decision endpoints.
 */
export type MappingGroupId = "needs_review" | "blocked" | "rejected" | "one_by_one" | "ready" | "decided";

export const GROUP_ORDER: MappingGroupId[] = ["needs_review", "blocked", "rejected", "one_by_one", "ready", "decided"];

export const GROUP_TITLE: Record<MappingGroupId, string> = {
  needs_review: "Needs review",
  blocked: "Blocked",
  rejected: "Rejected",
  one_by_one: "Low risk, decided one by one",
  ready: "Low risk, ready",
  decided: "Decided",
};

export const decided = (mapping: MappingProposal) => mapping.state === "APPROVED" || mapping.state === "MODIFIED";

export function groupOf(mapping: MappingProposal): MappingGroupId {
  if (decided(mapping)) return "decided";
  if (mapping.state === "BLOCKED") return "blocked";
  if (mapping.state === "REJECTED") return "rejected";
  if (mapping.risk !== "LOW") return "needs_review";
  return bulkEligible(mapping) ? "ready" : "one_by_one";
}

export function groupMappings(mappings: MappingProposal[]): { id: MappingGroupId; items: MappingProposal[] }[] {
  return GROUP_ORDER.map(id => ({ id, items: mappings.filter(mapping => groupOf(mapping) === id) })).filter(group => group.items.length > 0);
}

/** The chip a mapping shows. Low-risk mappings that still need their own decision read "Needs review". */
export function chipStatus(mapping: MappingProposal): V2MappingStatus {
  switch (groupOf(mapping)) {
    case "decided": return mapping.state === "MODIFIED" ? "changed" : "approved";
    case "blocked": return "blocked";
    case "rejected": return "rejected";
    case "ready": return "low_risk";
    default: return "needs_review";
  }
}

export const riskText = (risk: MappingProposal["risk"]) => risk === "HIGH" ? "High risk" : risk === "MEDIUM" ? "Medium risk" : "Low risk";
/** Recommendation confidence as the API gave it, as a whole percentage. Not a guarantee. */
export const matchText = (confidence: number) => Number.isFinite(confidence) ? `${Math.round(confidence * 100)}% match` : "Match not available";
