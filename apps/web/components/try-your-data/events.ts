// Future contracts only: no telemetry emission, uploaded values, names or record IDs.
export const intakeEvents = {
  try_your_data_opened: { source: "browser", trigger: "Intake page opened", owner: "Product", denominator: "Eligible product entries" },
  upload_started: { source: "browser", trigger: "Explicit validate after privacy confirmation", owner: "Product", denominator: "Eligible intake visits" },
  upload_completed: { source: "server", trigger: "Bounded body received", owner: "Engineering", denominator: "Upload attempts" },
  package_validation_started: { source: "server", trigger: "Parser starts", owner: "Migration", denominator: "Received packages" },
  package_validation_passed: { source: "server", trigger: "No package blockers; not migration readiness", owner: "Migration", denominator: "Validated packages by schema version" },
  package_validation_blocked: { source: "server", trigger: "Deterministic blocker found", owner: "Migration", denominator: "Validated packages by schema version" },
  file_replaced: { source: "browser", trigger: "User removes and reselects a file", owner: "UX", denominator: "Repair attempts" },
  validation_retried: { source: "browser", trigger: "Explicit validation repeated", owner: "UX", denominator: "Initially blocked packages" },
  workspace_created_from_upload: { source: "server", trigger: "Reviewed ticket creates session once", owner: "Product", denominator: "Eligible reviewed packages" },
  discover_started_from_upload: { source: "server", trigger: "Existing Discovery Agent starts once", owner: "Migration", denominator: "Upload workspaces" },
} as const;
// Allowed dimensions: schema version, status, issue code, entry surface. Diagnostic only.
// Before activation: consent, retention, event deduplication, cohort windows and baselines.
