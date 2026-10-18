# Current journey (source-traced at `aacd3a5`; no live execution claimed)

## Route map and links
`/` → CTA "Try the Beta" `/workspace` | "Explore Demo" `/simulator` | "Open Play" `/play` | disclosure links `/guide`, `/learn#why-migrate`, `/trust`, `/support`.
Nav (signed out): Explore Demo `/simulator`, Play, Learn `/learn`, Trust `/trust`, Help `/support`. Nav (signed in): My Migration `/workspace`, Play, Help, Account. Footer: Guide, Help, Feedback, Beta Limitations.
`/workspace` signed out → "Sign in to continue your migration" (Google). Signed in, no session → "Start a sample migration" → `/assess?sample=harbor-light-migrate-demo` (user then explicitly starts; default dropdown value in code is `northstar-supplies` unless the query selects Harbor Light).
Phases (content.ts): Understand `/assess` · Prepare `/plan-map-approve` · Move `/migrate-resolve` · Verify `/validate-configure` · Start `/onboard-fpu`. Plan screen has three views (Plan Summary, Mappings, Approval Review). After Move, "Verify My Books" → Validate. Final: "Review verified results" → `/trust?view=evidence&session=<id>`.
Session carry: URL `?session=`, `sessionStorage["movebooks-migration-session"]`; `member-home.ts` picks the next-action link by workflow status (26-state enum, 5 phases via `phaseFor`).

## Implemented vs simulated
Implemented: Firebase sign-in, API owner checks, session persistence, deterministic discovery/assessment/plan/mapping, human approvals, governed synthetic migration batches with controlled failure + bounded recovery, deterministic reconciliation, human-approved configuration, role-aware onboarding, synthetic-invoice verification, evidence snapshot, Firestore-backed AI activity readback (pending live acceptance).
Simulated/synthetic: source and target systems (synthetic companies), the "migration" itself, the invoice; `/simulator` is a read-only guided demo; Play is a separate game; Try Your Data is local-only (cloud upload disabled).
Not live: Gemini (deterministic-only on candidate), live provider integration, production readiness. 13 registered agents are deterministic components; Gemini is one bounded, user-triggered advisor plus a Reviewer slice.

## Evidence and AI activity
Reached from My Migration shortcut "Evidence & Results" or the final-task link. `Trust` mounts `<OperationalActivity/>` only in the Evidence branch after a session loads (`Trust.tsx`), at the bottom, with an explicit Refresh (no auto-read). Calls `/api/v1/operations/activity` (proxy: Firebase token verified, `X-Serverless-Authorization` added, audience = configured upstream origin).

## Friction observed in source (ranked)
1. Landing competes four promos (Beta, Demo, Play, Vision) plus three meta lines before any content.
2. Two-step start: Try the Beta → sign-in → My Migration empty state → Assess → explicit start.
3. AI activity is hard to find: only on a loaded Evidence view, bottom of page, named "Advisory Operations" with technical wording (micro-USD, reservations).
4. My Migration stacks ~9 blocks and two nav rows for one decision.
5. Mixed label casing and 5-phase vs route/screen names (Plan "Approval Review" listed first).
(Rendered layout/scroll depth not yet inspected — see UX-DECISIONS "verify" tags.)
