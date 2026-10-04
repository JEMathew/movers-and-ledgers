import type { AgentActivity } from "@/components/discover-assess/types";

export type Check = {
  id: string; label: string; source: string; target: string; difference: string;
  status: "VERIFIED" | "WARNING" | "BLOCKED"; evidence: string[];
  record_ids: string[]; explanation: string; next_action: string;
};
export type Proposal = {
  id: string; area: string; label: string; source_value: string; selected_value: string;
  alternatives: string[]; risk: "LOW" | "HIGH"; approval_required: boolean;
  state: string; evidence: string[]; policy_reason: string; explanation: string;
  decided_by?: string; decision?: string;
};
export type Snapshot = {
  session_id: string; company_name: string; workflow_status: string;
  /** Journey evidence every stage read carries; see journeyEvidenceFrom. */
  mapping_review?: { total: number; pending: number } | null; readiness_blockers?: number;
  report?: { id: string; currency: string; status: Check["status"]; checks: Check[];
    blocking_discrepancies: number; policy_version: string } | null;
  configuration?: { id: string; proposals: Proposal[]; target_settings: Record<string, string> } | null;
  repairs: { resolution_id: string; record_id: string; entity: string; applied: boolean }[];
  resolutions: { id: string; rationale: string; evidence: string[] }[];
  activity: AgentActivity[]; ready_for_onboarding: boolean;
};
