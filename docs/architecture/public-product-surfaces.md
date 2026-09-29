# Public product surfaces

Scope: synthetic public-reference Beta. The original public surfaces targeted local development;
the User Guide also describes the subsequently [validated cloud dev/test mode](google-cloud-validation.md),
including real Google sign-in and persisted synthetic workspaces. This is not an always-on hosted
service, production readiness, provider affiliation or customer-data intake claim. Cloud uploads,
Gemini and managed ADK remain disabled.
The [integrated architecture](beta-v1-integration.md) remains authoritative for workflow truth.
Rules verify. AI predicts. GenAI reasons. Agents orchestrate and act. Humans govern consequential decisions.

## Information architecture

| Route | Purpose / boundary |
| --- | --- |
| `/` | Business-first landing; Explore Beta → Product; See How It Works → five-phase overview. No invented progress or measured results. |
| `/product` | Public introduction, sample entry and read-only continuation of the existing local session. |
| `/workspace` | Same Product entry component behind the existing demo authentication boundary; no duplicate workflow. |
| `/guide` | Beta V1.0 User Guide: twelve anchored sections (A–L) with a contents nav, native disclosure for technical detail and links to existing routes and Learn topics. Static, no requests. |
| `/simulator` | Public Harbor Light Books introduction, decisions, synthetic limitations and outcome definition. |
| `/learn` | Ten short native disclosure modules with stable topic anchors and phase entry links. |
| `/play` | Three-choice-step educational exercise; isolated component state, no API, storage or financial actions. |
| `/trust` | Read-only projection of actual owner-scoped session evidence; empty, loading, expired and failed-read states. |
| `/feedback` | Structured, validated local draft with optional safe context and explicit download; never a submitted ticket. |
| `/support` | Contextual self-help, Learn, workflow and Report Issue links; never executes recovery or approvals. |

Navigation prioritizes Product, Guide, Simulator, Learn, Play, Trust, Feedback and Support, with a workspace
shortcut. Existing stage handoffs and session continuity remain intact. A shared contextual-help
aside links workflow stages to relevant Learn topics, Trust and Support; no stage algorithm changes.

## Business framing

Understand = Discover + Assess; Prepare = Plan + Map & Approve; Move = Migrate + Resolve;
Verify = Validate + Configure; Start = Onboard + First Real Task. The customer outcome is
Business Ready · Verified; the formal outcome remains Verified First Productive Use.
The landing explains Scale, Access, Connect and See & Act, then the three questions about coverage,
financial correctness and operational readiness. Data movement alone never implies completion.

## Reuse and canonical Simulator

Product and Simulator use `/assess?sample=harbor-light-migrate-demo`. The sole assessment change
is allowlisted sample preselection when there is no session reference. An existing session wins.
The user must still explicitly start ordinary creation, discovery and assessment; no demo-loader
endpoint or prior approval replay is called by these surfaces. All later decisions, controlled
failure/recovery, exact validation, configuration, onboarding and FPU reuse the integrated Beta.

The middleware preserves the query through sign-in so Harbor Light is not accidentally replaced
by the Northstar blocker sample. Only the Simulator *introduction* becomes public. Assessment and
workspace keep their existing boundary; development demo sign-in still returns 404 in production.
The public pages do not make the current runtime ready for Internet hosting. No identity boundary
is replaced and no API authorization is weakened.

Product continuation derives its link from server `workflow_status`, not the assessment-only status
or local marketing progress. Unrecognized states, non-synthetic payloads and mismatched session IDs
fail closed. This is a navigation projection, not an alternative state machine or completion gate.

## Trust / Agent Operations

`useSessionView` validates a UUID from explicit query or the existing session-storage pointer and
performs only the existing owner-scoped GET. It aborts on unmount and discards late responses.
No session is created on failure, no polling/telemetry is installed, and refresh replaces the snapshot.
Process restart may expire evidence; the UI explains this without inventing results.

`projectSession` explicitly selects activity action/agent/tool/status/time/references, normalized human
decisions, latest validation and FPU check statuses, unresolved execution failures, configuration and
onboarding attention, and lifecycle event IDs/names/times. Current and historical evidence are labelled.
Latest 30 records per trace section are disclosed, with total snapshot count. Raw event attributes,
source/target amounts, invoice/journal payloads, selected values, hidden reasoning and prompts are not
rendered or exported. The existing session endpoint still returns its normal full owner-scoped
payload to the authorized browser; this is presentation minimization, not a new server redaction API.
Before production, implement a dedicated minimized trace endpoint and reviewed retention/identity.

Rule-backed agent actions are distinguished from AI recommendations, deterministic verification and
human decisions. The Beta uses deterministic fallback; no live model quality or confidence claim.
Trust never calls approve, retry, repair, transition or event-submission routes.

## Guide, Learn and Play

