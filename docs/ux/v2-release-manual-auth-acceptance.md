# MoveBooks AI V2 manual authenticated acceptance

**Current preview decision:** the [collision assessment](v2-track-a-cloud-collision-plan.md) recommends a separate disconnected service for native memory acceptance first. It cannot support account testing. The `cand` destinations below are historical proposal URLs, not instructions to begin sign-in; the final authenticated host/backend scope must be separately approved.

20 October 2026. **Status: BLOCKED, not executed.** The owner's latest response explicitly confirms that account configuration and synthetic test-data setup still require verification. Do not assume A or B is authorized, that corresponding migrations exist, or that their contents are synthetic.

This procedure is for the exact V2 candidate after separately approved publication and deployment. The existing private preview is `ab46546`; the current `cand` tag points to an older production revision. Neither is acceptance evidence for `e7f1e288fd7f378045950fc94d5d7c89e298575f`.

## Exact destinations and current results

Fresh read-only checks at 16:47–16:48 IST on 20 October confirm the old `cand` target is `movebooks-beta-web-rel01d105c`. Google sign-in is enabled and the candidate domain is authorized. This does **not** verify account audience permissions or existing synthetic records. Initial Firebase GETs returned 403 without the quota-project header; the corrected read-only requests returned 200, with no IAM changes.

**Do not start candidate sign-in until the revision and published digest are verified.** These are the planned destinations after approval:

| Purpose | URL |
|---|---|
| Candidate sign-in / return target | `https://cand---movebooks-beta-web-33s3hhbhua-as.a.run.app/sign-in?next=%2Fworkspace` |
| Candidate workspace / reload | `https://cand---movebooks-beta-web-33s3hhbhua-as.a.run.app/workspace` |
| Candidate landing / video fragment | `https://cand---movebooks-beta-web-33s3hhbhua-as.a.run.app/#product-vision` |
| Existing production control, not V2 acceptance | `https://movebooks-si.web.app/` |
| Production Google audience configuration, owner inspection only | `https://console.cloud.google.com/auth/audience?project=movebooks-ai` |

Use Account → Settings and each account's existing own-migration link from the UI; do not invent a migration ID or put a private reference in this public checklist. The eventual backend and candidate origin require separate explicit approval. The old `cand` API is not accepted evidence; do not infer authorization to connect this candidate to the main production API. Any approved API must match the reviewed identity and route contracts.

| Acceptance evidence | A | B |
|---|---|---|
| Audience/configuration and existing synthetic migration confirmed | BLOCKED: awaiting owner verification | BLOCKED: awaiting owner verification |
| Interactive sign-in, expected identity | NOT RUN | NOT RUN |
| Existing own-migration list, read and deep-link reload | NOT RUN | NOT RUN |
| Account/Settings keyboard access and theme persistence | NOT RUN | NOT RUN |
| Observed normal token refresh and subsequent own-account read | NOT RUN | NOT RUN |
| Sign-out, Back/reload protection, return destination | NOT RUN | NOT RUN |
| Hosted cross-account isolation | BLOCKED: excluded scope | BLOCKED: excluded scope |

## Operator readiness

### Owner preflight — before any candidate sign-in

Complete this separately for aliases A and B. Keep email addresses and workspace identifiers in your private records; report only the alias and result.

