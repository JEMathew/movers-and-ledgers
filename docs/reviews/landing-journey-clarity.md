# Landing journey clarity review

Date: 1 October 2026. Branch: `ux/landing-journey-clarity`, based on merged
`main` at `8d0c7f0`. Local UX implementation only; not deployed or merged.

## Decision and scope

Local UX gates: GREEN. Live post-change performance: not measured; the historical
cold path remains an AMBER performance follow-up, not an authentication bypass.
P0: 0. P1: 0. Remaining P2: 1 (cold identity latency). Remaining P3: 1
(repeated scope notices on educational/support surfaces).

No backend, Firebase verification, proxy, IAM, SQL, runtime scaling, financial
rules, approvals, migration execution, Play behavior, release tags or media assets
changed. No real sign-in, scenario creation, approval or posting was performed.

## Visible changes

- Settings contains only its title, Theme and System / Light / Dark choices,
  plus the accessible close control. Device reduced-motion CSS remains intact.
- Explicit placement instruction takes precedence over the later narrative list:
  hero → Product Vision → Why businesses migrate → questions → How MoveBooks
  works → Trust → supporting experiences/footer.
- Approved video is unchanged: poster-first, native controls, click-to-play,
  `preload="none"`, no autoplay, responsive aspect ratio, Product Vision / 25 sec
  label and explicit vision-versus-current-Beta boundary.
- Hero actions: **Explore MoveBooks** to Product, **See how it works** to the
  journey anchor. The verified global **Go to migration** still targets Workspace.
- Removed uppercase styles from journey/reason headings and Guide Contents.
  Added a real sentence-case questions heading above its three subordinate
  questions. Product sample and data headings now use sentence case.
- Exceptions retained: MoveBooks AI, Harbor Light Books, Google, Gemini, Google
  ADK, AI/API/FPU, canonical workflow labels and the named outcome **Business Ready
  · Verified**. Navigation labels, non-heading eyebrow labels, proper names and
  immutable evidence titles retain their existing conventions.
- Existing four migration reasons, three customer questions and financial-trust
  statement were already correct and remain unchanged. Removed the duplicate
  hero brand label and seven redundant concern badges, not their explanations.
- Guide's stale claim that cloud access is not a public service was corrected to
  public synthetic Beta with no production uptime guarantee. Its primary action
  appears before the contents on mobile. Topic links remain secondary.
- Feedback's download becomes the primary action once a draft exists. It still
  submits nothing to a server. Play remains the same three-decision exercise.

## Menu-by-menu happy-path audit

“Fulfills” below describes implemented local navigation/contracts, not a new
cloud migration acceptance run. Links do not grant authorization or waive gates.

