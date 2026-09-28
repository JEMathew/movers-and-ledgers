# Google Cloud image-security triage

Date: 2026-09-28. Branch: `feature/google-cloud-validation`, draft PR #13.
Scope: existing synthetic Beta V1 only. **AMBER — no image-security clearance yet.**

This is an author-run applicability review, not an independent approval or a vulnerability waiver.
The [cloud review](google-cloud-validation.md) records exact deployed image digests. Counts below
refer to the completed prior Grype v0.119.0 scans, not a new scan. The old `/tmp` JSON reports did
not survive Cloud Shell recycling; their absence is an evidence-retention gap, not a clean result.
Exact registry digests are being retrieved for repeatable inspection. No ignored advisories,
`--only-fixed` filtering, severity reduction or successful rescan is implied by this table.

## API: every material High advisory represented

Fifty matches comprise thirteen advisories, including repeated source-package matches. “Requires
remediation” below also includes unresolved applicability: absence of a direct source call alone
is insufficient to establish native/transitive reachability. No row below authorizes exposure.

| Advisory / matches | Classification | Evidence and precondition | Remediation / residual verification |
| --- | --- | --- | --- |
| [CVE-2026-82560](https://security-tracker.debian.org/tracker/CVE-2026-82560) / 1 | Build/tooling-only candidate; applicability unclosed | Perl Pod::Text formatting attacker-controlled nested POD. Application is Python; source has no Perl execution path. | Confirm whether Pod::Text is actually installed in perl-base and whether any runtime dependency invokes it; remove unused tooling or use fixed vendor package. No waiver based on package name. |
| [CVE-2026-9538](https://security-tracker.debian.org/tracker/CVE-2026-9538) / 1 | Build/tooling-only candidate; applicability unclosed | Perl Archive::Tar allocates from attacker-controlled size fields. No application Perl or tar-processing call found. | Inspect the exact image for Archive::Tar; distinguish perl-base from the complete Perl module distribution. Retain finding until package/content proof. |
| [CVE-2025-69720](https://security-tracker.debian.org/tracker/CVE-2025-69720) / 4 | Build/tooling-only | The vulnerable operation is infocmp's terminfo analysis, not every ncurses-library operation. Noninteractive Uvicorn is the entrypoint; application does not invoke infocmp. | Verify exact-image executable and native dependency paths before concluding non-applicability; remove unused command tooling where safe. |
| [CVE-2026-5435](https://security-tracker.debian.org/tracker/CVE-2026-5435) / 2 | Runtime library; requires remediation/applicability proof | Deprecated libc DNS-record printing functions can overrun the caller's buffer. Ordinary DNS lookup is not evidence that these printing functions are called. | Inspect undefined symbols/transitive native dependencies for ns_printrr, ns_printrrf and fp_nquery; use a supported fixed package when available. No blanket glibc waiver. |
| [CVE-2026-19499](https://security-tracker.debian.org/tracker/CVE-2026-19499) / 2 | Runtime library; requires remediation/applicability proof | libc strfmon/strfmon_l right-justified monetary formatting. Deterministic Decimal arithmetic is not itself a call to those functions. | Inspect native call/import paths and installed version; preserve deterministic financial tests. Do not infer safety from lack of a direct Python call. |
| [CVE-2026-76642](https://security-tracker.debian.org/tracker/CVE-2026-76642) / 9 | Privileged tooling; mitigation candidate | Mount-helper failure followed by privileged post-mount hooks. Runtime UID is non-root; no application mount operation. | Confirm deployed capabilities, absence of usable privileged mount paths and attacker-controlled fstab entries. Remove unnecessary privilege-bearing tools/bits or use supported fixed packages; non-root alone is not proof. |
| [CVE-2026-78408](https://security-tracker.debian.org/tracker/CVE-2026-78408) / 9 | Privileged tooling; mitigation candidate | Requires privileged nsenter --join-cgroup against an attacker-controlled target. No app namespace-management functionality. | Verify no privileged operator/runtime call, inherited cgroup descriptor or host namespace access; do not treat every util-linux-derived library as independently exploitable. |
| [CVE-2026-78409](https://security-tracker.debian.org/tracker/CVE-2026-78409) / 9 | Privileged tooling; mitigation candidate | X-mount.subdir with an fstab-authorized mount and intermediate symlink traversal. | Confirm filesystem/privilege configuration and remove unsupported mount surface; retain raw scan until evidence is recorded. |
| [CVE-2026-78410](https://security-tracker.debian.org/tracker/CVE-2026-78410) / 9 | Privileged tooling; mitigation candidate | Privileged restricted bind mount with attacker-replaceable source path. | Verify no applicable fstab bind entry, privileged mount or writable source-path control. No broad “Cloud Run is safe” assertion. |
| [CVE-2026-54369](https://security-tracker.debian.org/tracker/CVE-2026-54369) / 1 | Runtime library; requires remediation/applicability proof | Privileged libacl pathname operations following attacker-controlled symlinks. | Inspect actual native imports and runtime privileges/paths; avoid replacing stable ABI with an untested distribution upgrade. |
| [CVE-2026-54370](https://security-tracker.debian.org/tracker/CVE-2026-54370) / 1 | Privileged tooling; mitigation candidate | Race in privileged recursive ACL utilities over attacker-controlled paths. | Confirm getfacl/setfacl/chacl availability and invocation paths; package-level matching alone does not prove command presence. |
| [CVE-2026-82049](https://github.com/python/cpython/issues/157190) / 1 | Already mitigated at cloud input boundary; runtime patch follow-up open | Python tarfile extraction of hard links to symlinks. App uses bounded ZIP parsing, not tar extraction; cloud intake is disabled before parsing and persistence. | Keep intake disabled and no untrusted archive extraction. Verify transitive runtime use and available supported Python 3.12 fix. Do not jump to a beta Python runtime solely because a scanner suggests it. |
| [CVE-2026-85091](https://security-tracker.debian.org/tracker/CVE-2026-85091) / 1 | Runtime library; requires remediation/applicability proof | zlib gzprintf/gzvprintf after a stalled nonblocking gzwrite. ZIP inflate/deflate is a distinct API path, not automatic proof of this failure. | Check installed source/version and native symbol use. Evaluate the upstream fix/vendor backport; do not clear solely because the package is marked unfixed. |

The API ledger contains **thirteen** distinct advisories:
2 Perl + 1 ncurses + 2 libc + 4 util-linux + 2 ACL + 1 Python + 1 zlib = 13.
The package/advisory match total is 50. Grouped source-package matches must retain their raw
package list when the new scan is archived; none are silently dropped.

## Frontend: all nine High matches represented

The prior exact-image scan located all eight npm-related matches under
`/usr/local/lib/node_modules/npm/node_modules`; zlib is an Alpine OS package. The production
entrypoint is `node server.js`. Build stage package installation remains necessary and unchanged.

| Advisory / matches | Classification and evidence | Remediation / verification |
| --- | --- | --- |
| [GHSA-mwp4-54f8-5fhr](https://github.com/advisories/GHSA-mwp4-54f8-5fhr) / 1 | Build/tooling-only: npm's ip-address 10.1.0; ambiguous octal address interpretation. | Remove the unused runtime npm tree; retain application dependency audit. Confirm absent in rebuilt inventory. |
| [GHSA-rgw5-rvv9-x895](https://github.com/advisories/GHSA-rgw5-rvv9-x895) / 1 | Build/tooling-only: npm's brace-expansion 2.0.2; intermediate expansion exhaustion. | Same physical removal; rescan must show the match gone, not ignored. |
| [GHSA-mh99-v99m-4gvg](https://github.com/advisories/GHSA-mh99-v99m-4gvg) / 1 | Build/tooling-only: same package; unbounded expansion length. | Same removal; no application lockfile downgrade or weakened test. |
| [GHSA-3jxr-9vmj-r5cp](https://github.com/advisories/GHSA-3jxr-9vmj-r5cp) / 1 | Build/tooling-only: same package; exponential expansion behavior. | Same removal; separate advisory retained here. |
| [GHSA-w4pp-8pjf-rmxw](https://github.com/advisories/GHSA-w4pp-8pjf-rmxw) / 2 | Build/tooling-only: npm's pacote 19.0.2 and nested 20.0.1; addGitSha denial of service. | Remove both with the complete npm runtime tree; build-stage dependencies are not thereby audited or patched. |
| [GHSA-c2c7-rcm5-vvqj](https://github.com/advisories/GHSA-c2c7-rcm5-vvqj) / 1 | Build/tooling-only: npm's picomatch 4.0.3; regex denial of service. | Physical runtime removal, then full app/container smoke and rescan. |
| [GHSA-52v5-jr5w-gjxr](https://github.com/advisories/GHSA-52v5-jr5w-gjxr) / 1 | Build/tooling-only: npm's sigstore 3.1.0; dropped certificate constraints. | Physical runtime removal; no relaxation of signature/certificate checks. |
| [CVE-2026-85091](https://security-tracker.debian.org/tracker/CVE-2026-85091) / 1 | Runtime library; requires remediation/applicability proof: Alpine zlib 1.3.2-r0. | Inspect Node/native dependency imports and gzip API path; supported fix/backport plus rescan or narrowly justified non-applicability evidence required. |

## Changes and non-negotiable gate

Commit `54bb635` removes only the unused npm installation and npm/npx launchers from the web
runtime stage. The container smoke gate now asserts their absence in addition to existing
health, static-asset, identity and restart checks. No product code, lifecycle or HITL path changes.

The CI `image-security` matrix builds both production images, scans each exported image with the
immutable Grype digest used previously and `--fail-on high`, and retains raw JSON/image identifiers
for 14 days even when the scan fails. The scanner receives a read-only image archive, not the Docker
socket, cloud credentials or service-account keys. There are no ignore rules or only-fixed filters.
Pending CI build/scan results must not be represented as a cleared gate.

## Exercised image evidence — 2026-09-28 continuation

Built a derivative of the exact Firebase-configured web digest above in Cloud Shell, with only
the same final-stage npm/npx removal. This is not a full source rebuild, registry push or deployment.
The resulting local OCI image index is
`sha256:714b90d8fbd7e04e4a6457a856ddc0e0f018e851ce4132b1fd43c5955eeffeb6`.
A network-isolated, read-only, capability-dropped, no-new-privileges container verified non-root
execution, all three npm/npx paths absent, `/healthz` HTTP 200 and rendered `/` HTTP 200. It was
stopped after the smoke test. No cloud credentials or host home directory were mounted.

The complete unsuppressed rescan finished with **exit 2: 1 High, 3 Medium, no Critical**.
All eight npm High matches are absent. The remaining High is **CVE-2026-85091, zlib 1.3.2-r0**.
Raw JSON and image archive are retained in the operator's Cloud Shell home under
`movebooks-validation-evidence-20260928`, not ephemeral `/tmp`. Scanner database is v6.1.9,
published 2026-09-28 00:37:02 UTC. The CI artifacts will provide repository-associated retention
after the new workflow is published and runs; a local operator report is not a CI pass.
Web raw JSON SHA-256: `75978875e267d3d6dd9c88e8cf5971d09775a9fe3e6dbb73942201d34957d19f`.

`readelf` confirms Node contains defined `gzwrite`, `gzprintf` and `gzvprintf` symbols. Node's
dynamic dependencies do not include system libz, and Alpine lists libapk/apk-tools as system-zlib
dependents; neither observation establishes safety of Node's bundled code. Sharp's native module
is present. A standalone `ldd` of that addon emits unresolved Node-API symbols (outside its Node
host); that diagnostic is not an application failure or a conclusive reachability result.
The zlib finding remains **requires remediation/applicability proof**, not waived.

The exact API registry image was retrieved successfully. A read-only, network-isolated inspection
at UID 65532 found infocmp, mount, umount, nsenter and Perl, but no Pod/Text.pm, Archive/Tar.pm or
getfacl/setfacl/chacl in the inspected paths. Privilege-bearing mount/umount and account-management
executables remain installed. CapEff/CapPrm were zero and NoNewPrivs was 1 in this deliberately
restricted inspection container; these flags do **not** prove the deployed Cloud Run configuration.
The tooling-module absence narrows applicability but does not clear the remaining native runtime
or privileged-tooling findings. The completed repeat scan of the unchanged exact API image exited
**2: 50 High, 58 Medium, 9 Low, 45 Negligible, no Critical**. Its thirteen-advisory match counts
agree with every API row above. This is a new scan, not an API remediation/rebuild claim.
Raw `api-grype.json` is retained beside the web report; SHA-256:
`1a24b31fb6249be70cf06c91abf1cb390088485fb7db276e968526440e2e9daf`.
Both scanner containers completed and were automatically removed; final `docker ps` showed no
running containers. An earlier attempt to summarize the still-empty API report failed JSON parsing
and was not counted as a scan result. No package finding is hidden by this evidence.

Findings have separate package severity and product exposure decisions. Any unclosed applicability
or remediation row blocks **image-security clearance** for this validation. The rebuilt image must
also pass the unchanged synthetic behavior/security gates. No aggregate vanity score.
