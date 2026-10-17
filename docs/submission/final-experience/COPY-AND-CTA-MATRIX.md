# Copy and CTA matrix (PROPOSED). "Current" quotes are from source at `aacd3a5`; (verify) = confirm rendered text in browser.

## Landing `/`
| Element | Current | Proposed | Why | Destination |
|---|---|---|---|---|
| Badge | "V1.0 Bounded Synthetic Public Beta" | remove (merged into scope line) | three meta lines compete with the value | — |
| H1 | "Move your books. Keep your confidence." | keep | clear, accountant tone | — |
| Value line | "Provider-neutral, AI-assisted accounting migration and onboarding. Review decisions, verify your numbers, and complete a first task with synthetic data." | "AI helps explain. Rules verify your numbers. You approve every consequential decision. Try it on a sample business." | states trust model in one breath; avoids "provider-neutral" jargon above fold | — |
| Primary CTA | "Try the Beta" | "Start a sample migration" | says what happens | `/workspace` (P1: `/sign-in?next=/assess%3Fsample%3Dharbor-light-migrate-demo`) |
| Secondary | button "Explore Demo" + line "Read-only five-phase Demo. No sign-in; the working synthetic Beta requires sign-in." | text link "Explore the demo — no sign-in" | one dominant action | `/simulator` |
| Scope line | "Synthetic Beta only. Do not use real customer or production provider data. Beta limitations" | "Synthetic data only — never real client books. Limits" | keep required disclosure, shorter | `/trust#beta-limitations` |
| Play panel | "Learn through MoveBooks Play …" + "Open Play" | remove from `/`; Play stays in nav and Learn | competing promo | `/play` (nav) |
| Vision section | `ProductVision` block | move into the "How MoveBooks works" disclosure as a link "Product vision" | competing promo | `/product` |
| Disclosures | How it works / Why migrate / Trust by design / Beta boundaries | keep (collapsed); keep "Live Gemini advice … disabled by default" sentence | required honesty | existing |

## Navigation
| State | Current | Proposed |
|---|---|---|
| Signed out | Explore Demo · Play · Learn · Trust · Help · Account | Demo · Learn · Trust · Play · Help · Sign in |
| Signed in | My Migration · Play · Help · Account | My Migration · Evidence (when a session is selected) · Play · Help · Account |
Footer keeps Guide, Help, Feedback, Beta limitations (no duplication of nav items).

## Journey stages (labels sentence case, verb first; destinations unchanged)
| Stage | Route | Current label(s) | Proposed primary CTA |
|---|---|---|---|
| Landing→start | `/workspace` empty state | "Start a sample migration" | keep |
| Understand/Assess | `/assess` | "Choose Test Files", "Use My Test Export", start button (verify text) | "Run readiness check" (hide file options when cloud uploads are off — verify) |
| Prepare: plan | `/plan-map-approve` | "Create My Migration Plan" | "Create migration plan" |
| Prepare: map | same | "Review Mappings" | "Review mappings" |
| Approve | same | "Approve Migration Plan", "Keep Reviewing" | "Approve migration plan", "Keep reviewing" |
| Move | `/migrate-resolve` | "Load reviewed manifest", "Start Migration" | "Load reviewed manifest" → "Start migration" |
| Resolve | same | "Retry failed batch", "Reject and block" | keep |
| Verify | `/migrate-resolve`→`/validate-configure` | "Verify My Books", "Continue to configuration" | "Verify my books" |
| Configure | `/validate-configure` | "Apply reviewed configuration", "Complete Setup" | keep / "Complete setup" |
| Onboard | `/onboard-fpu` | "Start onboarding from configured evidence" | "Start onboarding" |
| First task | same | "Prepare invoice contract", "Review invoice approval" | keep |
| Evidence | `/trust?view=evidence&session=<id>` | "Review Verified Evidence" / "Review verified results" | "Review verified results" |
Constraint: where a label sits next to approval/financial gates, change case only; do not weaken wording.

## AI activity panel (`OperationalActivity.tsx`)
| Element | Current | Proposed |
|---|---|---|
| Heading | "Advisory Operations" | "AI activity" (id `ai-activity`) |
| Intro | "Inspect operational capacity reservations and advisory outcomes for your account. This snapshot is separate from financial audit and approval records; it cannot establish financial correctness or migration completion." | "What AI advice was reserved, used or replaced by rules for your account. Separate from the financial audit trail; it does not show whether your books are correct." |
| Button | "Refresh Advisory Operations" | "Check AI activity" |
| Idle | "No operational read requested. Refresh explicitly to read a snapshot." | "Not checked yet." |
| Busy | "Reading operational activity. No financial action is requested." | "Checking… no financial action is taken." |
| DISABLED | "Operational Activity Is Disabled — The optional operational store is disabled in this environment…" | "AI activity tracking is off in this environment. This is not evidence of AI use." |
| AVAILABLE, empty | "No reservation records were returned in this snapshot. This does not establish that no operations occurred." | "No AI activity recorded for your account. Until AI advice is switched on, guidance comes from rules." (keep: "Latest 20 records only.") |
| AVAILABLE, event | "Reserved model calls: N · Reserved budget: X micro-USD. Reservation is not actual billing." | "Reserved: N call(s), $X.XX. A reservation is not a charge and does not prove the AI ran." (convert micro-USD ÷ 1,000,000) |
| UNAVAILABLE / error | "Operational Activity Unavailable … Verify your access or try again." | "AI activity couldn't be read. Nothing is assumed about AI use. Try again." |

## My Migration `/workspace`
Keep heading/task/attention/progress. Merge "Operational steps" and "Migration link and recent history" into one "Details" disclosure; keep one shortcut row: Evidence & results · AI activity (`/trust?view=evidence&session=<id>#ai-activity`) · Help with this task. Remove "MoveBooks Play" from this page (nav has it).