| Entry | Problem / intended user | Entry promise | Happy path and primary CTA | Destination / expected outcome | Fulfillment and remaining ambiguity |
| --- | --- | --- | --- | --- | --- |
| Product | Owner/bookkeeper needs a safe starting point | Inspect a sample or resume a selected migration | **Start a sample migration**; when saved progress is available, **Go to migration** becomes primary and sample entry secondary | Sample-selected Assess, or authoritative saved stage | Fulfills. Entry itself creates nothing; discovery requires an explicit action. Simulator uses the same sample, not a separate engine. |
| Guide | First-time visitor needs procedural help | How to start, decide and recover | Read relevant section → **Go to migration** | `/workspace`, then sign-in/selected migration | Fulfills. Learn remains concepts; Guide remains how-to. Corrected stale public-availability copy and vague Open links. |
| Simulator | Evaluator needs a safe rehearsal | Real governed workflow using synthetic Harbor Light Books | **Start simulation** → sign-in when required → explicitly start discovery | Existing sample-selected Assess route | Fulfills. No automatic discovery, approval or scenario creation. No invented scenario chooser. |
| Learn | User needs to understand a decision | Concise concepts with a safe return | Topic → **Return to [stage]** when contextual; otherwise **Go to migration** | Validated stage/session link, or `/workspace` | Fixed lost return context from workflow help. A link is a hint, not proof that a stage is allowed. Standalone topic links explicitly say Review [stage] in Product rather than suggesting live progress. |
| Play | Curious visitor wants low-risk practice | Three learning decisions, no migration progress | **Start learning scenario** → review choices → Continue lesson → try real synthetic workflow | Existing in-memory exercise, then Simulator | Fulfills. Continue lesson is an intentional in-exercise label, not a vague public entry CTA. Nothing reads/writes a workspace. |
| Trust | Owner/evaluator needs evidence | Distinguish advice, rule checks and human decisions | Read selected snapshot → **Return to migration**; without selection, **Review migration options** | Existing governed stage or Product | Fulfills. Refresh evidence is secondary. Empty evidence is not success; read failures remain explicit. No live monitoring or approval from this page. |
| Feedback | Evaluator wants to report an issue | Prepare a safe local draft | **Prepare feedback draft** → review → **Download reviewed draft** | Local JSON download for manual sharing | Fulfills stated limited promise; no inbox, transmission, triage or response SLA exists. |
| Support | User is blocked at a step | Explain safe next steps | Select issue → **Return to migration** with context; otherwise **Review migration options** | Existing stage or Product | Fulfills self-service promise. **Prepare issue draft** now accurately labels the Feedback link. No repair/approval bypass or live support team. |
| Settings | Any visitor wants display control | Supported preferences only | Settings → **Theme** → System / Light / Dark | Existing persisted theme preference | Fulfills. Reduced motion remains automatic; no fake account/billing/notification controls. |
| Sign in / account | User needs verified access and identity clarity | Google sign-in, server-verified email, Settings and Sign out | Ready click → popup → API verification → account | Current protected destination, or migration entry | Local contract gates pass. Cold API startup can exceed UX target; no client email is trusted. Sign-out still invalidates identity immediately and uses full navigation after SDK success. |
| Go to migration | Signed-in user needs to resume work | Reach migration entry, not mutate progress | **Go to migration** | `/workspace`, then explicit selected-stage action | Fulfills. Shown only for API-verified identity. No fetching progress from the global header, inferred approvals or automatic mutations. |

## Post-SSO latency diagnosis

Code trace:

1. Firebase imports, persistence initialization and `authStateReady` finish before
   enabling sign-in; popup invocation remains synchronous in the click handler.
2. Successful popup returns a user. `refresh` immediately enters a session-present,
   identity-unverified state. `getIdToken` precedes the identity request.
3. Hosting forwards `/api/v1/identity` to web. Proxy verifies the Firebase JWT,
   acquires Cloud Run workload authorization, then calls the fixed private API.
4. API uses Firebase verification with revocation checking. `/v1/identity` itself
   does not query SQL. Cold service startup is gated by `/readyz`, which checks
   repository readiness and permitted GCS readiness; those are separate from the
   identity handler.
5. Only a matching API subject plus nonempty API email populates the account.
   Generation/unmount protections reject stale responses.
6. Previously, success called `window.location.assign`, destroying the shared
   provider. Initialization and identity verification repeated on the destination,
   including when signing in on that same destination. Now successful sign-in uses
   sanitized Next.js client navigation, or no navigation when already there.
   Sign-out retains its full-page navigation and selected-session clearing.

The ambiguous **Updating session…** came from testing `busy` before `verifying`.
Popup + API verification share that busy interval. The UI now prioritizes
**Verifying your account…**, replaces it immediately with the API email on success,
and distinguishes **Signing out…**. A fixed, responsive account-control width
reduces the pending-to-email layout shift. No timeout was increased.

### Measured historical request evidence

Read-only Cloud Logging query against project `movebooks-ai`, services
`movebooks-beta-web` and `movebooks-beta-api`, window
`2026-09-30T18:51:00Z`–`18:55:35Z`. Only identity HTTP status/latency and system
startup metadata were read. No headers, tokens, email or business payloads were
retrieved. This is pre-change deployed evidence, not a new authenticated run.

| Request start (UTC) | Web identity request | Nested API request | Interpretation |
| --- | ---: | ---: | --- |
| 18:53:04.995 | 21.857453 s, 200 | 21.344535 s, 200 | Cold API path |
| 18:53:27.511 | 0.306187 s, 200 | 0.258136 s, 200 | Warm subsequent request |
| 18:54:42.715 | 0.319654 s, 200 | 0.260291 s, 200 | Warm subsequent request |

