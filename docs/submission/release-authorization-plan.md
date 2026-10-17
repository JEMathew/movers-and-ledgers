# Scoped cloud validation and release authorization plan

Prepared against local integration code `0c189f2`. **Dormant Firestore Phase A is accepted and closed; local Phase B testing is authorized. Runtime IAM, model activation, cloud app/config deployment and public release remain unapproved.**
Existing public Beta and its traffic remain untouched. Read-only reachability checks returned
HTTP 200 for the Beta and public repository; they do not identify the deployed source or prove
signed-in execution. Current environment has no usable ADC credentials or gcloud executable.

## Requested verification: current read-only inventory, then isolated validation

Scope the work to project `movebooks-ai` and workload
`movebooks-beta-api@movebooks-ai.iam.gserviceaccount.com`. The user directly authorized read-only console inspection on 17 October 2026. The earlier automatic browser approval block is resolved. [Current inspection and its limits](cloud-inspection-2026-10-17.md) record serving revisions, deterministic-only configuration, project Allow-role labels, API state, historical logs and Cloud SQL health. Local CLI/ADC remains unavailable. No fresh workload inference or financial journey was performed.

**Incident:** opening the Firestore database inventory automatically enabled `firestore.googleapis.com` despite no Enable action. This exceeded read-only scope; it was disclosed immediately. The owner explicitly elected to retain it enabled and forbade disabling it. The [drift record](../../infra/firestore/api-drift-record.json) records that disposition. No database, IAM or deployment change was made. Avoid any product page that can auto-enable disabled services.

[Firestore provisioning proposal](../security/firestore-provisioning-proposal.md) now supplies exact dormant resource/rule/index/policy, later conditional IAM, costs and rollback for review. Dormant provisioning was explicitly approved and accepted; [execution evidence](firestore-phase-a-evidence.md) records the exact named resource, resolved initial deletion-protection deviation and active rules/Ready index/false controls. Local Phase B integration is authorized; IAM grants and live application activation are not.

**Model gate:** Google's documentation lists `gemini-2.5-flash` retirement on 20 October2026. Evaluate a supported regional replacement with the existing safety/structured-output contract and current price bounds before proposing live configuration. The API remains deterministic-only. [Model replacement gate](../security/model-replacement-gate.md) records current candidates, prices and the unresolved Singapore-versus-global endpoint decision; no replacement has been applied.

The following mutations require a **separate explicit approval after that inventory**, not a
blanket grant from this document:

- Any Firestore resource/rule/index/policy change beyond accepted dormant Phase A, plus narrowly scoped workload access. No broad project Owner/Editor or public grants.
- Vertex inference permissions or selected regional model changes; verify access using the
  attached workload, not a developer identity. API enablement alone is insufficient.
- Synthetic authorization flag, Firestore policy document, owner/global quotas and conservative
  model-price reservation. Begin with operational kill switch disabled. Never infer model cost
  from a missing usage field or unverified price.
- Candidate Cloud Run revision / preview URL and any configuration or secret changes. Preserve
  existing public service revisions/traffic; no public upload capability.

Only approved isolated resources should receive negative tests: unauthenticated/other-owner
requests, forged actor/evidence, exhausted owner/global quotas, replay/concurrency, control outage,
missing policy, disabled kill switch, malformed output and deadline/ADC failure. Use a bounded
synthetic model-call allowance and capture sanitized provider/model/call/token/failure evidence.
No uploaded context, raw financial payload or credentials may enter model traces or Firestore.

Required proof before any live-model release: current workload/region access; Firestore transaction
atomicity and authenticated event/readback isolation; budget/kill-switch behavior; safe fallback;
SQL/persistence compatibility; current image/dependency security; and full signed-in browser path.
The source candidate now implements operational reservation/outcome readback and owner checks.
Its fake-SDK tests do not establish live Firestore behavior; validate the provisioned backend,
index, direct-client rules, IAM and owner/outage boundaries before claiming it as active.

## Proposed second authorization: bounded public candidate release

Only after the required tests and mandatory deck/video/links are complete, present exact image
hashes, source commit, immutable revision IDs, environment diff, resource/permission diff, spend
limits, rollback command/traffic target and negative-test evidence for human approval. The current
local commit is not such a cloud release authorization.

Publish the accepted source branch/PR and candidate assets only when public publication is
explicitly approved. Attach any resulting PR to this chat. Update Firebase/Cloud Run public traffic
only under the specific release approval. Verify public URLs, sign-in and owner isolation after
release; roll traffic back on any critical security, financial or truthfulness defect. Do not alter
preserved migration approvals or financial records to make a demonstration succeed.

## Independent hosted-upload gate

Public upload remains disabled throughout the verification and release steps above. It requires its own release
approval plus parser isolation, malware protection, authentication/tenant isolation,
retention/deletion, abuse prevention, bounded concurrency and negative security tests. The
browser-local fallback remains available while that capability is unfinished.

## Current local test boundary

Local Phase B uses a disposable loopback Firestore emulator, demo project IDs and explicit anonymous server credentials. Direct-client denial is tested separately with the Firebase web SDK. These tests do not validate cloud IAM, deployed client-rule enforcement, production index execution, model access or public activation. No operator credentials or live project data may be used by the local runner.