1. **Identify the existing account.** Privately confirm which existing Google account corresponds to A/B and that you control it. Do not create an account or submit credentials to this chat.
2. **Check the correct project.** Open the Google Auth Platform audience page linked above for **`movebooks-ai`**, using existing authorized administrative access. Inspect only; do not change audience, test users, IAM or settings.
3. **Confirm audience eligibility.** Record whether the OAuth app is Internal or External and its publishing status. For an External app in Testing, confirm the exact account is already an allowed test user where required. For Internal, confirm it belongs to the permitted organization. For an External published app, confirm applicable organization/account restrictions do not exclude it. If the setting or eligibility cannot be established, mark BLOCKED; provider-enabled/domain-authorized checks alone are insufficient.
4. **Verify existing workspace provenance without opening unknown customer data.** Use existing trusted synthetic fixture/seed manifests, test-run records or a verified statement from the workspace's data owner. Establish that the workspace already exists, belongs to A/B, and was created solely from synthetic fixtures. A workspace called “demo” or “test” is not enough. If records are absent or provenance is uncertain, stop here and mark BLOCKED; do not browse records to discover whether they contain real data.
5. **Confirm safe scope.** From those existing records, confirm the intended workspace has no real customer records, production accounting-provider connection or live financial actions. Keep a private mapping of account alias → known synthetic workspace and its provenance source. Do not upload, create, reset or modify a migration to satisfy this step.
6. **Return a minimal result.** For each alias report: account identified YES/NO; audience eligibility VERIFIED/BLOCKED; existing own-workspace VERIFIED/BLOCKED; synthetic-only provenance VERIFIED/BLOCKED; no live connection VERIFIED/BLOCKED. No emails, IDs, financial details or credentials are needed.
7. **Stop before sign-in.** Even if both preflights pass, wait for the exact candidate revision/digest to be deployed and separately approved for acceptance. Then use the procedure below in separate browser profiles. Do not test the old `cand` target.

Any unverified row blocks that account's hosted acceptance. Do not inspect production-connected real data or infer isolation from two successful own-account reads.

### Candidate readiness — only after separate deployment and acceptance approval

1. Confirm the deployed candidate revision, image digest, exact hero hash and source SHA against the release record. Do not start on the current old `cand` target.
2. Confirm the production project's Google provider remains enabled. Read-only verification found it enabled and found `cand---movebooks-beta-web-33s3hhbhua-as.a.run.app` already authorized on 20 October.
3. The owner checks the production Google Auth Platform audience/test-user configuration and confirms A and B are permitted. Do not change configuration or inspect the off-limits dev project. No passwords, tokens, exported storage, cookies or HAR files are needed.
4. Confirm the candidate proxy permits its HTTPS origin. The planned tag origin is absent from the current proxy environment; its addition needs explicit approval with deployment.
5. Use ordinary Chrome or another supported external browser with two separate fresh profiles. The owner performs every Google interaction. Do not use an embedded in-app browser for OAuth.
6. Both accounts must have existing, owner-confirmed synthetic migrations. If the owner cannot confirm this, stop migration checks and mark them BLOCKED. Do not create samples, uploads, migrations or approval records to make the checks pass.

## Read-only own-account checks

Repeat steps 1–7 separately for A and B. Never paste one account's migration reference into the other's profile.

1. Open the approved candidate `/sign-in?next=%2Fworkspace`. Select Sign in and complete the Google popup manually. The Account menu must show the expected verified email. Record only “matches A” or “matches B”, not the email.
2. Follow the logo to Member Home/My Migration. If several migrations appear, choose only an existing synthetic migration belonging to this account. Check its known name and status privately. An empty account is not a successful populated-migration check.
3. Reload `/workspace` and the current own-account migration link. Identity, selected migration and saved state should remain consistent. Do not advance a stage, approve, retry, configure, post or verify a financial operation.
4. Open Account → Settings. Exercise keyboard navigation and Dark / Light / System, then reload. These local appearance changes must persist without changing workflow state.
5. Keep the session open until a normal token-refresh interval has elapsed (allow at least 65 minutes), then reload and confirm identity and own-account reads still work. Record an observed successful refresh request/event timestamp and subsequent successful authorized read; elapsed time or a reload alone does not prove token refresh. In browser tools inspect only request name/status/timing, never copy authentication payloads, headers or tokens. If refresh cannot be observed safely, mark that row BLOCKED. Do not revoke tokens or change Firebase settings for this test.
6. Sign Out. The Account menu must clear. Reload the own-account `/workspace` link and verify no data appears without sign-in. A public HTML shell returning 200 is acceptable; private API data must require authentication. Back must not display the prior account's private data.
7. Open the same own-account deep link while signed out, complete sign-in manually, and verify the intended destination is restored. If a popup is intentionally closed, the app must remain signed out without a demo fallback.

