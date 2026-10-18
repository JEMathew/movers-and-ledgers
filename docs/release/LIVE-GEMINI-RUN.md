# Bounded live Gemini run

**Status:** executed once on 18 Oct 2026, PASS 14/14 ([record](../reviews/live-gemini-l1-16e31e9.md)). Each further paid run needs fresh approval.

Approval needed: one explicit "yes" for exactly this run. Synthetic data only; no deployment, IAM, Firestore or database change.

## What it runs
`scripts/live_advisor_reviewer_demo.py --live` on the synthetic `1200 · Misc Clearing` mapping (in-memory repository; no Cloud SQL, no customer data): one Advisor call and one independent Reviewer call through Google ADK.

| Control | Value (code-enforced) |
|---|---|
| Project | `movebooks-ai` only (`parser.error` otherwise) |
| Model | exactly one ID for all five capabilities; `gemini-3.5-flash-lite` requires location `global`, any other model requires `asia-southeast1` |
| Mode | `MOVEBOOKS_MODEL_PROVIDER_MODE=gemini-adk`; refused when `MOVEBOOKS_ENV` is staging/production |
| Confirmation | `--confirm-usd1-synthetic-test` required |
| Calls | ≤ 4 model calls total (2 per agent run via `RunConfig(max_llm_calls=2)`), 2 evidence reads, 2,048 output tokens, 30 s timeout, no retries |
| Authority | only tool is read-only `read_evidence`; outputs schema-validated (`human_approval_required: true`, `financial_authority: false`, evidence must be supplied facts); anything else → recorded FALLBACK |
| Cost | 29 Sep run: ~USD 0.0009/call on 2.5 Flash; expected total well under USD 0.05 |

Offline evidence for the same boundaries: `scripts/offline_agent_eval.py` (23/23 scenarios: grounding, authority, injection, low confidence, provider failure, Reviewer independence, disagreement, forged clearance) and `evidence/agents/`.

## Model and location (checked 18 Oct 2026)
- `gemini-2.5-flash` (the only model with live evidence, 29 Sep) is being retired: the repo and third-party reports give **20 Oct 2026**; Google notices said "no earlier than 16 Oct". Do not use it for new evidence.
- `gemini-3.5-flash-lite` is listed on Google's Vertex AI locations page under the **global** endpoint; Singapore (`asia-southeast1`) availability was not confirmed. Global may process requests outside Singapore — say so wherever the result is shown.

## Steps (Cloud Shell, project movebooks-ai)
```bash
# 0. Read-only preflight: is the model published and reachable for this project? (no inference, no charge)
curl -s -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  "https://aiplatform.googleapis.com/v1/publishers/google/models/gemini-3.5-flash-lite" | head -20
gcloud services list --enabled --project movebooks-ai | grep aiplatform   # expect aiplatform.googleapis.com

# 1. ★ The run (after approval). Repo at the approved commit, Python env with '.[cloud,agents]'.
export MOVEBOOKS_ENV=local MOVEBOOKS_MODEL_PROVIDER_MODE=gemini-adk \
  MOVEBOOKS_REASONING_PROJECT=movebooks-ai MOVEBOOKS_REASONING_LOCATION=global \
  MOVEBOOKS_REASONING_MODELS='{"planning":"gemini-3.5-flash-lite","mapping":"gemini-3.5-flash-lite","resolution":"gemini-3.5-flash-lite","configuration":"gemini-3.5-flash-lite","onboarding":"gemini-3.5-flash-lite"}'
PYTHONPATH=.:services/api/src python scripts/live_advisor_reviewer_demo.py --live \
  --confirm-usd1-synthetic-test --out live-advisor-reviewer-$(date -u +%Y%m%dT%H%M%SZ).json
```
Caller needs `roles/aiplatform.user` on the project (Application Default Credentials); the 29 Sep run used the same path with no IAM change.

## Pass criteria
Advisor `used_fallback: false` and Reviewer `used_fallback: false`, model `gemini-3.5-flash-lite`, Reviewer outcome not `NO_CONTRADICTION_FOUND` for the clearing account, baseline state still `REVIEW_REQUIRED`, usage recorded. Any FALLBACK is recorded honestly as AMBER, not retried in a loop (at most one re-run, inside the same approval).

## What may then be claimed
"In a bounded synthetic test on <date>, Gemini 3.5 Flash-Lite (global endpoint) produced an Advisor explanation and an independent Reviewer challenge that passed schema and grounding validation; the deployed Beta remains deterministic-only." Nothing about the deployed product using Gemini.
