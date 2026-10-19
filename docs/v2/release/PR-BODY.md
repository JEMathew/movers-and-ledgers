## MoveBooks AI V2: full experience (draft, do not merge)

This PR moves every primary screen onto the approved A+B design:

- landing page
- sign-in
- My migration
- Understand, Prepare, Move, Verify and Start
- evidence and Trust
- demo, Learn, Help, Try your data

It uses one five-stage journey, and every workflow screen shows the stage, what is done, what is waiting on you, one next step, the evidence and a recovery path.

**Scope**
- Only `apps/web` and `docs/v2` change. The API, domain rules, database schema, identity, the proxy and infrastructure are unchanged.
- Route files are identical to `main`.
- Gemini is not activated. AI is labelled Planned. The attribution line shows "Built on Google Cloud · Gemini AI planned" until the AI status is `live`.

**Financial and safety changes**
- Low-risk batch approval is built only on the existing per-item approve endpoint:
  - explicit consent and full inspection;
  - revalidation before submitting;
  - stop on first failure;
  - one audited decision per item.
- The invoice cannot be approved twice for the same terms.
- Blocked mappings offer no approve control.

**Release changes**
- Prerendered HTML is cached for at most 60 s; it was one year.
- The Play contrast and video focus-ring defects are fixed.

**Local verification**

| Check | Result |
|---|---|
| vitest | 814 passed |
| tsc and eslint | clean |
| `next build` | passes |
| pytest | 663 passed, 86 skipped; 678 passed with Postgres |
| Journey at 1440 and 390 | 49/49 each |
| axe | 0 violations on 23 routes × 2 widths |

Full results are in `docs/v2/release/RELEASE-READINESS.md`.

**Not yet verified**
- Hosted Google sign-in
- Two-account isolation
- Container scan
- CI

These are covered in `docs/v2/release/PREVIEW-PLAN.md` and `ACCEPTANCE-CHECKLIST.md`.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_011Rdxj7etdqG14zUJcubgxj
