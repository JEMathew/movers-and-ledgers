# V2 hosted preview: isolation, commands, smoke tests and rollback

Status: **prepared, not executed.** This environment has no Google Cloud credentials (`gcloud auth list`:
no credentialed accounts), so nothing here has run against `movebooks-ai`. Every ★ step needs your explicit
approval at the time it runs. Production (`movebooks-si.web.app` → `movebooks-beta-web`) was confirmed still on
V1 on 19 Oct 2026 ("Move your books with confidence."), and GitHub `main` is still `4e31e29`.

## What changes for V2

Only the **web** image changes. The API (`services/api`), domain rules, database schema and saved migrations are
identical to production, so the preview reuses the production API through the same private, IAM-protected
path the production web uses. No API revision, no database migration, no secret change.

## Why not a tagged revision of the production web service

A `--no-traffic --tag` revision of `movebooks-beta-web` gets its own URL. It inherits the service's invoker policy,
and that policy has `allUsers` (public web). The tag URL is therefore **public to anyone who has it**, not
access-controlled. It would also need the tag host added to Firebase authorized domains (a Firebase
configuration change). The plan below avoids both.

## Recommended: a separate, private preview service

| Property | How |
|---|---|
| Access-controlled | New service `movebooks-v2-preview-web` deployed with `--no-allow-unauthenticated`. Only principals who already hold `run.invoker` through the project (the owner) can reach it. No `allUsers` binding is created. |
| No production traffic change | Production services are not touched: no `update-traffic`, no deploy to `movebooks-beta-web` or `movebooks-beta-api`. |
| No IAM or secret change | The preview runs as the **existing web runtime service account**, which already holds `roles/run.invoker` on `movebooks-beta-api`. No new bindings, keys or secrets. |
| No database change | Same API, same database. The preview writes only what the V2 web writes through the existing API contracts: synthetic sample migrations owned by the signed-in test accounts. |
| Explicit identifiers | Built by `build-and-scan.sh` from an exact commit; deployed by image **digest**; labelled with the commit. |
| Rollback | Delete the preview service. Production is unaffected throughout. |

Sign-in works through an HTTPS localhost tunnel. The app sends Firebase tokens only to an HTTPS origin
(`identityEndpoint`). Firebase authorizes `localhost` by default; confirm it is still listed under
Authentication → Settings → Authorized domains. Adding a domain would be a Firebase change needing approval.

### Commands

```bash
R=asia-southeast1; P=movebooks-ai; REG=$R-docker.pkg.dev/$P/movebooks-beta
C=<full sha of v2/full-experience after the push>          # exact commit under test
```

1. **Build and scan (★ Cloud Shell).** Use the existing two-stage process; it builds the web image with `NEXT_PUBLIC_API_BASE_URL=/api` and Firebase identity:
   ```bash
   bash scripts/release/stage-a-archive.sh v2/full-experience ~/Downloads        # Mac, read-only
   EXPECT_COMMIT=$C bash build-and-scan.sh ~/mb-<short>.tar                      # Cloud Shell
   ```
   Pass = `RESULT: PASS` and 0 Critical/High in `web-security.json`. The API image it also builds is not deployed.

2. **Record production web settings (read-only).**
   ```bash
   gcloud run services describe movebooks-beta-web --region $R --project $P \
     --format='value(spec.template.spec.serviceAccountName)'                    # → SA
   gcloud run services describe movebooks-beta-web --region $R --project $P \
     --format='yaml(spec.template.spec.containers[0].env)'                      # copy names and values below
   gcloud run services describe movebooks-beta-web --region $R --project $P \
     --format='value(status.latestReadyRevisionName,status.traffic)'            # unchanged before and after
   ```

3. **Push the scanned web image (★).** Deploy by digest only.
   ```bash
   docker tag <mb-web:...> $REG/web:v2-<short> && docker push $REG/web:v2-<short>
   WEB_DIGEST=$(gcloud artifacts docker images describe $REG/web:v2-<short> --format='value(image_summary.digest)')
   ```

4. **Deploy the private preview service (★).**
   ```bash
   gcloud run deploy movebooks-v2-preview-web --region $R --project $P \
     --image $REG/web@$WEB_DIGEST --service-account <SA from step 2> \
     --no-allow-unauthenticated --min-instances 0 --max-instances 1 --concurrency 8 \
     --labels app=movebooks,release=v2-preview,commit=<short> \
     --set-env-vars "MOVEBOOKS_PRIVATE_API_ORIGIN=<same as production>,MOVEBOOKS_PUBLIC_WEB_ORIGIN=<same as production>,MOVEBOOKS_ADDITIONAL_WEB_ORIGINS=https://localhost:8443,NEXT_PUBLIC_FIREBASE_PROJECT_ID=$P,NEXT_PUBLIC_IDENTITY_MODE=firebase"
   gcloud run services get-iam-policy movebooks-v2-preview-web --region $R --project $P   # must show no allUsers
   ```
   `MOVEBOOKS_ADDITIONAL_WEB_ORIGINS` exists for exactly this case. The proxy accepts writes only from the configured
   origins, and the tunnel's origin is `https://localhost:8443`. Copy every other production web variable unchanged.
   Verified locally on a Firebase-mode production build: a POST with `Origin: https://localhost:8443` reaches the
   sign-in check (401); another origin, or none, is refused (403).

