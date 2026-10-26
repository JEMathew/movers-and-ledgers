# Design values vs API contracts

Owner condition (19 Oct 2026): reconcile mockup values and verification counts with the actual API contracts; never
hard-code authoritative financial results.

Every number in the design canvas is Harbor Light Books sample data. In the product each one must be read from the
API field below at render time. The UI may format, group and count API records; it must not compute, default or
store a financial result of its own.

## Values shown in the A+B design

| Design value | Shown on | API source (endpoint · field) | Status |
|---|---|---|---|
| Company "Harbor Light Books", "Sample" | App bar, all screens | `GET /v1/migration-sessions/{id}` · `company_name`, `sample_company_id` | Matches |
| Migration "…9753" | App bar switcher | Session `id` (UUID), last 4 characters | Matches |
| Stage done / now / locked | Stage bar | `workflow_status` mapped through the existing `stepByStatus` (journey.ts) onto the five phases | Matches; mapping is display only |
| 12 mappings; 2 need review; 10 low risk | My migration, Map and approve | `GET …/mappings` · count of `MappingProposal` by `state` and `risk` | Matches for Harbor; counts must be computed from the response |
| "Needs review / Blocked / Rejected / Approved / Changed" | Chips, queue groups | `MappingProposal.state` (`REVIEW_REQUIRED`/`PROPOSED`, `BLOCKED`, `REJECTED`, `APPROVED`, `MODIFIED`) | Matches; V1 showed one label for three states |
| "Low risk, ready" | Queue group | `state == AUTO_ACCEPTABLE && risk == LOW` (bulk eligibility in `bulk-approval-requirements.md`) | Matches |
| 76% match, Medium risk, rule reason for 1200 | Mapping detail | `confidence`, `risk`, `rationale`, `policy_reasons`, `alternatives` | Matches |
| Blocked reason "Vendor has no display name" | States sheet | `policy_reasons[]`, e.g. "Required target evidence is missing for fields: display_name." | Design paraphrases; product must show the API text or a mapped explanation keyed on the field name |
| Blocked recovery | States sheet, mapping card | `apply_mapping_decision`: a BLOCKED mapping can only be MODIFIED to a compatible target (`supported_targets`) | Design corrected: recovery is "change to a compatible target, or fix the source record" |
| Rejected recovery "Reconsider" | States sheet, prototype | `POST …/mappings/{mid}/reconsiderations` and review | Matches the existing reconsideration flow |
| "Move unlocks when every mapping is approved or changed" | My migration | `mapping_ready_for_handoff` requires every mapping APPROVED or MODIFIED | Matches |
| 8 batches, batch 2 paused | Move (concept) | `GET …/migration/progress` · batches and checkpoint state | Matches the Harbor scenario; count from response |
| "17 of 17 checks matched" | Verify, Start, landing | `GET …/validation` · `ValidationReport.checks[]` with `status == VERIFIED`, over `len(checks)` | Count must be computed from the list, never written as 17 |
| "Difference between old and new books USD 0.00" | Landing, Start | No single field. Use the trial balance check in `ValidationReport.checks[]` (`difference`) with `ValidationReport.currency` | **Gap in the design wording**: label it "Trial balance difference" and read the check's `difference`; show "Not available" if absent |
| 5 settings approved; 3 applied automatically | Verify, Start | `GET …/configuration` · proposals and their decisions | Count from response |
| Readiness 10 of 10 | Start | `GET …/fpu/readiness` · checks with `passed` | Count from response |
| Invoice USD 107.25 = 100.00 + 7.25 tax | Start, landing, prototype | `FpuTask.contract.totals` {`subtotal`, `tax`, `total`} (strings, exact decimals) and `contract.currency`, `contract.tax_rate` | Matches; render the strings as given |
| Invoice number "HL-FPU-…" | Start | Posted invoice `number` = `{prefix}FPU-{task id}` | Matches; shorten for display only |
| Customer "Cedar School", service "Catalog preparation" | Start | Invoice has `customer_id` and `product_id` only | **Gap**: names must be resolved from the migrated target records (`GET …/migration/target`); no API change in Phase 1 |
| Journal: AR 107.25 Dr; Sales 100.00 Cr; Sales tax payable 7.25 Cr | Start | Journal `entries[]` {`account_id`, `debit`, `credit`} | **Gap**: entries carry account ids (`account-ar`, `fpu-tax-payable`); display names need the target chart of accounts |
| "Posted and verified" | Start | `posted_at`, `verified_at`, `GET …/fpu/verification` checks | Matches |
| "Recorded with your name" | Everywhere | Server audit actor (`decided_by`, `posted_by`) from the verified identity | Matches |
| Advisor "escalate", Reviewer "challenged" for 1200 | Map and approve (examples) | Live only when the AI status rule allows; today the product returns labelled deterministic fallback | Shown as Planned examples only |

## Rules for implementation

1. Counts ("12", "10", "17 of 17", "10 of 10") are computed from API lists at render time.
2. Amounts are rendered from API decimal strings; the UI never adds, rounds or recalculates them. If a field is
   missing, the UI shows "Not available", never a sample value.
3. Sample values appear only in design files, the internal component sheet (labelled "Sample") and tests.
4. A contract test per screen fails if a rendered amount is not present in the mocked API response.

## Owner isolation already covered by API tests

`test_discover_assess`, `test_assessment_idempotency`, `test_plan_map_approve`, `test_mapping_reconsideration`,
`test_explicit_plan_approval`, `test_migrate_resolve`, `test_validate_configure`, `test_onboard_fpu`,
`test_onboard_cloud_owner`, `test_independent_review`, `test_beta_v1_integration`, `test_runtime_faults`,
`test_migration_listing`, `test_migration_activity_outbox`, `test_operational_activity`. The live two-identity check
per release remains manual until test identities are named.
