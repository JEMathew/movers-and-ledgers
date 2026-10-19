export type Decision = { actor: string; role?: string; at?: string; action: string; selection?: string; evidence_hash?: string };
export type Task = {
  id: string; label: string; status: "COMPLETED" | "REVIEW_REQUIRED" | "BLOCKED";
  explanation: string; next_action: string; evidence: string[]; approval_required: boolean;
  choices: string[]; decision?: { actor: string; role: string; at: string; action: string; selection: string } | null;
};
/** Posted invoice record. Customer and product are ids only; display names come from the snapshot lists. */
export type PostedInvoice = {
  number?: string; customer_id?: string; product_id?: string; quantity?: number; unit_price?: string; currency?: string;
  tax_code?: string; payment_terms?: string; subtotal?: string; tax?: string; total?: string; status?: string;
} & Record<string, unknown>;
/** Posted journal. Entries carry account ids, not account names (contract gap). */
export type PostedJournal = { entries?: { account_id: string; debit: string; credit: string }[] } & Record<string, unknown>;
export type Fpu = {
  id: string; status: string; contract_hash: string; checkpoint: "DRAFT" | "POSTED" | "VERIFIED";
  attempts: number; retry_limit: number; idempotency_key?: string; posted_by?: string; posted_at?: string; verified_at?: string;
  contract: { currency: string; tax_code: string; tax_rate: string; payment_terms: string; receivable_account: string; income_account: string; tax_account: string; totals: {subtotal: string; tax: string; total: string} };
  inputs: { customer_id: string; product_id: string; quantity: number; unit_price: string };
  decisions: Decision[];
  checks: { id: string; passed: boolean; explanation: string; evidence: string[] }[];
  invoice?: PostedInvoice | null; journal?: PostedJournal | null;
};
export type Snapshot = {
  session_id: string; company_name: string; workflow_status: string; effective_status: string;
  /** Journey evidence every stage read carries; see journeyEvidenceFrom. */
  mapping_review?: { total: number; pending: number } | null; readiness_blockers?: number;
  gate_error?: string | null; ready: boolean; verified_fpu: boolean; tasks: Task[];
  onboarding?: { fpu?: Fpu | null; faults: string[] } | null;
  customers: {id: string; display_name: string; email?: string}[]; products: {id: string; name: string}[];
  settings?: Record<string, string>;
  accounting_impact?: { before?: Record<string, string>; after?: Record<string, string> };
  activity: {id: string; agent: string; action: string; evidence_references: string[]}[];
};

/**
 * The parts of GET /v1/migration-sessions/{id} that the verified Start screen summarises: the validation
 * report (checks matched, trial balance difference) and the decisions recorded in earlier stages. Read only
 * once the first invoice is verified; every field may be missing and is then shown as "Not available".
 */
export type SessionEvidence = {
  mappings?: { state: string; decided_by?: string | null }[];
  execution?: { resolutions?: { state: string; decided_by?: string | null }[] } | null;
  configuration?: { proposals?: { state: string; decided_by?: string | null; decision?: string | null }[] } | null;
  validation_reports?: { currency: string; status: string; checks: { id: string; label: string; status: string; difference?: string | null }[] }[];
  reasoning_records?: unknown[];
  review_records?: unknown[];
};
