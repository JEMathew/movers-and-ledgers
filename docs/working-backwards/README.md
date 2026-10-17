# Working Backwards decision package

Version 1, 17 October 2026. **Hypothetical mature experience, not a launch announcement.** This package reconciles the 11 October PRFAQ-001 draft in `movebooks-working-backwards-v01-draft/docs/product/working-backwards/` with the current delivery directive. It introduces no real-customer claim or new security authority.

Read [press release](product-press-release.md), [customer FAQ](customer-faq.md), [internal FAQ](internal-faq.md) and [decision summary](decision-summary.md). Implementation authority remains the constitution, deterministic financial controls, human decisions and release gates. The PR/FAQ guides what must be built and accepted, not what may bypass them.

For each major capability, [promise traceability](../product-management/promise-traceability.md) joins customer promise, persona/JTBD, requirement, acceptance, backlog, code/test, deployed evidence and outcome. [Feature contracts](../product-management/feature-contracts.md) turn the promises into acceptance criteria. [Discrepancies](../product-management/promise-traceability.md#promise-discrepancy-register) remain visible until evidence closes them.

Current truth: bounded synthetic Beta; deterministic Python orchestration; user-triggered advisory Gemini with public activation gated; no real provider writes. Reviewer/Play/intake sprint enhancements require candidate evidence. Existing audit/session records do not imply Firestore integration. Last-known cloud mode is deterministic-only and Firestore API disabled; this package makes no new cloud verification claim.

Approval status: product decision draft for review, not approved external publication. The Product Quality Judge must examine actual implemented/deployed behavior against these promises and must not credit future assumptions.

Current integration checkpoint: local code `fffd14c` supplies the playable mission, browser-local
validation fallback, independent mapping challenge and bounded asynchronous operational admission.
The [promise checkpoint](../product-management/promise-traceability.md#integration-checkpoint--17-october-2026)
and [acceptance matrix](../submission/acceptance-report.md) record what is tested and what is still
release-gated. An unfinished hosted capability remains on the backlog, not an implied delivery.
