# Dormant Firestore Phase A execution

17 October 2026. User explicitly approved only the dormant scope in the
[provisioning proposal](../security/firestore-provisioning-proposal.md), with both policy
values false. The [original approval manifest](../../infra/firestore/proposal-manifest.json)
remains an immutable record of the proposed files and hashes.

**Accepted and closed — dormant Phase A only.** The owner enabled deletion protection; the successful update and refreshed Console metadata were verified. Rules, index and both false controls were reconfirmed. Local Phase B integration/testing is authorized; cloud IAM and activation are not. No Phase B IAM grant,
application deployment, Gemini invocation or public activation is authorized or performed.

| Check | Observed result |
| --- | --- |
| Project / database | `projects/movebooks-ai/databases/movebooks-operations` |
| Creation | Console inventory showed no databases before creation; created 17 October 2026 at 16:03:17 IST |
| Status | Available / Ready |
| Location | `asia-southeast1` (Singapore), selected from the supported Console options |
| Edition / mode | Standard / Firestore Native |
| Encryption | Google-managed |
| Deletion protection | **Enabled**; owner update `done:true`, reconfirmed in refreshed Console |
| Rules | Exact approved deny-all source, including comments, published and marked Active at 16:04:41 IST |
| Composite index | `CICAgOjXh4EK`: `movebooks_model_controls`, COLLECTION scope, `owner_hash ASCENDING`, `created_at DESCENDING`; Available / Ready after build completion |
| Control seed | Only `movebooks_model_controls/policy`, with Boolean `enabled:false` and `synthetic_beta_authorized:false` |
| PITR / backups | Both Disabled; no backups listed |
| TTL | No policies to display |
| Concurrency / App Engine integration | `PESSIMISTIC` / `DISABLED`, read from the successful owner update response |
| Additional observed metadata | `freeTier:true`, `realtimeUpdatesMode:REALTIME_UPDATES_MODE_ENABLED`, `versionRetentionPeriod:3600s` |
| Existing API | `firestore.googleapis.com` retained enabled per prior owner instruction |

The Console adds the usual implicit `__name__ DESCENDING` suffix to the composite index.
This is visible in its field list and does not add an application query field to the proposal.
The deny-client configuration was verified by reading the active source; live client
enforcement was not tested. Runtime IAM isolation, contention and model behavior remain separate gates.

## Resolved deviation and authentication history

The initial Cloud Shell database list stalled, then reported no active account. A subsequent
read-only describe using the signed-in account explicitly reported no valid credentials. The
Console inventory independently showed no existing databases, so creation proceeded through
the Console with restrictive rules, Standard Native, Singapore, Google-managed encryption,
PITR off and no backup schedule.

The Console creation form did not expose deletion protection and created it disabled. This
was a temporary deviation from the approved target, resolved by the owner update below. No deletion
was attempted. A Cloud Shell reconnect/restart did not restore authenticated CLI access.

The standard `gcloud auth login` flow requested broad cloud-platform, App Engine admin,
SQL login, Compute and reauthentication scopes. Automatic approval review rejected opening
that authorization URL because those scopes exceed Phase A. No consent or credential exchange
was completed; the unused broad sign-in prompt was cancelled. The owner executed the protection command in their existing session and shared the verified configuration. Its successful output was also visible read-only in the Console Cloud Shell: `done:true`, `DELETE_PROTECTION_ENABLED`, update time `2026-10-17T10:45:57.048785Z`. A refreshed Database details panel independently shows Enabled. No further sign-in or credential request is authorized.

The completed owner action was:

```sh
gcloud firestore databases update \
  --project=movebooks-ai \
  --database=movebooks-operations \
  --delete-protection
```

Read-only verification command retained for reproducibility:

```sh
gcloud firestore databases describe \
  --project=movebooks-ai \
  --database=movebooks-operations \
  --format=json
```

All specified resource fields match `infra/firestore/database.proposed.json`. The owner update also reports `freeTier:true`; this supersedes a blanket assumption that this named database lacks a free tier. The retained ~$0.25/month scenario deliberately excludes free quota and remains a conservative workload estimate, not measured billing or a cap. Realtime updates are enabled at database level by default; deny-client rules and both false controls remain in place. This is not application admission or public activation. Google's [update reference](https://docs.cloud.google.com/sdk/gcloud/reference/firestore/databases/update)
documents this flag. Any new API, IAM grant or broader access requires separate approval.
Do not delete the accepted dormant resource or disable the API as cleanup.

## Evidence

- [Owner successful update](evidence/firestore-phase-a-owner-update.png)
- [Enabled deletion protection](evidence/firestore-phase-a-database-accepted.png)
- [Reconfirmed active rules](evidence/firestore-phase-a-rules-accepted.png)
- [Reconfirmed false controls](evidence/firestore-phase-a-policy-accepted.png)
- [Reconfirmed Ready index](evidence/firestore-phase-a-index-accepted.png)
- [Historical database details before protection was enabled](evidence/firestore-phase-a-database.png)
- [Ready composite index](evidence/firestore-phase-a-index.png)
- [Active approved rules](evidence/firestore-phase-a-rules.png)
- [Saved false policy values](evidence/firestore-phase-a-policy.png)
- [Disabled PITR and backup settings](evidence/firestore-phase-a-recovery.png)
- [No TTL policies](evidence/firestore-phase-a-ttl.png)

The prior accidental API activation remains independently recorded in the
[inspection report](cloud-inspection-2026-10-17.md) and
[drift record](../../infra/firestore/api-drift-record.json). This later explicit provisioning
approval does not retroactively authorize that earlier inspection side effect.

## Phase A acceptance and next boundary

Accepted at 16:19 IST on 17 October 2026. Identifier, region, edition, Native mode, Google-managed encryption, pessimistic concurrency, App Engine integration off, deletion protection, PITR off, no backups/TTL, exact active deny-client source, Ready owner/time index and only two false policy fields match the dormant scope. No open Phase A deviation remains. Console source readback does not prove direct-client enforcement or workload IAM isolation. Those are test/activation gates.

The owner authorized **local** Phase B integration and testing. No runtime IAM grant, policy enablement, model invocation, app/env deployment, public feature activation or cloud test-data writes follow from this acceptance. Existing Beta revisions and SQL financial authority remain unchanged. General migration-phase event mirroring remains a separately tracked implementation gap until local code/tests deliver it.
