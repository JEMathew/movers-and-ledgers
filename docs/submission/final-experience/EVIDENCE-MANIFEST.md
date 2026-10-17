# Evidence manifest — AI Builder Cup 2026 (as of 18 Oct 2026)

Evidence type: **Local** (run here, real code) · **Mocked** (API responses stubbed) · **Deployed** (observed on the cloud candidate) · **Not verified**.
Nothing below is a deployed or live-Gemini result unless it says so.

## Verified capability counts (code inspection)
| Item | Count |
|---|---|
| Registered agent roles (`agents/registry.py`, responsibility text) | 13 |
| ADK agent definitions (orchestrator + 6 stage builders), none invoked by the API | 7 |
| Model-capable pathways invoked by the API (Advisor, Reviewer), both gated off in the deployed candidate | 2 |
| Autonomous goal-driven agents verified operating | **0** |

Say: *"Deterministic agents run the workflow; an optional Gemini Advisor and an independent Reviewer give advice that a person approves."*
Do not say: "13 autonomous agents", "AI migrates your books", or any present-tense live-Gemini claim until a captured non-fallback record exists.

## Rubric evidence
| Criterion (weight) | Claim | Evidence | Type | Gap |
|---|---|---|---|---|
| Technical merit & GenAI (40) | Deterministic 26-state workflow, exact reconciliation, human approval, checkpointed recovery | Real-backend journey to verified first synthetic invoice, 17/17 checks (17 Oct); backend suite 620 pass, 26 env-only failures identical to baseline; web 686 tests, lint, typecheck and production build pass at the integration candidate | Local | Not re-run on the deployed candidate |
| | Bounded Advisor + independent Reviewer (ADK, read-only evidence tool, 2 calls max, structured validation, fallback) | Code + tests; offline demo script `scripts/live_advisor_reviewer_demo.py`; historical live run 29 Sep: `gemini-2.5-flash`, 4 of 6 cases accepted (AMBER), ~USD 0.0009 per call | Local; historical live (retired model, not the deployed candidate) | No live run on `gemini-3.5-flash-lite`; Reviewer never live-run |
| | Owner-scoped persistence | Isolation and restart tests on SQLite | Local | Cloud SQL durability not verified |
| | Cross-device resume | `GET /v1/migration-sessions` (SQL-ordered newest-first, bounded, owner-bound cursors, incomplete-history signal; tested on SQLite and PostgreSQL 16, including >200 sessions) + picker (branch `feat/migration-listing`) | Local | Not deployed; real two-account check pending |
| Problem alignment (25) | Desktop-to-cloud migration friction; accountant-first journey | Synthetic Harbor Light journey; plain-language screens | Local | No customer feedback exists; do not imply any |
| Innovation (25) | Trust model: AI explains, rules verify, people approve; Reviewer challenge on `1200 · Misc Clearing` | Offline Reviewer finding (CHALLENGED) reproducible; live pending | Local | Judge/evaluator agent not built |
| UX (10) | Visual-first workspace, picker, blocked/completed states, 200% zoom, keyboard | Screenshots in `evidence/premium/`; Approval, Assess, Move, Verify, Start: 15/15 width checks no overflow; dialog actions on screen at 195/390/1280 px | Local; blocked/completed shots Mocked | Real Google sign-in, real device, screen reader not verified; MP4 not verified in a real browser |

## Remaining artifacts
| Artifact | State | Action |
|---|---|---|
| Final functional demo video (3–4 min) | Not produced | Record on the deployed candidate; state exactly what is live |
| PDF deck, 16 slides, < 5 MB | Draft exists (16 pages, 2.3 MB) | Update claims to the wording above; re-export |
| Description ≤ 1,024 chars | Reworded to state Gemini is gated and the public candidate is deterministic-only (922 chars) | Recount if edited; keep wording unless live Gemini is later captured |
| Public deployed URL | Candidate exists | Redeploy with final commit after approval; re-verify |
| Public GitHub repo | Not pushed | Push after approval |
| Portal submission receipt | None | Submit, then record the receipt |

## Prepared, not executed (each needs your approval)
Web image build and scan (script pinned to `ae1124d`, update to final commit/tree) · push of image · no-traffic deploy · traffic promotion · API rebuild for the listing endpoint · live Gemini run · Git push.

## Model retirement
`gemini-2.5-flash` retires **20 Oct 2026**. The validated replacement `gemini-3.5-flash-lite` requires `reasoning_location=global`, so requests may be processed outside Singapore. State that if live inference is shown.
