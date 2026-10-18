# Independent focused implementation review

17 October 2026. Candidate source checkpoint: `fffd14c`. Scope: the new independent Reviewer and model-admission controls. This is source and offline regression evidence, not live Google Cloud validation or release authorization.

## Findings and closure

| Finding | Original consequence | Reviewed closure | Evidence |
| --- | --- | --- | --- |
| P1 synchronous reservation in async API | Firestore RPC could block unrelated requests before the model timeout applied | Handlers await async admission; AsyncClient reads carry explicit timeout/no retry; total admission deadline and two active slots include cancellation cleanup | `runtime/model_controls.py`, `reasoning.py`, `reviewer.py`; slow RPC/concurrent ticker/zero-provider regression |
| P1 constructor gap in first remediation | Synchronous ADC discovery could still block the event loop outside the deadline | One cached initializer per project/event loop runs via `asyncio.to_thread` inside the timed admission task; shielded cache avoids duplicate credential discovery; a timed-out request cannot continue to inference | `configured_controls` and `reserve_live`; slow-constructor regression verifies bounded response, ticker progress, single initialization and no late reservation |
| P2 lost Reviewer execution usage | Invalid review output or ADK schema failure discarded known call/tool usage | Validation fallback retains observed ProviderResult; ProviderFailure preserves sanitized counts/category; no raw provider text enters the saved finding | `agents/reviewer/agent.py`; invalid-output and ProviderFailure regression |
| Resource cleanup follow-through | Per-request client creation could accumulate transports | Reused transport closes through application shutdown lifecycle | `close_model_controls`, API lifespan |

The focused review found no remaining blocking defect in these specific implementation paths and no direct financial-write, cross-owner or billable-replay bypass. This conclusion does not extend to infrastructure that was not exercised.

## Independent check executed

From the combined candidate, using the existing Python environment and repository/API/tests on PYTHONPATH:

```sh
python -m pytest -q tests/test_model_controls.py tests/test_independent_review.py
```

Result: **36 passed in 1.49 seconds**. One existing Starlette testclient deprecation warning appeared. Providers and Firestore clients in this suite are offline doubles. No real model call, cloud policy mutation, provider write, deployment or IAM change occurred.

The integration owner separately reports the final combined local backend run: **559 passed, 58 skipped in 26.65 seconds**; frontend: **658 passed across 50 files**; lint, typecheck and production build passed. These are local implementation checks and are not production impact, model accuracy or cloud-activation evidence.

## Remaining release gates

Effective Vertex inference permissions and regional model access, actual Firestore transaction/concurrency/outage behavior, operational policy and kill-switch activation, budget-price assumptions and sanitized live execution evidence require verification before model activation. Hosted uploads retain their independent parser-isolation/malware/auth/tenant/retention/abuse/concurrency gate. Candidate deployment, the prescribed deck template, team details and the final authentic working-product video remain separate submission requirements. Public Beta reachability alone does not establish the deployed candidate version.
