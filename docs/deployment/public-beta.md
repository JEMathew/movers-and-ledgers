# Public Beta connectivity and release gate

**V1 baseline LIVE / GREEN — MoveBooks AI V1.0 bounded synthetic public Beta.**
The historical post-merge CI fixture hold is resolved. The post-V1 account-shell regression
is **GREEN for its exercised live scope** and merged in PR #21. Safari verification of
deployed source `d19b7a3` passed: API-verified User A identity, compact Settings, Product/Guide
navigation and refresh, one-click Sign out, protected denial and no stale identity restoration.
The 390 × 844 signed-in Safari responsive viewport fit the account/navigation controls.
The final bounded read-back found 73 log entries, no ERROR/5xx, no business-write requests,
no running jobs and unchanged API privacy/IAM/SQL. These are bounded observations, not
production/compliance certification. Earlier AMBER handoffs below are retained as history.

## Public-brand preparation — 30 September 2026

**AMBER / not ready to publish or merge the new brand slice.** Branch
`feat/public-brand-experience` starts from main `5e01f7e9dc7c25f4aaa5345c3ffb9a27e7a9015a`,
including merged [PR #21](https://github.com/JEMathew/movers-and-ledgers/pull/21).
All seven jobs in [main CI run 36749557786](https://github.com/JEMathew/movers-and-ledgers/actions/runs/36749557786)
passed. The working tree was clean before the scoped copy/evidence changes.

Read-only baseline at 17:21 UTC confirmed web `movebooks-beta-web-00012-tjn` public and
API `movebooks-beta-api-00012-z5n` private, with the immutable images recorded below.
Both retain min 0 / max 1 / concurrency 8. Service/project IAM and runtime fingerprints,
SQL RUNNABLE/ALWAYS configuration and the existing identities are unchanged. All listed
validation job executions are completed. No cloud/Firebase/DNS change or deployment was made.

### Firebase Hosting selection — replaces the paid-domain plan

The only selected new public URL is `https://movebooks-si.web.app`. The product remains
**MoveBooks AI**, not MoveBooks SI. No paid domain or custom domain mapping is planned.

The Firebase Hosting API validation-only request returned 200 for `movebooks-si`; the
subsequent authorized create returned `projects/movebooks-ai/sites/movebooks-si` and
`https://movebooks-si.web.app`. The fallback `movebooks-ai` already exists as this project's
default site and was not changed. Site creation reserves the name; it does not prove the
application or authentication works there. No Hosting release is live from this change yet.

Fresh baseline at 18:14 UTC confirms the same private API/public web revisions, service and
project IAM fingerprints, min 0 / max 1 / concurrency 8 and SQL RUNNABLE/ALWAYS configuration.
All 19 retained validation executions are completed. No backend service, SQL or IAM change
is part of this slice. Normal gcloud Cloud Shell SSH setup created a local operator SSH key;
this is not a workload/service-account key or a workload IAM grant.

`firebase.json` describes a catch-all rewrite to existing `movebooks-beta-web` in
`asia-southeast1`. No direct API rewrite, load balancer, VPC or new application service is
introduced. The Hosting release will follow the current web service rather than adding
Cloud Run revision tags. Firebase Hosting supports this region; its request timeout is
60 seconds. Preserve private/no-store proxy responses and never cache identity/workspaces.
See [Firebase's Cloud Run integration](https://firebase.google.com/docs/hosting/cloud-run).

The web build uses `NEXT_PUBLIC_API_BASE_URL=/api` so each supported browser origin uses its
own authenticated proxy. `MOVEBOOKS_PUBLIC_WEB_ORIGIN` remains the operational Cloud Run
origin; `MOVEBOOKS_ADDITIONAL_WEB_ORIGINS=https://movebooks-si.web.app` is the only additional
deployment-owned origin. HTTPS, exact origin checks, cross-site denial, Firebase verification,
fixed API audience, request allowlist, header stripping and backend ownership remain intact.
No arbitrary Host/Origin value becomes a trusted origin or API destination.

After the scanned web revision is ready, add only `movebooks-si.web.app` to Firebase
authorized domains, preserving all existing entries. Human Google sign-in, verified email,
navigation/refresh, Settings/account menu, sign-out and protected denial are required before
canonical-link replacement. README links and GitHub settings remain unchanged until then.

The web.app hostname and managed HTTPS avoid domain purchase/renewal. Hosting currently
includes 10 GB storage and 10 GB/month transfer at no charge; Blaze overages are $0.026/GB
stored and $0.15/GB transferred. Cloud Run requests/data transfer and existing SQL charges
continue; this is a free hostname/allowance, not a spending cap. See
[Hosting pricing](https://firebase.google.com/docs/hosting/usage-quotas-pricing).

### Product Vision and trust changes

Approved source: `hf_20260928_094916_5d9b8dc0-6092-42e1-8f50-93035076fb0b.mp4`.
Master: 50,986,565 bytes, 25.04 seconds, 1920 × 1080 at 24 fps, HEVC Main 10/BT.709 and
AAC-LC stereo 32 kHz. SHA-256:
`bcf1e356e7f5fd0c7f9af37389bc921d7df900246b5d3aec7353ad1f7a8376ce`.

One repo copy of the optimized media lives under `apps/web/public/media/`, shared by local
Next.js, the production image and README-relative links, instead of duplicating the binary
under docs and runtime. The Docker runtime now copies this public directory.

- `movebooks-ai-product-vision.mp4`: 6,593,004 bytes; H.264 High/yuv420p; fast-start;
  unchanged 1920 × 1080, 24 fps and 25.04 seconds. Approximately 87% smaller.
  SHA-256 `6ba11a2dfcdebe4f38750e0762349fc8d0ed766531ac6fc19b922d65abcc3ada`.
- `movebooks-ai-product-vision-poster.webp`: 92,446 bytes; 1280 × 720, extracted from the
  approved film. SHA-256 `6b96ca4ee684c653a6de9fb58add5877021d653937b021efa8b3b219905e08e7`.
- AAC packets were copied unchanged; both audio hashes:
  `07b226be0ffce04a0e7f7b9c83f8592f1e1566efca21e62c9809bad98ecf86b1`.

The native, keyboard-operable player sits after the five-phase journey and before Trust.
It has a poster, explicit controls, inline playback, no autoplay/loop, `preload=none` and
fixed 16:9 geometry. No video is needed for initial render; initial local state was paused,
readyState 0 and zero buffered ranges. Keyboard play reached readyState 4 at 1920 × 1080.
No third-party player/tracker was added. Approximate optional transfer: 92 KB poster plus
6.59 MB on play; homepage first-load JavaScript remains 111 kB. These are bounded local
observations, not a field Core Web Vitals measurement.

README has a clickable poster near the top and explicitly distinguishes Product Vision
from the working Beta and a real product-screen Demo. Sampled imagery shows the five current
phases and Business Ready · Verified; depicted financial screens are conceptual, not live
Beta screenshots. Historical "First Real Task" wording is retained. No creative was
regenerated. Full narration transcription/caption review remains a non-blocking follow-up.

The approved trust sentence appears once in the landing Trust lead-in. The stack attribution
is subtle beneath its cards. Trust clarifies verified human approval, deterministic financial
truth, safe fallback, public deterministic-only routing and bounded synthetic Gemini evidence.
The projection excludes uploaded exports, raw financial rows/amounts, actors, comments and
credentials. Neither live models nor managed ADK are activated.

Local gates: 204 frontend tests pass across 24 files, lint/typecheck pass, production build
passes; repository checks cover 94 Markdown/373 text files with zero findings and whitespace
checks pass. New tests cover same-origin HTTPS identity URLs, explicit Hosting origin
allowlisting, malicious/absent/cross-site origin rejection, media packaging and bounded native
playback. Backend code and business controls are unchanged. Image scan, live Hosting auth,
README remote rendering and final release clearance remain pending.

Local visual checks at 1280 × 900 and 390 × 844 passed in light/dark themes with no horizontal
overflow and no captured console errors. Native controls accepted keyboard play/pause; both
media paths returned HTTP 200 with the expected type and size. Fixed media geometry is
reserved before playback. No Safari sign-in on Hosting is claimed by these local checks.

GitHub recommendations only (not applied): homepage `https://movebooks-si.web.app` after
HTTPS/auth gates pass; About: "Provider-neutral, evidence-driven agentic accounting migration
and onboarding platform with deterministic financial controls and human governance."
Topics: `agentic-ai`, `accounting`, `migration`, `onboarding`, `fintech`,
`human-in-the-loop`, `gemini`, `google-adk`, `google-cloud`, `product-management`.

## Account and migration-entry cleanup — 30 September 2026

### Exact-source web deployment — Safari authentication handoff

**AMBER; not cleared for merge.** Authorized source
`d19b7a3846a8e3561a1c0f9152528e69f0295284` on `release/account-shell-regression`
had a clean working tree. Only a new web image was deployed; no API deployment,
IAM/SQL/Firebase/runtime-configuration change or business mutation was performed.

Fresh artifact evidence:

- Clean, no-cache Linux amd64 web build passed, including production compilation,
  build-time lint/type validation and generation of 25 pages.
- Production `npm audit --omit=dev`: **0 vulnerabilities**.
- Existing pinned Grype `--fail-on high` gate: **0 Critical / 0 High / 5 Medium /
  1 Low**, exit 0. No ignore, suppression or only-fixed filter was used.
- Source archive SHA-256:
  `61553d8faf8e3ad39b0736b2514877947202e431c3db168b7260407e13b85dae`.
- Scanned image archive SHA-256:
  `68dde6b325ed0ed1ce3f1beb996ac42e73cd59638534ad004b6d4d89b7845a45`.
- Initial scan report SHA-256:
  `7352e742ef2f0160326c259d46b0b9f341451cd883fde8948fdf51475af403d6`.
- Published image:
  `asia-southeast1-docker.pkg.dev/movebooks-ai/movebooks-beta/web@sha256:8d9812d6077abf08c90dd0868684cab392c010bebcd35f0ca869f3f50268e397`.
  The published configuration/rootfs matched the scanned archive, configuration
  SHA-256 `bf10ad02254090863bd3207278b26b4d0edc27569325002bcf457e04fe0e5af0`.
- An accidentally queued duplicate Cloud Shell build was terminated before
  publication. It overwrote the temporary initial report, not the deployed
  immutable artifact. The exact deployed digest was subsequently pulled and
  scanned again with the same strict pinned gate: **exit 0, 0 Critical / 0 High /
  5 Medium / 1 Low**. Retained replacement report SHA-256:
  `2a327788596e9599ab449caf56fd4ebcdce639c0a57425a0096704d807d00b15`.
  Residual `glibc-2.44 2.44-r6` matches: Medium CVE-2026-77117, CVE-2026-80489,
  CVE-2026-8674, CVE-2026-89092, CVE-2026-86805; Low CVE-2026-95818. These
  remain tracked follow-ups, not suppressed findings or a vulnerability-free claim.

Web revision **`movebooks-beta-web-00012-tjn`**, created
**2026-09-30 14:06:34 UTC**, is Ready and serves **100%**. Public origin remains
`https://movebooks-beta-web-411600344727.asia-southeast1.run.app`.
Rollback target **`movebooks-beta-web-00011-p9v`** remains available; its immutable
image is `sha256:1e97ed9c8c0e0cc40ce919989eeaf7c40350f932e4c0531a06a71dc443240d16`.
An owner-approved rollback would route web traffic back to that revision, without
changing API, IAM or SQL. No rollback was performed.

Read-only preflight at 13:52 UTC, pre-deployment at 14:05 UTC, post-deployment
at 14:07 UTC and final read-back at 14:14 UTC matched the service
configuration/IAM and SQL fingerprints:

- Web remains public; API remains private with no public invoker. The existing
  dedicated web identity retains service-level API invocation only.
- Both services retain automatic scaling, min 0 / max 1, concurrency 8, existing
  identities, environment/secrets, ingress and CPU-throttling settings.
- API remains `movebooks-beta-api-00012-z5n`, image
  `sha256:925d5d218b925e2324ca03352aeea07db428485663989cfb5d0f1b0041bf5411`.
- SQL remains RUNNABLE / ALWAYS, `db-f1-micro`, 10 GB, encrypted public-IP
  connectivity with no authorized networks. No pending SQL operation or project
  IAM drift was found. Recurring resource sizing/cost posture is unchanged.
- Authenticated Cloud Run `/readyz` returned application **200**; IAM-only
  identity/preserved-onboarding requests returned **401**; anonymous direct API
  readiness/identity/preserved-onboarding requests returned Google edge **403**.
  Native container liveness remained successful.

Signed-out live checks:

- HTTP **200** for `/`, `/product`, `/workspace`, `/sign-in`, `/guide`, `/simulator`,
  `/learn`, `/play`, `/trust`, `/feedback`, `/support` and the anonymous preserved
  `/onboard-fpu` page shell. **26 static assets returned 200**. Anonymous proxy
  identity and preserved-onboarding GETs returned **401**; a page shell's 200
  does not grant protected workspace access.
- Desktop and 390px mobile checks found one Settings entry, Google sign-in,
  no Sign out/stale email and no horizontal overflow on the required surfaces.
  Compact Settings rendered in light/dark, with theme preference and device
  reduced-motion guidance only; no Session section. Escape/close returned focus,
  outside-pointer dismissal worked, and mobile navigation coexisted with controls.
- The requested home migration reasons, all three explicit customer questions and
  “Migration is more than moving files” wording were present. The replaced
  ambiguous home phrases were absent. Product retained its customer-facing entry.
- A fresh Safari **private** `/workspace` showed the correct signed-out surface.
  The first enabled **Continue with Google** click opened Google's sign-in popup;
  no second click was made. The owner was asked to complete User A sign-in/MFA.
  No password, token or session cookie was extracted or requested.
- Final bounded new-revision log read: **214 entries, 0 ERROR-or-higher/5xx**;
  **0 unfinished Cloud Run jobs**. This is bounded evidence, not a universal
  absence-of-errors claim.

Still required: completed Safari callback/API-verified User A email, signed-in
Settings/menu behavior, read-only Go to migration/owner workspace access, one-click
Firebase-confirmed Sign out, absence of stale identity restoration, and protected
denial afterward. The reported P1 remains **fixed locally, live clearance pending**;
P0 observed: **0**. No new P2/P3 defect was found in completed scoped checks;
Medium/Low image advisories and existing operational follow-ups remain visible.
No scenario, approval, invoice, migration or preserved FPU state was changed.
No merge, tag or V1 release modification was performed.

### Historical local sign-out event handling and compact preferences

The owner confirmed first-click chooser, correct API-verified email, no false session-attention
state and a working account-menu disclosure on deployed candidate `310c45b`. The owner then
reported unreliable Sign out and requested a narrower Settings surface and clearer home copy.
These findings supersede the pending callback checkpoint below, not its historical evidence.

**Root cause reproduced locally:** account-menu `onBlur` treated a null `relatedTarget` as
an outside focus move. A non-focusing pointer click (Safari ordering: pointerdown/mousedown,
focused Settings blur to null, mouseup/click) unmounted Sign out before its click handler.
The added regression failed on the original implementation because the button was removed.
This blocks the handler before Firebase sign-out, identity/session-reference clearing and
navigation; it is not evidence of a Firebase or backend authorization failure.

The fix keeps the action mounted for null-target blur, while retaining real focus-exit,
outside-pointer and Escape dismissal. The unchanged provider still waits for Firebase
confirmation, clears only selected-session references, navigates to `/sign-in`, displays a
sanitized failure on rejection and invalidates stale in-flight verification. No Firebase,
API/proxy authorization, migration/financial code, IAM, SQL or runtime configuration changed.

Settings now uses a compact anchored, non-modal dialog with System/Light/Dark and existing
device reduced-motion guidance only. Session/authentication information remains in the
account UI. Initial theme focus, Escape/close focus return, outside click, keyboard exit
and Safari non-focusing click behavior have regression coverage. There is no duplicate
Settings button. Desktop and 390px mobile light/dark rendering, visible focus, theme changes
and outside dismissal were inspected locally; no horizontal overflow was observed.

Home uses the owner-supplied “Why businesses migrate” heading, supporting text and four
reasons, plus the three explicit data/numbers/business-readiness questions and explanations.
The existing card/grid layout is retained. The shared header's Go to migration remains
`/workspace` and issues no mutation; the existing Product continuation may link to the saved
journey's authoritative stage using a read-only request. No CTA or workflow was redesigned.

Local validation:

- Focused account/auth/runtime/public-surface regressions: **89 passed / 5 files**.
- Full frontend: **193 passed / 22 files**.
- Backend identity/runtime: **57 passed**; existing Starlette deprecation warning only.
- Frontend lint, typecheck and production build: passed.
- Repository/link/credential-pattern checks: **94 Markdown / 369 text files, 0 findings**.
- Whitespace check: passed.
- Success/failure sign-out, all three session-reference removals, sanitized retry feedback,
  stale-verification rejection and SDK-user removal followed by denied protected headers
  pass locally. These mocked/local contracts do not establish a new live sign-out result.

Live reproduction limitation: the previously authenticated Safari window was no longer
available. A fresh live `/workspace` tab was signed out. Human User A sign-in was requested;
no credentials were extracted and no automatic Google sign-in was attempted. Live tracing
and protected-denial-after-sign-out must be repeated with the fixed deployed candidate.

Assessment: **local checks GREEN; release AMBER**. P0 observed: **0**. The reported sign-out
issue is **one P1 release blocker, fixed locally but not live-cleared**. Settings weight and
copy clarity P2 findings are addressed locally. No new P3 identified; existing operational
and image-advisory follow-ups remain unchanged. Do not claim final P1 clearance or merge.
Next: review the local fix, authorize a scanned web-only deployment, then complete the
human-present Safari sign-out/protected-denial regression. No deployment or cloud change
was made in this follow-up.

### Historical exact-candidate deployment; initial Safari handoff

**AMBER — DEPLOYED, RELEASE DECISION REQUIRED.** Signed-out smoke and security gates
passed; real Safari callback, signed-in/menu/session/sign-out, mobile authenticated and
preserved-journey checks remain pending. This is an incomplete gate, not a finding of
broken authentication. Do not merge or use earlier local fixtures as live clearance.

Candidate: `310c45b3937d272b3ddd46b7130887bc3780f621` on
`release/account-shell-regression`. The tree was clean before evidence updates. Review of
the candidate diff found only the intended presentation/copy/tests/documentation changes;
identity-provider, auth/proxy libraries, backend, infrastructure, migration and financial
controls are unchanged. No defects were repaired during this validation attempt.

Fresh repository-authoritative checks:

- `npm test`: 188 passed / 22 files.
- `npm test -- test/account-shell.test.tsx test/google-sign-in.test.tsx test/runtime-identity.test.tsx components/public-surfaces/surfaces.test.tsx`:
  71 passed / 4 files.
- `npm run lint`, `npm run typecheck`, `npm run build`: passed.
- `npm audit --omit=dev`: 0 vulnerabilities. The first sandboxed audit was unable to
  resolve the registry; the normal-network rerun above passed, without changing the gate.
- `.venv/bin/python scripts/repository_checks.py`: 94 Markdown / 369 text files, 0 findings,
  including repository links and the existing bounded credential-pattern scan.
- `git diff --check`: passed.
- `.venv/bin/pytest tests/test_identity_display.py tests/test_runtime_faults.py tests/test_validation_failures.py -q`:
  24 passed; existing Starlette test-client deprecation warning only.

Read-only cloud preflight at 12:53 UTC matched the previous configuration fingerprints:
web `movebooks-beta-web-00010-zll` public, API `movebooks-beta-api-00012-z5n` private,
min 0/max 1/concurrency 8, SQL RUNNABLE/ALWAYS, no service/project IAM or SQL drift.
Unchanged API readiness returned application 200; IAM-authenticated requests without
Firebase identity to identity/preserved onboarding returned 401; anonymous direct API
requests returned 403. No business writes or sign-in occurred in these probes.

The exact source archive SHA-256 is
`19da34caa55eaaadece96edae42bd82f2ec6bca6fb55e5f43c1fa538b38286e3`.
The existing browser Cloud Shell path is used for the clean web build and unchanged pinned
Grype `--fail-on high` gate. A requested new default SSH key was blocked by the local
approval boundary and was not created/uploaded; browser Cloud Shell requires no new SSH
access. Build/scan/publication completed with exit 0. Local fixture results do not
establish live readiness.

Deployment evidence:

- Project `movebooks-ai`, region `asia-southeast1`, existing web service only.
- Image `sha256:1e97ed9c8c0e0cc40ce919989eeaf7c40350f932e4c0531a06a71dc443240d16`,
  registry `asia-southeast1-docker.pkg.dev/movebooks-ai/movebooks-beta/web`.
- Fresh Grype: **0 Critical / 0 High / 5 Medium / 1 Low**; no ignore/only-fixed filter.
  Report SHA-256 `4558b1ee315de53a893fc6c5885a029802404bdeec41247a7bbffbe26116b912`;
  image archive SHA-256 `0913c86d32fe20129311c4bff665e8aa52c0d70b0d4ae12421813a7d95ebac9d`.
  Published configuration/rootfs matched the scanned archive; configuration SHA-256
  `7e7a7c0f3c56d449c3d34fe98d811b406909d87abf35bc63b1b2532bba38d01e`.
  Residual matches are `glibc-2.44 2.44-r6`: Medium CVE-2026-77117, CVE-2026-80489,
  CVE-2026-8674, CVE-2026-86805, CVE-2026-89092; Low CVE-2026-95818. They remain
  visible follow-ups, not suppressed findings or a vulnerability-free claim.
- `gcloud run services update movebooks-beta-web --image=<immutable registry digest above>
  --project=movebooks-ai --region=asia-southeast1 --quiet` changed only the image.
  Revision **`movebooks-beta-web-00011-p9v`**, created **2026-09-30 13:06:25 UTC**,
  Ready and serving **100%**. No API redeployment.
- Post-deployment read-back matched all preflight runtime/IAM/SQL fingerprints, except
  the intended web image/revision. Web public; API private and unchanged; min 0/max 1,
  concurrency 8; SQL RUNNABLE/ALWAYS. No business mutation or new access grant.
- HTTP 200: `/`, `/product`, `/workspace`, `/sign-in`, `/guide`, `/simulator`, `/learn`,
  `/play`, `/trust`, `/feedback`, `/support`, and anonymous preserved `/onboard-fpu`
  page shell. **26 static assets returned 200**. The page-shell 200 does not confer
  protected access: anonymous proxy identity/preserved onboarding requests returned 401.
- Bounded new-web log read: 35 entries, **0 ERROR-or-higher/5xx**; **0 unfinished Cloud
  Run jobs**. This is bounded evidence, not a universal absence-of-errors claim.
- Fresh Safari tab on `/workspace`: one Settings control, Google sign-in, expected
  customer-language heading/supporting text/Continue with Google, synthetic scope note,
  no account email or Sign out. Theme preference worked; Escape closed Settings and
  restored visible focus. The **first enabled Continue with Google click opened the
  Google account chooser**. Paused for the owner to select User A; callback/session
  establishment is not yet claimed. No credentials were requested or captured.
- Trust limitations and `/play` passed HTTP/content smoke. Full preserved journey access,
  navigation continuity, signed-in/mobile interactions and sign-out denial remain pending.
- Rollback target remains Ready: `movebooks-beta-web-00010-zll`, previous immutable image
  `sha256:18635ccea56a07300278c6f3f67bb8b490ff90af176d44e258f9ade151c09a7d`.
  If an owner-approved rollback is needed, route web traffic back to that revision; do
  not change API/IAM/SQL. No rollback was performed.

Observed new P0/P1 defects: **0/0**, not final clearance. No new P2/P3 defect identified
in completed checks; residual image Medium/Low advisories remain tracked follow-ups.
Application source remains exactly the candidate. Only this evidence document is edited
after deployment; no merge/tag/release was created. Exact SHA is **not yet cleared to merge**.

### Local implementation and presentation evidence

This presentation-only follow-up is on `release/account-shell-regression`, following
source `32edb96cd65d16eda4bdf853db2e92782c348da3`. The preceding web-only deployment
was `movebooks-beta-web-00010-zll` at 100%, image
`sha256:18635ccea56a07300278c6f3f67bb8b490ff90af176d44e258f9ade151c09a7d`.
Its fresh scan was 0 Critical / 0 High (5 Medium / 1 Low), report SHA-256
`1078fe0c5f4cb3ccf73a48d73c6d5cbdaa049612711f4e3f4aec823af1632428`.
Those are historical deployment facts, not a scan or deployment of this new cleanup.
The owner subsequently reported successful authentication and identified duplicate
Settings and implementation-heavy entry copy. No further live authentication, cloud
read-back or business-state mutation was performed for this local cleanup.

- Signed-in Settings exists only inside the verified-account disclosure, alongside Sign out.
  Closing Settings returns focus to the account trigger because the menu opener unmounts.
  Loading/attention sessions retain that single menu-based Settings path.
- Signed-out users retain one compact Settings control for theme/accessibility preferences
  before authentication, plus the existing Google sign-in action. No redundant header
  sign-in link is added. This keeps preferences available without requiring an account.
- Verified users see **Go to migration**. The shared header does not have authoritative
  migration-progress state, so it never guesses Start/Continue/View from local references
  and makes no extra request for CTA personalization. The underlying `/workspace` route
  and safe destination handling are unchanged.
- Sign-in and signed-out workspace use **Sign in to continue your migration**, **Use your
  Google account to securely access your MoveBooks migration**, and **Continue with Google**.
- Home/Product use concise synthetic-Beta scope notes. The global banner no longer repeats
  those notes on entry pages; authentication feedback remains available. Trust's **Beta
  limitations** section retains no-production-data/provider/production-readiness boundaries,
  with expandable server-verification, persistence and local-only intake details. Sample
  business, Simulator and local evaluation remain distinct; no upload/integration claim is added.
- Mobile visual review caught the account menu extending beyond the left edge after removing
  standalone Settings. Below the desktop navigation breakpoint, the menu now anchors to the
  shared header; desktop placement remains anchored to the account control.

No Firebase/identity-provider/token-verification/proxy/backend authorization implementation,
workflow, financial logic, IAM, SQL, live runtime or V1 tag change. `/play` content and behavior
are unchanged; it inherits the shared shell like other routes. No deployment or merge.

Local closure evidence:

- Focused account/auth/runtime/public-surface tests: **71 passed**. Full frontend suite:
  **188 passed across 22 files**. Lint, TypeScript and production build passed, including
  a repeat after the mobile positioning correction. Existing proxy/auth regressions remain
  included; no authentication or backend implementation was changed.
- Repository/link checks covered **94 Markdown files and 369 text files with 0 findings**;
  `git diff --check` passed. No dependency or lockfile changes.
- Visual review covered desktop `/`, `/product`, `/workspace` and mobile `/`, `/workspace`,
  each signed in/out and light/dark (20 combinations). It used real UI components and built
  production CSS in an isolated localhost fixture with a synthetic account context, not a
  real authenticated session. This verifies presentation, not live SSO/authorization.
- Account Settings/Sign out, Escape, outside-click dismissal, focus restoration and mobile
  navigation coexistence were checked. The temporary fixture server was terminated and
  browser viewport override removed. Home structured-data scripts emit a client-rendering
  warning in this fixture; they are not executed there and no production script change was made.
- **P0: 0; P1: 0 observed for this scoped change.** No unresolved P2/P3 defect identified in
  the touched presentation. **Local GREEN; deployment/live regression pending.** A separately
  authorized web build/scan/deployment followed by human-present Safari account/sign-out
  regression remains necessary before declaring the deployed cleanup GREEN.

## Historical account-shell identity timeout correction — 30 September 2026

**Local GREEN; live regression AMBER. Not deployed.** This checkpoint supersedes the
pending-first-click status below, not the deployed image or infrastructure record.
The owner confirmed that Safari opened Google's chooser on the first click and selected
the intended account. The live shell then showed "Session needs attention" instead of
an API-verified email. A successful Google popup alone is not verified application identity.

Read-only Cloud Run request evidence identified the deadline mismatch:

| Request timestamp (UTC) | Revision / path | Status | Latency |
| --- | --- | --- | --- |
| 2026-09-30 11:26:38.144349 | web `00009-4q4`, `/api/v1/identity` | 200 | 22.328726512 seconds |
| 2026-09-30 11:26:38.379130 | API `00012-z5n`, `/v1/identity` | 200 | 21.948704182 seconds |

The browser previously aborted identity verification at 15 seconds even though the
existing private proxy allows 60 seconds for its upstream request. That abort took the
genuine client-failure path before the successful response arrived. This is not evidence
of an API identity rejection, wrong account, route mismatch, or authorization bypass.
The min-zero runtime permits slow first requests; the precise source of this request's
server latency was not independently established as a cold start.

The read-only identity request now has a bounded 65-second client deadline (the existing
proxy budget plus transport margin), without retries or an authentication fallback.
Loading and updating have explicit accessible labels/copy; a previous error is cleared
when fresh verification begins. Only a verified API response with the matching Firebase
subject supplies the displayed email. Genuine rejection/timeout still fails closed with
sanitized sign-out/re-auth guidance. Generation checks still discard stale responses,
including responses completing after sign-out. No provider error, token, or raw payload
is displayed or recorded.

The header uses the existing small ghost Google sign-in button beside Settings. The
page sign-in action is content-width/secondary rather than a full-width primary CTA.
The normal verified-email disclosure retains Settings and Sign out. Pending verification
is not labeled as a failed session; no simultaneous sign-in/sign-out or client-only email
is introduced. Existing focus, Escape, outside-click and sign-out behavior are retained.

Local validation: **73 focused auth/account-shell/runtime/proxy tests and 182 full frontend
tests passed**; lint, typecheck and production build passed. Added fake-clock coverage
reproduces the 22.33-second response and checks the 65-second stalled-request failure;
additional cases cover pending verification, stale-error clearing, older success/failure
responses, compact controls and verified/failed account-menu states. Existing sign-out,
anonymous/invalid-token and proxy isolation checks remain passing. No tests were weakened.
The focused backend identity/runtime regression also passed **57 tests**, with the existing
Starlette test-client deprecation warning. Repository checks covered 94 Markdown files and
369 text files with zero findings; whitespace checks passed. These are local checks, not
a new live sign-out/isolation validation or a scan of a replacement container image.

No backend/proxy authorization implementation, dependency/lockfile, Firebase architecture,
IAM, API privacy, SQL, Cloud Run configuration, workspace, approval or invoice change.
No deployment or merge. P0/P1 introduced or observed in this focused local review: **0/0**.
The premature timeout and oversized sign-in are two P2 issues corrected locally; live
clearance remains pending. No additional P3 finding was identified in this bounded review.

Next gate requires deployment approval: build and scan a fresh web image, deploy web only,
then human-present Safari cold-load verification of first-click sign-in, API-verified email,
menu/Settings/Sign out, and protected denial after sign-out. Desktop/mobile and light/dark
visual checks of this new fix are also pending that approved live pass. Previous image scans
and visual results are not evidence for an unbuilt/undeployed replacement artifact.

## Historical account-shell refresh checkpoint — 30 September 2026

**AMBER: deployed and signed-out regression passed; human-present Safari authentication
and signed-in/session/sign-out regression are still pending.** Do not substitute previous
V1 manual results or local mocks for these live gates.

- Branch `release/account-shell-regression` was fast-forwarded to main
  `218de41039394464bb813bd1ace161b3c5decefd`. Account-shell PR #19 and portfolio PR #20 are
  merged; all seven jobs in [main CI run 36702920084](https://github.com/JEMathew/movers-and-ledgers/actions/runs/36702920084)
  passed. Changes since the previously deployed `ac95900` are documentation/assets only;
  API and web application source are unchanged.
- A clean web-only build from that exact commit passed. Initial Docker registry blob
  downloads failed; the same pinned vendor bases were fetched using the existing host
  registry client and loaded into Docker. No networking, Dockerfile or scan-policy change.
- Web revision `movebooks-beta-web-00009-4q4` serves 100% of traffic. Immutable image:
  `sha256:882be93cfbc18908854cf29e46ae50bec67294662b6ebf6c7470d61892b82692`.
  Fresh Grype gate: **0 Critical / 0 High**, 5 Medium / 1 Low, without suppression.
  Report SHA-256: `de1a3ae0abe290cd5a39f599e13f4bc2d1c0bd187094afa7d1a628dc7b41e71c`.
  Published image configuration/rootfs matches the scanned archive.
- Read-back at 10:59 UTC (16:29 IST) confirmed API `movebooks-beta-api-00012-z5n` and its
  image unchanged/private; web remains public. Service/project IAM and runtime configuration
  fingerprints match the preflight. Min 0/max 1/concurrency 8, service identities, environment
  and secrets remain unchanged. SQL remains RUNNABLE/ALWAYS with identical settings.
- Authenticated API `/readyz` returned 200; IAM-authenticated requests without Firebase
  identity to identity/onboarding returned 401; anonymous API requests returned edge 403.
- Live `/`, `/product`, `/workspace`, `/guide` returned 200 and showed the consistent
  signed-out shell on desktop and mobile: Settings + Google sign-in, no Sign out/stale email.
  Mobile home/workspace light/dark checks found no horizontal overflow or control overlap.
  Settings Escape restored visible focus; mobile navigation coexists with account controls.
  No browser warning/error entries were captured during these signed-out checks.
- Focused account/identity/Google/proxy tests: **66 passed**. Lint, typecheck, production
  build, production dependency audit (0 vulnerabilities), repository and whitespace checks passed.
  A bounded 20-minute read-back found API 37/web 20 log entries, zero ERROR-or-higher/5xx,
  and zero unfinished Cloud Run job executions. Temporary build SSH access was revoked and
  the task-created local keypair removed. No approvals, postings, scenarios or business writes.
- Pending: cold Safari first-click sign-in, API-verified identity/account-menu interactions,
  same-tab navigation/reload/owner access, then sign-out and protected denial. Firebase uses
  browser-session persistence; cross-tab persistence is not claimed. P0/P1 observed: 0/0;
  final live clearance remains pending. No new P2/P3 UX finding; residual image advisories
  remain non-blocking follow-ups. No API deployment, IAM/SQL change, merge or V1 tag change.

## Portfolio evidence reconciliation — 30 September 2026

Documentation-only reconciliation; no cloud resources, IAM, application code or release tags
were changed in this pass. Final [V1 acceptance](../reviews/v1-final-acceptance.md) is GREEN.
The signature-tamper fixture was corrected in `194375f`; current main `ac959004edf945dbb76a483e53e20872f9f5cd95`
includes that correction and account-shell PR #19. Public GitHub
[CI run 36681965187](https://github.com/JEMathew/movers-and-ledgers/actions/runs/36681965187)
reports success. This supersedes the specific CI hold below, not all future release gates.

The separately authorized account-shell deployment checkpoint at 07:32 UTC records web
`movebooks-beta-web-00008-g6m` at 100%, image
`sha256:afedd6406cb88af7f4bb4a1152efc6777ed41598b6d079c02eda5e9456d99bc0`.
Its fresh Grype scan passed: 0 Critical / 0 High, 5 Medium / 1 Low; report SHA-256
`4445c0e3f63f8653c27d1947f3589d0b5f52dd280d0689ca2c2dc2e5c81b1992`.
API remained `movebooks-beta-api-00012-z5n`, private, with its unchanged digest below;
web stayed public, min 0/max 1/concurrency 8 unchanged, project/service IAM unchanged.
SQL configuration was unchanged during deployment; the older fingerprint difference
was exactly settingsVersion 90 to 91, with all other settings matching.

That checkpoint passed signed-out checks on home/product/workspace/guide, mobile home/workspace
light/dark checks, 55 focused auth/UI/proxy tests, lint/typecheck/build and dependency audit.
It observed no ERROR/5xx in its bounded revision log window and no unfinished Cloud Run jobs.
Temporary build SSH access was removed. No business data was mutated.
**Safari first-click sign-in, signed-in account-menu behavior, navigation/refresh and post-sign-out
protected denial for this new shell remain pending human confirmation.** Earlier V1 manual passes
must not be relabeled as a fresh pass for this update. This documentation task did not rerun them.

## Historical V1 release baseline

PR [#18](https://github.com/JEMathew/movers-and-ledgers/pull/18) merged
`release/public-beta` into `main` at
`3e1a1f85ffbb7dd37140dbdb772228c08fcd430d`; the release branch remains at
`3d0960822fcd9f814a638df97c96916c40c0c325`.
Project `movebooks-ai`; region `asia-southeast1`.

## Historical go-live closure checkpoint — 30 September 2026 IST

This dated assessment is superseded by the portfolio evidence reconciliation above;
its CI hold and next actions are retained as historical evidence, not current blockers.
Read-only cloud drift verification and smoke began at
2026-09-29 19:43–19:47 UTC (30 September IST). No application/UX changes,
redeployment, IAM/Firebase/network/SQL/secret changes, Google user sign-in,
workspace creation, approvals, invoice posting or other business writes occurred.
The main tree exactly matches the approved release branch tree. Both current
revisions and immutable images match the artifact table below and each serves
100% of its service traffic. No deployment/configuration drift was found.

### Final non-destructive smoke

| Check | Fresh result |
| --- | --- |
| Public routes | HTTP 200 for `/`, `/product`, `/workspace`, `/sign-in`, `/simulator`, `/learn`, `/trust`, `/play`, `/guide`, `/feedback`, `/support` |
| Preserved FPU route, anonymous | HTML shell 200; no saved company or account identity exposed; anonymous protected onboarding request through web proxy returns 401 |
| Referenced static assets | All 26 unique referenced assets returned 200; no missing referenced scripts/styles/images |
| External API readiness | Normal developer Cloud Run IAM token, held only in memory in `X-Serverless-Authorization`: `/readyz` returns application JSON 200, `status=ready` |
| Application identity enforcement | Cloud Run IAM without Firebase: `/v1/identity` and preserved onboarding GET return application JSON 401 |
| Anonymous API | `/readyz` and `/v1/identity` return Google edge 403 |
| Traffic/access | Exact API/web revisions at 100%; web public, API IAM-private; no new grants |
| Logs/startup | 85 entries inspected in a 30-minute current-revision window: zero ERROR-or-higher/5xx entries; additional 45-minute inspection of 338 entries found no startup/uncaught-exception pattern |
| Jobs | 19 historical executions inspected; zero unfinished executions |

The 200 FPU shell is not anonymous workspace access or a new FPU execution. The
previous manual Safari A/B identity, ownership and sign-out results remain
owner-reported historical evidence; no automatic user authentication was attempted.
The historical exact 107.25 / one-invoice evidence remains unchanged, not recounted.
Public sample-business copy is not protected workspace evidence.

Logs also contain historical 404s for browser/crawler defaults (`/favicon.ico`,
`/apple-touch-icon.png`, `/apple-touch-icon-precomposed.png`, `/robots.txt`) and
owner-denied workspace requests. The default-file omissions are non-blocking polish,
not missing referenced application assets or evidence of a runtime crash. No claim
of exhaustive external-link crawling or replay of every browser interaction is made.

### CI closure hold — exact failure and disposition

PR #18's seven pre-merge checks passed. The subsequent
[main CI run 36620174487](https://github.com/JEMathew/movers-and-ledgers/actions/runs/36620174487)
on `3e1a1f85ffbb7dd37140dbdb772228c08fcd430d` is **failed**: six jobs pass
(agents, Python, PostgreSQL contract, containers, API image security, web image
security), but the web job's `npm run test` reports **164 passed / 1 failed**.
Lint, typecheck and production dependency audit passed before the failed test;
the web job's later production build was not run. Prior successful builds are
historical evidence, not a substitute for this failed main gate.

Failing test: `apps/web/lib/server/proxy-auth.test.ts:35`,
`rejects altered signatures and emulator unsigned tokens`.
The fixture replaces the signature's first character with `x`. When the generated
valid signature already starts with `x`, this operation does not alter the token,
so correct signature verification resolves instead of rejecting. A bounded local
synthetic diagnostic reproduced this unchanged-token collision; a separate 100-case
check rejected all 100 actual signature-byte mutations using the installed JOSE
verifier. This isolates a randomized negative-test construction defect, not evidence
that a modified signature bypasses authentication. The actual failed CI token was
not recorded or recovered, so its first character is inferred from the test and
reproduction, not claimed as a captured CI secret.

**Product/security findings: P0 = 0; P1 = 0 observed. Go-live closure gate: held.**
The test reliability defect is P2, but its failed remote security regression gate
must not be waived or described as GREEN. Next action is an authorized test-only
correction that guarantees a byte mutation and retains unsigned-token rejection,
followed by focused/full frontend checks and remote CI. No application-auth change,
test weakening, blind retry-until-green or redeployment is justified by this finding.

### Operations, accepted boundaries and V1.1 handoff

- Both Cloud Run services use automatic request-based scaling, min 0/max 1,
  concurrency 8. This is an available low-volume Beta, not a shutdown/manual-zero
  state. Cold starts and limited throughput are accepted limitations.
- Cloud SQL is RUNNABLE/ALWAYS, zonal `db-f1-micro`, 10 GiB SSD, encrypted connector
  access with IAM database authentication and zero authorized networks. It retains
  a public IP; this is not a private-IP/VPC claim. Automated backups remain disabled.
- Service/configuration/SQL fingerprints match the prior approved checkpoint.
  Project IAM remains unchanged; no public project or workload Owner/Editor grants
  were introduced. GCS/Secret Manager access was not broadened.
- Exact deployed-image prior scan hashes still match: API 0 Critical/0 High/6 Medium;
  web 0 Critical/0 High/4 Medium. The post-merge remote image-security jobs also pass.
  No new scan of the deployed digests or universal vulnerability-free claim is made.
- Cloud Logging is available; only safe status/revision/count summaries were retained.
  A short clean log window is not an availability SLO or a complete monitoring system.
- The unchanged [cost model](#cost-model--29-september-2026) remains a **US$14–22/month
  planning estimate**, not an actual bill or newly verified SQL price quote. Its
  SQL compute/storage components are approximately US$10.73/US$2.38 monthly. Cloud Run
  remains request-billed ([current pricing](https://cloud.google.com/run/pricing)).
  Soft target US$25; escalation ceiling US$35; alerts/max instances are not hard caps.
  SQL/storage, registry images, GCS artifacts, secrets, logs and network usage can
  continue to incur charges. No new recurring resource was introduced.

**Accepted Beta limitations:** synthetic business/data only; no production customer
data or real accounting-provider integrations; cloud uploads disabled/local-only;
deployed reasoning deterministic-only; Gemini and managed ADK not activated; no
production/compliance-readiness claim; no production-grade backup/recovery promise.
Backup/restore hardening, Medium advisory updates, cost/abuse monitoring, optional
private-IP networking and default browser/crawler assets are V1.1 follow-ups unless
new evidence establishes immediate material risk. They do not authorize changes here.

Rollback follows the [reviewed revert/image-rollback procedure](google-cloud.md#local-development-and-rollback):
obtain explicit operator authorization, select a previously validated compatible
immutable revision/image, preserve IAM/configuration and schema compatibility,
verify readiness and identity/owner-denial gates, and retain audit/business data.
Never reset public history, drop data, replay approvals or repost invoices. A code
rollback cannot recover lost SQL data while backups remain disabled. No rollback
or deployment was performed during this checkpoint.

**V1.0 scope is frozen:** no new features or UX redesign; product fixes only for
P0/P1 defects. The separately proposed test-only correction repairs release evidence,
not product scope. UX simplification belongs on a V1.1 branch: begin with a concise
journey/navigation usability review while retaining explicit human approvals,
identity visibility, deterministic verification and audit history. Final
`LIVE / GREEN` closure awaits the CI gate above.

### Prepared release metadata — not published

An existing [v1.0.0 release](https://github.com/JEMathew/movers-and-ledgers/releases/tag/v1.0.0)
already points to `76cebca5805b7d77e47f6e94a2d21a962f4474f6` and explicitly separates
public-Beta deployment from acceptance. It was not moved, replaced or deleted.
No `v1.0.0-beta` tag/release was created: a later prerelease after existing `v1.0.0`
would make version ordering ambiguous, and final CI closure is pending. The owner
should select release-metadata treatment after the gate passes; any new artifact
must explicitly identify the intended merged commit, not an inferred moving branch.

Prepared title: **MoveBooks AI V1.0 bounded synthetic public Beta — go-live**.
Prepared notes, held until CI closure:

- Demonstrates Discover → Assess → Plan → Map & Approve → Migrate → Resolve →
  Validate → Configure → Onboard → Verified First Productive Use using synthetic data.
- Rules verify; AI predicts; GenAI reasons; agents orchestrate and act; humans govern
  consequential decisions. Financial truth, lifecycle, approval enforcement,
  retry/idempotency and productive-use verification remain deterministic. Live
  reasoning capability in source does not imply deployed model activation.
- Firebase/Google identity, shared readiness-aware first-click popup flow, verified
  identity display, private API/public web proxy and owner isolation were validated.
- Mapping reconsideration preserves prior rejection/audit history; controlled
  failure/recovery, configuration/onboarding approvals and one synthetic invoice
  reaching verified FPU are preserved historical evidence, not rerun transactions.
- Deployment artifacts, scan hashes, limitations, cost posture and rollback reference
  are recorded here. This release does not claim production/compliance readiness.

## Historical pre-merge release closure — 30 September 2026 IST

This was the pre-merge assessment. The dated checkpoints below retain
the earlier AMBER findings, superseded image revisions and their remediation
history; they are not current unresolved gates. The deployed application source
is exactly `af0642677ca4cd507d85b6d37355a0f6768f536d`. This closure changes only this
document, not the deployed application. No rebuild, redeployment, merge or tag was
performed during closure.

| Component | Serving revision (100% traffic each) | Immutable image digest | Prior fresh scan |
| --- | --- | --- | --- |
| API | `movebooks-beta-api-00012-z5n` | `sha256:925d5d218b925e2324ca03352aeea07db428485663989cfb5d0f1b0041bf5411` | 0 Critical / 0 High; 6 Medium |
| Web | `movebooks-beta-web-00007-bsj` | `sha256:98955962636ddcc19095a80492bacce34992aeda822048f801ae08de27337862` | 0 Critical / 0 High; 4 Medium |

Registry prefix: `asia-southeast1-docker.pkg.dev/movebooks-ai/movebooks-beta/`.
The exact-source archives were built without cache; published image configuration
and root filesystem identities were checked against the scanned archives. Scan
reports were rechecked at closure, not represented as a new scan: Grype 0.119.0,
valid database built 2026-09-29 06:32:31 UTC, no threshold weakening/suppression.
Report SHA-256:

- API: `0c9cdd05fcae29f7e168f2ffd2e9b14b29920f961e8c470246fc09402adaf5a4`
- Web: `5c84a5f688f6cf0489210f05c57f432e8a64b6c1ab4aac7e5e80c0fc70baeaf3`

### Manual Safari evidence — owner-reported

The human owner supplied the following results after deployment of the
authentication fix. These are manual acceptance results, not an agent-performed
Google sign-in or automated Safari replay. The owner reports that manual Safari
authentication/isolation checks passed, including first-enabled-click Google
authentication after the popup/initialization fix, without requiring a second
click. The earlier automated browser observation separately verified controls
disabled while preparing and enabled once ready; it did not click Google sign-in.

- **User A (`jeasom@gmail.com`):** authenticated email displayed correctly; the
  preserved User A workspace opened; Harbor Light Books / Verified First
  Productive Use state was visible; refresh/navigation preserved access.
- **User B (`jemathew14@gmail.com`):** authenticated email displayed correctly;
  the same preserved User A session was unavailable/denied; no User A workspace
  or business data was exposed.
- **Anonymous after sign-out:** the preserved User A session was unavailable and
  protected workspace state was not exposed. This verifies normal browser
  session clearing/access denial, not immediate global revocation of every
  previously issued Firebase ID token. API revocation checks remain enforced.

The workspace was reused; no business data was mutated during this security
validation. No new scenarios, approvals, invoice posts or business actions were
performed. The prior deterministic 107.25 / one-invoice verification is preserved
historical evidence; this closure does not claim a fresh production database-wide
invoice recount or repeat the financial task.

### Focused release audit and fresh checks

Fresh cloud read-back at 2026-09-29 19:14–19:16 UTC confirms exact revisions/images,
web public/API private, unchanged service accounts/configuration/IAM, min 0/max 1,
concurrency 8, and unchanged SQL RUNNABLE/ALWAYS. Project IAM fingerprint remains
`e504eb9dfc8467ebd2e8a52e9cd654aafd9afb131b7efa2dc2b7bdf21e3781a5`.
There are no public project grants, workload Owner/Editor grants or unfinished job
executions. GCS public-access prevention/uniform access remain enforced with no
public bucket grants; checked Secret Manager policy has no public grant. No secret
contents, credentials, tokens or cookies were collected for evidence.

| Release check | Evidence / result |
| --- | --- |
| Authentication and display | Owner's Safari pass; shared readiness/first-click/verified-identity frontend regressions pass; display uses API-verified subject/email, not approval actors |
| Authorization, ownership, isolation | Owner A access/B denial; backend verified-principal owner gates and immutable owner persistence tests pass; proxy verifies Firebase before obtaining workload credentials |
| Sign-out | Owner reports protected denial afterward; sign-out success/failure, stale-response and navigation regressions pass; no claim of global token revocation |
| API privacy | No public invoker; only web workload has service-level invoker; fresh anonymous readiness/identity/protected GETs return Google edge 403 |
| Missing application identity | Run-IAM-authenticated identity/protected GETs without Firebase return application 401; no workspace data disclosed |
| Startup/readiness | Revisions Ready; authenticated external `/readyz` returns application 200 `ready`; direct-container native `/healthz` liveness succeeded |
| Secrets/IAM drift | Repository credential-pattern checks pass; cloud configuration fingerprints unchanged; no broad workload/public project grants |
| Image vulnerabilities | Exact deployed digests match scanned artifacts; 0 High/Critical; residual Medium triage retained below |
| Mutation, approval/posting safeguards | Read-only live closure; local isolated tests cover spoofing, owner approval gates, historical decisions, concurrency, stale manifests, governed recovery and duplicate posting |
| Public routes | Fresh unauthenticated GETs to `/`, `/product`, `/simulator`, `/learn`, `/play`, `/guide`, `/trust`, `/feedback`, `/support`, plus `/workspace` and `/sign-in`, all return 200 |
| Browser runtime | Fresh public home/workspace browser smoke shows normal rendering and sign-in controls; no observed console errors/warnings; deployed revision startup checks previously passed |

Focused regression results on the unchanged application source:

- **81 frontend tests passed** across `google-identity-runtime`, `google-sign-in`,
  `runtime-identity`, `public-routing`, `private-api-proxy`, and `proxy-auth`.
- **118 backend tests passed** across `test_identity_display`, `test_google_runtime`,
  `test_runtime_faults`, `test_onboard_cloud_owner`, `test_mapping_reconsideration`,
  `test_beta_v1_integration`, and `test_controls`. The existing Starlette test-client
  deprecation warning remains. These use local isolated fixtures, not cloud business
  writes; no live PostgreSQL restart or new live mutation test is claimed.
- Repository/link/credential-pattern and whitespace checks pass. Application
  lint/typecheck/build were not rerun for documentation-only changes; the exact
  deployed source's previous green checks and fresh production image build are
  retained evidence. No fresh remote CI run is claimed by this local closure.

**Finding classification: P0 blocker = 0; P1 blocker = 0.** Non-blocking follow-ups:
track the 6 API/4 web Medium base-runtime matches and vendor fixes; plan backup/
restore hardening (SQL automated backups remain disabled); improve cost/abuse
monitoring within the approved budget; evaluate private-IP networking later;
address the Starlette test-client deprecation; improve generic unavailable-session
copy without exposing whether another owner's workspace exists. None authorizes
new scope or is waived as universally safe.

Limitations remain locked: synthetic/dev-test public-reference Beta only; no
production customer data, real provider integrations, production or compliance
readiness claim. Cloud Try Your Data uploads remain disabled/local-only. Deployed
model routing remains deterministic-only; no Gemini or managed ADK activation.
Existing financial verification, lifecycle, HITL, audit and retry/idempotency
controls are unchanged. SQL remains running for authorized Beta availability;
retained SQL/image/GCS/log/secret resources incur costs under the existing soft
US$25 target/US$35 escalation ceiling, not a hard cap. No shutdown is claimed.

**Release decision: GREEN — ready to merge for this bounded Beta scope.** Stop
after the documentation commit and wait for explicit merge authorization. Normal
PR review/required CI must still be satisfied at merge time; no automatic merge,
tag or additional deployment is authorized by this assessment.

## Approved boundary

Only the existing Next.js web service becomes public. Its `/api/v1/...` handler is
an authenticated, explicitly allowlisted transport to the private API, not a new
business-logic layer. The existing web service identity receives `roles/run.invoker`
on `movebooks-beta-api` only. No project-wide invocation grant, service-account key,
new service, load balancer or VPC is required.

The proxy verifies Firebase RS256 signature, project audience/issuer, subject,
expiry, issued-at and authentication time before obtaining workload credentials.
The workload ID token goes in `X-Serverless-Authorization`; the original Firebase
token stays in `Authorization`. The API independently verifies Firebase identity
and revocation and retains every owner, approval, audit, lifecycle, financial,
retry and idempotency check. Client owner/actor headers confer no authority.

Transport: fixed deployment-owned HTTPS upstream/audience; explicit GET/POST route
allowlist; no arbitrary destination or query forwarding; same-origin mutations;
no forwarded cookies/owner/workload credential headers; 256 KiB streamed JSON
request limit; 8 MiB response limit; 60-second upstream timeout; no redirects,
automatic mutation retries, response caching or raw exception logs. The existing
idempotency header is preserved. Authenticated synthetic template download remains
available; cloud intake is rejected before reading or forwarding an upload body.

SQL retains encrypted (`ENCRYPTED_ONLY`), IAM-authenticated **public-IP** connector
access with **zero authorized networks**. This is not private-IP networking.
GCS and Secret Manager remain private. Private-IP/VPC migration is later hardening.
No production/customer/provider data, provider integrations or production/compliance
claim. Financial truth/HITL are unchanged. Optional live reasoning still requires
explicit operator configuration; do not silently enable model spend or managed ADK.

## Deployment settings

| Setting | Required value / intent |
| --- | --- |
| Browser build `NEXT_PUBLIC_API_BASE_URL` | `https://movebooks-beta-web-411600344727.asia-southeast1.run.app/api` |
| Server `MOVEBOOKS_PRIVATE_API_ORIGIN` | Actual private API HTTPS service origin, also the workload token audience |
| Server `MOVEBOOKS_PUBLIC_WEB_ORIGIN` | `https://movebooks-beta-web-411600344727.asia-southeast1.run.app` |
| Firebase build/runtime | Existing app/project configuration; `NEXT_PUBLIC_IDENTITY_MODE=firebase`; project ID required server-side too |
| API service IAM | Existing web SA: `roles/run.invoker`; no public principals |
| Web service IAM | `allUsers: roles/run.invoker` after hardened revision ready |
| Run scaling | Request billing, automatic scaling, min 0/max 1 each, initial bounded concurrency 8 |
| SQL availability | Existing tier/disk, RUNNABLE / ALWAYS for the authorized public-Beta gate checks |

The earlier **manual zero** was a shutdown setting, not available autoscaling. Public
Beta needs automatic scaling/min 0 so requests can start an instance. Preserve
existing connector, identities and backend settings. Deploy freshly scanned immutable
digests, not historical cloud-validation images as a substitute for merged V1.

## Cost model — 29 September 2026

Soft operating target **US$25/month**; escalation ceiling **US$35/month**. Stop before
a configuration projected above the ceiling. No new always-on job/network service.
Official SQL page checked with **Singapore selected**; 730 hours/month, USD list
prices before tax/FX/credits, not a measured bill:

| Item | Estimate / qualification |
| --- | --- |
| Zonal Enterprise PostgreSQL 17 `db-f1-micro` | $0.0147/hour = **$10.731/month** running |
| Existing 10 GiB SSD | $0.000326027/GiB-hour = **$2.38/month** |
| Backups | Automated backups currently **disabled**. Used storage ~$0.112/GiB-month; hypothetical 10 GiB ~$1.12, not measured usage |
| Cloud Run | Min 0/request billing avoids provisioned idle instances. Reserve $0–5 for low-volume requests; active CPU/memory/requests/egress remain billable, free allowances account-shared |
| Artifact Registry | ~$0.10/GiB-month above first account-shared 0.5 GiB. 30 image/index records; 20 known manifest sizes sum 813,157,473 bytes before shared-layer deduplication; 10 indexes report no size. Not billed usage |
| GCS, secrets, logs, network | Reserve $1–3 at existing small evidence volume; confirm actual usage/billing before claiming exact spend |

Planning range **~$14–22/month**, assuming low traffic, small retained artifacts and
no live model calls. Public request abuse/heavy use can exceed it. Max instances and
billing alerts are **not hard spend caps**. Recalculate before increasing limits or
enabling new paid paths. SQL storage auto-resize is currently disabled. No retention
policy or existing evidence was deleted/changed. Backups disabled is an explicit
recoverability limitation to revisit before broader use, not a production durability
promise. Stopped SQL still incurs retained storage and potentially the published
idle IPv4 charge ($0.014/hour); never claim shutdown means zero total charges.

Sources: [SQL](https://cloud.google.com/sql/pricing),
[Run](https://cloud.google.com/run/pricing),
[Artifact Registry](https://cloud.google.com/artifact-registry/pricing),
[Logging](https://cloud.google.com/products/observability/pricing),
[service authentication](https://docs.cloud.google.com/run/docs/authenticating/service-to-service),
[Firebase verification](https://firebase.google.com/docs/auth/admin/verify-id-tokens).

## Historical evidence and then-outstanding gates

Fresh preflight **2026-09-29 15:19:43 UTC**: API/web public bindings empty, manual 0 /
max 1; SQL STOPPED/NEVER, pending operations 0; unfinished job executions 0 (3 inactive
definitions retained); public project IAM and workload Owner/Editor absent; GCS
public access prevention enforced/uniform access; secret public bindings empty.
Project IAM SHA-256:
`e504eb9dfc8467ebd2e8a52e9cd654aafd9afb131b7efa2dc2b7bdf21e3781a5`.
No IAM, Run, SQL or Firebase configuration changes had been applied at that preflight.
The scoped changes and fresh read-back below supersede that baseline.

Local verification covers signed-token negatives, dual authorization headers,
cross-origin/path rejection, unchanged mutation/idempotency forwarding, backend
denial preservation, upload rejection before reading, template preservation, body
bounds and safe failure. **34 new proxy/auth tests; 130 total frontend tests passed**.
Frontend lint, TypeScript and production build passed. Repository checks covered
94 Markdown / 361 text files with 0 findings; whitespace checks passed.
Focused backend runtime/owner tests: **68 passed**, existing
Starlette test-client deprecation warning only. Production npm audit: **0 vulnerabilities**.
The full historical acceptance suite is intentionally not rerun.

Image preparation and remaining gates:

1. Fresh production image build/High-Critical scans. Local Docker absent; Cloud Build
   disabled (not enabled). Cloud Shell authorization was completed. The official
   gcloud Cloud Shell SSH/SCP path builds the exact `7e4a82c` archive using existing
   Docker and normal user authentication, without a new build service or workload
   privilege. Existing public Firebase browser settings are reused; no user tokens
   or service-account keys are extracted. Both clean builds and strict image scans
   passed: API **0 High / 0 Critical, 6 Medium**; web **0 High / 0 Critical, 4 Medium**.
   No suppressions or threshold changes were used.
2. Approved service IAM/scaling applied and read back; other runtime privileges preserved.
3. Public HTTPS, real Firebase SSO on that origin, A access/navigation/sign-out denial,
   anonymous denial, B owner denial. No preserved approvals/invoice repeated.
4. Nine public surfaces/responsive themes/focus passed on the first deployed image;
   authenticated read-only preserved-workspace smoke passed on the current image.
5. Fresh image, IAM/privacy/runtime/cost read-back and final P0/P1 clearance.

Preserved FPU workspace/invoice untouched by this attempt. Authenticated User A
read-back confirms VERIFIED FIRST PRODUCTIVE USE, 10/10 completed prerequisites,
the 107.25 invoice contract, VERIFIED checkpoint and one posting attempt. Original
approval actors and posting/verification timestamps remain visible. This is a
read-only smoke, not a repeated posting or a fresh database-wide invoice count;
the prior one-invoice verification remains historical evidence. No new workspace,
approvals or financial writes were performed. No merge, release tag
or custom domain. The web URL is publicly reachable but **not yet cleared for
sharing**. Local success does not clear live gates. Keep the authorized runtime
available for human-present sign-in; if validation is abandoned or a security gate
fails, return services private/manual-zero and SQL STOPPED/NEVER without deleting
data/images. A successful public Beta may retain SQL running under the approved
target; do not reuse the expired earlier one-shot negative-validation cleanup window.

### Applied changes and read-back — 29 September 2026

- SQL resume operation `bfe1174e-6d93-4ea8-9f0a-98f000000031` ran
  **15:57:42–16:09:02 UTC**, completed without error. No tier, disk, network,
  database grant, backup or retention change.
- API revision `movebooks-beta-api-00011-c45` Ready at **16:10:04 UTC**;
  first web revision `movebooks-beta-web-00005-p7l` Ready at **16:04:18 UTC**.
  Both use the immutable digests below, existing service accounts, concurrency 8,
  max 1, automatic scaling/default min 0, request-based CPU allocation. Existing
  API environment is unchanged, including Firebase and `deterministic-only` routing.
- Exactly two service policy changes: web `allUsers: roles/run.invoker`; API
  `serviceAccount:movebooks-beta-web@movebooks-ai.iam.gserviceaccount.com` with
  `roles/run.invoker`. No API public principal or project-wide invocation grant.
- Read-back **16:16:45 UTC**: both Ready; API public bindings empty; web public
  binding exactly as authorized; SQL RUNNABLE/ALWAYS, pending operations 0;
  unfinished job executions 0; three existing inactive job definitions retained.
  Project IAM hash unchanged; no public project binding or workload Owner/Editor.
  GCS public access prevention enforced/uniform access, no public bucket binding;
  existing secret public bindings empty.
- Final read-back **16:24:42 UTC**, after the copy-corrected web rollout, confirms
  the same IAM/privacy/scaling/SQL state, unchanged project IAM hash and zero running
  jobs. Direct API **403** and anonymous protected web proxy **401** were reconfirmed.
- Live anonymous checks: direct API **403** after Ready; web protected proxy **401**
  with explicit Google sign-in requirement. These do not substitute for real-user
  verification of the dual-token proxy and owner isolation.
- All nine public routes inspected at desktop/dark and mobile/light (390×844),
  plus mobile/dark spot check. No raw/default HTML or horizontal overflow. Mobile
  menu opened with Enter, Product navigation closed it, keyboard focus had a visible
  3px solid outline. Status messaging includes text, not color alone. Viewport reset.
- Copy-only correction `14c7693` removes stale claims that Google identity is
  unavailable or all sessions expire on restart, and distinguishes persistent cloud
  workspaces from local demo state. No layout, auth, financial or workflow changes.
  Added assertions preserve this distinction. All 130 frontend tests, lint,
  typecheck, production build and repository/whitespace checks passed again.
  Replacement web revision `movebooks-beta-web-00006-5hx` became Ready at
  **16:23:11 UTC**. Corrected Product, Simulator and home wording was verified on
  that deployed revision, along with desktop/light styling. Its fresh scan has
  **0 High / 0 Critical, 4 Medium**; API image unchanged.
- The official gcloud SDK generated a temporary user SSH key for Cloud Shell
  transfers (not a workload/service-account key). After transfers finished, the
  matching public key was revoked with the Cloud Shell API, absence verified, and
  only that task-generated local keypair removed. Normal user OAuth and workload
  credentials were not changed. No temporary localhost auth client was started.

Public URL: `https://movebooks-beta-web-411600344727.asia-southeast1.run.app`.
Human next step: User B signs in normally and verifies cross-owner denial. No
tokens, cookies, passwords or MFA codes should be copied into tools or evidence.

### Public-origin User A checkpoint — 29 September 2026

- Human completed normal Google sign-in on the public web origin. The preserved
  synthetic workspace loaded through the deployed web proxy/private API; no
  localhost acceptance transport or extracted browser credentials were used.
- Navigate to Guide and return to the same preserved workspace: protected state
  loads again with VERIFIED FIRST PRODUCTIVE USE, original approvals and the
  one-attempt VERIFIED invoice checkpoint. No business-action button was used.
- Keyboard activation of Sign out returned to the sign-in surface. Reopening the
  protected workspace no longer displayed protected state and reported the generic
  "Saved session unavailable" error. A separate unauthenticated HTTP request to the
  deployed protected proxy returned **401** with the Google sign-in requirement.
- UI automation pointer activation did not reliably activate controls in this
  browser; keyboard activation completed sign-out. Do not infer a product defect
  or a successful invoice-detail disclosure from the pointer attempts.
- User B sign-in/cross-owner denial remains outstanding. No new cloud/IAM change
  was made for this checkpoint. The existing authorized public-Beta runtime remains
  available for human-present testing; no new final cloud read-back is claimed.

### Fresh image evidence — source `7e4a82c`

User B handoff follow-up: the inspected tabs did not establish an unambiguous
second-account session. One tab remained signed out; a separate workspace tab
loaded the preserved owner workspace. The UI does not display the current signed-in
account, and `browserSessionPersistence` makes tab context relevant. This is **not**
counted as cross-owner denial or as proof of an isolation defect; the authenticated
account must be confirmed through the normal Google UI before either conclusion.
No credentials were extracted and no business actions were taken. User B isolation
and final security clearance remain open.

Fresh cloud read-back **2026-09-29 17:10:19 UTC**: API private, web public only as
authorized, both Ready with automatic/default min 0 and max 1; SQL RUNNABLE/ALWAYS,
pending operations 0; no unfinished jobs; unchanged project IAM hash; no project
public grants or workload Owner/Editor; GCS public access prevention enforced and
uniform access enabled; bucket/secret public bindings empty. No cloud changes were
made in this follow-up. This is public-Beta availability, not a shutdown claim.

Source archive SHA-256:
`54c53819875e7fd3f7da13ee3ece0d49930e6cf55f9356c89cd56c7b42e31fad`.
Grype pinned image:
`anchore/grype@sha256:8c2c9234a345577a6d321a4753aa3ee1276d8975c8452d2344a56b57733ecad3`.

| Component | Published immutable digest | Scan report SHA-256 |
| --- | --- | --- |
| API | `sha256:d7219fb2e30836ccc33d2c36082ed16127c24200c104547e93f636a9d9efaea5` | `9d4a9a5ec7c9a3a9a259eb16801522ca22848ad69356873a4dc1bb08b62d2a71` |
| Web, initial `7e4a82c` (superseded) | `sha256:2153a75d6ccd942dfb475c8ce025a846ab70a544c31b1495324d15fd6366dfd8` | `902b12e2187e738e93f050e5733419762395ae89404d1ab8a23e370f2f658858` |
| Web, `14c7693` (superseded) | `sha256:1b5da27a78f8bb0e899111f29ce2419454d62d8277169f7cdc9f45daca00545e` | `54dacc0d9158378e926a3b74b5be84246cf7cbe8d0df0299879c3fcb00d54eea` |

Copy-corrected source archive SHA-256:
`b3418d1fd17eb70eb36efe9d9a178c1503895a50f938c65e62066b167c706f85`.
Scanned current web image archive SHA-256:
`c02d750f1b5325e5a988a056f8cd9fa6a66097b211a58520b9d04a335ed9d501`.
Published config SHA-256:
`d58a1cc60f956a9aec29a8639fa3b4b5b00a191e7bc52698d42b61185fdab0e8`;
configuration/rootfs identity again verified equal to the scanned archive.

Docker's push network path refused connections, while host HTTPS reached the registry.
The same scanned archives were uploaded using Google's host-side
[crane v0.22.1](https://github.com/google/go-containerregistry/releases/tag/v0.22.1)
and the existing gcloud credential helper. The official tool archive checksum was
verified. Published configuration JSON, including root filesystem layer identities,
was checked equal to the scanned archives. Manifest serialization differs from
Docker's local index; deploy the **published digests above**, not the local index ID.
No IAM workaround, new Cloud Build service, TLS bypass or exported token was used.

Residual Medium triage (not suppression; no fixed versions reported by this scan):

| Advisory | Package / source | Bounded applicability and follow-up |
| --- | --- | --- |
| CVE-2026-87910 | API `python-3.14 3.14.7_git20260925-r0` | Archive-link extraction/filter issue. No application `tarfile` use found; cloud intake disabled. Track vendor update; do not claim Python package absence. |
| CVE-2025-15367 | Same Python runtime | POP command injection. No application `poplib` use or mail retrieval integration. Track vendor update. |
| CVE-2026-77117, CVE-2026-80489 | Both images `glibc-2.44 2.44-r6` | Specific Japanese character conversion loop. No application iconv/JIS conversion path found; bounded JSON/synthetic intake only. Reassess if charset conversion is added. |
| CVE-2026-8674 | Same glibc | Resolver search-list assertion. Runtime DNS configuration is platform-controlled, not request-supplied; no application `LOCALDOMAIN` control. Residual platform dependency to track. |
| CVE-2026-89092 | Same glibc | Requires running nscd/untrusted DNS. Images launch only Node/Python, not nscd. Track base-runtime patches. |

These are preliminary reachability conclusions from scanner advisory descriptions,
Dockerfiles and application source search, not proof of zero dependency risk. The
existing High/Critical gate passes; Medium base-runtime updates remain a follow-up.

## Historical release assessment at human sign-in handoff

**AMBER; not yet cleared for public sharing.** No new P0/P1 defect observed in the
completed local, image, public-route, anonymous-denial and IAM checks. Final P0/P1
clearance is withheld until User B owner isolation passes through the new proxy
and final read-back is complete. User A access/navigation/sign-out and anonymous
denial passed as recorded above. Historical V1/live-cloud evidence is not a
substitute for the remaining deployment-specific gate. The authenticated FPU
screen was read back; no new posting or database-wide invoice-count test is claimed.

Remaining non-blocking hardening: Medium base-runtime advisories above, currently
disabled SQL backups, low-volume cost/abuse monitoring (not a hard spend cap), and
later private-IP networking if warranted. Preserve synthetic-only scope, disabled
cloud uploads and deterministic-only deployment routing. No remote CI for the
unpublished public-Beta commits is claimed. After live gates pass: publish branch,
open PR, run CI and obtain human review; do not automatically merge/tag.

## First-click authentication remediation — local only, 29 September 2026

The owner reproduced Safari first-click failure followed by second-click success
on the deployed public Beta. Source inspection confirms `IdentityEntry` awaited
Firebase module loading, persistence setup and `authStateReady()` inside the click
handler **before** `signInWithPopup`. The header used a separate navigation-only
link, and every popup/initialization error was collapsed into one message. The cold
asynchronous path explains loss of user activation on Safari; the exact original
Firebase error code was not captured, so popup blocking is a supported diagnosis,
not a fabricated live error trace. The installed SDK proactively initializes its
popup resolver for Safari/mobile during auth initialization.

Local remediation:

- One root identity provider starts and caches initialization before interaction,
  subscribes to Firebase token/session changes, and enables sign-in only when ready.
  Header, `/workspace` and `/sign-in` use the same supported popup action. The ready
  click invokes `signInWithPopup` without application-level imports/awaits beforehand.
  A shared in-flight guard prevents duplicate popup requests, and listener callbacks
  cannot race popup completion into cancelling the first successful navigation.
- Google receives `prompt=select_account`. The display reads **Signed in as email**
  from a new authenticated, no-store `GET /v1/identity` response. The API uses the
  existing Firebase verifier, including revocation checks, and returns only its
  principal subject/email. The client checks the subject against the SDK user.
  No approval actor, client-supplied email/owner or inferred workspace identity is used.
  Only this GET is added to the existing proxy allowlist; it performs no business write.
- Popup blocked, closed, competing popup, network, unauthorized-domain, storage and
  initialization failures have distinct sanitized messages. No raw provider exception
  is displayed/logged. Failures never introduce a demo identity or automatically retry.
- Sign-out clears identity UI and selected-session references, preserves workspace
  data, and navigates only after SDK success. Failure explicitly says sign-out is
  unconfirmed. Late verification cannot restore a stale identity after sign-out.
  Internal return destinations reject control-character/protocol-relative redirects.
- Browser session persistence remains tab-scoped. The verified identity indicator
  is therefore intentionally visible in each tab; a different tab's account is not
  evidence for the current tab.

Popup remains the only supported initiation path. No automatic redirect fallback
or manual blank-window workaround is introduced. Firebase's redirect helper has
additional cross-origin storage requirements on Safari; changing `authDomain` or
adding auth-helper hosting is outside this fix. See
[Firebase dependency initialization](https://firebase.google.com/docs/auth/web/custom-dependencies)
and [redirect browser requirements](https://firebase.google.com/docs/auth/web/redirect-best-practices).
User-blocked popups still require the user to allow this site's popup and explicitly
retry; the fix removes the cold-initialization double-click requirement, not browser
security controls.

Local evidence: **165 frontend tests passed** (35 more than the prior 130), including
first-click synchronous invocation, shared header/workspace behavior, readiness,
duplicate prevention, error focus/messages, restored/changed identity, sign-out
success/failure, stale responses and proxy verification. **348 backend tests passed;
10 PostgreSQL-only tests skipped** without a running database. Existing owner/mutation
isolation, actor-spoof, revocation, deterministic/lifecycle and recovery suites pass;
8 new backend tests cover verified identity, invalid/demo credentials and read-only
behavior. The fuller existing Python environment was used so optional SDK tests ran;
the minimal environment initially reported 336 passed / 22 skipped. Existing
Starlette test-client deprecation warning remains. Thirteen offline advisory evals
passed with zero live model calls. Frontend lint/typecheck, Ruff, repository/link and
whitespace checks passed. Production build passed for the final cloud-mode source.

No dependency/lockfile, IAM, Firebase configuration, runtime configuration, agent,
financial control or preserved-workspace change. No deployment, merge or live
authentication test of this fix. Local review found no new unresolved P0/P1;
**release remains AMBER** pending deployment approval, freshly scanned images/CI,
and real Safari cold-load first-click, header/workspace, displayed A/B identity,
sign-out/anonymous denial and cross-owner denial checks. Deploy the backwards-compatible
API identity endpoint before the matching web build when separately authorized;
without the new API endpoint the new display intentionally fails closed.

## Historical API edge/probe diagnosis — 30 September 2026 IST

This checkpoint supersedes the local-only deployment status above. Exact source
`af0642677ca4cd507d85b6d37355a0f6768f536d` was built and scanned: API 0 High /
0 Critical (6 Medium); web 0 High / 0 Critical (4 Medium). API revision
`movebooks-beta-api-00012-z5n` serves 100% of traffic using
`sha256:925d5d218b925e2324ca03352aeea07db428485663989cfb5d0f1b0041bf5411`.
Web remains unchanged at `movebooks-beta-web-00006-5hx`; its freshly scanned image
`sha256:98955962636ddcc19095a80492bacce34992aeda822048f801ae08de27337862`
has not been deployed.

**Root cause classification: validation-probe construction issue caused by
path-specific Cloud Run edge behavior, not an application routing/startup failure.**
The failed URL was
`https://movebooks-beta-api-33s3hhbhua-as.a.run.app/healthz`, with a normal developer
Cloud Run ID token in `X-Serverless-Authorization`. The hostname is the actual
canonical service URL; the alternate regional hostname is
`https://movebooks-beta-api-411600344727.asia-southeast1.run.app`.
The external `/healthz` request returned Google HTML 404, without an application
request ID or matching request/container log. Changing the IAM header to
`Authorization` produced the same edge result. Do not infer an audience or IAM
failure from this path: the same token, hostname and header successfully reached
other application routes.

Cloud Run native probes call the container directly on port 8080. System logs for
this exact revision confirm startup `/readyz` succeeded at
2026-09-29 18:42:20.044 UTC and liveness `/healthz` succeeded at
18:42:20.052 UTC. Application startup completed with no observed import/runtime
error. The image command remains `python /app/services/api/start.py`, binding
Uvicorn to `0.0.0.0:8080`; no command override or framework base-path is configured.

Corrected non-destructive external validation uses **`GET /readyz`**, not
`/healthz`, together with native liveness evidence. Health paths do not require
Firebase inside the application, but external access still requires Cloud Run IAM.
`/readyz` checks database/storage readiness and returns 200
`{"status":"ready","mode":"cloud-dev"}` (503 when unavailable).
Native `/healthz` returns 200 `{"status":"ok","service":"movebooks-api"}`.
There is no root `/` route; its application JSON 404 is expected.

Read-only diagnostics and corrected smoke beginning 2026-09-29 18:48 UTC:

| Request | Credentials | Result |
| --- | --- | --- |
| `/healthz` | Cloud Run IAM | Google edge HTML 404; not an app health result |
| `/readyz` | Cloud Run IAM | Application 200, `ready` |
| `/v1/runtime` | Cloud Run IAM | Application 200; Firebase, Cloud SQL, deterministic-only, production-ready false |
| `/` | Cloud Run IAM | Application JSON 404 with request ID and correlated log |
| `/v1/identity` | Cloud Run IAM, no Firebase | Application 401 with correlated request/application logs |
| Preserved workspace onboarding GET | Cloud Run IAM, no Firebase | Application 401; no workspace data returned |
| `/readyz`, `/v1/runtime`, `/v1/identity`, preserved workspace GET | None | Google edge 403 |

The protected identity route requires the existing verified Firebase principal;
Cloud Run IAM alone cannot access it. No user-token sign-in, workspace write,
approval, scenario creation or invoice posting was performed. Request logs did not
provide an authenticated principal to attribute safely; no principal is inferred
from workspace history. Tokens stayed in process memory and were not recorded.

The corrected probe preserves authentication separation: use normal authenticated
gcloud developer credentials in `X-Serverless-Authorization`, leaving Firebase
`Authorization` absent for the negative check. The web workload uses an ID token
whose audience is its configured API origin, independently of the Firebase token.
See [Google developer authentication](https://docs.cloud.google.com/run/docs/authenticating/developers)
and [separate service authentication header](https://docs.cloud.google.com/run/docs/authenticating/service-to-service).
This evidence establishes only the observed `/healthz` edge behavior; it does not
claim that every path ending in `z` is blocked (`/readyz` was verified working).

API ingress remains `all` with IAM required, no public invoker, min 0 / max 1 and
concurrency 8. No API redeployment, IAM/network/SQL/auth-policy/business-logic
change was required for the diagnostic correction. Recommendation: proceed to the
separately authorized web deployment and then manual Safari verification. Overall
release remains **AMBER** until those gates pass; no merge occurred.
