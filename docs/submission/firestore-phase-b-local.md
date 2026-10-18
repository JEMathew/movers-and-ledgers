# Local Firestore Phase B integration

17 October 2026. Authorized scope: local implementation and testing after
[dormant Phase A acceptance](firestore-phase-a-evidence.md). Cloud IAM grants, live test-data
writes, application deployment and paid inference remain excluded.

## Controls and direct-client rules

**Passed: 13 real SDK/emulator integration tests and eight Firebase web SDK denial checks.**
Final combined Python run: 3.04 seconds. [Combined output](evidence/firestore-phase-b-local-combined.txt). The earlier [controls-only run](evidence/firestore-phase-b-local-controls.txt) passed 10 in 2.73 seconds. Source commit `6575004`. Full backend regression: **628 passed, 71 skipped, one existing deprecation warning** in 28.95 seconds; [log](evidence/backend-phase-b-tests.txt). Thirteen of those default-suite skips are the emulator cases passed separately here; the original 58 optional/external skips remain unverified.
The `PERMISSION_DENIED` messages in that output are expected client-denial evidence.

The tests verify missing/disabled policy denial without counters, named-database isolation,
reservation → terminal completion → owner-filtered activity readback, immutable replay,
exact owner/global/budget exhaustion, conservative transaction contention and the real
update-time precondition rejecting a competing stale completion. Contention may admit zero
requests; these checks prove bounded reservations and provider-step admission, not throughput.
Firebase **web** SDK tests deny reads and writes for anonymous and mock signed-in clients
against both `(default)` and `movebooks-operations`. Server SDK access is tested separately
because it bypasses client rules.

The runner creates a new disposable loopback emulator with project `demo-movebooks-local`,
strips cloud/app credential configuration and uses explicit `AnonymousCredentials`. Tests
independently reject non-loopback endpoints and forbid ADC. The runner starts no cloud
fallback, imports no saved project data and stops the emulator in cleanup. Normal pytest
skips these integration tests without its explicit opt-in flag. Node is required by the runner.

```sh
/Users/jincenmathew/Downloads/Intuit/movebooks-ai/.venv/bin/python \
  scripts/run_firestore_emulator_tests.py \
  --java '/private/tmp/movebooks-jre21-verified/jdk-21.0.12.1+1-jre/Contents/Home/bin/java' \
  --jar /Users/jincenmathew/.cache/firebase/emulators/cloud-firestore-emulator-v1.19.8.jar \
  --node /Users/jincenmathew/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node
```

Run from the integration repository. The portable JRE and emulator are local dependencies,
not committed binaries. Python Firestore SDK: 2.32.0; Firebase web SDK: 12.19.0.

| Artifact | Provenance / SHA-256 |
| --- | --- |
| Firestore emulator 1.19.8 | [Official artifact](https://storage.googleapis.com/firebase-preview-drop/emulator/cloud-firestore-emulator-v1.19.8.jar); `9d43599ed6151199e8d604dc87fac51218e49e5f3a48519b1ae560bbe5e3382d` |
| Portable Temurin 21 JRE | [Official release](https://github.com/adoptium/temurin21-binaries/releases/download/jdk-21.0.12.1%2B1/OpenJDK21U-jre_aarch64_mac_hotspot_21.0.12.1_1.tar.gz), [published checksum](https://github.com/adoptium/temurin21-binaries/releases/download/jdk-21.0.12.1%2B1/OpenJDK21U-jre_aarch64_mac_hotspot_21.0.12.1_1.tar.gz.sha256.txt); `dec50fc6f9fcd4fe3ae8cabf5a5fa68f6afc48841f7698e468e9aa5d54beed84` |
| Deny-client rules | `infra/firestore/firestore.rules`; `e2e4d57004343221057b6e946bd66cacfe9c471fd26291be3f3b4f28763d7ffc` |

## Default-disabled local migration-phase slice

`runtime/migration_activity.py` and the optional `SqlSessionRepository` constructor hook provide an explicit local vertical slice. A separate outbox row joins the successful session create/CAS transaction. Failed CAS or enqueue cannot partially commit either record. Relay reads committed rows through independent file-backed SQLite connections; memory/shared-connection pools and PostgreSQL activation are rejected. The default repository factory and financial schema bootstrap are unchanged.

The stored envelope contains HMAC pseudonyms, a strict workflow/phase enum and UTC timestamp only. The read projection returns phase/status/time, with an independent owner check and limit of 20. No owner hash, financial payload or credentials are returned. Delivery uses create-only Firestore writes and checks equality on AlreadyExists, so lost responses/acknowledgements can retry without duplicate events or rewriting distinct records. Invalid payloads are quarantined. Relay is bounded to ten events with a cooperative two-second per-event deadline; this is not a two-second whole-batch guarantee.

The full backend run includes **34 offline outbox cases**. Three additional emulator cases cover committed SQL → real Firestore create → owner-filtered readback, idempotent delivery/conflicting existing records and rejection of malformed/financial fields. Focused read-only review found no additional actionable defect after the independent-connection guard and uncommitted-visibility test. Telemetry never approves, reconciles, posts or establishes financial success.

**Still partial product scope:** the cloud/PostgreSQL adapter, cloud schema deployment, new `movebooks_migration_activity` owner/time index, authenticated API/UI wiring and ongoing worker/retention policy are not delivered by this local slice. It is not the complete live migration-phase stream. The approved advisory collection/index is separate and was not modified.

## Remaining boundaries

The emulator does not validate deployed IAM, Google token verification, production index
requirements, actual cloud contention/deadlines, service-account isolation or hosted behavior.
Local rules tests validate the supplied rules, not enforcement by the deployed database.
No live Gemini quality, latency or cost result is claimed. The public API remains deterministic-only.
Local Phase B controls and the stated local outbox slice are accepted. This closes the former missing-Java/emulator gate only for local verification; cloud identity, runtime activation and full phase-stream delivery remain gated.
