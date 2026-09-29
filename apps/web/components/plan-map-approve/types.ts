import type { AgentActivity, AssessmentResult, DiscoveryResult } from "@/components/discover-assess/types";

export type WorkflowStatus =
  | "DISCOVERED"
  | "ASSESSED"
  | "PLANNED"
  | "MAPPING"
  | "AWAITING_APPROVAL"
  | "APPROVED";

export type PlanPhaseStatus = "READY" | "NEEDS_ATTENTION" | "BLOCKED" | "FUTURE";
export type MappingState =
  | "PROPOSED"
  | "AUTO_ACCEPTABLE"
  | "REVIEW_REQUIRED"
  | "APPROVED"
  | "MODIFIED"
  | "REJECTED"
  | "BLOCKED";

export type PlanPhase = {
  id: string;
  sequence: number;
  name: string;
  objective: string;
  dependencies: string[];
  status: PlanPhaseStatus;
  risks: string[];
  customer_action: string;
  agent_responsible: string;
  approval_checkpoint: string | null;
};

export type MigrationPlan = {
  id: string;
  version: string;
  status: "DRAFT" | "READY_FOR_MAPPING";
  phases: PlanPhase[];
  blockers: string[];
  risks: string[];
  checkpoints: string[];
  approvals_required: string[];
  customer_actions: string[];
  relative_complexity: string;
  evidence_references: string[];
};

export type MappingProposal = {
  id: string;
  version: string;
  area: string;
  source_id: string;
  source_label: string;
  recommended_target: string;
  selected_target: string;
  confidence: number;
  risk: "LOW" | "MEDIUM" | "HIGH";
  evidence: string[];
  rationale: string;
  alternatives: string[];
  state: MappingState;
  approval_required: boolean;
  policy_reasons: string[];
  deterministic_checks: string[];
  specialist: string;
  decided_by?: string | null;
  decided_at?: string | null;
  decision_comment?: string | null;
  reconsiderations?: MappingReconsideration[];
};

export type MappingReconsideration = {
  id: string;
  prior_decision_id: string;
  prior_actor: string;
  prior_timestamp: string;
  prior_reason: string | null;
  prior_evidence: string[];
  prior_target: string;
  requested_by: string;
  requested_at: string;
  reason: string;
  proposed_target: string;
  state: "REVIEW_REQUIRED" | "APPROVED" | "REJECTED";
  reviewed_by: string | null;
  reviewed_at: string | null;
  decision_id: string | null;
};

export type MappingHistoryDecision = {
  id: string;
  affected_entity: string;
  decision: string;
  actor: string;
  occurred_at: string;
  selected_value: string | null;
};

export type Session = {
  id: string;
  workflow_status: WorkflowStatus;
  discovery?: DiscoveryResult;
  assessment?: AssessmentResult;
  plan?: MigrationPlan;
  mappings: MappingProposal[];
  activity: AgentActivity[];
};