Save a small result table with source SHA, revision/digest, UTC time, browser version, account alias, step and PASS/FAIL/BLOCKED. Mask emails and truncate migration references in any screenshots. Never export authentication material.

## Checks excluded by the current authorization

- Cross-account reads, forged references, cross-account writes and same-profile A→B stale-state probes against production-connected data are **not authorized**.
- The existing `docs/v2/release/auth-isolation/isolation_check.py` deliberately sends A's references as B. **Do not run it against this production-connected candidate.** Its earlier instructions to create a sample or test foreign-owner actions are superseded by the current boundary.
- Own-account success is not proof of cross-account isolation. Hosted isolation remains BLOCKED unless qualifying existing evidence is supplied or a separate safe environment and test scope are authorized. `movebooks-ai-dev` remains off limits.
- Revocation, mutation, approvals, configuration, invoice execution and destructive tests are excluded.

Local identity, owner-listing, proxy-denial and account-switch regression tests provide supporting evidence, not a replacement for the missing hosted acceptance.

## Final closeout handoff

**A = UNVERIFIED; B = UNVERIFIED; hosted authentication/isolation = NOT PASSED.** The Stage 2 memory preview was deleted and cannot be used for sign-in. Its IAM-authenticated HTTP calls used the operator's Cloud Run access, not either account's Firebase identity. Public `/workspace` HTML is not private-workspace acceptance.

Return only this non-sensitive owner record for each account:

| Alias | Google audience eligibility | Distinct owned workspace | Synthetic fixture/provenance record | No production provider/data | Ready for separately approved sign-in |
|---|---|---|---|---|---|
| A | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED | NO |
| B | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED | NO |

Keep the corresponding identities and provenance documents private. Distinct browser profiles do not establish distinct server-side owners: verify the owner mapping from authorized existing records. No account or migration creation is requested.

Once those records pass, the owner must approve the exact final image/revision, authenticated hostname, backend/data boundary and permitted checks. The historical `cand` URLs above remain inactive instructions until that happens. Own-account acceptance may then use the existing read-only procedure with human interactive sign-in and observed refresh. Cross-account denial and stale-session checks require a separately approved safe synthetic environment/scope or qualifying existing evidence. Do not run foreign-owner probes on production-connected data. If a prerequisite is unavailable, record BLOCKED without opening unknown records.

Action A4 in the closeout records the benefit and evidence rationale. Minimum acceptance record: alias, candidate digest/revision, browser, timestamp, authorized step, expected result, actual result and PASS/FAIL/BLOCKED; no credentials, tokens, exported storage or financial/customer payloads.

## Local preview versus hosted acceptance — acceleration update

The owner review build on `http://127.0.0.1:3117/` explicitly sets `NEXT_PUBLIC_LOCAL_UX_PREVIEW=true` at build time. It does not initialize Firebase in the identity provider and has no Firebase project/key/auth-domain configuration or private API origin. Its Sign In link leads to a local explanation; Explore Demo remains authored synthetic data and Try Your Data remains browser-local. This build cannot certify hosted Google sign-in, session persistence, account isolation or financial execution.

The reported “Google sign-in is not configured for this site” message is the exact `auth/unauthorized-domain` mapping in `apps/web/lib/identity.ts`, displayed by `IdentityProvider` / `IdentityFeedback` following the Firebase popup failure. The previous local build retained public Firebase configuration but had no deliberate preview disable flag. The reported error is consistent with the local origin not being authorized; no Firebase configuration mutation or new live sign-in attempt was made to diagnose it. The new local flag prevents that attempt instead of weakening the domain check.

For a future exact-commit hosted build, **omit `NEXT_PUBLIC_LOCAL_UX_PREVIEW`** (or use `false`) and verify the emitted identity behavior, public Firebase build settings, approved same-origin API configuration and synthetic-only environment before publishing. These public build-time variables cannot be corrected merely by changing runtime environment variables after building. Hosted controls are covered by mocked regression tests only; all A/B rows above remain UNVERIFIED/NOT RUN. Reverify the target revision, service owner and Gemini collision assessment immediately before any authorized cloud write. Do not repurpose the completed disconnected memory preview as an authentication environment.
