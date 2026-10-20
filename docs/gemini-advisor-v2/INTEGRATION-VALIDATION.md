# Local integration handoff — 20 October 2026

**GO for creating a separate local integration worktree in a future authorized step, with deterministic providers and synthetic fixtures.** No integration worktree was created here. NO-GO for live activation, deployment or a working Request Source Evidence action. This commit does not authorize generation. The prior four attempts remain consumed.

## Exact commit files

| File | Purpose |
| --- | --- |
| `agents/reasoning/adk.py` | Treat missing thinking-token metadata as partial usage |
| `apps/web/components/plan-map-approve/analysis-contract.ts` | Shared consumed API type and fail-closed parser |
| `apps/web/components/plan-map-approve/AssistedAnalysis.tsx` | Validate paired response and isolate selection state |
| `apps/web/components/plan-map-approve/AssistedAnalysis.test.tsx` | Recorded/mocked UI and authority/isolation tests |
| `tests/test_post_inference_integration.py` | Recorded usage, schema equality, deterministic no-provider and safety tests |
| `tests/fixtures/gemini-recorded-pair.json` | Portable, derived synthetic response/usage fixture; no ledger or credentials |
| `scripts/gemini_analysis_eval.py` | Existing guarded evaluation harness, unchanged from approved execution |
| `scripts/gemini_eval_guard.py` | Existing counted-input, retry, persistent-claim and four-attempt guard |
| `scripts/gemini_cloud_shell_preflight.py` | Existing read-only dependency of the guard tests; historical pins unchanged |
| `tests/test_gemini_evaluation_guards.py` | Mock-only transport/ledger tests; historical gate uses isolated revision fixture |
| `docs/gemini-advisor-v2/analysis-api-schema.json` | Exact generated existing request/response schemas |
| `docs/gemini-advisor-v2/REQUEST-SOURCE-EVIDENCE-PROPOSAL.md` | Unapproved API, state, audit and acceptance-test proposal only |
| `docs/gemini-advisor-v2/HANDOFF.md` | API/UI behavior, evidence accounting and integration boundaries |
| `docs/gemini-advisor-v2/INTEGRATION-VALIDATION.md` | This scope, checks and acceptance record |

Baseline: `4b71b28c763a69ad50a433ef7962a6d5fff62e44`, branch `feature/gemini-advisor-v2`. Existing application API routes, model settings, owner checks and human decision endpoints are inherited from this baseline. No parallel UX files were inspected or changed.

Raw evaluation outputs, archives, ledgers and staging receipts are excluded. Historical local staging helpers and reports remain untracked. The fixture is an exact projection of the locally verified raw bundle, whose SHA-256 is `b87d0537e5b74203236b66b63379f263a062d4f756cc2b5b5679f69363f313f7`. Fixture SHA-256: `6f01c83a9085358ecfe29a1bc34156b59291d8a21e9bab9628356dc7cec75b33`. Its historical completeness claim is intentionally retained, not corrected retroactively.

## Integration configuration and mock contract

For an explicitly enabled **local deterministic preview**:

```dotenv
MOVEBOOKS_ENV=local
MOVEBOOKS_MODEL_PROVIDER_MODE=deterministic-only
MOVEBOOKS_SYNTHETIC_ANALYSIS_ENABLED=true
MOVEBOOKS_SYNTHETIC_BETA_AUTHORIZED=false
NEXT_PUBLIC_SYNTHETIC_ANALYSIS_ENABLED=true
```

Keep both synthetic-analysis enable flags false in an ordinary release. The preview configuration must resolve to these backend values at startup; tests construct `Settings(_env_file=None, ...)` explicitly. Never change the provider mode to `gemini-adk` for this integration. No ADC, credentials, Cloud Shell runtime, cloud endpoint or evaluation ledger is needed. A mocked response with historical `provider: gemini-adk` is a fixture, not a live invocation.

The sole analysis action is an explicit confirmed POST to `/v1/migration-sessions/{session_id}/analysis/mapping/{mapping_id}` with `{"request_id":"<UUID>","confirmed":true}`. The browser forwards through the existing authenticated `/api` proxy. Backend ownership is authoritative. Use the [generated schemas](analysis-api-schema.json) and [handoff](HANDOFF.md) for fields, error codes, caching and states.

Frontend mocks replace fetch with `fixture.evaluation.evidence_and_results`; use the fixture Reviewer's `mapping_id` when rendering. Dynamically generated test mappings must rebind role evidence references in memory, never change the saved fixture. Reviewer `advisor_request_id` must link the returned Advisor, and Reviewer `mapping_id` must match the selection. `ACCEPT` evaluates the recommendation; `CHALLENGED` evaluates mapping evidence. Neither approves a target.

