# Firestore provisioning proposal — approval required

17 October 2026. Source implementation `0c189f2` (named-database/completion fix `dac9815`). Configuration hashes: [approval manifest](../../infra/firestore/proposal-manifest.json). **Proposed, not executed.** The user elected to
retain the API enabled after the disclosed inspection side effect. This does not authorize a
new database, IAM, service/configuration change, model inference or public release. The
[drift record](../../infra/firestore/api-drift-record.json) preserves the prior disabled state,
automatic activation, and later owner decision without treating that decision as retroactive approval.

## Recommended database and exact scope

| Decision | Proposal | Reason / constraint |
| --- | --- | --- |
| Project / database ID | `movebooks-ai` / `movebooks-operations` | Isolate operational records; explicitly select this named database instead of relying on `(default)` |
| Location | Regional `asia-southeast1` (Singapore) | Colocate with existing Cloud Run and Cloud SQL; this is not a data-residency compliance claim |
| Edition / mode | Standard / Firestore Native | Existing Python Firestore API and transactions; no MongoDB interface |
| Concurrency | Pessimistic | Match Standard transactions; verify contention/deadline behavior before activation |
| Encryption | Google-managed encryption | No new KMS key or KMS IAM scope proposed |
| Deletion protection | Enabled | Prevent accidental database deletion; cleanup requires separate deliberate approval |
| Recovery / retention | PITR off; no backup schedule; TTL off for initial dormant validation | Operational evidence only; preserve replay reservations/counters. Before ongoing use, approve a retention/restore policy that cannot erase replay or budget protection |
| Default access | All direct client reads/writes denied | Authenticated API supplies owner-scoped, bounded, sanitized projections |
| Initial policy | `enabled:false`, `synthetic_beta_authorized:false` | Provisioning must not activate inference |
| API | Keep `firestore.googleapis.com` enabled | Explicit owner decision; no other API enablement proposed |

Exact [database resource](../../infra/firestore/database.proposed.json),
[disabled policy seed](../../infra/firestore/policy.proposed.json),
[deny-client rules](../../infra/firestore/firestore.rules) and
[owner/time composite index](../../infra/firestore/firestore.indexes.json) are reviewable source files.
The [named-database rules/index target](../../infra/firestore/firebase.proposed.json) prevents a default-database rules deployment. No auto-apply or provisioning script is wired into CI. Cloud settings also reject `FIRESTORE_EMULATOR_HOST` so cloud admission cannot be redirected to a local control emulator. Before execution, use a read-only database
list/describe to confirm the name is absent and location/billing prerequisites; stop on a conflicting
existing resource. Do not overwrite an existing database, ruleset or IAM policy.

