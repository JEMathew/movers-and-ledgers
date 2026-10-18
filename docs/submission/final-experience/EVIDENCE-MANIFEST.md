# Evidence manifest — AI Builder Cup 2026 (as of 18 Oct 2026)

Environment labels: **Local** (sandbox; real code, real local API, demo identity) · **Live harness** (real Gemini on Vertex AI from a bounded test script, not the deployed product) · **Historical live** (dated live run, not the current candidate) · **Candidate** (deployed with no traffic) · **Deployed** (observed on the public URL) · **Not verified**.
Nothing below is a deployed-product Gemini result. Release candidate `16e31e9` on branch `feat/migration-listing`; not yet pushed; candidates deployed with no traffic.

## Verified capability counts (code inspection)
| Item | Count |
|---|---|
| Registered agent roles (`agents/registry.py`) | 13 |
| ADK agent definitions (orchestrator + 6 stage builders), none invoked by the API | 7 |
| Model-capable pathways invoked by the API (Advisor, Reviewer), both gated off in the deployed Beta | 2 |
| Autonomous goal-driven agents verified operating | **0** |

Say: *"Deterministic agents run the workflow; an optional Gemini Advisor and an independent Reviewer give advice that a person approves."*
Do not say: "13 autonomous agents", "AI migrates your books", or that the public Beta uses Gemini.

## Artifacts → commit → environment
| Artifact | Path | Commit | Environment | Result |
|---|---|---|---|---|
| Demo video (3:43.7, H.264 1440×1000, captions) | `docs/submission/assets/movebooks-demo.mp4` (+ `.srt`); SHA-256 in `evidence/journey-fa13e9e/recording/video-manifest.json` | product `fa13e9e`, file `a40f8ad` | Local | Recorded run PASSED 21/21; full decode clean; frames inspected |
| End-to-end journey, Discover → Verified First Productive Use, exception + recovery, My Migration, picker, switching, reload, fresh browser | `evidence/journey-fa13e9e/` (script `browser-journey/final-journey.cjs`) | `fa13e9e` | Local | 21/21 checks; invoice USD 100.00 + 7.25 = 107.25 |
| Deck, 16 slides, official template | `docs/submission/assets/movebooks-final-deck.pdf` (1.2 MB) / `.pptx` | `e26b2b3` | — | OOXML validation passed; rendered and inspected |
| User / agent / system swimlane | `docs/submission/assets/movebooks-swimlane.png` (source `.html`); deck slide 6 | `e26b2b3` | — | — |
| Offline Advisor + Reviewer evaluation | `evidence/agents/offline-agent-eval.json`; `scripts/offline_agent_eval.py` | `09a8d01` | Local, no network | 23/23; negative control fails as expected |
| Offline Advisor + Reviewer demo | `evidence/agents/offline-advisor-reviewer-demo.json` | `09a8d01` | Local, no model | Reviewer CHALLENGED; baseline REVIEW_REQUIRED |
| Backend tests | `tests/` | `09a8d01` | Local (venv with `.[cloud,agents]`) | 663 passed, 0 failed, 86 skipped. Without the optional Google libraries: 26 import failures only |
| Listing tests incl. PostgreSQL 16 | `tests/test_migration_listing.py` | `35183a2` | Local | 33 passed (SQLite + Postgres) |
| Web tests, lint, typecheck, build | `apps/web` | final HEAD | Local | 697/697 (52 files); lint, `tsc`, production build pass |
| Proxy fix for the migration list in Firebase mode | `apps/web/lib/server/*` | `5b5d736` | Local production build | Smoke 7/7 after; 6/7 before (`404`) — `docs/release/evidence/smoke-*.txt` |
| Dependency audits | `docs/release/evidence/` | `fa13e9e` | Local | npm prod 0 vulnerabilities (145 pkgs); pip-audit 0 known (141 pkgs) |
| Release scripts | `scripts/release/`, `docs/release/RELEASE-RUNBOOK.md` | `fa13e9e` | Local (source checks only) | Integrity checks refuse wrong commit / tampered tree / tampered archive |
| Live Gemini, Advisor + independent Reviewer | `docs/reviews/live-gemini-l1-16e31e9.md`; raw evidence and checksums held privately by the owner | `16e31e9` | Live harness, 18 Oct, `gemini-3.5-flash-lite`, global endpoint | **14/14 acceptance checks**; 4 model calls, 2 read-only evidence reads; Advisor ESCALATE, Reviewer CHALLENGED, mapping stays REVIEW_REQUIRED; estimated USD 0.00341 |
| Live Gemini, Advisor (earlier model) | `docs/reviews/live-gemini-adk*.md` | historical | Historical live, 29 Sep, `gemini-2.5-flash`, `asia-southeast1` | First ledger AMBER; after targeted prompt fixes all five capabilities accepted (GREEN for the exercised synthetic gate) |
| Container images | Release evidence folder (Cloud Shell) | `16e31e9` | Cloud Shell build | Built and scanned before publication |
| No-traffic candidates | Release evidence folder (Cloud Shell) | `16e31e9` | Candidate | 13/13 live smoke checks; production traffic unchanged |

## Rubric map
| Criterion (weight) | Strongest evidence | Gap |
|---|---|---|
| Technical merit & GenAI (40) | 26-state deterministic workflow with exact reconciliation, checkpointed recovery and human approval (journey 21/21); bounded ADK Advisor + independent Reviewer with schema, grounding and authority validation (offline 23/23; historical live GREEN on 2.5 Flash) | Live Gemini proven in a bounded harness (one synthetic case), not in the deployed product; candidate not yet serving |
| Problem alignment & impact (25) | Desktop-to-cloud migration from readiness to a verified first invoice, with returning-user continuity | No customer feedback or measured impact; do not imply any |
| Innovation (25) | Rules verify, AI explains, people approve; a Reviewer that never sees the Advisor's output and can only challenge | Judge/evaluator agent not built |
| UX (10) | Current UI in the video and deck; picker; 200% zoom and keyboard checks (`evidence/premium/`) | Screen reader and real-device checks not done |

## Still open (each needs the owner or an approval)
Contact field on deck slide 1 · database backup · promotion (API first, then web) · real Google sign-in and two-account check after promotion · push · video upload (public link) · submission and receipt.

## Independent security review
A separate reviewer (no access to these conclusions) checked the proxy change against ~30 edge cases through the real `proxyRequest`: query smuggling, encodings, duplicate keys, path variants, other routes/methods, cross-owner cursors, origin/auth/header/body limits. Result: nothing exploitable; P2 suggestions applied (no bare `?` forwarded; edge-case tests added). Smoke after the change: `docs/release/evidence/smoke-after-final.txt` (7/7).