API system logs: instance starting at `18:53:05.256914Z`, startup `/readyz`
succeeded after two attempts at `18:53:26.324575Z`: **21.067661 s**. No web startup
entry in this bounded window. The warm web-minus-API interval is about 48–59 ms;
it cannot isolate workload-token acquisition, proxy verification or transport.
The nested durations must not be added together.

Conclusion: API cold-start/readiness dominates the observed long delay. The
duplicate post-sign-in verification is an additional code-proven avoidable round
trip, not the cause of all 21 seconds. The logs alone do not establish which later
requests were caused by navigation versus a human refresh.

Not measured: popup completion→token, browser→Hosting, per-stage proxy timings,
SQL versus GCS readiness duration, Firebase-only verification duration, paint
latency, post-change live warm/cold totals. Do not claim the <2–3 s warm or <5–8 s
cold verified-email targets are achieved. Warm server time is compatible with the
warm target, but cold server time already exceeds the cold target.

Recommendation: separately profile startup imports, repository initialization,
SQL connector and GCS readiness before proposing changes; retain fail-closed
readiness and revocation checks. Client navigation removes one redundant request
without an infrastructure cost change. Keeping an API instance warm may help but
adds idle compute cost and requires explicit sizing/cost approval; no dollar
estimate or <8 s guarantee is supported by this trace. No scaling, IAM or SQL
change was applied. Incremental recurring infrastructure configuration cost: none.

## Validation and review

- Frontend suite: **217 passed**, 24 files (includes auth/proxy security and
  public-surface regressions). Frontend lint and TypeScript: pass.
- Production build: pass, all 25 static pages generated. Final additional
  heading tests were followed by another full suite/lint/typecheck pass.
- Backend identity display and cloud owner regressions: **23 passed**. Existing
  Starlette test-client deprecation warning remains unrelated to this change.
- Repository scan: **95 Markdown / 375 text files**, zero findings. Whitespace
  check: pass. Lockfile, media, server verification/proxy and backend unchanged.
- Regression coverage includes pending popup verification, immediate verified
  email, same-route no reload, single verification/client routing, sanitized
  destinations, late/stale identity rejection, sign-out, Settings controls,
  sentence-case headings, hero links, video order, contextual Learn return,
  non-mutating entry links, mobile nav and existing owner/proxy boundaries.
- Reduced-motion CSS unchanged; approved media unchanged.
- Local visual review: desktop 1440×900 and mobile 390×844, light/dark landing,
  Product Vision, reasons/questions/journey/Trust; Guide and Product CTA hierarchy;
  Settings focus/Escape; mobile header. No observed horizontal overflow.
- Signed-in/pending account visual review used actual shell components with an
  isolated temporary localhost fixture and synthetic identity states. It did not
  authenticate, call Firebase/API, or establish a real live SSO result. Fixture
  is outside the repository and excluded from the production build.
- No preview console errors observed in the actual Next.js landing page.
- Both temporary localhost preview processes stopped after review; no listeners
  remain on their ports. No cloud runtime or live user session was changed.

## Changed-file inventory

All application changes are within `apps/web`:

- `app/page.tsx`, `app/learn/page.tsx`, `app/simulator/page.tsx`,
  `app/globals.css`.
- `components/AccountControls.tsx`, `components/IdentityEntry.tsx`,
  `components/IdentityProvider.tsx`.
- `components/public-surfaces/Guide.tsx`, `ProductEntry.tsx`, `Trust.tsx`,
  `Support.tsx`, `Feedback.tsx`, `WorkflowHelp.tsx`, new `LearningReturn.tsx`.
- Tests: `test/account-shell.test.tsx`, `test/google-sign-in.test.tsx`,
  `test/runtime-identity.test.tsx`, and public-surfaces `Guide.test.tsx`,
  `ProductVision.test.tsx`, `WorkflowHelp.test.tsx`, `surfaces.test.tsx`.
- This review record. No generated build or temporary fixture files are included.

Next: review this focused diff, run remote CI if published, then separately
authorize deployment and human Safari post-SSO timing verification. Recommended
next UX/performance slice: measured cold-start feedback/latency, not more landing
features or changes to deterministic workflow controls.