[Google's database guide](https://docs.cloud.google.com/firestore/native/docs/manage-databases)
and [database REST schema](https://docs.cloud.google.com/firestore/docs/reference/rest/v1/projects.databases)
explain named resources, editions, concurrency and protection fields. Location selection is a
creation decision; moving later requires a separate migration plan rather than a simple rollback.

## Security rules and IAM proposal

The proposed rules deny all direct web/mobile SDK reads and writes, including signed-in users.
Server ADC bypasses those rules, so server IAM is independently required. This separation follows
[Google's server-security guidance](https://docs.cloud.google.com/firestore/native/docs/security/iam).

A later, separately approved IAM phase would create custom role
`projects/movebooks-ai/roles/movebooksOperationalRuntime` and add its conditional binding only for
`movebooks-beta-api@movebooks-ai.iam.gserviceaccount.com`:

| Permission | Required operation |
| --- | --- |
| `datastore.databases.get` | Begin / roll back reservation transactions |
| `datastore.entities.get` | Read policy, usage, reservation and owner event data |
| `datastore.entities.list` | Run the bounded owner/time query |
| `datastore.entities.create` | Create scoped counters and reservations |
| `datastore.entities.update` | Commit counters and conditional terminal outcomes |

The [role definition](../../infra/firestore/runtime-role.proposed.json) and
[additive conditional binding](../../infra/firestore/runtime-binding.proposed.json) contain the exact
proposed permissions and condition:

`resource.name == "projects/movebooks-ai/databases/movebooks-operations"`

No document deletion, database/index administration, IAM administration, new credentials,
impersonation grants, public member or broad predefined data role is proposed for the runtime.
The operator would use their existing authorized administrative identity for setup; the application
must never use that identity. Preserve unrelated IAM bindings and conditions.

Database IAM conditions must be tested through the actual SDK/REST workload identity, including
negative access to another database. The database guide notes that console access does not enforce
these per-database conditions. A console screenshot is therefore insufficient isolation evidence.

**Boundary that must remain explicit:** database-level IAM does not distinguish the policy document
from other documents in this database. This proposed runtime update permission could modify the
policy if the workload were compromised, although application code has no policy-write path. The
Firestore switch is an application admission control, not an independently enforced IAM boundary or
hard cloud-billing cap. Before the IAM/live phase, review whether a separate policy authority is
required. No such separation is claimed by these rules. Existing SQL financial/audit authority stays
separate; operational events cannot approve, reconcile, post or establish FPU.

## Data, activity and replay

The current source stores SHA-256 owner/key projections, UTC day, controlled capability/state,
server timestamps, reserved call/budget counts and nullable observed usage counters. No prompts,
model text, raw source records, transaction amounts, invoice content, actor identifiers or credentials belong here.
Owner-scoped GET independently checks each returned owner, projects an allowlist and caps at 20;
UI refresh is explicit. Completion writes now use the snapshot update-time precondition so a
competing stale completion cannot overwrite the winning terminal result.

The implemented Firestore stream currently covers **advisory reservation/outcome activity within a
migration**. Full migration-phase activity replication remains required scope, not a delivered
Firestore feature. Existing authoritative workflow activity remains in SQL. Before enabling a phase
event mirror, implement and verify an after-commit outbox, idempotent pseudonymous event key, strict
phase/status schema, owner isolation, bounded readback and failure/replay handling. It must not copy
raw financial payloads or make the UI imply that telemetry proves financial success. No phase-event
index or write authorization is added silently by this proposal.

Do not enable TTL or delete reservations while their session replay window is unresolved. A future
retention policy must preserve admission tombstones/counters for at least the accepted replay
window. A restored or missing ledger must remain disabled until allowances can be reconciled
conservatively; restoring an old backup must not restore spend capacity.

## Cost estimate

Checked 17 October 2026 on [Google's public Standard pricing page](https://cloud.google.com/firestore/pricing),
with **Singapore**, **Monthly**, **Default** consumption selected. [Pricing capture](../submission/evidence/firestore-singapore-pricing.png).
The estimate assumes no free quota or commitment discounts. The published named-database pricing
section excludes free quota; account-specific billing/currency/taxes must be checked before creation.

| Item | USD price used |
| --- | ---: |
| Document reads | $0.0369 / 100,000 |
| Document writes | $0.1107 / 100,000 |
| Document deletes | $0.0123 / 100,000 |
| Storage, including indexes | $0.1846 / GiB-month |

Scenario: 30 days, 10 new advisory admissions/day, up to 13 reads/admission including three
reservation attempts and completion, 4 committed writes/admission, 1,000 explicit activity
refreshes/day returning 20 documents each, and 0.1 GiB average total stored/index data. This yields
603,900 reads ($0.2228391), 1,200 writes ($0.0013284) and storage ($0.01846): **$0.2426275/month,
rounded planning allowance $0.25/month for Firestore usage alone**.
[Machine-readable assumptions and arithmetic](../submission/evidence/firestore-cost-scenario.json).

Dormant phase A has only a disabled policy document and its empty index; the usage scenario above describes a possible later active workload, not new activity authorized by provisioning. There is no fixed database-creation fee in the published pricing.

This is an estimate, not a cap or measured spend. Additional denied requests, contention/retries,
abuse, telemetry, phase-event replication, taxes and cross-region/outside-cloud traffic change it.
Cloud Run, SQL, Storage and Gemini are separate. The same-region API/database path avoids
cross-region Firestore transfer in this scenario. Recommend a separate $1/month Firestore warning
budget with 50/90/100% alerts under later explicit configuration approval; alerts do not stop usage.
No budget or notification has been created.

Current application defaults reserve $0.10 per admission against $1/day and at most two model
calls/admission: the budget is tighter than the 100-global-calls/day setting, allowing at most ten
new admissions/day at those unchanged values. Owner limit is 20 calls/day. UTC day boundaries are
05:30 IST. These are application reservation allowances, not current model prices, a hard provider
billing guarantee or permission to run paid tests. Replacement-model pricing is still a live gate.

## Approval phases and verification

**A — Dormant provisioning, requested for review only.** Create only the named database with the
resource settings above, install the exact deny-client rules and owner/time index, and seed only the
disabled policy. No runtime IAM grant, service deployment/env change, paid inference, synthetic
financial action, public upload or public release. Preserve the API enabled. If creation requires
billing enablement, a new API or broader privileges, stop and present that new scope.

**B — IAM and isolated backend verification, separate approval.** Review the policy-write boundary,
apply only the custom-role/binding diff if accepted, and test SDK identity, named/other-database
isolation, direct-client denial, transaction contention, stale completion, missing policy, quota and
budget exhaustion, outage/deadline, owner isolation and immutable replay. No generation required to
verify reservation semantics. Test fixtures and their cleanup need their own bounded plan; do not
mutate existing project data. Emulator testing is pending because this workstation lacks a Java
runtime; current tests are offline doubles/SDK-port contracts, not emulator/live proof.

**C — Candidate runtime and model activation, separate approval.** Present exact image/commit,
revision/env/secret diff, price bound, model replacement, policy changes, rollback target and
sanitized test evidence. Default backend remains disabled; model mode remains deterministic-only.
Provisioned resources and source tests do not activate the feature or authorize production traffic.

## Rollback and failure containment

For dormant phase A, do not auto-delete or disable the API if a check fails. Leave the disabled
policy, deny-client rules and deletion protection in place, report the partial resource state and
request the exact cleanup action. Region/name conflicts require stopping, not overwriting.

For a later active phase, first disable admission through the approved operator policy, then
restore the previously approved deterministic-only revision/configuration and revoke only the new
conditional runtime binding under the rollback approval. Do not refund/delete reservations, reset
usage counters, delete the database, disable project APIs or modify SQL records. Existing in-flight
model requests may complete; a kill switch prevents new admissions rather than cancelling them.
Database deletion is destructive and requires separate explicit authorization, disabling deletion
protection deliberately and preserving required replay/evidence data first. No automatic rollback
is authorized by this document.

## Review and local verification

A separate read-only review found no blocking defect in dormant phase A, the scoped later IAM proposal or the captured cost arithmetic. The reviewed named-database/precondition source was `dac9815`; subsequent `0c189f2` additionally rejects cloud emulator routing. Focused model-controls/activity/runtime tests:105passed. Full backend results are recorded in [the test log](../submission/evidence/backend-tests.txt). These remain local SDK-port/double tests; no provisioning or live-model claim follows.
