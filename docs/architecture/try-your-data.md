# Try Your Data — controlled local intake

Scope: bounded, de-identified test accounting exports into the existing governed Beta. Not a
production customer-data service, provider connector, live Google identity/runtime or migration
readiness claim. The [integrated lifecycle](beta-v1-integration.md) remains authoritative.
Rules verify. AI predicts. GenAI reasons. Agents orchestrate and act. Humans govern consequential decisions.

## Entry and lifecycle

Product/workspace and Assessment link to protected `/try-your-data`. The user chooses Sample
Business or Try Your Data. Simulator is unchanged. Intake follows Upload → Validate → Review →
Resolve blockers → Create workspace → Discover → Assess. A schema-valid package is **not** migration
readiness, approval, reconciliation or completion. There is no direct downstream-stage endpoint.

Select files, confirm permission/local privacy notice, explicitly validate, inspect file counts and
issues, replace/remove files and retry, then explicitly review exclusions and create. Every file
change invalidates the displayed report and review checkbox. Native file input, labelled controls,
textual statuses, live region/errors, disabled busy controls and focused result headings use the
existing themes. No new motion or dialog. Validation runs only after the explicit action.

## Versioned supported package

`controlled-package-v1`: exactly eight required files and optional `metadata.json`. One flat ZIP may
contain those same files. Template: authenticated `GET /v1/intake/template`, generated from the
synthetic Harbor fixture with a bill matching its A/P balance, never from uploaded data.

| File | Required columns / structure | Optional columns |
| --- | --- | --- |
| customers.csv | id, display_name | email |
| vendors.csv | id, display_name | email |
| accounts.csv | id, code, name, account_type, opening_balance | parent_id |
| products.csv | id, name, item_type | income_account_id, expense_account_id |
| invoices.csv | id, customer_id, receivable_account_id, document_number, total | paid, product_id, transaction_id |
| bills.csv | id, vendor_id, payable_account_id, document_number, total | paid, product_id, transaction_id |
| transactions.csv | id, transaction_date, entries | invoice_id, bill_id, customer_id, vendor_id |
| configuration.json | company, settings, taxes | No unknown keys |
| metadata.json | Optional package_version and description strings | No authority fields |

IDs: 1–64 ASCII letters/digits/hyphen/underscore, beginning with a letter/digit. Dates use ISO dates.
Money uses exact finite decimal strings, at most two decimal places and absolute value ≤ 1e18.
Journal `entries` is a CSV-quoted JSON array of 2–100 objects with exactly `account_id`, `debit`,
`credit`; exactly one positive side per entry, nonnegative values and equal journal totals.
No automatic balancing, currency conversion, merging or consequential repair.

Account types: bank, accounts_receivable, accounts_payable, asset, liability, equity, income,
expense, cost_of_goods_sold. Product item_type: service, inventory, non_inventory. Later mapping
compatibility remains a separate gate; intake acceptance does not assert all target transformations.
Header-only CSVs explicitly declare empty datasets. Accounts and journals must supply actual
balanced evidence. IDs are unique within each entity, and declared references must resolve.
Invoice/bill control accounts must have the correct receivable/payable classification.

Configuration company has exactly id, legal_name, display_name, base_currency and integer
fiscal_year_start_month (1–12). Settings has all eight existing configuration areas: fiscal_year,
base_currency, tax_setup, payment_terms, inventory, invoice_preferences, user_roles, integrations.
Values must pass existing configuration policy; company currency/year must match. Taxes is an
array of at most 20 id/code/rate/jurisdiction records with finite decimal rates in [0,1], unique IDs
and an unambiguous selected tax code (or NONE with no taxes). The template documents working values.
No fault injection, migration controls, model settings, actor, approval or lifecycle state accepted.

## Normalization and evidence

The adapter emits the existing provider-neutral Beta source envelope: company and datasets for
Customer, Vendor, Account, Product/Service, Invoice, Bill, Transaction and Configuration. Taxes and
eight configuration preferences come from explicit configuration.json—not invented defaults.
Configuration base-currency/calendar records are structural projections of those explicit values.
This is the existing Beta dictionary contract, not a claim of conformance to every rich canonical
domain model or proprietary export. Unsupported semantic treatments remain blocked downstream.

UTF-8/BOM decoding, CSV structure and entries JSON parsing are the only intake transformations.
No trimming or numeric rounding. Each accepted row retains entity/source ID, file, one-based CSV
record ordinal (header=1; not physical line for multiline CSV), row-source hash, transformations,
and ignored-column names. Each file retains SHA-256. Unknown CSV columns produce visible warnings,
are excluded from normalized records only after explicit review, and remain represented by hashes
and exclusion names; raw excluded values are not retained. Metadata is evidence-only and generates
a warning, not an instruction. Financial payload values are not copied to issue reports or Trust.

## Safety limits and parser boundary

