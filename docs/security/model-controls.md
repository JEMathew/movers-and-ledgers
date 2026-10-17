# Bounded model controls — local implementation candidate

17 October 2026. Implementation owner: integration. **No infrastructure or public activation has occurred.**

The existing five-context advisor remains synthetic-only and user-triggered. The separate account
Reviewer challenges a proposal without consuming the advisor's output. Neither has business-write
tools. Reviewer observations cannot enter a mapping decision, reconciliation or FPU calculation.

## Public inference gate

`runtime/model_controls.py` reserves capacity **before** every new cloud inference request. It
requires Firebase owner identity, explicit `synthetic_beta_authorized`, and the Firestore backend.
Missing configuration, SDK/access failure, malformed counters, missing policy, disabled switch,
quota exhaustion and budget exhaustion produce a visible deterministic fallback with zero calls.
Session CAS reservations also prevent a concurrent identical request from calling twice.

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
- Enable/provision the intended Firestore database only under that approval; verify regional and
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
- Complete sanitized operational activity readback and owner-isolation tests before claiming the
  requested Firestore activity stream is integrated. Existing SQL activity/audit is independent.

## Evidence

`tests/test_model_controls.py` covers policy, identity, quotas, budget, corrupt counters, replay,
concurrency at the port boundary, outage sanitization and denial before provider invocation.
`tests/test_independent_review.py` covers independent evidence, forged references, approval/authority
spoofing, false clearance, stale results, owner isolation, pending replay, persistence compatibility
and the actual Google ADK runner with a scripted offline model. Model execution evidence from
these tests is **offline**; it is not a claim of a paid Gemini invocation.

Hosted uploads retain a separate release gate and never enter model context.