5. **Open the preview (on the reviewer's machine).**
   ```bash
   gcloud run services proxy movebooks-v2-preview-web --region $R --project $P --port 8080   # authenticates as you
   npx --yes local-ssl-proxy@2.0.5 --source 8443 --target 8080                              # HTTPS for Firebase sign-in
   # open https://localhost:8443 (accept the local self-signed certificate)
   ```

5a. **Auth-layering gate (before any acceptance step).** The preview has two separate authentication layers.
   - **Cloud Run IAM** decides who may reach the private service. `gcloud run services proxy` attaches your identity token.
   - **Firebase Google sign-in** decides whose migrations the app shows. The browser sends the Firebase ID token as
     `Authorization: Bearer …` to `/api/v1/*`, and the web proxy verifies it, then forwards it to the API. Cloud Run
     IAM for that hop travels in `X-Serverless-Authorization` (`lib/server/private-api-proxy.ts`).

   Google's documentation for `gcloud run services proxy` does not state which header carries its token. If it sends
   `Authorization`, it replaces the Firebase token on the browser-to-web hop: Google sign-in succeeds, but every data
   call returns 401 "Sign in with Google to access this workspace". This has not been verified from this environment.
   Check it first:
   ```bash
   # Through the tunnel, unauthenticated at the app layer: expect 401 from the app (Cloud Run IAM passed).
   curl -sk -o /dev/null -w '%{http_code}\n' https://localhost:8443/api/v1/identity
   ```
   Then sign in with test account A at `https://localhost:8443/sign-in`, and open My migration.

   **Pass:** the Account menu shows A's verified email, and My migration loads (start a sample migration if it is empty).

   **Fail (401 after a successful Google sign-in):** stop `gcloud run services proxy`. Use the standalone proxy instead.
   It sends the IAM token in `X-Serverless-Authorization` by default and leaves `Authorization` untouched
   ([GoogleCloudPlatform/cloud-run-proxy](https://github.com/GoogleCloudPlatform/cloud-run-proxy)):
   ```bash
   go install github.com/GoogleCloudPlatform/cloud-run-proxy@latest      # pin the version you review
   cloud-run-proxy -host https://<preview-service-url> -bind 127.0.0.1:8080
   ```
   Keep `local-ssl-proxy` unchanged and repeat this step. Do not make the service public to work around it.

6. **Smoke tests.**
   ```bash
   bash docs/v2/release/smoke-v2.sh https://localhost:8443          # 24 read-only checks
   ```
   Locally, the same tunnel (`local-ssl-proxy` → Firebase-mode standalone build) passed 24/24. Google sign-in itself
   could not be exercised here. On 19 Oct, the script also passed 24/24 against a local production build of the
   Phase 1 closure commit.
   Then do the manual acceptance in `docs/v2/release/ACCEPTANCE-CHECKLIST.md`, including the two-account isolation
   harness (`auth-isolation/isolation_check.py https://localhost:8443`) with the two existing test Google accounts.

7. **Rollback or clean-up (★).**
   ```bash
   gcloud run services delete movebooks-v2-preview-web --region $R --project $P
   ```
   Synthetic migrations created during the preview stay with their owners, as with any Beta use.

### Go/no-go for the preview

- **YES, deploy the private preview** once steps 1 and 3 are approved and the scan passes (0 Critical, 0 High).
  Nothing in it changes production traffic, IAM, secrets or data.
- **Roll back** (delete the service) on any of the following:
  - the IAM policy shows `allUsers`;
  - `smoke-v2.sh` fails;
  - step 5a fails with both proxies;
  - any isolation check shows another account's data;
  - a financial value differs from the API.

## Production release (separate decision, not requested here)

The production release follows `docs/release/RELEASE-RUNBOOK.md`, web only:

1. `--no-traffic --tag cand` on `movebooks-beta-web`.
2. Smoke tests (`smoke-candidate.sh` and `smoke-v2.sh`).
3. `update-traffic --to-tags cand=100`.
4. **Immediately run a Firebase Hosting release (`firebase deploy --only hosting`, unchanged `firebase.json`).** A new Hosting release purges the CDN.
5. V2 now caps prerendered HTML at `s-maxage=60` (it was one year), so stale V1 HTML cannot outlive a minute.

Rollback = `update-traffic --to-revisions <previous web revision>=100`, then another Hosting release.

## Caching finding (fixed in `3ec4c8c`)

Next.js sends `Cache-Control: s-maxage=31536000` for the 14 prerendered pages (measured on a Firebase-mode production
build). The Hosting CDN may keep that HTML for a year. After a new revision, it can point at CSS and JS chunks the
new revision no longer serves, which reproduces the earlier stale-asset failure. V2 changes almost every stylesheet,
so this would have surfaced on release.

| Response | Before | After `3ec4c8c` |
|---|---|---|
| 14 prerendered pages (`/`, `/assess`, …) | `s-maxage=31536000` | `public, max-age=0, s-maxage=60, must-revalidate` |
| Dynamic pages (`/trust`, `/workspace`, `/sign-in`, `/product`) | `private, no-cache, no-store` | unchanged |
| Hashed `/_next/static/*` | `public, max-age=31536000, immutable` | unchanged |
