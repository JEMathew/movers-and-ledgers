export type FindingCategory = "BLOCKER" | "WARNING" | "INFO";
export type ReadinessStatus = "READY" | "NEEDS ATTENTION" | "BLOCKED";

export type DatasetProfile = {
  dataset: string;
  label: string;
  record_count: number;
  missing_values: Record<string, number>;
  duplicate_candidates: number;
  referential_integrity_issues: number;
  unsupported_items: number;
  status: ReadinessStatus;
  evidence_ids: string[];
};

export type Finding = {
  id: string;
  rule_code: string;
  category: FindingCategory;
  title: string;
  explanation: string;
  affected_entity: string;
  affected_record_count: number | null;
  evidence: string[];
  recommended_action: string;
  provenance: "DETERMINISTIC";
  tool: string;
  customer_action_required: boolean;
};

export type DiscoveryResult = {
  fixture_version: string;
  sample_company_id: string;
  company_name: string;
  synthetic: boolean;
  profiles: DatasetProfile[];
  findings: Finding[];
  tools_called: string[];
};

export type AssessmentResult = {
  readiness: ReadinessStatus;
  policy_version: string;
  blocker_count: number;
  warning_count: number;
  ready_areas: string[];
  unresolved_areas: string[];
  recommended_next_actions: string[];
  decision_basis: string[];
  target_assumptions: string[];
  score: null;
};

export type AgentActivity = {
  id: string;
  occurred_at: string;
  agent: string;
  action: string;
  tool: string;
  status: "COMPLETED" | "FAILED";
  evidence_references: string[];
  risk: "LOW" | "MEDIUM" | "HIGH";
  provenance: "DETERMINISTIC";
  customer_action_required: boolean;
  human_approval_required: boolean;
};
