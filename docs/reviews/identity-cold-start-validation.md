# Identity cold-start live validation

Live validation of PR #23 (identity cold-start optimization) on the public Beta API,
1 October 2026. Companion to the local profiling note in
[identity-cold-start.md](identity-cold-start.md).

Verdict: **AMBER**. PR #23 is deployed, safe and security-neutral, but it does **not**
materially shorten the real Cloud Run cold start. Startup to readiness is still about 22 s
against a 21.07 s baseline. Warm identity verification is unchanged and fast.

P0: 0. P1: 0. P2: 1 (cold identity latency). P3: 1 (retained Medium/Low image advisories).

## Evidence sources

This note separates three kinds of evidence. Nothing here was inferred from local timings.

| Label | Meaning |
| --- | --- |
| **Cloud Shell, pasted** | Output of the pre-deploy script run by the owner in Cloud Shell and pasted into the review session verbatim |
| **Owner-reported** | Results the owner read from Cloud Shell or the browser and reported; the raw output was not captured in this repository |
| **Agent-measured** | Anonymous, read-only HTTP checks run by the reviewing agent from outside Google Cloud |

The agent had no gcloud, Docker or scanner access. All cloud commands were executed by the
owner in Cloud Shell from a prepared script. Environment and secret values were never printed;
only fingerprints were compared.

## Scope and boundaries

One cloud mutation was approved and made: the `movebooks-beta-api` container image. One new
tag, `cold-start-b5b48ef`, was pushed to the existing Artifact Registry repository. Not
changed: web service, IAM, SQL, min/max instances, concurrency, CPU, memory, environment,
secrets, Firebase authorized domains, billing, tags or releases. No business data was written.
No merge or push of source was made as part of this validation.

## Source and deployment

| Item | Value | Source |
| --- | --- | --- |
| Source commit | `b5b48efa7393d8b9c814f2926a04085ba3059831` (PR #23 squash on `main`) | Cloud Shell, pasted (script asserts commit and clean tree) |
| Previous revision | `movebooks-beta-api-00012-z5n` | Cloud Shell, pasted |
| Previous image | `sha256:925d5d218b925e2324ca03352aeea07db428485663989cfb5d0f1b0041bf5411` | Cloud Shell, pasted |
| New revision | `movebooks-beta-api-00013-x8m` | Owner-reported |
| New image | `sha256:c4fcc5de8ba6164c528c3123fb0e44138b84513123737eb627107113b2c75d65` | Cloud Shell, pasted |
| Registry | `asia-southeast1-docker.pkg.dev/movebooks-ai/movebooks-beta/api` (existing) | Cloud Shell, pasted |
| Rollback target | `movebooks-beta-api-00012-z5n`, retained | Cloud Shell, pasted; retention owner-reported |

The previously deployed source (`af06426`) did not contain PR #23. The API-affecting
difference between it and `b5b48ef` is exactly the three PR #23 files (`main.py`,
`runtime/persistence.py`, `runtime/warmup.py`), confirmed by `git diff` in the repository.

Deployment command, image only:

```text
gcloud run services update movebooks-beta-api --image=asia-southeast1-docker.pkg.dev/movebooks-ai/movebooks-beta/api@sha256:c4fcc5de8ba6164c528c3123fb0e44138b84513123737eb627107113b2c75d65 --project=movebooks-ai --region=asia-southeast1 --quiet
```

## Image security gate

Built in Cloud Shell with `docker build --pull --no-cache -f services/api/Dockerfile`, saved
to an archive and scanned with the pinned
`anchore/grype@sha256:8c2c9234a345577a6d321a4753aa3ee1276d8975c8452d2344a56b57733ecad3`
using `--fail-on high`, no ignore or only-fixed filter. The script refuses to push unless the
scanner exits 0 with zero Critical and zero High, and refuses to finish unless the published
image configuration equals the scanned image.

| Severity | Count |
| --- | ---: |
| Critical | 0 |
| High | 0 |
| Medium | 7 |
| Low | 1 |

Source: Cloud Shell, pasted. Gate passed. The previously deployed image recorded 6 Medium;
the base image is pinned by digest, so the seventh is most likely a newly published advisory
rather than a new package. The individual advisory identifiers and the report hash were not
captured in this repository and the report lived in Cloud Shell `/tmp`. They remain visible
follow-ups, not suppressed findings and not a vulnerability-free claim.