- At most 9 files, 256 KiB per expanded file, 2 MiB total, 1,000 records per CSV, 32 columns,
  8,192 characters per CSV cell; most retained text is further capped at 200 characters.
- Encoded HTTP body is streamed and capped at 3 MiB before JSON parsing. Direct ZIP body or a
  strict `{files: [{name, content}]}` base64 envelope; no multipart dependency or filesystem paths.
- Exact filename allowlist; duplicate names, case variants, nested archives, directories, traversal,
  symlinks, encrypted archives and unsupported compression rejected. ZIP stored/deflate only;
  expanded length and aggregate budget bounded; compression ratio over 100:1 rejected.
- No extraction to disk, code execution, shell, macros, formula evaluation, network/provider call
  or LLM egress. UTF-8/control-byte, CSV width/quoting, JSON duplicate-key/nonfinite, schema/type,
  identifier, reference, balanced-journal and configuration checks fail closed.
- Raw request values are never echoed through validation exceptions. Existing auth scopes tickets,
  session state and Trust to the principal. Demo identity still fails closed in production.

Malware scanning, isolated parser processes, independent fuzzing, real IAM/tenant isolation,
encryption-at-rest, legal/compliance and externally hosted abuse controls are **not implemented**.
The current identity is a shared development demonstration identity, not a customer boundary.
Do not host this intake publicly or upload confidential business records. Neither consent nor a
bounded parser turns this runtime into a secure production service.

## Ticket, workspace and lifecycle reuse

`POST /v1/intake/validate` returns READY / NEEDS ATTENTION / BLOCKED, safe file inventory,
issues (where/why/action/can-continue), activity and an opaque owner-scoped ticket. Blocked tickets
have no normalized source and cannot create a workspace. `POST /intake/{id}/discard` removes only
the ticket; existing workspaces are unchanged. Revalidate to create a fresh report after replacement.

Tickets expire after 30 minutes (lazy cleanup on intake requests), maximum 8 per owner / 32 total.
At most 16 uploaded workspaces per process; capacity stops with 429 instead of silently evicting
evidence. Uploaded workspaces remain until local API restart. Raw bytes are temporary parser input;
normalized source and lineage live in server memory. Browser selections disappear on reload; only
the existing session-ID pointer is stored. No durable deletion/retention or crash recovery guarantee.

`POST /intake/{id}/workspace` accepts **only** `{reviewed: true}`. Server records owner review bound
to package, source checksum and report hash; stores a normal `MigrationSession` at CREATED; calls
the existing DiscoveryAgent and AssessmentAgent through DiscoverAssessService. Same-ticket retries
return the same session; process-local lock plus existing repository CAS protects handoff. Failed
concurrent writes return 409; no stage rewind or implicit approval. Tickets are not portable across
restart or workers; no distributed exactly-once claim.

`source_for(session)` supplies either immutable session-owned upload evidence or a bundled sample to
the **same** planning, mapping, migration, validation, configuration, onboarding and FPU pipeline.
Private `uploaded_source` is excluded from serialized session responses. `source_kind=user_upload`
and Discovery `synthetic=false` identify provenance. Legacy session `synthetic=true` describes the
synthetic execution sandbox, not uploaded source provenance. There are no real provider writes.
The bill dataset adds an optional ninth existing execution batch; original fixtures still have eight.
Counts, identities, source/payload checksums and bill A/P reconciliation prevent silent bill loss.

## Trust and analytics

Public Trust/Product reads now use owner-scoped `/migration-sessions/{id}/intake-trust`, a server-side
allowlist, not the full session payload. It includes stage, source kind, safe intake milestones,
tool/agent/status/time, decision IDs, lifecycle IDs and deterministic result flags. It excludes
financial amounts, business names, source identifiers, raw records, selected values, prompts and
private reasoning. Detailed records stay in the authorized governed workflow. Intake timestamps
identify validation completion, not invented per-tool latency. A human review is not a rule result.

Ten uninstrumented contracts live in `components/try-your-data/events.ts`: try_your_data_opened,
upload_started/completed, package_validation_started/passed/blocked, file_replaced,
validation_retried, workspace_created_from_upload, discover_started_from_upload. Each declares
source, trigger, owner and denominator. Only server-confirmed events can indicate creation/pass.
No collector or fabricated measurements. Before activation: privacy/retention, event IDs, cohort
window, deduplication, baselines and permitted dimensions. Never include upload values or filenames.

## Verification and operation

See [review](../reviews/try-your-data.md) for gates, criterion scores, findings and exact QA scope.
No packages/dependencies, production identity, live Gemini/ADK, provider connectors or deployment
added. Normal reviewed revert is the rollback; never rewrite public history. Stop local servers to
end the demonstration. Next: Google-native runtime integration with privacy/identity/durability
gates, then live Gemini/ADK evaluations, then UX/demo polish. These remain separate reviewed slices.
