# Packaging status and submission checks

17 October 2026. This is packaging preparation, not a final ready declaration.

| Asset / rule | Current status | Completion evidence required |
| --- | --- | --- |
| Official pitch deck | Exact source located, preserved and populated into 16-slide review deck; branding/fonts retained | Confirmed team roster filled; contact pending owner input, final portal acceptance open |
| PDF <=5 MB | Official-template review PDF: 16 pages, 2,347,471 bytes; rendered and visually checked | Portal acceptance; re-export if pending fields change |
| Working-product video 3–4 min | Accepted authentic local UI WebM3:51.88,1440×1000,visible captions/SRT; silent | Public accessible link, portal format acceptance and authorized publication |
| Product description <=1024 chars | Prepared in product-description.txt, mechanically bounded | Reconcile final implemented/live claims and selected BFSI challenge |
| Selected BFSI problem statement | User-confirmed: BFSI: Intelligent Risk, Fraud & Financial Experiences | [Exact statement and accounting-migration fit](problem-statement.md) |
| Prototype URL | Existing documented Beta: https://movebooks-si.web.app | 17 October read-only HTTP 200 confirmed by integration owner; candidate version not deployed/verified, no new deployment authorized |
| Repository URL | Existing source: https://github.com/JEMathew/movers-and-ledgers | 17 October GitHub REST 200, private:false confirmed by integration owner; candidate branch/release still separate |
| Google Cloud evidence | Existing architecture and historical validation reused | Genuine current service/mode/permission evidence, sanitized as appropriate |
| PM / Working Backwards / diagrams | Prepared in source control | Candidate promise/test/deployment reconciliation |
| Acceptance/evidence manifest | Integration-owner deliverable | All mandatory assets and gates reflected accurately |

No cost, benchmark, adoption, financial impact, accuracy or performance result is invented. Implementation cost slide must distinguish measured spend, pricing inputs, workload assumptions and an unpriced model. Benchmarking must identify evaluated tasks, evidence window and missing comparisons. The mature PR/FAQ does not authorize real provider use or upload activation.

## Read-only link evidence from integration owner

On 17 October 2026, the public prototype returned HTTP 200 with the MoveBooks AI title. GitHub REST returned repository `JEMathew/movers-and-ledgers`, `private:false`, default branch `main`, last pushed `2026-10-12T16:47:16Z`. These observations prove reachability/public visibility only. The candidate was not deployed by this packaging work. `/api/v1/runtime` returned 404, so it supplies no runtime capability evidence. Local ADC/gcloud was unavailable. The user subsequently authorized console inspection; [current findings](cloud-inspection-2026-10-17.md) record healthy older serving revisions, deterministic-only API configuration, model retirement and an unintended Firestore API auto-enablement. The owner explicitly retained the API enabled. Subsequent approved dormant Phase A provisioned the operational database, deny-client rules and index with both policy flags false; see the current [Phase A evidence](firestore-phase-a-evidence.md). This does not activate application access or model inference.

The candidate offline Agent Quality Judge has 18 golden contract cases in `evals/agent_quality_cases.json`, runner `scripts/agent_quality_judge.py`, and report `docs/submission/agent-quality-evidence.json`. Its reported 100% score measures expected contract acceptance/rejection detection with zero live model calls. It must not be presented as model accuracy, financial accuracy or customer impact.

Final local checkpoint: core `1a24a2c`, 584backend passed/58skipped,674frontend passed/51files,17combined UI checks on1a24a2c and14Play checks. [Final video provenance](browser-journey/recording/video-manifest.json) separates the captured API `fffd14c` from the newer acceptance. Hosted upload, live Gemini/Firestore, candidate deployment/publication and the public video link remain gated; the exact template is now applied; confirmed team/leader/member details are filled and contact remains pending input.

Control-only follow-up `0c189f2`:594backend passed/58skipped. Dormant provisioning has since been explicitly approved and recorded in the Phase A evidence. Local Phase B integration is separately authorized; runtime IAM, live inference, application activation and publication remain gated. Existing deck/media checkpoints remain identified separately.

Current local Phase B checkpoint `6575004`: **628 backend passed / 71 skipped in 28.95 seconds**. The 13 emulator skips passed separately in 3.04 seconds, plus 8 actual Firebase Web SDK denial checks. The remaining 58 original optional/external skips remain unverified. See [Phase B local evidence](firestore-phase-b-local.md). Frontend remains 674/51 files; UI17/17 and the accepted video retain their earlier explicit source checkpoints. No cloud/IAM/inference claim.
