import type { AgentActivity } from "@/components/discover-assess/types";

export type BatchStatus =
  | "PENDING"
  | "RUNNING"
  | "COMPLETED"
  | "FAILED"
  | "RETRY_PENDING"
  | "BLOCKED";

export type MigrationBatch = {
  id: string;
  sequence: number;
  entity: string;
  record_count: number;
  status: BatchStatus;
  attempt_count: number;
  retry_limit: number;
  succeeded_count: number;
  failed_count: number;
  last_error: string | null;
};

export type MigrationFailure = {
  id: string;
  batch_id: string;
  kind: string;
  code: string;
  summary: string;
  root_cause: string;
  retryable: boolean;
  risk: "LOW" | "MEDIUM" | "HIGH";
  evidence: string[];
  affected_record_ids: string[];
  resolved: boolean;
  retry_count: number;
};

export type ResolutionProposal = {
  id: string;
  failure_id: string;
  version: string;
  specialist: string;
  action: string;
  rationale: string;
  evidence: string[];
  confidence: number;
  risk: "LOW" | "MEDIUM" | "HIGH";
  reversible: boolean;
  deterministic_fix_available: boolean;
  human_approval_required: boolean;
  escalation_rule: string;
  state: "PROPOSED" | "AWAITING_APPROVAL" | "APPROVED" | "APPLIED" | "REJECTED" | "ESCALATED";
};

export type MigrationExecution = {
  id: string;
  version: string;
  status:
    | "MIGRATION_READY"
    | "MIGRATING"
    | "MIGRATION_PAUSED"
    | "RESOLVING"
    | "RETRY_PENDING"
    | "MIGRATION_COMPLETE"
    | "MIGRATION_BLOCKED";
  manifest_version: string;
  batches: MigrationBatch[];
  failures: MigrationFailure[];
  resolutions: ResolutionProposal[];
  progress_percent: number;
  current_batch_id: string | null;
  current_agent: string;
  safe_to_validate: boolean;
};

export type DemoSession = {
  id: string;
  company_name: string;
  workflow_status: string;
  activity: AgentActivity[];
  execution?: MigrationExecution | null;
};
