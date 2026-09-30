# Identity cold-start profiling and low-risk optimization

Branch `perf/identity-cold-start` from `main` at `acd1f61072e1359269ce0f1c9213d563cd4061bb`.
Repository `movebooks-ai` (primary worktree). No deploy, push, merge, tag, IAM, SQL, scaling or
Cloud Run configuration change was made or is authorized by this document.

Verdict: **AMBER**. The application is not the cold-start bottleneck. Code-level changes
remove credential resolution and Cloud SQL connector construction from import, overlap the two
readiness dependencies, and pre-build the Firebase verifier before the first identity request.
They cannot reproduce or remove the observed ~21 s Cloud Run cold path, which is dominated by
dependency initialization inside the startup probe and by the probe cadence itself.

## Identity critical path (call graph)

```text
Google popup completes -> Firebase user (onIdTokenChanged) -> user.getIdToken()
  -> fetch /api/v1/identity (same-origin Hosting -> web, 65 s client deadline)
    -> web proxy: JWT signature/audience check (JWKS) -> workload ID token (metadata)
      -> https://<private api>/v1/identity (Cloud Run IAM, min 0)
        [cold only] container start -> python start.py -> import movebooks_api.main
          -> settings (pydantic) -> routers, domain, agents contracts
          -> discover_assess.service: session_repository(settings)      (SQL construction)
          -> uvicorn lifespan startup -> port bound
          -> Cloud Run startup probe GET /readyz (must pass before traffic)
               -> repository.ready(): ADC + RSA keys + connectSettings + ephemeral cert
                                       + TLS + IAM DB auth + SELECT ... LIMIT 1
               -> GoogleArtifacts.ready(): import storage + client (ADC) + bucket.reload
        -> require_principal -> firebase_identity(project) [first call: import + app]
          -> verify_id_token(check_revoked=True): Google certs fetch + get_user round trip
        -> JSONResponse {subject, email}, Cache-Control: no-store
    -> proxy copies JSON -> browser checks subject == firebase:<uid> -> email rendered
```

Everything above the identity handler must finish before the first `/v1/identity` responds on a
cold instance. `/v1/identity` itself performs no SQL or GCS work.

## Timing breakdown

MEASURED LOCALLY (Apple Silicon, Python 3.11, warm file cache, fresh interpreter, 3 runs each):

| Stage | Before | After |
| --- | ---: | ---: |
| `import movebooks_api.main`, local memory mode | 0.18-0.26 s | 0.18 s |
| `import movebooks_api.main`, cloud settings, ADC stubbed | 0.27-0.28 s | 0.17 s |
| Cloud SQL connector module import | 0.09-0.11 s | deferred to first DB use |
| `Connector()` construction (credential lookup stubbed) | <0.001 s | deferred |
| `firebase_admin.auth` import + `initialize_app` | 0.06 s | moved to startup thread |
| `google.cloud.storage` import | 0.02-0.07 s | overlapped with SQL check |
| Process start -> port bound (memory mode) | 0.21-0.31 s | unchanged (memory mode) |
| Process start -> first `/v1/identity` 200 (memory mode) | 0.23-0.33 s | unchanged (memory mode) |
| Warm `/v1/identity`, in-process, demo identity | 0.4-0.6 ms | 0.4-0.6 ms |

First-run imports with a cold OS file cache were 1.9 s (connector), 1.1 s (storage) and 0.2 s
(Firebase) locally. A fresh container also starts with cold caches, so these are the plausible
worst-case Python-side costs, still far below 21 s.

INFERRED FROM HISTORICAL CLOUD EVIDENCE (Cloud Logging, 2026-09-30, pre-change):

| Observation | Value |
| --- | ---: |
| Cold web identity request / nested API request | 21.857 s / 21.345 s |
| Instance start -> startup `/readyz` success, second attempt | 21.068 s |
| Warm web identity request / nested API request | 0.306-0.320 s / 0.258-0.260 s |

Not measurable locally and not measured: metadata-server credential latency, SQL Admin API
`connectSettings` and `generateEphemeralCert` calls, RSA key generation on a throttled vCPU,
Cloud SQL TLS + IAM authentication, bucket metadata reload, the startup-probe period/timeout
values, and Google certificate/`get_user` fetches on first verification. `gcloud` is not installed
on this machine, so the live probe configuration could not be read.

## Startup work classification

| Work | Class | Blocking identity today? |
| --- | --- | --- |
| Python start, FastAPI, pydantic, routers, domain/agents contracts | A | Yes, ~0.2 s locally |
| Settings validation | A | Yes, negligible |
| Firebase Admin import + app construction | A | Yes, in the first request (now pre-warmed) |
| Google certs + `get_user` revocation round trip | A | Yes, per request, required for security |
| Cloud SQL connector import + `google.auth.default()` at import | B | Was on the import path with no identity need (now deferred) |
| First SQL connection inside `/readyz` | B, but gates traffic | Yes, via startup probe |
| GCS client + bucket policy check inside `/readyz` | B/C, but gates traffic | Yes, via startup probe (now concurrent with SQL) |
| Migration/orchestrator services | C | Import only, ~0.06 s locally |
| Gemini/ADK | D | Not imported at startup; already lazy |
| Structured logging middleware | E | Negligible |
| Schema bootstrap | F | Operator-only script, never at runtime |

