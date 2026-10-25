# MVP acceptance and publication evidence — 25 October 2026

[Product overview](../../README.md) · [Eight-artifact showcase](README.md) · [Video Academy](../video-academy/README.md)

**GO — judge-ready functional MVP.** Non-commercial, synthetic-data-only evaluation for approved
hackathon judges and interview panelists. This is a documentation closeout of accepted evidence,
not a new application test, security clearance, deployment or commercial-readiness certification.

## Four-P0 acceptance

| Requirement | Result | Evidence and attribution |
| --- | --- | --- |
| P0-01 — Approved judge access | **PASS** | Previously accepted authenticated Account B workspace access; not rerun for this publication. |
| P0-03 — Complete five-stage migration | **PASS** | Previously accepted existing synthetic migration, reconciliation and First Productive Use; no new migration or invoice. |
| P0-04 — Genuine Gemini Advisor and independent Reviewer | **PASS** | Owner's 25 October production visual verification reports the correct existing migration/mapping showing Advisor explanation, independent Reviewer **QUESTION**, grounding, uncertainty and the historical/no-model-call notice. |
| P0-05 — Isolation and financial safeguards | **PASS** | Previously accepted ownership, account isolation and human authority evidence retained; no new financial actions. |

### What the evidence establishes

- **Production screenshot-observed behavior, reported by the owner:** the saved Advisor explanation
  and independent Reviewer assessment were visible, with supporting evidence, uncertainty and
  retained human authority. The panel stated “Historical analysis restored. No model was called.”
  The owner's authenticated production screenshots are not attached to this documentation update;
  this statement records the owner's acceptance, not an independent reinspection of those images.
- **Earlier authenticated response evidence:** complete saved Advisor/Reviewer content, matching
  account/migration/mapping ownership and explicit Advisor–Reviewer linkage were inspected. Activity
  counts alone were not used as proof. Raw identifiers, response bodies and credentials are excluded.
- **Earlier exact-image protected preview:** restored genuine Advisor escalation guidance and
  Reviewer QUESTION/CHALLENGED assessment; matching grounding, uncertainty, historical labelling,
  clearing on mapping switch and restoration on reopening passed. This is preview evidence, not
  a substitute for the later production visual acceptance.
- **Earlier server-side release evidence:** 34/34 independent public smoke checks passed. The
  recorded production window contained 73 GET requests, zero mutation requests and zero analysis
  endpoint requests. The protected-preview window separately contained 57 GETs and zero mutation
  or new-inference requests. These bounded windows do not prove all activity during the owner's
  later manual check or unrelated users' activity.

No new model calls, migrations, financial writes or application regressions were run for this
portfolio update. Preserved receipts were read; raw operational evidence remains private.

## Released product identity

