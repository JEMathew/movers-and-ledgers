# MoveBooks AI V2: full experience, implementation report

> Superseded for status and test counts by `docs/v2/release/RELEASE-READINESS.md` (release-readiness sprint, `3d4cb07`).

Branch `v2/full-experience` at `64f7953` (27 commits on top of `v2/phase1-foundations` `0c6c757`, which was created
from GitHub `main` `4e31e29`). Prepared 19 Oct 2026, local only. Not pushed, not merged, not deployed; GitHub push is not
authorised from this environment, so no draft PR was opened. Gemini is not activated (`AI_ASSISTANCE_STATUS = "planned"`).

## Outcome against the definition of done

| Requirement | Status | Evidence |
|---|---|---|
| Landing follows the approved V2 design | Done | `evidence/landing.png` |
| Every primary authenticated workflow uses V2 | Done: sign-in, My migration and picker, Understand, Prepare, Move, Verify, Start, evidence | `evidence/*.png`, route screenshots |
| Understand → Prepare → Move → Verify → Start works end to end | Done | 49/49 UI journey steps at 1440 and 390; API `VERIFIED_FIRST_PRODUCTIVE_USE`, invoice total 107.25, 17/17 checks |
| Consequential approvals explicit and attributable | Done | Per-item approvals unchanged; batch approval sends one audited call per item with the set comment; 6 separate decisions by the owner recorded |
| Real API data drives figures and status | Done | Figures formatted from API strings (`formatApiAmount`); unknown shown as unknown; contract tests use non-sample values |
| Desktop and mobile consistent | Done | 23 routes × 1440/390 and journey screenshots; no horizontal scroll at 390 |
| Accessibility and regressions checked | Done | axe WCAG 2.2 AA: 0 violations on every V2 route (light and dark); only the pre-existing `/play` contrast issue (2 nodes) remains |
| V1 production unchanged | Done | No deploy, Firebase, Cloud Run, IAM or database command was run. Changes are confined to `apps/web` and `docs/v2` |
| No Gemini activation or deployment | Done | AI status constant unchanged and guarded by a test |
| Evidence and limitations documented | Done | This report, `CHECKPOINT.md`, `evidence/` |

## Test results (final commit `64f7953`)

| Check | Result |
|---|---|
| Web unit and component tests (vitest) | 798 passed, 0 failed, 0 skipped (Phase 1 foundations: 744) |
| Typecheck (`tsc --noEmit`) | Pass |
| Lint (`eslint`) | Pass |
| Production build (`next build`) | Pass; route files identical to `main` (no route added, removed or renamed) |
| API tests (pytest) | 663 passed, 86 skipped (API unchanged; same as baseline) |
| Harbor Light journey through the UI, 1440 and 390 | 49/49 steps; batch approval of 6 low-risk mappings then the rest one by one; plan approval; migration exception, approved fix, retry; verification; 5 settings; essentials; invoice; post and verify |
| API facts after the journey | `VERIFIED_FIRST_PRODUCTIVE_USE`, total 107.25, 17 of 17 checks verified |
| Rejected-mapping recovery (live) | Rejection recorded by the owner; plan approval unavailable while rejected; reconsideration requested and approved; mapping approved with both decisions kept in history; plan review then available |
| Blocked mapping (Northstar `vendor-002`, live) | Shown as Blocked with its recovery; no approve or reject control; batch approval switched off while readiness findings are open |
| axe on journey screenshots and 23 routes, light and dark | 0 violations except `/play` (pre-existing, untouched) |
| Keyboard | Every tab stop on 18 routes at both widths shows a visible focus ring; no focus on hidden elements; batch approval panel fully operable by keyboard |
| Reduced motion | No animation or transition over 50 ms with reduced motion on any checked route |
| Browser page errors | 0 |

## What changed, by workstream

### A. Design system, landing, navigation