Guide (`/guide`) is the getting-started/how-to surface; Learn remains concept learning, not a second
guide. Section F documents merged mapping reconsideration during pre-execution review: enter a
reason, request reconsideration, then explicitly approve/reject as the authenticated workspace owner.
The prior rejection, actor, timestamp, reason and evidence are retained alongside the new decision.
The temporary rollout qualifier is removed now that PR #13 is merged into `main` (`2c62b22`).
No workflow, authorization or cloud runtime behavior is changed by this guide update. Local memory
and cloud persistence/sign-in are distinguished; cloud Try Your Data remains disabled even after sign-in.

Learn covers migration purpose, scope, mappings, reconciliation, approvals, confidence, evidence,
deterministic financial truth, recovery and business-ready meaning. Native details/summary provides
keyboard-accessible progressive disclosure. Stable anchors work without a custom documentation app.
Play teaches compatible mapping review, governed duplicate recovery and failed reconciliation.
Unsafe choices show consequences and cannot advance the exercise. Completion is explicitly educational,
not migration success. Restart affects only the exercise; no dependencies or 3D runtime were added.

## Feedback and Support privacy

Feedback types: Share Feedback, Report Issue, Suggest Improvement. Categories: Product experience,
Bug/blocker, Knowledge/explanation, Agent recommendation, Accessibility, Security/privacy.
The draft requires 10–1500 characters and user confirmation of no sensitive data. The form sends no
network request, persists nothing in browser storage, and has no upload. Refresh discards its state.
User-triggered JSON download is explicit local persistence under the user's control.

Context is previewed and excluded by default. Allowlist: UUID session/audit reference, five-phase
index, bounded MB error code, known failed-action category, nonnegative bounded affected-record count.
Unknown query fields, raw payloads, arbitrary timestamps and credentials are discarded. `prepared_at`
is the draft preparation time, not a fabricated incident time. References never grant API access.
Free text is untrusted and React-escaped; a consent checkbox is not automated sensitive-data detection.
No text reaches a model, analytics system, server or triage queue. Production intake requires redaction,
abuse prevention, authorization, retention/deletion and an accountable operator before activation.

Support explains mapping/readiness blockers, approvals, paused migration, validation mismatch,
onboarding prerequisites and failed productive tasks. It links to the existing stage with safe context,
Learn and an issue draft. It never claims a human responder, resolution time or automatic repair.
The future closed loop remains Feedback/Support → Triage → Product/Bug/Knowledge/Agent Eval → Fix
→ Regression/Eval Case → Release. Local draft preparation does not claim that loop is operational.

## Future analytics contracts — not instrumentation

Typed taxonomy: `apps/web/components/public-surfaces/analytics.ts`. No collector, emission, storage,
production baseline or measured funnel exists. Each contract declares trigger, source, accountable
role, diagnostic/outcome interpretation, denominator where meaningful, and allowed fields.

| Event | Authority / interpretation |
| --- | --- |
| `landing_cta_clicked` | Explicit CTA; unique eligible visits entering Product / eligible landing visits. |
| `core_product_entered` | Explicit governed-workflow entry; entries / eligible Product visits. |
| `simulator_started` | Server-confirmed ordinary session creation with future entry attribution; not clicking the introduction. |
| `simulator_completed` | Server-verified FPU for the same attributed journey, deduplicated once; never browser-declared success. |
| `learn_topic_opened` | Expanded topic; diagnostic, not demonstrated comprehension. |
| `play_started`, `play_completed` | Exercise version and scenario; never counted as migration/FPU. |
| `trust_view_opened` | Authorized successful evidence read, paired with failure rate. |
| `feedback_submitted` | Future intake server accepts a persistent case; never emitted for today's local draft. |
| `support_opened` | Topic/stage access; not proof that a blocker was resolved. |

Before activation, fix cohort eligibility/exclusions and a matured observation window; report open
journeys separately. Segment by entry surface/scenario/stage and version, not sensitive business
attributes. Deduplicate with privacy-reviewed event IDs and server references; choose retention,
consent and access policy. Product/UX own entry/learning measures, Migration owns FPU correctness,
Trust owns read reliability, Support owns accepted-case measures. Numeric targets and baselines are
unmeasured. Guardrails: no false completion, approval bypass, raw data egress, lost context or inaccessible
critical path. Assistance and autonomy remain diagnostic, not success-definition conditions.

## Accessibility, operations and rollback

Existing light/dark tokens, Lucide icons, textual statuses, visible focus, native controls and reduced
motion remain authoritative. No autoplay or continuous new motion. Responsive grids stack on mobile;
trace IDs wrap. Play and feedback completion focus a labelled heading. Original governed dialogs and
financial controls are unchanged. Public navigation preserves a direct Product route on mobile.

No new backend, dependencies, provider calls, cloud resources or deployment. Try Your Data, Google SSO,
live Gemini/managed ADK, production connectors and billing remain out of scope. Existing Next.js/PostCSS
advisory and Starlette warning are not resolved by this slice. Rollback is a normal reviewed revert of
this branch's commit; no history rewrite. See the [review record](../reviews/public-product-surfaces.md).
