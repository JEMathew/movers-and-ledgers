# Bounded model controls — local implementation candidate

17 October 2026. Implementation owner: integration. **Dormant Phase A is provisioned and accepted; runtime IAM, deployment and model activation remain gated.** The API was auto-enabled during inspection and the owner subsequently directed it remain enabled; [drift record](../../infra/firestore/api-drift-record.json).

The existing five-context advisor remains synthetic-only and user-triggered. The separate account
Reviewer challenges a proposal without consuming the advisor's output. Neither has business-write
tools. Reviewer observations cannot enter a mapping decision, reconciliation or FPU calculation.

## Public inference gate

`runtime/model_controls.py` reserves capacity **before** every new cloud inference request. It
requires Firebase owner identity, explicit `synthetic_beta_authorized`, and the Firestore backend.
Missing configuration, SDK/access failure, malformed counters, missing policy, disabled switch,
quota exhaustion and budget exhaustion produce a visible deterministic fallback with zero calls.
Session CAS reservations also prevent a concurrent identical request from calling twice.

Native asynchronous Firestore RPCs have explicit read deadlines. Admission has a two-second total deadline and at most two active reservations per event loop, including slow cancellation cleanup. ADC initialization runs off the event loop and is cached once per project/database/loop; caller timeout cannot start duplicate credential discovery. A timeout returns fallback without inference; a late reservation is conservatively retained. Channels are reused and closed at application shutdown.

A Firestore transaction reads policy, owner/day usage, global/day usage and a unique reservation;
it atomically writes owner/global counters and a reservation. Two model calls and the full
operator-configured worst-case cost allowance are consumed even on failure. No automatic refund
or retry can double-spend a reservation. Owner and key identifiers are SHA-256 projections; raw
financial records, actor identifiers, prompts and model text do not enter Firestore.

Default settings: 20 owner calls/day, 100 global calls/day, 100,000 micro-USD reservation/request,
1,000,000 micro-USD/day limit. **These are proposed conservative allowances, not verified model
prices or measured spend.** The operator must establish a defensible worst-case price/token bound
for every selected model before activation. Model calls cap at two and output tokens at 2,048.
Input is an allowlisted bounded synthetic projection. Local/test invocations keep per-workspace
limits and do not imply public quota enforcement.

## Deployment prerequisites (all pending)

- Approve infrastructure and IAM changes explicitly; no setup script enables the service.
- Provision the intended Firestore database only under that approval; verify regional and
  retention requirements. Do not grant client SDK or public access to control documents.
- Grant the workload narrowly reviewed data access. Client Firestore rules must deny these
  collections; server Admin SDK IAM remains a separate authority.
- Seed `movebooks_model_controls/policy` out of band with `enabled: false` and
  `synthetic_beta_authorized: false`. Only the operational authority changes the switch.
- Verify transaction contention, exhausted quotas, existing reservations, outages and kill switch
  using the emulator and then authorized live synthetic negative tests. The current unit suite
  tests a pure transaction decision and serialized port double; **it is not live Firestore proof**.
- Prove effective Vertex inference permission and regional model access for the API workload.
- Review budget prices, alarms, pseudonymous-data retention/deletion and reservation TTL. Preserve
  reservations for the session replay window; unsafe early deletion would weaken replay defense.
- Validate the implemented sanitized operational readback against the real authorized backend,
  including owner isolation, index/rules/IAM and outage behavior, before claiming live Firestore
  activity. Existing SQL activity/audit remains independent.

## Evidence

`tests/test_model_controls.py` covers policy, identity, quotas, budget, corrupt counters, replay,
concurrency at the port boundary, outage sanitization and denial before provider invocation.
`tests/test_independent_review.py` covers independent evidence, forged references, approval/authority
spoofing, false clearance, stale results, owner isolation, pending replay, persistence compatibility
and the actual Google ADK runner with a scripted offline model. Model execution evidence from
these tests is **offline**; it is not a claim of a paid Gemini invocation.

Hosted uploads retain a separate release gate and never enter model context.

Source integration `1a24a2c` adds owner-filtered readback, explicit refresh in owner-keyed Trust
Evidence, controlled reservation/outcome states and a strict response projection. Source rules
deny all direct client reads/writes; the approved owner/time index is Ready in the dormant database. These are not financial
audit records, model-call proof or real-cloud acceptance. See [activity evidence](operational-activity-delivery.md).

`dac9815` explicitly selects `MOVEBOOKS_FIRESTORE_DATABASE` (proposed `movebooks-operations`) and caches clients by project/database. No database is created by the SDK initializer. Terminal updates carry the read snapshot update-time precondition; competing stale writes fail without refunds or financial effect. [Provisioning proposal](firestore-provisioning-proposal.md) separates dormant resources, IAM verification and runtime activation.

`0c189f2` also rejects Firestore emulator routing in cloud modes, matching the existing identity-emulator prohibition. Local emulator testing, when a Java runtime is available, must use an explicitly isolated test configuration; no cloud-mode bypass is introduced.

Dormant infrastructure status: [Phase A accepted and closed](../submission/firestore-phase-a-evidence.md), with both controls false and deletion protection enabled. Local Phase B integration is authorized; no live activity, workload IAM isolation or model-generation acceptance is implied.

Current follow-up `6575004`: [Dormant Phase A closed](../submission/firestore-phase-a-evidence.md); [local Phase B](../submission/firestore-phase-b-local.md) passes13real SDK/emulator cases,8client-denial checks and34offline phase-outbox cases. Full backend628passed/71skipped, with13emulator skips passed separately and58original optional gates still unverified. The phase mirror is a default-disabled local SQLite/emulator slice only; cloud/PostgreSQL/schema/new-index/API/UI/worker delivery and cloud IAM remain separate gaps. Earlier checkpoints above are historical, not current provisioning status.