- **Capability:** the Clear Ledger palette, type and components now apply across the whole app. The landing has been rebuilt: a proof card labelled as a sample, the five stages with their owners, "who decides what", why businesses migrate, the vision video, and the Beta boundaries. Navigation and footer labels are in sentence case. Play is behind `NEXT_PUBLIC_FEATURE_PLAY_NAV`, which is off by default. A shared workflow pattern (`StageHeader`, `WorkflowSummary`, `RecoveryNotice`) provides the stage, done work, waiting-on-you, next step, evidence and recovery on each screen. There is one five-stage bar, with the recorded steps kept as a closed breakdown.
- **Problem:** V1 mixed two progress models, Title Case and uppercase status labels, and a landing that led with video rather than proof.
- **Benefit:** A customer sees one model, one next action and a clear statement of who decides what, on every page.
- **AI Builder dimension:** product experience and design quality; responsible AI communication. The AI is shown as Planned, and the attribution line is gated.
- **Intuit relevance:** consistent orientation reduces migration anxiety and support contacts. The workflow pattern is reusable for other source systems and onboarding journeys.
- **Evidence:** `evidence/landing.png`; surface, nav, casing and attribution tests; axe clean.

### B. Entry, My migration, Understand, Prepare

- **Capability:**
  - Single-action sign-in card and a picker with cards.
  - My migration rebuilt to the approved frame: stage bar, guide sentence, next step, waiting on you, "How this move is going", at a glance, evidence, and second opinions marked Planned.
  - Understand leads with the readiness result.
  - Prepare has a riskiest-first queue (needs review, blocked, rejected, low risk one by one, low risk ready, decided) next to a detail pane comparing the old and new books.
  - Low-risk batch approval, described below.
- **Problem:** in V1 every mapping went through the same flat queue, so routine decisions got the same effort as risky ones, and the blocked and rejected paths were easy to miss.
- **Benefit:** fewer clicks for routine items without weakening control; risky, blocked and rejected items are separated, each with its way forward.
- **AI Builder dimension:** human-in-the-loop design, guardrails and auditability.
- **Intuit relevance:** this is the human/agent collaboration pattern the role describes. The rules propose, low-risk items are batched under explicit consent, and judgement calls stay individual and attributable.
- **Evidence:** `evidence/my-migration.png`, `prepare-mappings.png`, `batch-approval.png`, `rejected-recovery.png`, `blocked-recovery.png`; 19 batch-approval tests; live recovery run.

#### Low-risk batch approval

Built only on the existing per-item `approve` endpoint, which already accepts a `comment`. There is no new API.

A mapping is eligible only if all of these hold:
- risk is LOW;
- state is AUTO_ACCEPTABLE or REVIEW_REQUIRED;
- the target has not been changed;
- it is not tax;
- every policy reason is exactly the server's "Eligible for streamlined human approval." Chart-of-accounts and tax mappings carry a "sensitive" reason, so they never qualify;
- no rule check failed;
- there is no open reconsideration.

The panel is also switched off when the session has open readiness findings. These, such as possible duplicate customers, are not linked to individual mappings, so the panel fails closed.

How a batch runs:
1. The person sees the full list and can remove any item.
2. Consent is an unticked checkbox, and the count must match everywhere.
3. The mappings are re-read before submitting. The batch aborts and names any item that changed.
4. Calls go one at a time in order, and stop on the first failure with "approved" and "not sent" shown per item.
5. Nothing is retried or undone automatically.

For Harbor Light, 6 mappings qualify. The design showed 10, but the 4 low-risk account mappings are marked sensitive by the server and stay individual.

### C. Move, Verify, Start and the verified first invoice

- **Capability:**
  - **Move:** an ordered batch list, the paused-batch card, and recovery stating "a problem pauses one batch, not the move".
  - **Verify:** checks grouped as record counts and balances and integrity, plus the trial-balance result; settings show who decided and when.
  - **Start:** the draft invoice is rendered as an invoice with its journal. The verified screen follows the approved frame: invoice total, "No difference", Verify, readiness and decision cards, and "No AI advice was used".
- **Problem:** in V1 the verified result was a list of uppercase status lines. The financial proof, the USD 107.25 invoice that balances, was buried.
- **Benefit:** the bookkeeper sees the proof first, then everything behind it, with every figure taken from the API.
- **AI Builder dimension:** verifiable, deterministic financial outcomes; evaluation evidence.
- **Intuit relevance:** time-to-value and first productive use are the success metrics the role names. This screen is the moment the customer trusts the new books.
- **Evidence:** `evidence/move-exception.png`, `verify.png`, `start-verified.png`; 21 new state tests, including one that every rendered amount is an API string.

### D. Trust, evidence and supporting surfaces

