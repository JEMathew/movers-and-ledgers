# MoveBooks AI V2 disclosure drafts for owner review

20 October 2026. **Unpublished, incomplete drafts. Do not deploy these as policies.** The public site and approved visual design are unchanged. The operator must supply the missing facts below and obtain appropriate legal review for its jurisdiction and intended audience.

## Minimum decisions before publication

| Required decision | Why it matters |
|---|---|
| Legal operator, address, jurisdiction and effective date | “Movers & Ledgers” branding does not establish the legal contracting party or privacy controller. |
| Working privacy contact and request procedure | The existing `/support` page is self-service Help; it does not receive requests or create tickets. A staffed support promise is unnecessary, but an actual privacy request channel is needed. |
| Retention and deletion schedule | Confirm Firebase identity, saved synthetic migrations, approvals/evidence, operational logs and backups separately. No automatic deletion period has been verified. |
| Google/Firebase profile and infrastructure data inventory | The API verifies UID and email; Firebase may retain additional provider profile fields. Confirm actual scopes, fields, infrastructure logs, processors, regions and transfers. |
| Applicable rights and lawful basis | Depends on the operator and audience. Do not invent legal bases, response deadlines or universal rights. |
| Terms covering eligibility, changes, termination and responsibility | Confirm who may use the Beta, how notices work, and legally appropriate provisions. No invented governing law, liability cap or indemnity. |
| Owner-reviewed publication locations | Publish real accessible policies and link them from the homepage only after approval. No placeholder URLs. |

Google's OAuth policy requires production-app homepages to link Privacy and Terms. It applies to authentication-only OAuth too; the label “Beta” does not itself settle whether an exception applies. The operator must determine the intended audience and applicable verification status. [Google OAuth policies](https://developers.google.com/identity/protocols/oauth2/policies).

## Proposed privacy notice text

**Scope.** This notice describes the MoveBooks AI synthetic Beta. The service demonstrates guided accounting-migration workflows. It is not connected to production accounting providers, and you must not submit real customer records, production financial data, tax or account numbers, passwords, or access tokens.

**Sign-in information.** Google sign-in is provided through Firebase Authentication. MoveBooks AI verifies your account identifier and email through its API to identify your session and control access to your workspaces. Authentication information is used to sign you in and maintain your session. Your Google password is entered with Google, not into a MoveBooks AI password form.

**Workspace information.** Signed-in synthetic workspaces can store sample business information, workflow progress, checkpoints, decisions and associated evidence. These records support resuming work and showing what decisions and checks occurred. Access is checked by the API against the signed-in account.

**Files checked in your browser.** On the hosted Beta, Try Your Data checks selected files in your browser. This feature does not upload those files to the MoveBooks API. Cloud export uploads are disabled. This statement concerns that file-checking feature; it does not mean that sign-in information or saved synthetic workspaces remain only on your device.

**Browser storage.** The application uses browser storage for appearance preferences, sign-in session state and migration-selection conveniences. Signing out is different from deleting stored account or workspace records.

**Operations and providers.** Google Cloud hosts the application and Firebase provides authentication. Application diagnostics record bounded operational information such as request or session references, status and timing. The operator must complete the separate provider, infrastructure-log, retention and international-transfer disclosures before this notice can be published.

**AI status.** Current Beta guidance uses deterministic rules. Gemini Advisor and Reviewer assistance is planned and unavailable in this Beta. The homepage-only “Built on Google Cloud” marketing statement describes hosting infrastructure; it is not a statement that live Gemini assistance is running for users.

**Retention, requests and contact.** These sections require the owner's verified retention schedule, deletion/request process, legal identity and reachable privacy contact. No deletion deadline, guaranteed outcome, support response time or statement about sale, advertising or model training is asserted in this draft.

## Proposed Beta terms text

**Purpose and limits.** MoveBooks AI is a bounded synthetic Beta for evaluating guided accounting-migration workflows. Sample results and progress indicators describe the supported synthetic workflows; they do not certify a real business's books or readiness. Real accounting-provider connections and production invoice posting are unavailable.

**Permitted use.** Use only authorized synthetic test accounts and synthetic data permitted by the Beta. Do not submit production customer or accounting records, credentials or tokens. Do not attempt to access another person's workspaces, circumvent access controls or disrupt the service.

**Your account and decisions.** Use an account you are authorized to operate. Review the account identity before acting. Consequential workflow decisions require the applicable human approval and validation. Guidance is not permission to bypass failed checks or perform actions outside the workflow.

**Guidance and attribution.** Current guidance uses deterministic rules. Gemini Advisor and Reviewer assistance is planned and unavailable in this Beta. Technology attribution does not imply Google endorsement or accounting-provider affiliation.

**Professional use.** The Beta is not accounting, tax or legal advice and is not a production or compliance-ready service. Do not rely on synthetic demonstrations to carry out real financial transactions or establish regulatory compliance.

**Help and availability.** The Help destination offers self-service guidance. It does not submit a support ticket, promise a staffed service or establish a response-time or uptime commitment.

