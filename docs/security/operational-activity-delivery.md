# Owner-scoped operational activity — source candidate

17 October 2026. Source-only capability behind the existing disabled operational-store gate.
No Firestore database, index, rules, IAM or deployed configuration was changed or verified live.

`GET /v1/operations/activity` is an authenticated read-only router. It returns DISABLED before
ADC/store access for local mode, disabled backend or missing synthetic-Beta authorization. It
returns UNAVAILABLE on initialization/query errors, deadline or exhausted read capacity; no SDK,
credential, request, prompt or owner text is returned. Integration now wires the router, authenticated GET proxy allowlist and the owner-keyed Trust
Evidence subtree. Reservation and completion instrumentation is connected; financial flows are unchanged.

Enabled reads reuse `await configured_controls(settings)` and its per-loop/project/database cached
AsyncClient, including cached off-loop ADC initialization. A maximum two-second total read deadline
covers initialization plus the query, and two shared read slots bound outstanding work including
SDK cancellation cleanup. Query: collection `movebooks_model_controls`, equality FieldFilter on
SHA-256 of the verified principal subject, created_at descending, limit 20; the bounded async stream
also counts at most 20 snapshots independently of SDK enforcement. Retries are disabled for reads.

Every document independently rechecks owner_hash and validates capability, controlled state,
aware created timestamp and bounded reservation scalars. Only these allowlisted fields leave the
runtime. Optional reported model/tool calls, input/output tokens, usage status and completion time
are bounded, enum/timestamp checked and nullable. Unknown usage is not invented as zero. Owner
hashes, document/request IDs, business/financial state, prompts and provider payloads are omitted.
Malformed/foreign documents are omitted; an empty available snapshot never proves no operations
occurred. Completion telemetry never authorizes accounting actions or establishes financial
correctness, actual billing, inference success or migration completion. Existing SQL lifecycle
activity remains independent.

`OperationalActivity.tsx` fetches only on an explicit refresh click, using existing authenticated
headers, an independent five-second client deadline and no-store semantics. It independently
re-projects the response, labels allowances as reserved capacity, shows unknown usage explicitly,
and distinguishes disabled/unavailable/empty snapshots. The integration owner must mount it in an
owner-keyed authenticated subtree so identity changes discard prior snapshot state. There are no
client POST/write paths or automatic/polling reads. Server response uses private, no-store caching.

`infra/firestore/firestore.indexes.json` is the source composite index for owner_hash ASC plus
created_at DESC. `firestore.rules` denies all direct client reads/writes, including authenticated
clients. Admin SDK accesses still require independently reviewed IAM; client rules do not constrain
server ADC. The source files contain no deployment commands and are not live infrastructure evidence.

Offline verification:

- 23 new Python tests: exact SDK query port, strict projection, forged owner/parameter isolation,
  malformed event omission, bounded counts, optional unknown usage, disabled no-ADC path,
  sanitized outage, cached off-loop ADC deadline, bounded cancellation cleanup, authentication,
  write-method denial and source index/rule contracts.
- 20 existing model-control tests also pass: combined **43 Python tests passed**.
- 15 new component tests: explicit GET only, no automatic read, disabled/outage/empty states,
  four controlled execution states, unknown usage, malformed/private-field protection,
  single pending read and explicit retry.
- Full frontend regression: **673 tests across 51 files passed**.
- TypeScript typecheck, frontend lint, scoped Ruff checks and git diff whitespace check passed.

These are fake SDK-port/offline contracts, not Firestore transaction, emulator, IAM, index,
public deployment, live Gemini usage or financial audit evidence. Full integrated/proxy tests and
release authorization remain with the integration owner.

Integration checkpoint `1a24a2c`: reservation records now include only a pseudonymous owner hash;
terminal advisory metadata is recorded after session CAS and does not refund or rewrite allowances.
Independent mapping-review operations use their own allowlisted capability. A proxy regression
verifies authenticated GET, no owner-header forwarding and denied POST. Live index/rule/IAM and
transaction/readback validation remain unperformed; all infrastructure stays disabled/unchanged.

Follow-up `0c189f2`: explicit named-database routing, database-specific client cache and update-time-conditional completion prevent default-database access and stale terminal overwrites. Cloud mode rejects Firestore emulator routing. Full backend594passed/58skipped; live/emulator verification remains pending. The API is retained enabled by owner direction, with dormant Phase A subsequently accepted and runtime activation still gated. See [proposal](firestore-provisioning-proposal.md).

Dormant infrastructure status: [Phase A accepted and closed](../submission/firestore-phase-a-evidence.md), with both controls false and deletion protection enabled. Local Phase B integration is authorized; no live activity, workload IAM isolation or model-generation acceptance is implied.

Current follow-up `6575004`: [Dormant Phase A closed](../submission/firestore-phase-a-evidence.md); [local Phase B](../submission/firestore-phase-b-local.md) passes13real SDK/emulator cases,8client-denial checks and34offline phase-outbox cases. Full backend628passed/71skipped, with13emulator skips passed separately and58original optional gates still unverified. The phase mirror is a default-disabled local SQLite/emulator slice only; cloud/PostgreSQL/schema/new-index/API/UI/worker delivery and cloud IAM remain separate gaps. Earlier checkpoints above are historical, not current provisioning status.
