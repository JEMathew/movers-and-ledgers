# Bounded live Gemini run: Advisor and independent Reviewer (release 16e31e9)

**Date:** 18 Oct 2026 · **Model:** `gemini-3.5-flash-lite`, Vertex AI global endpoint · **Environment:** live test harness
(`scripts/live_advisor_reviewer_demo.py --live`) run in Cloud Shell with the owner's credentials · **Result:** PASS, 14/14 acceptance checks.

This is a test-harness result. The public Beta and the release candidate run deterministic agents only;
switching Gemini on in the product is a separate, gated decision.

## What ran
One synthetic case: account `1200 · Misc Clearing`. It fits the proposed type, but its business purpose is unknown.
- The **Advisor** received the mapping-stage evidence and returned structured advice.
- The **independent Reviewer** built its own context from the source evidence. It never saw the Advisor's output and could only challenge or ask for evidence.
- Both ran on an in-memory synthetic session. No API server, database, Firestore or business state was involved.

## Limits enforced by the code (fingerprint-checked before the run)
| Control | Where |
|---|---|
| One ADK run per agent, at most 2 model calls each (4 in total) | `RunConfig(max_llm_calls=2)` and a callback that refuses a third call (`agents/reasoning/adk.py`) |
| No transport retries | `HttpRetryOptions(attempts=1)` |
| Only tool: `read_evidence`, which returns the supplied synthetic context; no write tools | `agents/reasoning/adk.py` |
| Strict output schema; `human_approval_required: true`, `financial_authority: false`; no semantic retry; invalid answers become a labelled deterministic fallback | `agents/reasoning/provider.py`, `agents/reviewer/agent.py` |
| Explicit confirmation flag, pinned project, a single approved model and its location | `scripts/live_advisor_reviewer_demo.py` |

## Result (owner-reported from the Cloud Shell evidence)
| Item | Value |
|---|---|
| Acceptance checks | 14/14 PASS |
| Model calls | 4 (Advisor 2, Reviewer 2) |
| Read-only evidence-tool calls | 2 (one per agent) |
| Advisor | `next_action: ESCALATE`; human approval required; no financial authority |
| Reviewer | `CHALLENGED` |
| Deterministic mapping | `REVIEW_REQUIRED`, approval still required; unchanged |
| Estimated inference cost | USD 0.00341, from API-reported tokens at published list prices (an estimate, not a bill) |

The evidence is held privately by the owner and is not in this repository. It covers the result JSON, the acceptance JSON, a summary, UTC start and finish times, stdout and stderr, and SHA-256 checksums.

## What this does and does not show
- **Shows:** real Gemini inference through Google ADK on Vertex AI, staying within the coded call, tool and authority limits. Escalation to a person and an independent challenge happened as designed.
- **Does not show:** model accuracy across cases (one case only, not human-scored), production readiness, or Gemini in the deployed Beta.

## Reproduce
Follow `docs/release/LIVE-GEMINI-RUN.md`: a free read-only preflight, then one approved paid run. Each paid run needs fresh approval.