- **Capability:**
  - **Evidence and results:** a five-stage bar from the session status, the next step back to the task, and waiting-on-you and done-so-far from the evidence read. Records read as "Mapping approved" or "First invoice approved", with the result, actor and time; raw values stay in each record.
  - **Trust:** principles shown as cards, with the AI one marked Planned.
  - **Resume link:** shows the real stage and next action.
  - **Help:** answers as one recovery card with a single action.
  - **Demo, Guide, Learn and Try your data:** sentence case and five-stage wording, with Play hidden.
- **Problem:** the evidence page said "Agents advise and coordinate", which is untrue for the Beta, and showed raw codes such as `first_productive_use · approve`.
- **Benefit:** customers and reviewers can audit a migration in plain language without losing the raw record.
- **AI Builder dimension:** transparency, explainability and truthful AI claims.
- **Intuit relevance:** audit-ready evidence supports Care and support deflection.
- **Evidence:** `evidence/trust.png`; evidence, guide, help and demo tests; axe clean.

### E. Integration and QA

- Merged B and C without conflicts.
- Fixed the issues found on review:
  - tabular figures widened the decimal point in this typeface;
  - dialog shadow and blur;
  - a disabled "Approve" button shown on blocked mappings;
  - the "None" difference wording;
  - Gemini labelling on the independent rule check;
  - the batch readiness gate;
  - focus rings on video and file inputs.
- Built the combined journey, recovery, keyboard, dark-mode and before/after harnesses.

## Decisions and deviations

1. **Attribution.** The approved line "Built on Google Cloud and powered by Gemini AI" would claim live hosted inference while the Beta is deterministic-only. `components/v2/Attribution.tsx` therefore shows "Built on Google Cloud · Gemini AI planned" and switches to the exact approved line only when the AI status is `live`. That switch is a separate, verified release decision. It is one quiet line on the landing page and in My migration.
2. **"USD 0.00" difference.** The rules report the trial-balance comparison as "None" (no difference) or "Mismatch", not as an amount. The product and the landing sample say "No difference". Showing "USD 0.00" needs an API contract change.
3. **Batch size.** As explained above, 6 mappings qualify for Harbor Light rather than the design's 10, because the server marks account mappings as sensitive.
4. **Evidence pack.** No export exists in the app or API. The Start screen's primary action is "Review verified evidence".
5. **Theme default.** The theme now defaults to light, the approved design. System and dark remain available, and dark mode is axe-clean.
6. **Landing launch action.** It is repeated once in the closing band, as in the approved frame, with the same label, destination and secondary style.
7. **Recorded steps.** The nine recorded steps are kept, as a closed "Steps in each stage" breakdown under the five stages. This preserves the step-level parity tests.

## Known limitations and remaining work (estimate)

| Item | Why | Estimate |
|---|---|---|
| Hosted preview (tagged, no-traffic Cloud Run revision) | Firebase sign-in, Cloud SQL and the CDN are not exercised locally; needs your approval | 0.5 day after approval |
| Draft PR to `main` | Push not authorised here | 15 min once authorised |
| API contract: trial-balance difference as an amount; account display names on the journal; evidence-pack export | Design shows them; API returns text or ids | 1–2 days (backend, out of Phase 1 scope) |
| Invoice approval button stays enabled after approval, so repeated approvals accumulate (existing rule, kept) | Behaviour change needs a decision | 0.5 day |
| `/play` colour contrast (2 nodes) | Pre-existing; Play is out of navigation | 1 hour |
| Rejected batch fix in Move is covered by component tests only | The sample journey never produces it | 2 hours for a live fixture |
| Browser-level two-identity isolation test | Needs two named test identities | 0.5 day after identities are provided |

## Reproduce

Local, synthetic data only:

```
API:  MOVEBOOKS_ENV=local MOVEBOOKS_PERSISTENCE_BACKEND=memory MOVEBOOKS_STORAGE_BACKEND=memory \
      MOVEBOOKS_IDENTITY_MODE=demo MOVEBOOKS_DEMO_IDENTITY_ENABLED=true MOVEBOOKS_MODEL_PROVIDER_MODE=deterministic-only \
      uvicorn movebooks_api.main:app --app-dir services/api/src --port 8000
Web:  cd apps/web && NEXT_PUBLIC_API_BASE_URL=http://localhost:8000 NEXT_PUBLIC_IDENTITY_MODE=demo npx next dev -p 3000
Play in navigation: NEXT_PUBLIC_FEATURE_PLAY_NAV=on
```
