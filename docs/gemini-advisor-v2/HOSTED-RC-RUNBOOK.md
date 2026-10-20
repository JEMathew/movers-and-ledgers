# Hosted candidate runbook — deterministic only, NOT AUTHORIZED TO DEPLOY

This runbook prepares the existing architecture. It grants no publication, deployment, traffic, IAM, infrastructure, data or model authorization. Run the command generator locally now; the pending manifest must exit 2 and emit **no deployment commands**. Do not populate acceptance fields merely to make it pass.

```sh
cd /Users/jincenmathew/Downloads/Intuit/movebooks-gemini-advisor-v2
/Users/jincenmathew/Downloads/Intuit/movebooks-ai/.venv/bin/python \
  scripts/gemini_release_commands.py \
  docs/gemini-advisor-v2/release-manifest.pending.json
```

The generator is pure command rendering: no subprocess, credential access, network or cloud execution. Its accepted-fixture tests never deploy anything. A later approved, fully populated copy produces separate `preflight`, `deploy_no_traffic` and `rollback` command lists. Never pipe its output to a shell.

## Verified baseline, October 20 at 23:23–23:25 IST

Readbacks used the existing approved CLI account `jeasom@gmail.com`, explicit project `movebooks-ai`, region `asia-southeast1`. No login, ADC recovery or credential creation. Eight metadata reads plus direct workload-role and operational-policy reads succeeded.

| Resource | Observed state |
| --- | --- |
| `movebooks-beta-api` | Generation 48, 100% `movebooks-beta-api-r16e31e9-1041`, service identity `movebooks-beta-api@movebooks-ai.iam.gserviceaccount.com`, ingress `all` with IAM invocation restricted to the web service identity |
| `movebooks-beta-web` | Generation 60, 100% `movebooks-beta-web-r16e31e9-1041`, service identity `movebooks-beta-web@movebooks-ai.iam.gserviceaccount.com`, public invoker binding |
| API image | `asia-southeast1-docker.pkg.dev/movebooks-ai/movebooks-beta/api@sha256:27dbe8f17d8fb1e61f1e986cc397bf0a0bb8e37fc60f98b34e4f3176142246f6` |
| Web image | `asia-southeast1-docker.pkg.dev/movebooks-ai/movebooks-beta/web@sha256:2ef8acd0db5f35a09faf70a9edc7818d3d563251bcbe121c925ccca79ae46d64` |
| API configuration | `cloud-dev`, Firebase, Cloud SQL, GCS, `deterministic-only`; existing SQL database `movebooks`, bucket `movebooks-ai-beta-artifacts` |
| SQL | `movebooks-beta-pg`, POSTGRES_17, RUNNABLE, asia-southeast1 |
| Firestore | Existing `movebooks-operations`, FIRESTORE_NATIVE, deletion protection enabled |
| Operational policy | `enabled=false`, `synthetic_beta_authorized=false`; updated October 17. Policy was read, never changed |
| Workload roles | API direct bindings include Vertex user, conditional Cloud SQL roles and conditional datastore user; these are not a complete effective-permission test |
| Secrets | No secret-reference environment entries in the inspected containers; non-allowlisted values were not retained. This does not certify all secret handling in the project |

Current serving revisions are not the local candidate. No application endpoint, production accounting record or customer workspace was probed. Compare retained `cloud-readback.json` with the earlier receipt: service generations, serving revisions, IAM and deterministic mode are unchanged. Operation/collision status must be freshly checked immediately before a later authorized write.

## Inputs that must close before command generation

1. Track A/release owner explicitly accepts an immutable UX checkpoint and source/artifact reconciliation. Combine only approved commits in the separately authorized worktree. Preserve three unrelated Track A workflow/smoke changes outside it.
2. Security owner dispositions the High development advisory and remaining API base findings; validate exact final images, SBOMs, native memory/runtime behavior and provenance. Existing API smoke used a 768 MiB local limit; serving API is 512 MiB. Existing web smoke used 512 MiB; serving web is 256 MiB. Do not infer suitability or automatically increase resources.
3. Data/identity owner approves exact synthetic A/B accounts, isolated existing SQL/database and bucket boundaries, permitted reads/writes, retention and cleanup. Current `movebooks`/artifact-bucket attachment is **not** approved as a shortcut. If safe isolation requires new infrastructure or IAM, stop for a separately scoped decision.
4. Bind immutable combined source and **published registry digests**, exact configuration, fresh service generations, complete traffic/tag baselines and rollback revisions. Registry publication itself needs separate authorization. Local image IDs or archive hashes are not registry digests.
5. Approve the exact service/revision/tag exposure and one operator window. A web revision tag on the currently public service is publicly reachable even with `--no-traffic`. Authentication and synthetic-data checks are mandatory; no IAM change is included in this runbook.
6. Record the actual separate approval reference. Acceptance booleans in the JSON are evidence pointers, not authorization or an enforcement substitute.

For a reviewed source SHA, use tag `tb-<first-seven-sha>` and suffix `tb-<first-seven-sha>-<HHMM>`, verified unused in fresh service metadata. The pending manifest intentionally contains null source/digest/tag/approval fields. A fully executable deployment package cannot be truthfully completed while these inputs remain unavailable.

## Exact command shape, rendered only after acceptance

The generator emits these operations with validated concrete image digests, tags and revisions:

```sh
# Read-only compare-and-stop before writes (also manually compare IAM/traffic/config).
gcloud --project=movebooks-ai --account=jeasom@gmail.com --quiet run services describe movebooks-beta-api --region=asia-southeast1 '--format=value(metadata.generation)'
gcloud --project=movebooks-ai --account=jeasom@gmail.com --quiet run services describe movebooks-beta-web --region=asia-southeast1 '--format=value(metadata.generation)'
```

Candidate creation is `gcloud ... run deploy movebooks-beta-api` / `movebooks-beta-web`, with the reviewed `--image=...@sha256:...`, `--revision-suffix=...`, `--tag=...` and **`--no-traffic`**. API updates explicitly force:

```text
MOVEBOOKS_MODEL_PROVIDER_MODE=deterministic-only
MOVEBOOKS_SYNTHETIC_ANALYSIS_ENABLED=false
MOVEBOOKS_SYNTHETIC_BETA_AUTHORIZED=false
MOVEBOOKS_MODEL_CONTROLS_BACKEND=disabled
```

No permission, secret, database, CPU, memory, ingress or service-identity flags are generated. Existing values must match the approved isolated boundary; the generator does not repair them. A service-generation check is not an atomic deployment lock and does not protect IAM against a concurrent operator. Stop on any drift.

The unchanged existing web image has its synthetic-analysis build flag absent/off. Client-side `NEXT_PUBLIC_*` flags are compiled into Next.js; runtime environment changes cannot enable that UI. Thus this first hosted command set validates the disabled-mode public experience, **not a hosted paired-analysis demo**. An explicitly approved deterministic paired demo needs a combined web build exposing the opt-in flag, matching API synthetic flag, approved data boundary and additional hosted acceptance. No live activation is part of either mode.

## Smoke and negative acceptance after separate deployment approval

- Verify exact candidate revision image digests, workload identities, flags, limits, probes, zero main-traffic shift and unchanged pre-existing tags. Bind all results to candidate URLs, not the ordinary serving URL.
- Using approved human-authenticated profiles only: sign-in/out, refresh, own synthetic workspace, account switching and workspace/mapping changes. Never place credentials in scripts, URLs or logs.
- Missing identity must fail; foreign-owner synthetic sessions/mappings must return non-disclosing denial; forged actor/owner, malformed confirmation and stale contexts must fail before mutation.
- Disabled analysis must remain unavailable and make zero provider attempts. Existing deterministic rules and guidance remain usable. No request on page load; no claim of live Gemini generation.
- If a separately approved paired deterministic candidate is later tested: explicit selection/invocation only, separate role records, missing-purpose uncertainty, no state changes during analysis, exactly one audit event after the allowed human decision, duplicate decision rejected, no real financial execution.
- Observe latency/error and sanitized audit metadata; never publish raw source data or tokens. Confirm policy flags remain false. API/SQL/Firestore health and required runtime identity permissions need candidate-specific checks; direct project-role listings alone are insufficient.
- Capture native memory/startup behavior at approved limits, desktop/mobile/keyboard/accessibility and >65-minute identity refresh acceptance where required by the existing UX handoff. Existing local AMD64-emulation results cannot certify these.

## Rollback and preservation

Immediately before a write, retain serving revision/digest/configuration, **all** traffic/tag assignments, service generation and IAM etag. After a failed candidate, confirm operator ownership and absence of intervening Track A changes before any rollback. Never blindly replay historical commands.

The generator renders `gcloud ... run services update-traffic <service> --to-revisions=<verified-old-revision>=100 --remove-tags=<owned-track-b-tag>` for each service. This restores the observed single-revision baseline and removes only the owned candidate tag; it is not suitable if the fresh baseline has split traffic. Preserve other tags. No revision/data/ledger deletion is generated. If only a no-traffic candidate was created, removal of its owned tag is normally sufficient; any traffic operation still requires the approved rollback scope.

Keep both model policy flags false and preserve audit/reservation history. A rollback must never reset model counters, authorization ledgers or accounting state. Retain candidate evidence and diagnose failures before another attempt.

## Live-control implementation gate — separate from this runbook

Current controls: at most two provider turns and two evidence-tool reads per role, SDK generation retries disabled, bounded provider timeout, session CAS/idempotency, up to ten advice records and three review records per workspace, owner/global daily Firestore reservations and policy kill switch, and at most two in-process reservation tasks while cleanup completes. Corrupt persisted control documents now fail closed.

Limits: the 65,536-byte assembled-request cap is not a token counter. Application monetary reservations are operator-supplied; complete thinking usage is not guaranteed. There is no automatic distributed error-rate circuit breaker or independent per-minute workspace throttle. A process semaphore is not distributed throttling. The exhausted evaluation ledger is never an application control.

Before live synthetic activation, approve the input/output price and reservation policy, then implement counted assembled-request admission before **each** provider turn (including tool results), fail closed on count errors, retain output/thinking limits and reserve the worst-case request cost atomically. Extend the existing control transaction with a pseudonymous workspace/time-window counter only if that policy is approved. Test missing/corrupt counters, races, restart, timeout, price/config drift and kill-switch shutdown using mocks/emulators first. Verify current free countTokens availability and permissions at the separately authorized gate; make no model call now. A burst/circuit-breaker policy must specify failure window, reopen authority and non-refund behavior; do not silently invent thresholds or provision resources.