Request Source Evidence is [proposal only](REQUEST-SOURCE-EVIDENCE-PROPOSAL.md): OPEN → SUBMITTED → SATISFIED, or SUBMITTED → OPEN for more evidence. Outstanding requests would hold the mapping unresolved. Satisfaction would still require a separate human mapping decision. These states and holds are not implemented in the current API.

## Focused validation

| Check | Result |
| --- | --- |
| Backend: recorded integration, assisted analysis, live-reasoning module with doubles, guard tests | 107 passed |
| Frontend: AssistedAnalysis and private API proxy | 60 passed |
| API schema snapshot equals current Pydantic models | PASS, included in backend count |
| Deterministic mode never enters either provider or Gemini adapter | PASS, included in backend count |
| TypeScript, affected ESLint, affected Ruff, diff whitespace | PASS |
| Original raw evidence / preserved guard and harness SHA-256 | PASS |
| Actual Gemini generation during this validation | Zero |
| Existing real authorization ledger operations | None |

Python 3.11.15 and existing installed dependencies were reused, including Google ADK 1.39.1 and GenAI 2.28.0. No dependency or Cloud Shell installation occurred. The earlier Cloud Shell Python 3.12 staging validation remains historical evidence; it was not rerun. One existing Starlette/httpx deprecation warning is unrelated to these changes.

Backend reproduction from the repository root, using the existing development environment (no cloud configuration):

```sh
python -B - <<'PY'
import sys
import pytest

def deny_network(event, args):
    if event in {"socket.connect", "socket.connect_ex", "socket.getaddrinfo"}:
        raise RuntimeError("Network forbidden in offline integration validation")

sys.addaudithook(deny_network)
raise SystemExit(pytest.main([
    "-q", "-p", "no:cacheprovider",
    "tests/test_post_inference_integration.py",
    "tests/test_assisted_analysis.py",
    "tests/test_live_reasoning.py",
    "tests/test_gemini_evaluation_guards.py",
]))
PY
ruff check agents/reasoning/adk.py scripts/gemini_analysis_eval.py \
  scripts/gemini_eval_guard.py scripts/gemini_cloud_shell_preflight.py \
  tests/test_post_inference_integration.py tests/test_gemini_evaluation_guards.py
git diff --check
```

Frontend reproduction from `apps/web`, using existing installed dependencies:

```sh
./node_modules/.bin/vitest run \
  components/plan-map-approve/AssistedAnalysis.test.tsx \
  lib/server/private-api-proxy.test.ts
./node_modules/.bin/tsc --noEmit --incremental false -p tsconfig.json
./node_modules/.bin/eslint \
  components/plan-map-approve/AssistedAnalysis.tsx \
  components/plan-map-approve/analysis-contract.ts \
  components/plan-map-approve/AssistedAnalysis.test.tsx
```

The socket audit applies to the parent Python process. Existing subprocess tests run only deterministic harness mode, reject missing live approval before execution, or race isolated mock ledger claims under a temporary HOME. The serialization test invokes SDK methods against a replaced in-memory transport with anonymous credentials. No actual Google request is dispatched. Temporary test ledgers do not reset or extend the consumed authorization.

## UX prerequisites and integration acceptance

Before a merge decision, test these against the combined local tree:

1. Review conflicts against the exact commit list, especially `AssistedAnalysis`; preserve the parser and mapping/workspace state reset while applying the separate approved design.
2. Keep explicit invocation, no page-load request, bounded loading/error/unavailable behavior and no automatic retries. Respect default-off flags.
3. Render separate role findings, grounded evidence, uncertainty and recommendation disagreement. Do not show fabricated confidence percentages, applied changes or approval from a model result.
4. Clear/remount private state on workspace navigation and identity change. Preserve backend ownership, proxy origin/authentication checks and mapping/Advisor linkage.
5. Approve/reject remain separate human actions. Analysis never calls financial mutations; do not introduce a working Request Source Evidence control until its proposal is approved, implemented and tested.
6. Run the focused suites, schema equality, type/lint checks and refreshed-shell interaction tests on the combined tree. Cross-branch UI compatibility is a prerequisite, not a claim already established here.
7. Preserve nullable/partial usage and the raw evidence. A future live gate needs fresh authorization and operational call/cost controls reviewed for the application endpoint; the harness ledger is consumed and is not a UI authorization mechanism.

Known reported usage is 5,207 input and 557 candidate-output tokens; the historical rate estimate for those components is $0.0029546. Thinking counts are missing, the 825-input-token countTokens difference is unexplained, and complete billable usage/cost remains UNVERIFIED. One ambiguous synthetic case establishes neither broad financial accuracy nor production readiness.
