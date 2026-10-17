# Packaging status and submission checks

17 October 2026. This is packaging preparation, not a final ready declaration.

| Asset / rule | Current status | Completion evidence required |
| --- | --- | --- |
| Official pitch deck | Draft content uses required section list; exact template pending receipt | Import actual `Submission Template \| AI Builder Cup.pptx`, preserve structure/design and inspect final deck |
| PDF <=5 MB | Export required with final template | Actual file size, page rendering and portal acceptance |
| Working-product video 3–4 min | 3:30 storyboard and draft captions prepared | Authentic candidate footage, final MP4 duration/audio/visual QA and accessible link |
| Product description <=1024 chars | Prepared in product-description.txt, mechanically bounded | Reconcile final implemented/live claims and selected BFSI challenge |
| Selected BFSI problem statement | User-confirmed: BFSI: Intelligent Risk, Fraud & Financial Experiences | [Exact statement and accounting-migration fit](problem-statement.md) |
| Prototype URL | Existing documented Beta: https://movebooks-si.web.app | 17 October read-only HTTP 200 confirmed by integration owner; candidate version not deployed/verified, no new deployment authorized |
| Repository URL | Existing source: https://github.com/JEMathew/movers-and-ledgers | 17 October GitHub REST 200, private:false confirmed by integration owner; candidate branch/release still separate |
| Google Cloud evidence | Existing architecture and historical validation reused | Genuine current service/mode/permission evidence, sanitized as appropriate |
| PM / Working Backwards / diagrams | Prepared in source control | Candidate promise/test/deployment reconciliation |
| Acceptance/evidence manifest | Integration-owner deliverable | All mandatory assets and gates reflected accurately |

No cost, benchmark, adoption, financial impact, accuracy or performance result is invented. Implementation cost slide must distinguish measured spend, pricing inputs, workload assumptions and an unpriced model. Benchmarking must identify evaluated tasks, evidence window and missing comparisons. The mature PR/FAQ does not authorize real provider use or upload activation.

## Read-only link evidence from integration owner

On 17 October 2026, the public prototype returned HTTP 200 with the MoveBooks AI title. GitHub REST returned repository `JEMathew/movers-and-ledgers`, `private:false`, default branch `main`, last pushed `2026-10-12T16:47:16Z`. These observations prove reachability/public visibility only. The candidate was not deployed by this packaging work. `/api/v1/runtime` returned 404, so it supplies no runtime capability evidence. No ADC/gcloud was available for a current effective Vertex/Firestore verification.

The candidate offline Agent Quality Judge has 18 golden contract cases in `evals/agent_quality_cases.json`, runner `scripts/agent_quality_judge.py`, and report `docs/submission/agent-quality-evidence.json`. Its reported 100% score measures expected contract acceptance/rejection detection with zero live model calls. It must not be presented as model accuracy, financial accuracy or customer impact.
