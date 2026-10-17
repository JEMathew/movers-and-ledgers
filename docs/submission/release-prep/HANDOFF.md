# HANDOFF — MoveBooks AI release preparation (read this first)

Written Sat 17 Oct 2026 ~18:00 IST. **Submission deadline: Sun 18 Oct 2026 23:59 IST** (portal shows 18/10/2026 11:59 PM IST).
Do **not** repeat completed audits, assessments or full test suites. Everything below is already settled.

## Repository state (verified read-only 17:37 IST)
- Worktree: `/Users/jincenmathew/Downloads/Intuit/movebooks-submission-integration` (git worktree of `.../movebooks-ai`)
- Branch `delivery/submission-integration`, HEAD `01d105c8348ade37b1a02df0a1f95b0c3c00a5f4`
- Git tree `6c5b3872fa1afa6a5dfa75e4f9b3d27c21056a3c`; working tree clean at verification (before this folder was added).
- Not pushed. GitHub `main` is still `8f750d9` (12 Oct); none of the candidate is public.
- GCP project `movebooks-ai`, region `asia-southeast1`, services `movebooks-beta-api`, `movebooks-beta-web`.
  API workload identity `movebooks-beta-api@movebooks-ai.iam.gserviceaccount.com`. Cloud SQL `movebooks-ai:asia-southeast1:movebooks-beta-pg`.
  Registry `asia-southeast1-docker.pkg.dev/movebooks-ai/movebooks-beta/`. Public site `https://movebooks-si.web.app` (Firebase Hosting -> `movebooks-beta-web`).

## Completed gates (with evidence)
| Gate | Evidence |
|---|---|
| Candidate local acceptance: 628 backend pass / 71 skip, 674 frontend pass, lint/tsc/build pass, 17/17 real-UI journey to verified USD 107.25 invoice, Play 14/14 | `docs/submission/acceptance-report.md`, `browser-journey/`, `browser-play/` |
| Firestore Phase A (dormant DB `movebooks-operations`, rules, index, policy seeded false) accepted and closed | `docs/submission/firestore-phase-a-evidence.md` |
| Firestore Phase B local (emulator) accepted | `docs/submission/firestore-phase-b-local.md` |
| P0-1 Gemini 3.5 Flash-Lite / `global` endpoint / `ThinkingLevel.LOW`, offline-validated (67 targeted tests), independently reviewed PASS | commit `a66a3eb`; `docs/security/model-replacement-gate.md` |
| API image now installs `.[cloud,agents]` (google-adk 1.39.1 / google-genai 2.31.0) | commit `01d105c`; extras resolved + imported OK on Python 3.14.6 (131 pkgs, `pip check` clean) |
| Source archive of `01d105c` verified in a scratch copy: archive tree hash == expected; embedded commit == expected; all Dockerfile build inputs present | this session (scratch only; **authoritative checksum must be made on the Mac**) |

## NOT done (do not claim otherwise)
- No Cloud Shell command has been run. Cloud Shell does **not** have the candidate source.
- No image built or scanned. No candidate deployed. No live Gemini call. No IAM/Firestore/Firebase change. No backup taken. No push.
- No standalone build-and-scan script existed before this session; `build-and-scan.sh` here is new, **reviewed by `bash -n` and a synthetic gate test only, never executed against Docker/Grype**.

## Remaining tasks, priority order
1. **Stage A** (`STAGE-A.md`): archive on Mac -> upload -> verify in Cloud Shell. Needs the user.
2. **Stage B** (`build-and-scan.sh`) after the user says "go": build API+web, ADK import check, pinned Grype, evidence.
3. **Release gates** (`RELEASE-GATES.md`), each needing its own explicit approval, in order.
4. Submission assets: re-record demo against deployed URL (+20 s Gemini segment only if live Gemini passes), upload to YouTube unlisted, fill deck contact field, push/merge branch (approval), verify all links in a private window, final description.
5. **Live Gemini go/no-go** was targeted for Sat 19:30 IST. If not green by Sun 10:00 IST: keep Gemini off, submit the "validated in development" description.

## Exact pending user approvals (none granted yet)
A1 Create Mac archive and upload (user action). A2 "Go" for Stage B. A3 Cloud SQL on-demand backup. A4 Create custom role + conditional Firestore binding (see gates; **supersedes my earlier chat suggestion of `roles/datastore.user`**). A5 Registry push of the two scanned images. A6 No-traffic API deploy, then API traffic. A7 No-traffic web deploy. A8 Temporary Firebase authorized domain. A9 Web traffic. A10 Firestore policy flags. A11 Live Gemini (`global`, paid, bounded). A12 Git push / publish.

## Commands prepared, not executed
`STAGE-A.md` (archive/upload/verify), `build-and-scan.sh`, and every command in `RELEASE-GATES.md`.

## Known risks / rollback constraints
- Cloud SQL automated backups are **off**; an on-demand backup is the only data rollback point. No schema change since `main`, so rollback = route traffic back to the recorded revisions (`--to-revisions`).
- Live Gemini processes prompts in `global` (no Singapore residency). Synthetic data only; acceptable only because no residency promise is made.
- `gemini-2.5-flash` retires 20 Oct 2026 (during judging); only `gemini-3.5-flash-lite` is validated. Other models fall back to old thinking config.
- Live policy needs BOTH Firestore `movebooks_model_controls/policy` `enabled:true` AND `synthetic_beta_authorized:true` (plus env `MOVEBOOKS_SYNTHETIC_BETA_AUTHORIZED`). Start disabled.
- Vertex access must be proven with the **attached workload identity** (from the candidate revision), not a developer identity.
- Cloud Shell memory may be too small for the Next.js build. If so, STOP and ask; do not change architecture.
- The web image embeds the Firebase web key by design; keep the evidence folder private. Never print the key.
- Firebase `AUTH_DOMAIN` build value and the candidate tag hostname were **not verified** from the repo; the user supplies/confirms them.
- Commit `01d105c` is local only; Cloud Shell can only get it via the archive.

## Next immediate action
Ask the user to run **Stage A** (`STAGE-A.md`) and paste the output. Then wait for explicit "go" before Stage B.

## Added after writing the gate files
- **Acceptance scripts cannot test the deployed site.** `browser-journey/accept-and-record.cjs` hardcodes `http://localhost:3000` + local demo identity. Deployed acceptance (G7 in `RELEASE-GATES.md`) must be manual with Google sign-in, or the scripts need a separate adaptation (not started).
- **Grype DB metadata structure is assumed** (recursive search for `built`/`valid` under `descriptor.db`). The gate fails closed if `built` is missing: if Stage B reports "database 'built' timestamp not found", paste `python3 -c "import json;print(json.load(open('<evidence>/api-grype.json'))['descriptor'].get('db'))"` and adjust only that parser.
- Gate logic was tested on 10 synthetic cases (pass, High, Critical, ignored findings, stale DB, missing DB timestamp, wrong image digest, scanner error, no matches list, invalid DB). Docker/Grype were NOT run.
- Firestore least privilege uses the repo's custom role `projects/movebooks-ai/roles/movebooksOperationalRuntime` (5 permissions) with condition `resource.name == "projects/movebooks-ai/databases/movebooks-operations"` — not `roles/datastore.user`.
