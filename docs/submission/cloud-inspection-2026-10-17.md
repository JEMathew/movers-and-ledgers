# Current cloud inspection — 17 October 2026

User explicitly authorized read-only inspection of the existing `movebooks-ai` Google Cloud project,
including service revisions/configuration, IAM, Vertex/Gemini availability, Firestore status, logs
and deployment health. The earlier automatic browser approval block was resolved by that direct
permission. This report supersedes prior statements that no current console evidence was available.
No paid inference request, financial action, IAM edit, database creation, deployment or traffic
change was performed. **There was an unintended API-enablement side effect, recorded below.**

## Configuration and service observations

| Item | Current observation | Limit of evidence |
| --- | --- | --- |
| API Cloud Run service | Healthy and serving traffic in `asia-southeast1`; `movebooks-beta-api-rel2997e20` receives 100%; deployed 9 October 2026, 21:20:59 IST | Console status/configuration; no new authenticated financial journey |
| API image digest | `sha256:9d95c18f29db96f3b361638212d22bc7a2b8b30f4bd5fd826a12ae1453d2c2a0` | Image bytes/source provenance not independently reconstructed |
| API workload | `movebooks-beta-api@movebooks-ai.iam.gserviceaccount.com` | Serving revision's Security tab |
| API safe configuration | `cloud-dev`; Firebase identity; demo identity false; `cloud-sql` persistence; `gcs` storage; structured logs; `deterministic-only` model provider | Configuration is not execution proof for SQL/storage/authentication |
| API bounds | 1 CPU, 512 MiB, concurrency 8, request timeout 60 seconds, revision maximum 1 instance | Does not establish load capacity |
| Web Cloud Run service | Healthy; `movebooks-beta-web-ux2f781012182645` receives 100%; deployed 12 October 2026, 23:56:47 IST | Separate older public release, not local submission candidate |
| Web image digest | `sha256:ee3773bc25bb101021a754fdc11731758b5fd9ca158c98ff2c66d1a2208f4d30` | No source/image equivalence claim |
| Web safe configuration | Firebase identity; API proxy `/api`; private API origin points to existing API; additional allowed web origin includes `https://movebooks-si.web.app` | Firebase Hosting routing itself was not separately inspected |
| Cloud SQL | `movebooks-beta-pg`: Available/Runnable, PostgreSQL 17, `asia-southeast1-c`; matches configured API instance | No SQL query, data/backup restoration or connection test |
| SQL operating gaps | Console reports one high-priority issue: no automated backup policy; high availability is not enabled | Dev/test posture; remediation requires scoped approval; not production readiness |
| Container security metadata | Serving API revision reports vulnerability information/build/source information unavailable and threat detection disabled | Local dependency audits do not replace current production-image scanning |

Source console pages:

