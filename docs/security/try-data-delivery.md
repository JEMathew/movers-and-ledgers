# Try Your Data delivery — browser-local fallback

Date: 17 October 2026. Implementation and local validation evidence, not public activation authorization.

## Release decision

**Browser-local compatibility slice: implemented and locally verified.** The public/Firebase and
production UI now offers the agreed fallback instead of removing the test-data experience.
**Hosted upload/workspace activation: NO-GO.** The existing cloud API validation gate remains
closed; no infrastructure, IAM, deploy, authentication or API release flags changed. Parser
isolation, malware protection, durable tenant isolation and quotas, retention/deletion, abuse
controls and concurrency/security acceptance must receive independent release authorization.
A browser pass cannot authorize financial actions or fabricate an uploaded migration workspace.

The full existing local authenticated server intake and governed lifecycle handoff are retained.
The browser fallback is deliberately limited to compatibility checking, repair/replacement,
revalidation and explicit local review. It links to the synthetic demo after explaining that
hosted creation is unavailable. Migrating the selected package through Verify/FPU in a hosted
environment remains unfinished, release-gated scope.

## Implemented customer workflow

Download Template ZIP → choose individual files or one flat ZIP → explicitly attest permission
and synthetic/de-identified data with no confidential customer records → validate locally →
review actionable file/row/column issues → correct/replace by selecting the same filename →
revalidate → explicitly confirm local review. Selection changes clear the result and review.
Reload and Clear Files discard selection/report state. Review is an in-tab UI state, not an
attributable server approval. Download Local Report exports metadata/checksums/issues only.

The bundled eight-file Harbor template was generated from the existing authenticated
`intake_api.template` output at base commit `8f750d9`; it contains only existing synthetic fixture
content. It is generated into a stored ZIP entirely in the browser. No API or model calls are
needed to download or validate. Optional `metadata.json` is supported as evidence only.

## Boundary and limits

- `TryYourData.tsx` chooses fallback for Firebase identity, production builds, or explicit local
  preview `NEXT_PUBLIC_INTAKE_MODE=browser-local`. This selector can only select the safe fallback;
  it cannot activate hosted intake. Default development retains the existing full local workflow.
- No fallback network call, browser persistent storage write, model projection, provider write,
  package ticket, workspace/session creation or lifecycle mutation. File values remain opaque data.
- Selected `File.size` is checked before reading. Parser independently enforces maximum 9 expanded
  files, 256 KiB each, 2 MiB total, 1,000 data records/CSV, 32 columns and 8,192 characters/cell.
  The existing 3 MiB HTTP cap stays unchanged; fallback has no HTTP upload request.
- ZIP stored/deflate only; 100:1 maximum expansion, bounded stream expansion, verified CRC32,
  matching central/local metadata and filenames, non-overlapping consecutive entries. Rejects
  traversal, folders, unsupported names, duplicate names, symlinks, encryption, unsupported flags,
  multi-disk, ZIP64, comments, extra fields, data descriptors, corrupt/truncated archives. This is
  an explicitly documented narrower supported subset; individual CSV/JSON files remain available.
  Browser-native `DecompressionStream("deflate-raw")` must be available for compressed ZIPs.
- Strict UTF-8, control/bidi character rejection, bounded CSV state machine, duplicate-key JSON
  rejection, finite JSON numbers, maximum JSON depth 16 and bounded structural tokens. Prototype
  looking JSON keys remain inert in null-prototype dictionaries and fail strict schemas.
- Required files/columns/values, header uniqueness, ID uniqueness, reference integrity, account
  roles, configuration/type/allowed-value rules, tax selection, valid calendar dates and journal
  shape are checked. Money uses exact integer cents (`BigInt`), maximum absolute 1e18; each journal
  balances exactly, account/journal evidence is required and opening balances must sum to zero.
- The browser uses fixed-point decimal syntax (no exponents or whitespace) and a narrow tax-rate
  decimal syntax. This is a documented compatibility subset, not a claim of parser equivalence.
  Deterministic server validation remains authoritative for the retained local workspace flow.
- Unknown CSV columns are reported for explicit review and excluded. Free-text cell contents,
  company names, source identifiers and configuration values are not copied into reports.
  SHA-256 binds each accepted inventory item to expanded file bytes, with filename, row count and
  exclusions. Report issue details show at most 200 findings while preserving full issue count
  and blocked state, bounding rendering work. SHA hashes and supported filenames are evidence,
  not anonymization or proof of business authenticity.

Browser-local validation does not provide malware scanning, a secure hosted parser sandbox,
independent fuzzing, financial reconciliation, migration readiness, accounting authorization or
verified First Productive Use. Its READY result is labeled **Local Compatibility Checks Passed**.
It does not mean a migration was created, executed or verified.

## Verification evidence

Commands run in the isolated `delivery/intake` worktree:

| Check | Result |
| --- | --- |
| `npm run test` in apps/web | 635 tests / 47 files passed |
| `npm run typecheck` | Passed |
| `npm run lint` | Passed |
| `pytest tests/test_intake.py tests/test_intake_contract.py tests/test_intake_errors.py tests/test_intake_hardening.py -q` | 110 passed; existing Starlette/httpx deprecation warning |
| `git diff --check` | Passed |

New tests cover canonical template compatibility/checksum, exact high-value money, missing and
hostile filenames, limits, malformed CSV/UTF-8, schema/type/reference/account-role errors,
unbalanced journals, invalid dates, missing accounting evidence, unknown-column data exclusion,
configuration authority injection, duplicate JSON keys, non-finite/deep/hidden JSON, ZIP CRC,
stored/deflate, unsafe names, symlinks, compression ratio, flags, multi-disk, comments, extra fields,
forged sizes, duplicates and corruption. UI tests cover consent, no fetch/storage/session creation,
review gating, replacement/revalidation, report/template downloads, clear and pre-read size checks.
Existing local ticket/handoff and HTTP/server security tests still pass.

Actual UI exercised in the in-app browser against local Next dev on 127.0.0.1:3101 using explicit
browser-local mode and the existing synthetic local sign-in: download template → file chooser
select downloaded ZIP → consent → validate → **8 files / 13 records passed** → explicit review →
**Hosted Workspace Creation Is Unavailable**. Reload cleared selection, consent and result.
Screenshots are authentic local implementation evidence, not hosted/deployed evidence:

- [Browser-local entry](try-data-browser-entry.png)
- [Successful local check and confirmed review](try-data-browser-review.png)

No public deployment, public data upload or cloud credential verification was performed in this slice.