Unnecessarily blocking identity before this change: connector construction and credential
resolution during import, sequential rather than concurrent readiness dependencies, and the
Firebase Admin import inside the first request. Nothing else on the identity path is avoidable
without weakening readiness or verification.

## Optimizations implemented

1. **Lazy Cloud SQL construction** (`runtime/persistence.py`, `LazyCloudSessionRepository`).
   Safe: same `cloud_engine`, same pool and fail-closed errors; creation is lock-protected and
   happens once; `close()` disposes only what was built. Impact: connector import and credential
   lookup leave the import path (0.1 s locally plus one metadata call on Cloud Run). Security:
   none; the identity path never touched SQL. Regression risk: low; readiness and all session
   operations still build the same engine on first use.
2. **Concurrent readiness checks** (`main.py`, `readiness_checks` / `run_readiness`). Safe: both
   checks still run and any exception still yields 503 with no detail. Impact: cold `/readyz`
   saves the shorter of the SQL and bucket checks, inferred at roughly 1-3 s on Cloud Run.
   Security: unchanged contract; readiness was not weakened. Regression risk: low.
3. **Cloud-only warm-up thread** (`runtime/warmup.py`, called from lifespan). Builds the cached
   Firebase verifier and imports the storage client without verifying any token. Safe: daemon
   thread, failures ignored because the request path rebuilds and fails closed; never runs in
   local/test modes. Impact: first identity request no longer pays import + app construction.
   Regression risk: low.

Not implemented, documented only: removing SQL/GCS from `/readyz` (would weaken the readiness
contract), prefetching Google certificates (relies on SDK internals), dropping `check_revoked`
(security regression), and any Cloud Run setting change.

## Files changed

- `services/api/src/movebooks_api/main.py`
- `services/api/src/movebooks_api/runtime/persistence.py`
- `services/api/src/movebooks_api/runtime/warmup.py` (new)
- `tests/test_identity_cold_start.py` (new)
- `docs/reviews/identity-cold-start.md` (this document)

No frontend, infrastructure, dependency, IAM, SQL, scaling or release change.

## Authentication and security regression

`/v1/identity` still requires a Firebase-verified bearer token, derives subject and email server
side, rejects anonymous, demo, revoked, expired and wrong-audience tokens with 401 and no leaked
detail, rejects POST, ignores browser-provided owner/actor/email headers, and exposes no
credentials. Owner isolation tests are unchanged and pass. New tests prove a warm-up failure
cannot weaken verification and that local modes never start the warm-up.

## Tests

- Ruff check: pass. Ruff format: changed files formatted; 24 pre-existing unformatted files
  untouched.
- Focused identity/runtime/auth negative-path suites: 82 passed.
- Full backend suite: 342 passed, 22 PostgreSQL-only skips, inherited Starlette warning.
- Repository checks: 95 Markdown / 377 text files, 0 findings; `git diff --check` pass.
- Frontend tests not run: no frontend files changed.

## Expected cloud impact and remaining uncertainty

Expected: a small reduction in time to port bind and in cold `/readyz` duration, plus a shorter
first identity request after readiness. No cloud improvement is claimed from local measurements.
Real Cloud Run cold-start latency was not reproduced locally.

Uncertain: the startup probe's period and timeout, which quantize any readiness gain; the split
between SQL and GCS inside the 21 s; and whether the first probe attempt failed on connection
refused or on timeout. Reading the live service description would settle the first two.

## Cloud Run min instances = 1 (document only, not applied)

- Likely cold-start reduction: removes the container start, import and startup-probe interval
  for the single kept instance, so the first post-sign-in identity request should approach the
  warm ~0.3 s path. Scale-out beyond one instance would still cold start.
- Trade-off: one idle instance billed continuously; idle CPU is throttled under request-based
  billing, so idle cost is mostly memory plus the min-instance rate. Instance restarts and new
  revisions still cold start once.
- Monthly cost category: low tens of US dollars for one small instance in asia-southeast1 under
  request billing, exceeding the current US$25 soft Beta target on its own. Confirm against the
  live pricing calculator before approval; no exact figure is asserted here.
- Bounded public Beta: not justified by default; occasional 20 s first verification is tolerable
  with the current "Verifying your account..." state. Interview/demo: justified for the demo
  window if pre-warming by a request beforehand is unreliable; enable temporarily and revert.
  Future production: justified, possibly with startup CPU boost, once traffic is steady.
- Compared with code-level changes: code changes preserve min 0 and cost nothing but only trim
  the cold path; min instances = 1 is the only lever that removes it for the common case.

## Decision

Remaining cold-start problem: **D, mixed**, weighted toward **B** (dependency initialization
inside readiness) and **C** (platform startup and probe cadence). Application import is a
minor contributor by measurement.

P0: 0. P1: 0. P2: 1 (cold identity latency remains above the 5-8 s target). P3: 0.

Recommended next step: read the live API service description (probe period/timeout, CPU,
startup CPU boost) and, with approval, measure one cold start with per-check timing in `/readyz`
logs. Live Cloud Run validation of this branch is warranted before any claim of improvement,
but only after review, CI and an image build; it is not a prerequisite for merging the
fail-closed code changes.