- [API revisions](https://console.cloud.google.com/run/detail/asia-southeast1/movebooks-beta-api/revisions?project=movebooks-ai)
- [Web revisions](https://console.cloud.google.com/run/detail/asia-southeast1/movebooks-beta-web/revisions?project=movebooks-ai)
- [Project IAM](https://console.cloud.google.com/iam-admin/iam?project=movebooks-ai)
- [Cloud SQL instances](https://console.cloud.google.com/sql/instances?project=movebooks-ai)

## IAM, model API and lifecycle

The project IAM principal row for the serving API identity shows **Agent Platform user**, Cloud SQL
Client, Cloud SQL Instance User and the custom **MoveBooks token revocation check** role. The two SQL
roles display the `beta-instance-only` condition. No Firestore data role was visible in that principal
row. This is a project Allow-policy observation; role IDs, full permission expansion, resource-level
policy, effective Deny/VPC-SC evaluation, impersonation and current workload inference were not tested.
Do not treat a role label as proof that a specific model request will succeed.

The enabled-service inventory and [Agent Platform API detail](https://console.cloud.google.com/apis/api/aiplatform.googleapis.com/overview?project=movebooks-ai)
confirm `aiplatform.googleapis.com` is enabled. The API dashboard's 30-day Methods table shows 20
GenerateContent and one CountTokens request with 0% reported API errors. This aggregate is historical,
not attributed to the Cloud Run identity or the candidate, and does not measure structured-output
acceptance, reasoning quality or customer outcomes. No new generation was invoked during inspection.

The historical bounded test selected `gemini-2.5-flash`; the source pins reasoning location to
`asia-southeast1` and requires an explicit capability-to-model map. The serving revision has no live
model map and remains deterministic-only. Google's current model documentation lists
`asia-southeast1` as supported **and retirement on 20 October 2026**. A supported replacement needs
regional, SDK/ADK, structured-output, tool, safety, quota and price evaluation before live activation.
No automatic model substitution or deployment change is authorized by this finding.

Primary public references, checked 17 October 2026:

- [Gemini 2.5 Flash regions and retirement](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/gemini/2-5-flash), updated 16 October 2026.
- [Firebase model shutdown FAQ](https://firebase.google.com/docs/ai-logic/faq-and-troubleshooting), independently confirms the Agent Platform retirement date.

## Operational logs

The [existing API log pane](https://console.cloud.google.com/run/detail/asia-southeast1/movebooks-beta-api/observability/logs?project=movebooks-ai)
showed historical request/status records from 10–13 October, including HTTP 200 identity,
configuration and onboarding requests, followed by a normal application shutdown on 13 October.
It does not prove current signed-in execution, no errors outside that displayed window, candidate
acceptance or model activity. Request/session identifiers and raw records are omitted here.

## Unintended Firestore API activation — owner elected to retain it

1. The full enabled-service inventory initially omitted Firestore. The
   [Firestore API library detail](https://console.cloud.google.com/apis/library/firestore.googleapis.com?project=movebooks-ai)
   explicitly displayed **Enable** (disabled state).
2. Opening the Firestore database inventory as a status inspection displayed an error saying the
   console had attempted to auto-enable the API. No Enable/Create/Save action was taken.
3. The agent immediately left that inventory page. Returning to the library detail confirmed
   **API Enabled** with **Manage**. Thus an unintended project configuration change did occur. [Observed API-enabled screenshot](evidence/firestore-auto-enabled-console.png).
4. The inventory also displayed an empty table and “You don't have any databases in this project
   yet,” alongside its API error. This is not an authoritative successful database enumeration.
   The agent did not create or modify a database, index, rule or policy.
5. The agent disclosed the incident and requested separate explicit approval to disable only
   `firestore.googleapis.com`, restoring the prior state. The owner subsequently directed that the API remain enabled; **no rollback was performed**. Do not revisit a product landing page that can auto-enable a disabled service.

Current API-enabled status is **not** evidence of an activated operational backend. The candidate's
Firestore controls/readback remain undeployed and unprovisioned. Database existence/region, indexes,
rules, workload access, transaction behavior and owner isolation remain unverified.

## Release disposition

Read-only inventory supplies current serving revision/configuration and bounded IAM/API/health
observations. It does not authorize live-model activation, Firestore provisioning, IAM changes,
backup/HA changes, candidate deployment, public uploads or publication. Overall submission stays
No-Go for its remaining mandatory inputs and release gates. The owner resolved the API state by retaining enablement. Evaluate the imminent model retirement, and prepare exact scoped changes for review.

## Owner disposition after inspection

The user explicitly directed: leave `firestore.googleapis.com` enabled and do not disable it. This accepts the enabled API as the new desired baseline; it does not retroactively authorize the inspection side effect. [Structured drift record](../../infra/firestore/api-drift-record.json). Database creation, IAM, service deployment and other configuration remain unapproved. The [concrete provisioning proposal](../security/firestore-provisioning-proposal.md) must be reviewed before any provisioning.

## Later dormant provisioning approval

After this inspection, the owner explicitly approved Phase A only. The named database was created, exact deny-client rules published, owner/time index creation started and the two false policy controls seeded. [Execution evidence](firestore-phase-a-evidence.md) records accepted dormant Phase A, including owner-enabled deletion protection and reconfirmed Active rules/Ready index/false controls. The historical inspection scope and API incident above remain unchanged; no IAM, service deployment or model activation was authorized by the later Phase A approval.