## Unchanged-state checks

| Check | Result | Source |
| --- | --- | --- |
| Service IAM policy fingerprint, before vs after | Unchanged | Owner-reported |
| Environment/secret fingerprint, before vs after | Unchanged | Owner-reported |
| No `allUsers` / `allAuthenticatedUsers` binding on the API | Confirmed before push | Cloud Shell, pasted (script gate) |
| Scaling (min 0 / max 1), concurrency, CPU, memory | Unchanged | Owner-reported |
| Cloud SQL state and configuration | Unchanged | Owner-reported |
| Web service and Hosting | Not deployed, unchanged | Owner-reported |

## Authentication and access

Agent-measured from outside Google Cloud at 2026-10-01 10:16 UTC, after deployment, three
requests each, no credentials:

| Request | Status | Time |
| --- | ---: | ---: |
| `GET https://movebooks-si.web.app/` | 200 | 0.07-0.23 s |
| `GET https://movebooks-si.web.app/api/v1/identity` | 401 | 0.22-0.29 s |
| `GET <private API>/v1/identity` | 403 | 0.47-1.01 s |
| `GET <private API>/readyz` | 403 | 0.12-0.23 s |

The web proxy rejects a missing token before calling the API, and the Google edge rejects
direct anonymous API access, so the API remains private. The same three denials were
owner-reported from Cloud Shell. Authenticated sign-in through the public web returned an
API-verified identity (owner-reported; the warm timings below come from those requests).
Owner isolation and business state were not exercised: no scenario, mapping, approval or
invoice action was performed.

## Timing results

| Measurement | Before PR #23 (2026-09-30) | After PR #23 (2026-10-01) | Source |
| --- | ---: | ---: | --- |
| Warm authenticated `/v1/identity` | 0.26 s API / 0.31-0.32 s web | ~0.20-0.37 s | Owner-reported |
| Instance start to startup probe success | 21.07 s | ~22 s | Owner-reported |
| Cold authenticated identity request | 21.34 s API / 21.86 s web | not isolated as a single request | - |
| User-perceived first sign-in delay | ~21 s | ~10-20 s | Owner-reported |

The ~22 s figure is the deployment cold start of the new revision. A separately timed
scale-to-zero cold request with matching request and system log lines was not captured in
this note.

## Interpretation

- PR #23 does not materially improve the live cold path. Start-to-ready is within noise of
  the baseline. This matches the local profiling prediction that application import is a
  minor contributor.
- Warm verification is unaffected and well inside the 2-3 s target.
- The remaining bottleneck is the startup path that gates traffic: container start, the
  first Cloud SQL connection and bucket check inside `/readyz`, and the startup probe
  cadence. Running the two readiness checks concurrently did not shorten the total
  noticeably, which suggests one dependency or the probe period dominates.
- Classification of the remaining problem: mixed dependency and platform startup, not
  application code.

Still unknown: the startup probe period and timeout, CPU and startup CPU boost settings, and
the split between SQL and bucket readiness. The live probe configuration was read in Cloud
Shell but not recorded here. Per-check timing in `/readyz` logs would settle the split.

## Min instances analysis (not applied)

| Option | Latency | Cost | Fit |
| --- | --- | --- | --- |
| A: min 0 (current) | First sign-in after idle waits ~10-20 s behind "Verifying your account..." | No idle cost | Bounded public Beta |
| B: temporary min 1 | First sign-in near the warm ~0.2-0.4 s path | Low tens of US dollars per month if left on; prorated for a short window | Scheduled interview or demo windows only |
| C: code-level only | Shown here to be insufficient alone | None | Already merged; keep |

Recommendation: keep min instances 0 for the public Beta. Use temporary min instances 1
only for scheduled interview or demo windows, enabled and reverted explicitly with owner
approval, and confirmed against live pricing first. Sending one authenticated request a
minute before a demo is a zero-cost alternative when the timing is predictable.

## Rollback

Not needed. If a blocker is later proven, route API traffic back to
`movebooks-beta-api-00012-z5n` with owner approval; no IAM, SQL or web change is involved.

## Next steps

1. Record the live startup probe period/timeout, CPU and startup CPU boost values.
2. Record the seven Medium and one Low advisory identifiers for the new image.
3. If cold latency matters beyond demos, evaluate startup CPU boost and probe timing as a
   separately approved configuration change, with per-check `/readyz` timing first.
