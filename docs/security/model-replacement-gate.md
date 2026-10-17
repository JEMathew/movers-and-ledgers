# Model replacement before activation

17 October 2026. P0-1 local compatibility change, based on candidate `6e6625f` on
`delivery/submission-integration`. No runtime environment, deployment, IAM or paid inference change.

Google lists `gemini-2.5-flash` retirement on 20 October 2026 and includes
`gemini-3.5-flash-lite` as a replacement. [Official lifecycle table](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/model-versions).

## Verified replacement

| Item | Verified choice |
| --- | --- |
| Exact Vertex AI publisher model ID | `gemini-3.5-flash-lite` |
| Explicit location | `global` |
| Service endpoint | `https://aiplatform.googleapis.com` |
| Resource | `projects/PROJECT/locations/global/publishers/google/models/gemini-3.5-flash-lite` |
| Generation | `max_output_tokens=2048`; temperature/top-p/top-k omitted |
| Thinking | `thinking_level=LOW`, `include_thoughts=false`; `thinking_budget` omitted |

The [model page](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/gemini/3-5-flash-lite)
confirms the ID, global Standard PayGo, GenerateContent, function calling and structured output.
Custom sampling values are ignored by this model; frequency/presence penalties remain unset.
[Thinking documentation](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/thinking)
confirms LOW support and warns against sending a Gemini 3 token budget or combining budget and level.
LOW is a bounded application choice, not evidence of adequate model quality.

[Endpoint documentation](https://docs.cloud.google.com/gemini-enterprise-agent-platform/resources/locations)
requires the unprefixed global hostname. Its documented REST form is
`https://aiplatform.googleapis.com/v1/projects/PROJECT/locations/global/publishers/google/models/gemini-3.5-flash-lite:generateContent`.
The application retains its installed SDK's API-version selection; no API-version migration is included.

## Local implementation and explicit configuration

`Settings.reasoning_location` now accepts `global` as well as `asia-southeast1`; Singapore
remains the default. Selecting this exact replacement in live model routes requires explicit
global location, so a model-only substitution fails configuration validation. Other model
configurations retain their existing behavior; this change does not certify other Gemini 3 IDs.

The shared Advisor/Reviewer ADK runner selects the configuration above only for this exact
replacement. Legacy configuration retains temperature 0 and `thinking_budget=128`.
An operator would explicitly set `MOVEBOOKS_REASONING_LOCATION=global` and
`MOVEBOOKS_REASONING_MODELS` to:

```json
{"planning":"gemini-3.5-flash-lite","mapping":"gemini-3.5-flash-lite","resolution":"gemini-3.5-flash-lite","configuration":"gemini-3.5-flash-lite","onboarding":"gemini-3.5-flash-lite"}
```

This is configuration documentation, not activation instructions or an applied environment file.
Provider mode remains deterministic-only by default. Explicit project/five-route validation,
staging/production live-model rejection, synthetic projection/authorization, policy kill switch,
owner/global call and cost reservations, timeouts, two-call limit, read-only evidence tools,
independent Reviewer contract, fallback and financial authority boundaries remain unchanged.

## Processing location and approval boundary

Global requests may be processed outside Singapore; the processing region cannot be selected
or known per request. Do not represent global inference as Singapore-resident or suitable for
an in-region processing requirement. This opt-in changes reasoning request routing only;
it does not relocate SQL, Firestore or Cloud Run resources. No live request was made.

## Targeted offline verification

Installed dependencies: `google-adk==1.39.1`, `google-genai==2.28.0`.
Only `tests/test_reasoning_configuration.py`, `tests/test_live_reasoning.py` and
`tests/test_independent_review.py` were run: **67 passed, zero skipped, one existing
Starlette/httpx deprecation warning, 1.67 seconds**. Network connections and ADC discovery
were blocked in the test process. The entire test suite was not run.

Coverage includes both endpoint constructions, replacement configuration serialization without
legacy fields, explicit location/route rejection, preserved defaults, and actual offline ADK
Advisor/Reviewer runners with injected scripted models. Both two-call tool round-trips retain
a final user turn, satisfying the replacement's documented final-turn restriction. Existing
fallback, synthetic-input rejection, owner/budget/stale/replay and financial-state tests pass.
No real provider or cloud access is inferred from these results.

**P0-1 source/configuration compatibility resolved locally. Live activation remains blocked:**
effective workload access, explicit global processing approval for live use, model quality/latency,
prompt/tool token bounds and conservative two-call cost reservations still need review and a
separately approved bounded inference test. The existing $0.10 reservation is not proof of coverage.
No deployment, IAM mutation, public push or model activation is authorized by this document.
