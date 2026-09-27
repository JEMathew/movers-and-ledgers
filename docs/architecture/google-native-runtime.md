# Google-native runtime foundations

Scope: synthetic public-reference Beta runtime foundations, not production readiness.
No deployment, real accounting connector, live Gemini or managed ADK activation.
Rules verify. AI predicts. GenAI reasons. Agents orchestrate and act. Humans govern consequential decisions.

The [integrated journey](beta-v1-integration.md), [public surfaces](public-product-surfaces.md)
and [controlled intake](try-your-data.md) remain authoritative. This document supersedes their
process-local-only description **only for configured cloud synthetic sessions**.
See [deployment gates](../deployment/google-cloud.md) and [review evidence](../reviews/google-native-runtime.md).

## Architecture and maturity

| Component | Status | Boundary |
| --- | --- | --- |
| Next.js/TypeScript/Tailwind frontend, FastAPI API | IMPLEMENTED | Existing journey and shared design system; no alternative lifecycle. |
| Environment validation, demo identity, memory state | IMPLEMENTED | Credential-free local/test execution. |
| Firebase Authentication browser/ID-token verification | CLOUD-READY | SDK-backed adapters; no live identity project/account verified here. |
| Cloud SQL PostgreSQL application state | CLOUD-READY | SQLAlchemy snapshots verified against real PostgreSQL 17, including rollback, concurrent CAS and container restart; live Cloud SQL/IAM remains unverified. |
| Cloud Storage | INTERFACE-READY | Private bucket adapter and owner-authorized artifact service; no upload persistence endpoint activated. |
| Secret Manager | INTERFACE-READY | Allowlisted version-alias lookup, safe unavailable errors; no current runtime secret required. |
| Cloud Run images/health/shutdown | LOCAL RUNTIME VERIFIED | Production images built and exercised on Linux ARM64; supplied ports, probes, non-root/read-only execution and SIGTERM passed. Live Cloud Run is unverified. |
| Cloud Logging | IMPLEMENTED application boundary | Allowlisted JSON stdout; platform sink, retention and access policy not provisioned. |
| Cloud Monitoring / BigQuery | INTERFACE-READY | Contracts below; no dashboards, datasets, measured rates or active analytics emitter. |
| Artifact Registry / deploy pipeline | PLANNED | CI builds without cloud credentials; no push/deploy workflow or resources. |
| Live Gemini / managed ADK | PLANNED | Existing capability policies and offline-compatible agent contracts only. |

## Why one relational primary store

One owner-scoped session contains the ordered lifecycle, original assessment/plan/mappings,
approvals/decisions, synthetic target records, idempotency keys, checkpoints, validation/configuration,
onboarding/FPU, activity and event references. A single atomic snapshot update preserves these
relationships without a cross-document commit protocol. **Cloud SQL PostgreSQL is the only chosen
cloud transactional store.** Firestore and BigQuery are not parallel workflow stores. Firebase Admin's
transitive Firestore library is not used as an application database.

`runtime/persistence.py` implements the existing repository port. The `migration_sessions` table has
UUID primary key, owner, snapshot digest and versioned JSON text. Text intentionally uses the same
codec in PostgreSQL and offline tests. Decimal values remain exact JSON strings interpreted through
the domain schemas; UUID/enums/times recover through Pydantic. Private `owner_subject`, excluded from
API serialization, is explicitly retained in the storage envelope. Unknown schema/owner or digest
mismatch fails closed. Uploaded source is **rejected**, never accidentally lost or silently persisted.

Inserts cannot overwrite existing sessions. Mutations use one conditional SQL UPDATE against ID,
owner and prior snapshot digest; losing writers receive the existing conflict path. Session identity
cannot change. No read/modify/write outside a database transaction is used to implement CAS. Database
errors do not fall back to memory or claim success. Sixteen MiB bounds each snapshot; this is not a
scalable production event store. The full audit trace is retained atomically, but a privileged DB
administrator could still rewrite it: no immutable/WORM production-audit claim.

