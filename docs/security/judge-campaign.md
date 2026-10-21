# Accepted synthetic judge campaign — implemented locally, inactive

Owner accepted USD5 aggregate planned inference allowance over one nonrenewing seven-day
window, five paired analyses/user/UTC day and ten/workspace/UTC day, restricted to explicitly
approved synthetic identities/workspaces. The hosted four-attempt validation grant remains
separate. The owner also confirmed that no approved A/B manifest exists yet.

Acceptance receipt SHA-256:
`8290099eb7ca67e0a48acf2e77b40f68165488cdf088ce219d1021f9ac95eb47`, retained at
`docs/integration/judge-policy-accepted/OWNER-ACCEPTANCE.json`. Acceptance is not activation.
No actual campaign, eligibility record, start/end date or validation grant was created.

## Admission and storage

`judge_campaign_enabled` defaults false. Existing single-use validation code remains unchanged
and is selected when the flag is false. When true, Settings require the existing synthetic
cloud-dev/Firebase/Firestore mode, approved project/global location, live provider and explicit
synthetic admission. Production/staging mode prohibitions remain; no mode relabeling bypass.
There is no client-controlled campaign ID or provider-authority selection.

The existing owner-checked paired mapping endpoint selects `JudgeAuthority`, binds the canonical
server-side evidence hash and supplies it to the unchanged counted transport. Standalone cloud
model routes still lack a paired authority and cannot use this budget. Cached pairs replay
without a new claim. A cached Advisor with missing Reviewer cannot buy a fresh Reviewer run.
Independent projection, human approval, response schemas and financial mutation rules remain.

Existing Firestore database: `movebooks-operations`, collection `movebooks_model_controls`.
Fixed campaign document: `judge-judge-mvp-20261021-v1`. The doubled prefix is intentional and
matches the implementation; do not substitute another name. Other documents share this prefix:

- `-eligible-<sha256(owner_hash:workspace_hash)>`: operator-verified subject/workspace binding,
  approved Harbor Light fixture hash and provenance receipt hash; no credentials or raw IDs.
- `-claim-<sha256(authenticated_owner:workspace_id:request_id)>`: source/mapping binding,
  random execution nonce, per-role/total attempts, in-flight marker and terminal status.
- `-owner-YYYY-MM-DD-<owner_hash>` and `-workspace-YYYY-MM-DD-<workspace_hash>`: daily analyses.
- `-attempt-<claim_hash>-N`: immutable sanitized response evidence.

The runtime **never creates the campaign or eligibility documents**. Missing or malformed
documents fail closed. After owner/account/native/disclosure gates pass, an operator must
create them once using create-only semantics. The inactive template cannot grant access.
Browser Firebase users must retain no direct database-writing capability; verify existing
rules/IAM rather than modifying them to make a test pass.

One serializable transaction checks policy kill switch, campaign, eligibility, request claim,
daily counters and shared slots before charging the full pair. It reserves USD0.08048 and one
analysis against both daily limits even when later execution fails. At most two pairs share
active slots. Missing daily documents can start at zero within that transaction; malformed
existing ones cannot. Exact source revision and approved proof hashes bind the campaign.

Start/end must be explicit UTC timestamps exactly seven days apart. Start is not inferred from
deployment, first request or restart. The campaign counter never resets on a UTC-day rollover.
USD5 admits at most 62 full reservations, totalling USD4.98976; the remainder cannot admit a
63rd. This is a conservative application allowance, not a cloud billing cap. Pricing, free
countTokens and all-billable-output bounds must be verified before proof flags become true.

Each generation reservation rereads eligibility, expiry and kill switch after token counting.
At most four attempts/pair, two/role, with Reviewer only after a completed Advisor. Attempts
are charged before dispatch. The unchanged transport enforces counted input50,000, output2,048,
LOW, one SDK attempt, endpoint/tool restrictions and sanitized usage/version/latency evidence.
Firestore transaction retries are not model retries. Missing thinking/billing remains unknown.

Terminal accounting is allowed after kill/expiry so received responses can be recorded and
proved terminal slots released. Spend/day counts are never refunded. Ambiguous in-flight
failures remain HALTED while holding their slot. Repeated cleanup is idempotent; a new process
nonce cannot resume a prior claim. There is no automatic lease expiry, repair or replenishment.
An operator may investigate terminal evidence but must never delete/reset a claim to retry.

## Exact additional configuration, after all gates pass

These are candidate configuration values, **not instructions to enable production now**:

```text
MOVEBOOKS_JUDGE_CAMPAIGN_ENABLED=true
MOVEBOOKS_REASONING_RESERVATION_MICROUSD=40240
MOVEBOOKS_REASONING_OWNER_DAILY_CALLS=20
MOVEBOOKS_REASONING_GLOBAL_DAILY_CALLS=100
MOVEBOOKS_REASONING_GLOBAL_DAILY_MICROUSD=1000000
```

Retain exact approved model routes/global/project, synthetic flags, Firebase, existing SQL/GCS,
timeouts, SDK pins and native-validated resource configuration. The legacy USD1/global UTC-day
ceiling remains stricter than the seven-day total: at most12 fully reserved pairs/day globally.
Existing per-session evidence/run limits also remain and may stop analysis before a daily cap.
The workspace quota does not authorize sharing or foreign access. Do not raise these limits
or bypass an exhausted grant to satisfy a judge request.

## Validation and remaining gates

New offline decisions and actual paired endpoint tests verify acceptance/provenance denial,
cost/day/window/slot limits, roles, replay, cached partial pairs, input rejection and unchanged
financial state. New anonymous loopback Firestore tests verify real SDK transactions, last-
budget contention, shared slots, restart denial, four attempts/evidence, kill/ambiguity,
foreign eligibility, corrupt counters and daily rollover/expiry. They do not certify cloud IAM,
authenticated hosted isolation, model pricing or actual inference. Contention may conservatively
deny both requests; the safety assertion is never two winners for the final allowance.

Before activation: approved A/B accounts and synthetic workspace provenance; native private
runtime/control/kill-switch and $107.25 FPU/isolation acceptance; one bounded genuine paired
proof using the separate validation grant; accepted Track A live disclosures; compatible native
fallback; fresh source/digest/security and serving-state checks. Native control tests must use
isolated test records and no generation, not initialize/reset the actual campaign for testing.

The existing immutable images predate this code. No image was regenerated in this change.
Build a new API from the finalized reviewed source only when native staging can proceed; build
the combined web only after Track A's accepted live-disclosure checkpoint is reconciled.

Recovery: disable the operational policy, stop promotion, retain the compatible API and all
claims/Reviewer records, restore only a compatible accepted web if required. Once paired records
exist, never restore the incompatible legacy API. No financial state or ledger reset is allowed.
