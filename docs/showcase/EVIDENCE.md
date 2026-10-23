# Capability and publication evidence — 24 October 2026

[Product overview](../../README.md) · [Eight-artifact showcase](README.md) · [Video Academy](../video-academy/README.md)

This is a documentation snapshot, not a product release or a new acceptance run. Read-only public
checks, existing repository evidence and local workstream records were inspected. No Gemini call,
cloud mutation, financial action, push, public PR, media upload or production deployment was performed.

## How to read a claim

| Class | Meaning |
| --- | --- |
| **A — Publicly deployed and verified** | The stated public behavior was observed; the exact scope is given. |
| **B — Staging verified** | Bounded hosted/private acceptance evidence exists; this does not prove public behavior. |
| **C — Locally verified** | Source/test/local UI evidence exists; neither pushing nor deployment follows from it. |
| **D — Planned** | Proposed design or future direction; not an implementation promise. |
| **E — Unverified** | Evidence is insufficient for the specific claim, even if adjacent capabilities work. |

A recorded result is attributed to its original run. Counts from different commits and environments
are not combined. This refresh did not rerun application suites or generate model-quality evidence.

## Source and GitHub state

The verified repository is [JEMathew/movers-and-ledgers](https://github.com/JEMathew/movers-and-ledgers).
Fetched main: **`54f1b3f2ca29e225a99159264b2a1df84ffdbf5b`**, merge of
[PR #39](https://github.com/JEMathew/movers-and-ledgers/pull/39), which adds PostgreSQL migration-listing isolation coverage.
The supplied audit checkout is a clean detached checkout at `54141f2`; it was not edited.

| Source or release | Observed state | Consequence for this portfolio |
| --- | --- | --- |
| [PR #37](https://github.com/JEMathew/movers-and-ledgers/pull/37) | Merged release `16e31e9` and evidence | Historical deployed Beta and harness statements are retained with dates. |
| UX V2 PRs #30–#35 | Merged into main | Source implementation is public; merge alone is not proof of serving revision. |
| [PR #38: V2 Phase 1](https://github.com/JEMathew/movers-and-ledgers/pull/38) | Open draft; head `ab4654671b94f049bcf1a5959627e5d48862b97c` | Its local acceptance counts do not certify the current public deployment. |
| `feature/video-academy-v1` | Local HEAD and fetched remote both `dbdd07fcf1ad937146faf726f375c3ee56ad0030`; not merged into main | Pushed, plus separately verified public Academy availability. |
| `integration/ux-gemini-v2-local` | Local HEAD `b20ef668736a520387753dee4c8c19e4f66ae8da`; reachable through the fetched Academy remote branch | The commit is pushed through another branch; its original branch name alone is not deployment evidence. |
| `feature/gemini-advisor-v2` | Local HEAD `db2ef1fe078fbc28a800241d4456e23bc5b06d81`; staging package reports have narrower scope | Local runtime checks are not live model proof. Later hosted records must be read separately. |
| Original showcase exports | Local untracked files in the submission worktree inspected at `aacd3a5` | Hashes, not that commit, identify their exact bytes. They become tracked only in this documentation candidate. |
| [GitHub v1.0.0 Release](https://github.com/JEMathew/movers-and-ledgers/releases/tag/v1.0.0) | Published 29 September; no attached media assets | No final-demo V2 download link can be inferred from the release. |

No current CI-green claim is made from a historical job. This branch changes documentation and
reviewed documentation assets only; it does not bring the application source on main up to the serving build.

## Claim-to-evidence matrix

| Capability | Class and evidence | Practical limit |
| --- | --- | --- |
| Canonical public product | **A.** `https://movebooks-si.web.app` opened with the actual MoveBooks UI; public page GETs checked 24 October. [Capture](assets/product-public-20261024.jpg). | `movebooks.ai` failed DNS resolution in both browser and direct check. Retain the canonical Hosting URL. |
| UX V2 public surfaces / Track A | **A** for the observed landing, Learn and guided demo. [Current captures](README.md#05-prototype-showcase); source evidence in [UX PR05](../ux-v2/pr05/README.md) and [PR06](../ux-v2/pr06/README.md) is historical/local. | No claim that every Track A change, draft PR #38 or authenticated migration is freshly accepted. |
| Read-only five-stage demo | **A.** Public simulator exposes Understand, Prepare, Move, Verify, Start; sampled readiness, mapping and failed-total evidence observed. | Sample preview does not execute a migration, invoke a model or grant approval. |
| Academy / Track C | **A.** Nine visible lesson cards, accessible MP4s, English captions and transcripts. [Measured manifest](../video-academy/manifest.json). | Public endpoint availability and bounded playback checks are narrower than complete viewing of all nine films. |
| Deterministic migration, recovery and FPU | **C.** [21-check real local UI/API run](../submission/final-experience/evidence/journey-fa13e9e/README.md), including 17 validation checks and a verified USD 107.25 synthetic invoice. | The synthetic invoice is an observed test outcome, not customer revenue or a production provider posting. |
| Historical deployed Beta acceptance | **A, historical.** [Deployment checkpoints](../deployment/public-beta.md), [V1 acceptance](../reviews/v1-final-acceptance.md) and merged PR #37. | Dated release scope; not a fresh full end-to-end test of today's serving frontend/API. |
| Owner isolation, audit and recovery | **C** for [source/tests](../../tests/test_migration_listing.py), [threat model](../security/THREAT_MODEL.md) and prior acceptance; historical hosted scope remains in deployment records. | No fresh two-account authentication or isolation test here. |
| Advisor/Reviewer offline boundaries | **C.** [23/23 scripted scenarios](../submission/final-experience/evidence/agents/offline-agent-eval.json); no network or real-model calls. | Not evidence of semantic accuracy, live availability or accounting judgment quality. |
| 18 October live Gemini harness | **C — isolated development/test harness**, using a live cloud model; [owner-reported 14/14 checks](../reviews/live-gemini-l1-16e31e9.md). | One case, four calls, not a hosted product run and not publicly activated by that result. |
| Later hosted paired Gemini / Track B | **B.** A subsequent private hosted record supports separate Advisor/Reviewer runs and retained human authority. The owner holds raw evidence; it is excluded from this candidate. | This audit reviewed the existing record; it did not invoke inference or publish raw responses, identities, reservations or traces. |
| Public Gemini availability | **E** for fresh authenticated public execution. Later activation records and current “Live · limited evaluation” UI support a restricted evaluation being configured, rather than the old blanket “deterministic-only” statement. | Public activation is not general availability. No new authenticated public inference was run; a private proof, a video or a status label cannot fill that gap. |
| Evidence retrieval and uncertainty | **C.** [Read-only ADK implementation](../../agents/reasoning/adk.py), [Reviewer contract](../../agents/reviewer/agent.py), offline cases and bounded harness record. | Evidence projections are constrained inputs; no general web search, external accounting-data retrieval or production RAG quality is claimed. |
| Browser-local file validation | **C** in [intake architecture](../architecture/try-your-data.md); public entry **A** observed. | Browser validation is not hosted ingestion or permission to submit customer data. |
| Production provider integrations, delegated roles, managed model hosting, broad analytics | **D.** [Roadmap](README.md#08-future-development-roadmap). | Neither a diagram nor a technology dependency establishes implementation. |
| Customer outcomes and production model accuracy | **E.** No new measured customer evidence. [Metrics framework](../METRICS_FRAMEWORK.md) defines intended measurements. | Do not turn test pass counts into accuracy, time-saving or commercial impact claims. |

## Advisor, Reviewer and safeguards

The main-branch Reviewer builds an independent context and explicitly excludes Advisor wording.
Later paired implementations may pass a proposal separately from source facts. Independence therefore
means a distinct role, evidence projection and validated output—not a universal assertion that the
Reviewer never sees a proposal. Both roles remain advisory; deterministic accounting and human
approval are authoritative. The public Academy's corrected lessons 04/05/09 reflect this distinction.

The historical public-source harness enforces two calls per role, one read-only evidence tool,
2,048 maximum output tokens and no transport retries. Its 14 checks cover one synthetic case.
Later hosted controls include admission, bounded reservations and safe-off behavior. This snapshot
makes no promise about remaining quota, current campaign eligibility or billable cost. Historical
usage estimates are not invoices or guaranteed spending ceilings.

Recovery preserves audit history, original posting identity and explicit decisions. Invalid advice
falls back visibly. Operator rollback and model deactivation are separate release controls; this
portfolio does not execute them. [Migration controls](../architecture/migrate-resolve.md) ·
[First-use controls](../architecture/onboard-fpu.md) · [Live-model design](../architecture/live-gemini-adk.md).

## Public-safety decision

Included: seven original safe PPTX/PNG pairs, the existing public C4 equivalent, three fresh signed-out
screenshots, descriptive documentation and this audit's public media metadata. The original decks
were inspected for text, notes, external relationships, embedded content and credential/private-path
patterns; source bytes and attribution were retained. Previews were visually reviewed.

Excluded: private Gemini packages and raw release receipts, account identities, private session URLs,
operational logs, infrastructure-specific original architecture slides, delivery ZIPs, and all new MP4
copies. The separate source collections were read-only. The approved local SRTs remain in the archive;
existing public VTT links provide accessible captions without duplicate caption trees.

Publication still requires explicit owner approval. Missing Drive parity and absent final-demo V2 hosting
are recorded limitations; neither prevents a useful portfolio because verified local equivalents and
the already published Academy walkthrough are available. Publishing the older V2 film as a current
live-Gemini demonstration would be **NO-GO** without resolving its dated claims.