Schema bootstrap is an explicit operator command under a separate migration principal, never startup
DDL. Runtime gets SELECT/INSERT/UPDATE only. Cloud SQL Python connector uses attached ADC and IAM DB
authentication, bounded pooling and connection timeouts. Repository factories import Google SDKs only
in cloud mode. SQLite is a **test-only contract harness**, not a second configured application store.
Fourteen integrated golden journeys run with a fresh DB engine on every read, covering restart-style
reload, failure approval, checkpoint resume, duplicate actions, no-stage-bypass, exact reconciliation
and verified FPU. Real PostgreSQL parity and a four-container restart journey have now passed locally;
see the [runtime validation record](../reviews/runtime-validation-gates.md). CI repeats these gates;
neither direct PostgreSQL nor a test identity proves Cloud SQL IAM or Firebase integration.

## Environments, identity and UX

`Settings` supports local (default), development compatibility alias, test, cloud-dev, and future
staging/production. Local/test select memory + demo; cloud requires Cloud SQL + GCS + Firebase, explicit
HTTPS CORS origins, structured logs, all resource identifiers, and demo disabled. A Cloud Run `K_SERVICE`
environment rejects forgotten local defaults. Firebase emulator bypass is forbidden in cloud mode.
See the [variable matrix](../deployment/google-cloud.md#configuration).
Generic `DATABASE_URL` is deliberately unsupported and rejected without logging its value; the
production store uses explicit Cloud SQL/IAM settings. Only the isolated test harness accepts
`MOVEBOOKS_TEST_DATABASE_URL`; it is not a deployable application mode.

Firebase Authentication with its Google provider is the Beta identity choice. Browser SDK uses
session persistence; the API verifies ID tokens with signature/audience/issuer/time checks supplied
by the Admin SDK **and revocation checking**. It derives `firebase:<uid>`, never trusts owner/actor
fields in requests, and namespaces real identities away from `demo-user`. Session owner is the only
currently supported application role. Consequential audit roles become `WORKSPACE_OWNER`; local
demo decisions retain `DEMO_WORKSPACE_OWNER`. Delegation, organizations and support impersonation
are not implemented. Token/SDK errors are generic; no silent demo fallback.

Anonymous Landing, Learn, Play, basic Simulator and product introduction remain public. Cloud page
shells are public; **the API—not the middleware cookie—is the data authorization boundary**. Every
workflow, approval, report and contextual evidence request uses the shared token adapter. Production
builds reject demo headers and the demo-cookie endpoint. Missing Firebase config displays an accessible
error and does not fabricate sign-in. Cloud API configuration must be HTTPS before acquiring/sending
a token. Internal sign-in destinations reject network-path/backslash redirects. Sign-out clears only
app navigation pointers and Firebase session state. A cloud scope banner states synthetic/durable/local
upload boundaries. Existing dialogs, approval UX, themes and reduced-motion rules remain unchanged.

The legacy `/v1/workspaces` placeholder is local-only and returns 410 in cloud mode. Ordinary
`/v1/migration-sessions` creation is the persisted workspace unit; existing owner-scoped sessions,
activity and decisions are history. No new cross-session history UI is claimed.

## Controlled Try Your Data and storage

The [local intake contract](try-your-data.md) remains controlled, de-identified test exports, not
production customer data. Its current review checkbox does not grant cloud retention consent.

| Data | Local/test | Cloud foundation |
| --- | --- | --- |
| Raw package bytes | Bounded parsing memory; not written to disk | Intake returns unavailable before parsing; UI refuses to transmit files. |
| Normalized source and intake ticket/report | Owner-scoped process memory, tickets expire after 30 minutes; workspace lasts until process restart | Not automatically persisted; durable repository rejects uploaded sessions. |
| Synthetic sessions and decisions | Process memory | Cloud SQL versioned snapshot, includes audit/evidence/FPU; no model egress. |
| Safe report/summary artifacts | Explicit-consent memory adapter | Private GCS adapter callable by future reviewed export service; not automatically generated/uploaded. |
| Controlled package artifact | No new persistence | Object-kind seam exists but retention explicitly rejected until cloud intake privacy/consent/operating review. |

`ArtifactService` first checks the requesting owner against the session repository. Object keys use
hashed owner + workspace UUID + allowlisted kind + random artifact UUID, never filenames/emails.
Operations are bounded to 2 MiB and require explicit retention consent for a write. GCS requires
uniform bucket-level access and enforced public access prevention on each operation. Create uses
generation-match zero; deletion uses the observed generation, preventing accidental replacement
deletion. Access is service-mediated, not public URLs or shareable signed bearer URLs. Consumers
must pass authenticated principal values, not browser-asserted owners. No list/public/share API exists.

Deletion removes the specified artifact only; bucket soft-delete/versioning/backups may retain copies
under operator policy. No UI claims immediate permanent erasure. SQL/session retention and orphan
cleanup require the future operator runbook; automatic expiry, legal deletion and customer retention
guarantees are not implemented. No sensitive record, upload, token, hidden prompt or private reasoning
is sent to logs, Trust/Ops or models by these adapters. Existing minimized Trust projection remains.

## Requests, operations and async seam

The API image includes domain, agents, tools and synthetic fixtures, listens on `PORT`, uses a non-root
user and execs Uvicorn for SIGTERM handling (eight-second graceful window). Web uses standalone Next,
`PORT`, `HOSTNAME=0.0.0.0`, non-root execution and a public `/healthz`. API `/healthz` is process liveness;
`/readyz` checks actual DB-table access and private bucket policy in cloud mode. Readiness is not proof
of Firebase sign-in or model availability. No runtime filesystem data persistence.

ASGI middleware bounds even chunked bodies to 3 MiB and ten seconds before parsing. Existing parser
limits remain stricter. Blocking database work in discovery/migration route handlers runs in FastAPI's
sync worker pool rather than blocking the event loop; other stage handlers already use that pattern.
Pool size three, no overflow, ten-second checkout/connect timeouts. Configure Cloud Run concurrency
eight/request timeout sixty seconds for the initial synthetic evaluation, then load-test before exposure.

Current fixture-sized deterministic operations remain synchronous, with state committed atomically;
there is no live provider write or request-local background task. A cancelled response/uncertain DB
acknowledgment requires reload plus existing idempotency/approval checks, not blind execution replay.
No strict CPU deadline/cancellation guarantee or production throughput is claimed. `WorkCommand` /
`WorkDispatcher` describe a future async seam: session ID, expected hash, operation and idempotency key.
Future workers must reauthorize owner/evidence, recheck preconditions and CAS, and deduplicate deliveries.
Use Cloud Tasks for bounded commands, Pub/Sub for independent event consumers, or Cloud Run jobs for
larger batches only after live workload evidence; Workflows is not needed for today's modular monolith.

## Logging, monitoring, analytics and secrets

Application logs allow only validated UUID references, numeric status/latency and enumerated actions,
stages and error codes. No path/query/header/body/exception text is logged. Request IDs are server
generated. Uvicorn access logs are disabled in the image; unexpected adapter exceptions become generic
503s without serialized exception traces. Product audit remains in the transactional session, not logs.
Platform request-log policy is a separate operator responsibility: prohibit secrets in URLs and restrict
or exclude query-bearing request logs. This code does not configure Cloud Logging retention or sinks.

| Monitoring contract | Signal / owner / response |
| --- | --- |
| Request errors/latency | Status and latency distributions; operations triages sustained 5xx/readiness failures. |
| Auth failures | 401 rate; security distinguishes revoked/expired identity from verifier outage without tokens in logs. |
| Persistence failures | 503 and readiness; platform investigates DB connectivity/schema/pool; never switch to memory. |
| Storage failures | Safe unavailable signal/private-policy failure; platform stops artifact work. |
| Lifecycle failures | Existing server-authored failure events; migration owner reviews evidence, not model speculation. |
| Retry and idempotency conflicts | Checkpoints, conflict responses and events; engineering investigates duplicates/stale writers. |
| Validation failures | Deterministic report statuses; finance/migration owner stops false success. |
| Model-provider failure (future) | Capability + safe error category only; AI owner evaluates fallback, never relaxes checks. |

Only request/readiness logs are emitted by the new runtime today; the other signals are event/adapter
contracts awaiting collectors and alert wiring. Initial thresholds, SLOs, dashboards, escalation
ownership assignments and baselines must be measured/reviewed, not fabricated.

BigQuery is optional analytics only: `AnalyticsEvent` schema v1 permits event/session UUID, timestamp,
kind (lifecycle/evaluation/operations), stage and outcome; freeform extras are rejected. Future tables
`runtime_events_v1` and `evaluation_results_v1` must partition by occurrence date, deduplicate event ID,
apply reviewed retention and dataset-scoped permissions. Outcome rows must come from canonical server
verification, not browser clicks. Evaluation rows need an expanded reviewed schema before activation.
No dataset/table/exporter is provisioned. `DisabledAnalytics` emits nothing. North Star remains
**Percentage of eligible migration journeys reaching verified First Productive Use.** Assistance and
autonomy are diagnostics, not success conditions.

`SecretProvider` has unavailable local and Secret Manager implementations. Names are operator
allowlisted, path injection rejected, latest version fetched without an application cache, response
wrapped in redacted `SecretStr`. No raw exception/secret text is returned. No secret is fetched for
deterministic operation; Google workload access uses attached ADC, not service-account key files.

## Model/ADK system review

Modes are deterministic-only, fallback and Gemini-ready (configuration intent, not activation).
Model-assisted mode is deliberately rejected until the next reviewed slice. Existing capability-level
routes remain separate: financial reconciliation, execution, FPU and governance deterministic;
knowledge from versioned repository; optional resolution/guidance/explanation routes Gemini-ready.
All actual workflow behavior continues through deterministic fallback without model credentials.

| Contract | Verified interface / remaining runtime boundary |
| --- | --- |
| Agent/tool ownership | Existing registry, typed tools, parent orchestration; no cloud adapter owns policy or writes through a model. |
| Structured outputs | MigrationExplanation, ResolutionGuidance, ConfigurationExplanation, SetupGuidance; deterministic validation/FPU events. |
| Session IDs | Existing API UUID/owner repository; host must resolve authorized ADK session context before supplying evidence. No managed session bridge added. |
| Parent/sub-agent handoff | Existing orchestrators alone approve, persist and advance; advisory adapters have no write tools. |
| Callbacks/evals | Before/after callbacks on advisory agents; deterministic validation/activation eval hooks; offline SDK-double tests retained. |
| Failure/fallback | Fourteen durable golden journeys include model-unavailable completion and governed failure/recovery. |

This verifies existing compatible contracts, not managed ADK execution, live model quality, calibration,
streaming, cloud ADK session persistence or callback telemetry. Those remain the next activation review.

## Local/cloud parity and delivery

`make setup`, `make dev-api`, `make dev-web` remain credential-free. `.[cloud]` is optional for local
work but installed in the API image. Local samples and controlled exports retain original behavior.
CI checks Python/frontend suites, Ruff/lint/typecheck/build, configuration failure modes, Markdown
targets, bounded secret patterns, whitespace, PostgreSQL contracts and both Docker images/smokes.
No Google credentials, deploy permissions or model API calls are needed in PR CI.

Publication/deployment is human-owned. Current execution evidence and unresolved validation gates are
in the [foundation review](../reviews/google-native-runtime.md) and subsequent
[runtime validation review](../reviews/runtime-validation-gates.md); architecture intent is not a passed release gate.
