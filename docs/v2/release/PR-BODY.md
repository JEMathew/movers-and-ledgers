## MoveBooks AI V2: Phase 1 release candidate (draft, do not merge)

This PR moves every primary screen onto the approved V2 design, in one five-stage journey:
- landing and sign-in;
- My migration;
- Understand, Prepare, Move, Verify and Start;
- Evidence and Trust;
- Demo, Learn, Help and Try your data.

Every workflow screen shows:
- the stage;
- what is done and what is waiting on you;
- one next step;
- the evidence;
- a recovery path.

**Scope**
- Frontend changes are in `apps/web`, and documentation is in `docs/v2`.
- One narrow backend fix: `decide_fpu` in `agents/orchestrator/onboard_fpu.py`, with tests.
- Route files, schema, identity, the proxy and infrastructure are unchanged.
- Play stays hidden from navigation behind its default-off flag.
- The attribution is the approved line "Built on Google Cloud and powered by Gemini AI".
- Hosted live Gemini inference is **not** active: the Advisor and the Reviewer remain Planned, and `AI_ASSISTANCE_STATUS` is `planned`.

**Financial and safety changes**
- **Invoice approval is idempotent on the server.** An identical repeat of the latest decision on the same contract records nothing new. The same action with a different note is refused (409). Reconsideration, revocation, changed-contract approval and posting idempotency are unchanged. This is covered by unit, API, PostgreSQL race and live tests.
- **Low-risk batch approval** is built on the per-item approve endpoint:
  - consent and full inspection;
  - revalidation before submitting;
  - stop on first failure;
  - one audited decision per item;
  - a server error reads as "not confirmed", never as "refused".
- Blocked mappings offer no approve control.

**Release changes**
- Prerendered HTML is cached for at most 60 s; hashed assets are immutable.
- The Play contrast and video focus-ring defects are fixed.

**Local verification** (full matrix in `docs/v2/release/RELEASE-READINESS.md`)

| Check | Result |
|---|---|
| vitest; tsc; eslint; ruff | 815 passed; clean |
| pytest | 668 passed, 88 skipped; 728 passed with PostgreSQL 18 |
| `next build`; `smoke-v2.sh` | passes; 24/24 |
| Journey at 1440 and 390 | `VERIFIED_FIRST_PRODUCTIVE_USE`, one invoice decision, 0 axe violations |
| axe WCAG 2.2 AA | 0 violations on 64 route checks (16 routes, 2 widths, light and dark) |

**Not yet verified:** CI, container scan, hosted Google sign-in, two-account isolation and the preview auth-layering gate.
See `docs/v2/release/PREVIEW-PLAN.md` and `ACCEPTANCE-CHECKLIST.md`.

🧙 Built with [WOZCODE](https://wozcode.com)