Accepted release evidence dated **25 October 2026 (IST)**; not a claim of a fresh cloud inspection
by this documentation task. The canonical public URL is [movebooks-si.web.app](https://movebooks-si.web.app/).

| Item | Accepted release identity |
| --- | --- |
| Production web | `movebooks-beta-web-p004-555eaac`, 100% web traffic in the release record |
| Web source commit | `555eaac961712352b5e355db10b3da1d44f605d3` |
| Immutable web image | `sha256:538b676ee5cb1a03802e8acbda13eab4ce572f3e8fcabbbbc4afea47e69fb4c4` |
| Production API | `movebooks-beta-api-b20-judge-sdk1`, unchanged at 100% in the release record |
| Retained web rollback target | `movebooks-beta-web-c5515ee1-academy`; no rollback performed |

GitHub [portfolio PR #40](https://github.com/JEMathew/movers-and-ledgers/pull/40) starts from
`54f1b3f2ca29e225a99159264b2a1df84ffdbf5b`; its original 24-file refresh is
`5bdafd173104959000d05a9626d9998407f64d3d`. Documentation publication does not merge the serving
application source onto main, change production, or imply that a clean clone reproduces deployed overlays.

## Capability and evidence classes

| Capability | Status | Limit |
| --- | --- | --- |
| Public landing, demo, guide and Learn | **Deployed and verified** within the recorded public checks | The demo uses sample evidence and does not execute a migration. |
| Four functional P0s | **Accepted**, with evidence attribution above | Bounded approved-account synthetic MVP; no commercial or all-user certification. |
| Saved Gemini explanations and independent review | **Production visually verified by owner**; payload and preview evidence previously collected | No new inference was needed. A saved case is not a model-quality benchmark or promise of unrestricted generation. |
| Nine Academy videos and captions | **Published**; dated media checks and hashes in the [manifest](../video-academy/manifest.json) | Thumbnail defect deferred; playback remains usable. Complete narration/timing review is not rerun here. |
| Release candidate tests | **Previously validated:** 992 frontend and 93 offline agent tests, build, TypeScript and lint | Historical candidate results, not tests run by this docs branch. |
| Exact released web security | **Previously validated:** production dependency audit and unchanged Grype High/Critical gate passed | Grype database age was 15.37 hours at promotion against a 72-hour limit; no claim that a scan stays fresh indefinitely. |
| Earlier local journey and harness | **Previously validated**, separately scoped [local journey](../submission/final-experience/evidence/journey-fa13e9e/README.md) and [18 October live harness](../reviews/live-gemini-l1-16e31e9.md) | Do not aggregate counts, equate harness with hosted product, or relabel screenshots. |
| Wireframes, real provider connectors, broader analytics and managed model hosting | **Planned**, see [roadmap](README.md#08-future-development-roadmap) | No real accounting-provider integration or implementation promise. |
| Custom domain and measured customer outcomes | **Unverified/unresolved** | Use the canonical Hosting URL; no savings, adoption or production accuracy claims. |

## Security and publication limits

[OpenTelemetry Issue #42](https://github.com/JEMathew/movers-and-ledgers/issues/42) remains open.
The ADK/OpenTelemetry compatibility blocker is unresolved; repository-wide CI is **not green**.
[PR #41](https://github.com/JEMathew/movers-and-ledgers/pull/41) contains the separately validated
Next.js web security patch. It has not been amended or merged by this work. No vulnerability
suppression, policy change or security-gate exception is implied by functional acceptance.

PR #40's original CI failed web/AI security checks on its unchanged application baseline.
The separately validated production web artifact and PR #41 do not retroactively make PR #40 green.
Updating PR #40 is a documentation publication decision; **merge remains NO-GO while mandatory
security gates are unresolved and requires separate authorization**.

Other known limitations: Academy thumbnail behavior is deferred, `movebooks.ai` is unverified/unresolved,
and the older final-demo V2 has no verified public hosting URL. The [published Academy walkthrough](https://movebooks-si.web.app/learn?tab=videos#lesson-09)
provides the existing captioned demo. No new media, diagrams or provider integrations are introduced.

## Screenshots, provenance and privacy

The existing three public screenshots were genuinely captured signed out on **24 October 2026 IST**
at the canonical production site: [demo](assets/demo-public-20261024.jpg),
[landing](assets/product-public-20261024.jpg) and [Academy](assets/academy-public-20261024.jpg).
Their original bytes and dates remain intact. They show public surfaces, not Account B's saved
Gemini results. The 18 October prototype deck is a genuine **local** capture; wireframes are proposals.
No image has been relabelled as the 25 October authenticated production acceptance.

The [showcase manifest](manifest.json) preserves original hashes and attribution. Seven original
PPTX/PNG pairs and the existing C4 sources remain unchanged; all eight artifacts are retained.
The [Academy inventory](../video-academy/README.md) retains all nine approved video and caption links.
Private screenshots, account/session/mapping/request identifiers, raw responses, operational logs,
credentials and private delivery archives are excluded. The owner-reported production acceptance
is explicitly attributed rather than illustrated using unrelated or reconstructed evidence.

No new design, media generation, application change or release is part of this documentation update.

## Documentation validation — 25 October 2026

The existing repository documentation checker reports zero findings across 158 Markdown and
692 text files. The portfolio link check resolves 163 internal references including anchors
and 36 public URLs, including all nine MP4, VTT and transcript endpoints. MP4 prefixes identify
valid containers; all nine current VTT hashes match the approved manifest. Original full-video
hash and timing results retain their 24 October date; full playback was not repeated.

All 20 showcase/source manifest hashes match, preserving the eight-artifact showcase. A bounded
privacy scan found no private account identifiers, local paths or credential patterns in the
updated portfolio text. Existing licensing notices remain byte-for-byte unchanged.

Local GitHub-flavored Markdown previews of the README, showcase, receipt and Academy rendered
on desktop and mobile without broken images or page overflow. All 12 existing GitHub-hosted
PNG/JPEG/SVG assets returned HTTP 200 and matched approved hashes. The updated text has not yet
been pushed, so its final github.com rendering remains a post-publication check.