**Privacy and completion.** The final terms must refer to the approved privacy notice and identify the legal operator. Eligibility, service changes, termination, data-access consequences, notices, governing law and any liability provisions remain for owner/legal review. This draft does not establish those terms or authorize publication.

## Publication checklist — approval still required

Production `/privacy` and `/terms` both returned **404** in the fresh 20 October 16:47 IST GET checks. No policies were published.

1. Owner supplies and verifies every missing fact in the decision table: legal operator, actual privacy request channel, collected data/scopes, processors/regions, retention/deletion, audience and applicable jurisdiction. Self-service Help is retained and cannot be described as ticket submission or a privacy inbox.
2. Legal reviewer resolves the draft clauses and records reviewer, approved version, effective date and intended Beta audience. Review the claims against the actual deployed data flows; deterministic guidance remains the current capability statement. Gemini work is outside this release.
3. Owner approves the exact final Privacy and Terms text and actual publication paths, together with a version/checksum. A draft or acknowledgement of the checklist is not legal approval.
4. Separately authorize local implementation/checkpoint and publication. Preserve approved layout; add only the necessary genuine policy links. Do not invent URLs, contacts or a footer destination before content is approved.
5. Before production promotion, verify both published documents are publicly readable without sign-in, linked from the homepage, keyboard accessible, and consistent with Google Auth Platform policy URLs and actual practices. Any OAuth configuration update requires separate authorization.
6. Retain the reviewed versions and approval record. Verify the privacy request procedure actually reaches its intended recipient without submitting real personal information as a test.

**Current result: BLOCKED at steps 1–3.** Review completion has no dependable ETA until the owner supplies these facts. Publication is not authorized.

## Accessibility release decision

The existing 25-second narrated video remains unchanged. It has no synchronized captions. Its “Video description” describes visuals, expressly excludes spoken captions, and has not been verified as a complete equivalent alternative.

| Issue | Release classification | Required action |
|---|---|---|
| Missing synchronized captions | **Blocking for a release meeting WCAG Level A/AA; unresolved public-release gate** | Accessibility workstream supplies and reviews captions. Today's deferral is not a waiver or a claim of compliance. |
| Meaningful alternative for essential visual information | **Blocking acceptance check until equivalence is assessed** | Review the existing description against the actual video; establish whether it satisfies the applicable alternative/description requirement. Do not assume absence of a second artifact means no alternative exists. |
| Self-service Help destination | **Nonblocking for self-service help** | Keep the truthful destination. It cannot substitute for a privacy request channel. |
| Missing reviewed Privacy and Terms | **Blocking public-release disclosure gate** | Complete owner facts and review, then separately authorize implementation/publication and homepage links. |

WCAG distinguishes synchronized captions from a text or audio alternative for essential visual information. Passing automated axe checks does not establish these media requirements. See [WCAG 1.2.2](https://www.w3.org/WAI/WCAG22/Understanding/captions-prerecorded) and [WCAG 1.2.3](https://www.w3.org/WAI/WCAG22/Understanding/audio-description-or-media-alternative-prerecorded.html). No full WCAG compliance or jurisdiction-specific legal conclusion is claimed.

## Closeout approval form — incomplete, not a policy

No final text is approved. Owner/legal review must supply the following record; “not provided” is an internal review status, never proposed public copy.

| Approval field | Current state | Evidence needed |
|---|---|---|
| Legal operator, address, audience, jurisdiction and effective date | NOT PROVIDED | Owner-confirmed facts; legal review of applicable scope |
| Reachable privacy contact and rights/request process | NOT PROVIDED | Real channel, responsible recipient and verified handling procedure; self-service Help is insufficient |
| Data map, provider scopes and processors/regions/transfers | PARTIAL DRAFT ONLY | Confirm application, Firebase, infrastructure logs and backups separately |
| Retention, deletion and account termination consequences | NOT PROVIDED | Operationally supported periods/procedure, including backup limitations |
| Applicable rights, lawful basis and required terms provisions | LEGAL REVIEW PENDING | Jurisdiction-specific review; no invented promises or deadlines |
| Exact approved Privacy and Terms text | NOT APPROVED | Reviewer, date, version/hash, intended audience and effective date |
| Publication paths, homepage links and OAuth consistency | NOT APPROVED | Final documents and separate authorization for publication/configuration changes |

Proposed route names `/privacy` and `/terms` describe intended implementation, not working published URLs. After text approval, create genuine pages and add those links to the existing minimal footer; do not publish this draft or add placeholder destinations. The actual final deployment must match the disclosed data flows. Review the deterministic/current-versus-planned AI statements again only if the approved deployed capability changes; do not incorporate separate Gemini development here.

Publication acceptance must establish readable policy text without sign-in, keyboard-accessible links, correct effective version and a real privacy request process. The completed action closes a trust/disclosure gate, not a claim of general legal compliance. Action A3 in the final closeout records its user, AI Builder and PM-review rationale.
