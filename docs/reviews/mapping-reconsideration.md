# Mapping reconsideration — bounded local review

Date: 2026-09-28. Branch: `feature/google-cloud-validation`. Baseline: `fe498ad`.

**GREEN for the local reconsideration slice; overall Google Cloud validation remains AMBER.**
No cloud compute, endpoint exposure, Firebase change, deployment or preserved-workspace mutation
was performed. PR #13 remains draft/unmerged. Cloud intake, Gemini and managed ADK remain disabled.

## Outcome and design review

The final rejection previously had no supported recovery transition. The new flow retains that
decision, requests a linked review, and requires a separate owner approval/rejection. Ordinary
approval cannot overwrite a rejected mapping, even while reconsideration is pending. No automatic
approval, replacement workspace, SQL edit, history deletion or execution-stage rewind is added.
The [architecture contract](../architecture/plan-map-approve.md) defines allowed transitions,
four audit events, deterministic checks, owner identity and idempotency/CAS behavior.

Review checked authorization before workspace access, request/review schema spoofing, original
audit/history preservation, repeated rejection, stale/duplicate requests, failed atomic writes,
legacy snapshot compatibility, UI request/review separation and error/focus handling. No unresolved
P0/P1 finding was identified in this bounded local slice. This is not final cloud P0/P1 clearance.

Two development issues were found and corrected before completion: a review outcome initially
used an action spelling incompatible with persisted state literals; restart tests exposed it.
Also, serializing an added empty field would invalidate optimistic hashes of existing snapshots;
empty reconsideration lists are omitted to preserve legacy encodings. Neither version was deployed.

## Verified checks

- **20 new backend cases**, exercised through HTTP with local server-principal overrides and
  both in-memory and real file-backed SQLite repositories. No live Firebase claim is made.
- Final full backend suite: **275 passed, 10 existing PostgreSQL-only skips**. Existing Starlette
  test-client deprecation warning remains; no test was weakened or skipped for this change.
- New coverage: final rejection cannot be overwritten; explicit request required; User B/anonymous
  request/review denial; spoofed actors rejected; original actor/time/reason/evidence/events and
  decisions retained; approval appends a new decision; rejection remains final; changed-payload
  retries rejected; identical requests/reviews idempotent; no parallel pending review; restart
  before/after review; legacy snapshot read/write; CAS rollback; same-workspace migration handoff;
  no execution rewind; repeated rejection chain; browser event forgery denied.
- **6 new frontend cases** across focused component and page integration tests. These verify
  reason requirements, separate human actions, original history, request route wiring, no new
  workspace, retry key retention, safe errors and focus restoration. Existing frontend tests remain.
- Complete frontend suite: **82 passed**. Frontend lint, TypeScript and production build passed.
- Ruff and whitespace checks passed. Repository checks inspected 85 Markdown files and 325 text
  files with zero findings.

The UI uses existing focus-visible styles, labeled native textarea/buttons and status/alert
announcements; DOM tests verify focus on the history heading after state changes. No new dialog
or global navigation behavior was introduced. A live browser screen-reader audit is not claimed.

## Remaining release boundaries

- The preserved cloud session `efbf72e9-aff5-489c-b17e-d2edced3237b` has **not** been changed.
  It can use the new flow only after new API/web images are built, scanned and deployed.
- Existing deployed images have their prior zero-High/zero-Critical evidence. That evidence is
  **not transferred** to unbuilt replacement images. Fresh CI/image gates are required.
- New persistence tests use SQLite; remote PostgreSQL CI and real two-user Firebase HTTP checks
  remain release gates, not silently counted as local passes.
- Keep a reconsideration-capable API version for restarts after new records exist. Older API
  versions do not recognize the new event names; do not assume a downgrade can read those sessions
  or erase new audit history to make it work. No deployment/downgrade was exercised locally.
- Final cloud owner approval-POST denial, actor anti-spoofing, canonical FPU, execution restart/
  resume and full monitoring failure coverage remain unverified. Production/tamper-proof audit,
  real accounting providers and compliance are outside this slice.
- The unrelated pre-existing `apps/web/package-lock.json` modification is preserved and excluded
  from this commit. No dependencies, lockfile, images, IAM or cloud configuration were changed.

## Exact next step

Publish the local branch through normal Git, obtain fresh CI and image scans, then schedule an
authorized bounded live resumption. Keep cloud resources stopped/private until then. In the
**same preserved workspace**, request Catalog preparation → Service reconsideration with a
reason referencing the owner's synthetic dev/test authorization. Review the retained rejection
and submit a separate explicit approval; never seed or auto-apply it. Verify User B request/review
denial, authenticated actor/audit persistence and the remaining cloud journey gates, followed by
mandatory shutdown/IAM rollback. Do not merge automatically.

## Changed-file inventory

- Domain: `domain/planning_mapping/models.py`, `domain/discovery_assessment/models.py`.
- Orchestration: `agents/orchestrator/mapping_reconsideration.py`.
- API/service: `services/api/src/movebooks_api/discover_assess/api.py` and `service.py`.
- Persistence compatibility: `services/api/src/movebooks_api/runtime/persistence.py`.
- UI: `apps/web/components/plan-map-approve/MappingReconsideration.tsx`,
  `PlanMapApproveExperience.tsx`, `types.ts`.
- Tests: `tests/test_mapping_reconsideration.py`,
  `apps/web/components/plan-map-approve/MappingReconsideration.test.tsx`,
  `apps/web/components/plan-map-approve/PlanMapApproveExperience.test.tsx`.
- Documentation: this review, `docs/architecture/plan-map-approve.md`,
  `docs/reviews/google-cloud-validation.md`, `docs/deployment/google-cloud.md`.
