# Google Cloud image-security verification

Date: 2026-09-28. Branch: `feature/google-cloud-validation`, draft PR #13.
**Image-security gate: GREEN for the tested synthetic Beta images only.**
Overall Google Cloud validation remains **AMBER**: authenticated browser identity, cloud FPU and
the other live gates in the [cloud review](google-cloud-validation.md) remain incomplete.

This author-run assessment supersedes the earlier tentative classifications; it is not an
independent approval, production-readiness claim or vulnerability waiver. No Cloud Run service,
Cloud SQL instance, Firebase flow, public endpoint, Gemini or managed ADK was started or changed.

## Reproducible before/after evidence

The baseline is commit `a97d710`, [CI run 36401805324](https://github.com/JEMathew/movers-and-ledgers/actions/runs/36401805324).
The remediated source is `c80c920b4d6bc3a493162ee2f238b33eed6c04cd`
(runtime change `90479d5` plus bounded build-download timeout).
[CI run 36405067750](https://github.com/JEMathew/movers-and-ledgers/actions/runs/36405067750)
passed all six jobs: python, web, postgres-contract, containers and both image-security jobs.
Its artifact names use PR merge ref `374617d161d50ec0cbcef42b6f36cb2d6d4ec3ae`;
the recorded workflow head is `c80c920`, not that merge ref.

| Production image | Baseline High | After High | After Critical | Remaining Medium | Grype exit |
| --- | ---: | ---: | ---: | ---: | ---: |
| API | 50 (13 advisories) | 0 | 0 | 6 | 0 |
| Frontend | 1 (zlib; historically 9 before npm removal) | 0 | 0 | 4 | 0 |

Both CI production builds used `--pull --no-cache`. Independent clean Docker builds and scans
in authenticated Cloud Shell agree with these counts. Neither image was deployed or pushed to
the application registry. The scanner is unchanged:
`anchore/grype@sha256:8c2c9234a345577a6d321a4753aa3ee1276d8975c8452d2344a56b57733ecad3`
(0.119.0), database v6.1.9 built `2026-09-28T06:42:30Z`, valid.
The gate remains `--fail-on high`; no ignores, VEX suppression, only-fixed filter, severity
downgrade or successful-exit override. Both reports contain zero ignored matches.
Scanners receive read-only image archives, not the Docker socket or cloud credentials.

### CI evidence identifiers (SHA-256)

| Evidence | API | Frontend |
| --- | --- | --- |
| Baseline raw Grype JSON | `3118dc7c357b97bb3c710d0500e82993093c56c7b8c45b3aa6da33126a80d50a` | `4278e6118ab2303f4d4eb6d6d65d255805fbe3ac490c552c9770e41a06a7c2c0` |
| Rebuilt image ID | `4a2c64eb30cffe639b07dfd05b05fda861c186f550b7182682ef2f51b04a9096` | `fa8bd5aa12a54beef631e42126575020ddb1e0789e20623140881841e7bdba2d` |
| Rebuilt image archive | `a59f1ac5dbd871c8fa56e88c66716b63a4b45ad7e4b347a8f313c5f09ef461c5` | `8438b91f19dbda574a7191f98365c505190280864d5bd8f5a2cc2da8d1d23f96` |
| Rebuilt raw Grype JSON | `49cce9cd47c50341757261ec9e2f06a01e58dd69d82afd81b646c46b0ee28a33` | `40ecdd01815b5e6b962d4ff6793c6f84181a44f14e0caea9493a3635f9f6ff8b` |
| CI artifact ZIP | `fa4dd2aaba796695e9ba66b2b77842416a9c58e13b36e06b911880e7397d573d` | `20b538da9b997ca3f677f0eaf62795895f938f99e477e1985741cc164a119d95` |
| Artifact ID | 10961822289 | 10961014973 |

CI retains raw JSON, image ID and archive hash for 14 days (these artifacts expire 2026-10-12).
The operator downloaded both before/after artifact pairs and independently hashed their JSON.
For longer retention, archive these non-sensitive reports before expiry; hashes alone cannot
reconstruct a deleted report. Earlier raw operator reports and hashes remain in Git history.

## API: all thirteen High advisories classified

Each row has exactly one **final** classification for the tested replacement image.
“Non-applicable” is specific image-content/call-path evidence, not a blanket distribution waiver.
Forty-nine baseline matches came from Debian OS packages and one from the Python binary;
none of the fifty was an application Python dependency finding. Repeated source-package matches
are recorded below, not counted as independent exploits or dismissed as duplicates.
The scanned target is the final runtime image, not intermediate build/test stages.

| Advisory / baseline matches | Baseline package/version and source | Final classification | Remediation or exact applicability evidence |
| --- | --- | --- | --- |
| [CVE-2026-82560](https://security-tracker.debian.org/tracker/CVE-2026-82560) / 1 | perl-base 5.40.1-6+deb13u1; Debian perl | non-applicable | Replacement image has no Perl executable; no Perl runtime is copied from the builder. Earlier inspection also found no Pod/Text.pm in perl-base. Nested POD formatting is not an application input path. |
| [CVE-2026-9538](https://security-tracker.debian.org/tracker/CVE-2026-9538) / 1 | same perl-base | non-applicable | Perl/Archive::Tar is absent from the replacement runtime; application does not invoke Perl archive extraction. |
| [CVE-2025-69720](https://security-tracker.debian.org/tracker/CVE-2025-69720) / 4 | libncursesw6, libtinfo6, ncurses-base, ncurses-bin 6.5+20250216-2; Debian ncurses | already mitigated | Upgraded to Wolfi ncurses 6.6.20260926-r0, newer than the upstream 6.5-20251213 infocmp fix. infocmp is still installed: this is a patched-tool claim, not an absence claim. |
| [CVE-2026-5435](https://security-tracker.debian.org/tracker/CVE-2026-5435) / 2 | libc-bin/libc6 2.41-12+deb13u4; Debian glibc | non-applicable | See the bounded native audit below: no external DNS-printer callers in either image and no application source invocation/FFI path. The legacy __fp_nquery provider remains in libresolv; this is not a patch or complete-code-removal claim. |
| [CVE-2026-19499](https://security-tracker.debian.org/tracker/CVE-2026-19499) / 2 | same glibc packages | already mitigated | Wolfi glibc-2.44 2.44-r6 includes the stable-branch strfmon buffer fix shipped from r4. Vendor evidence identifies backport 63b53df549451a5d69fcba6d7612ea99f517e8e3; see sources below. |
| [CVE-2026-76642](https://security-tracker.debian.org/tracker/CVE-2026-76642) / 9 | util-linux source group listed below | non-applicable | mount/umount and the privileged mount-helper/post-hook surface are absent from the replacement API. No application mount operation; tests run non-root, capability-dropped and no-new-privileges. |
| [CVE-2026-78408](https://security-tracker.debian.org/tracker/CVE-2026-78408) / 9 | same util-linux group | non-applicable | nsenter is absent; no namespace/cgroup-joining functionality or inherited privileged descriptor is provided by the application. |
| [CVE-2026-78409](https://security-tracker.debian.org/tracker/CVE-2026-78409) / 9 | same util-linux group | non-applicable | No mount executable or application fstab/X-mount.subdir operation. The vulnerable privileged intermediate-symlink traversal workflow is unavailable. |
| [CVE-2026-78410](https://security-tracker.debian.org/tracker/CVE-2026-78410) / 9 | same util-linux group | non-applicable | No mount/umount executable or restricted privileged bind-mount workflow. This is removal, not reliance on non-root alone. |
| [CVE-2026-54369](https://security-tracker.debian.org/tracker/CVE-2026-54369) / 1 | libacl1 2.3.2-2+b1; Debian acl | non-applicable | libacl is absent from /usr/lib in the final API; no application privileged pathname-ACL operations. |
| [CVE-2026-54370](https://security-tracker.debian.org/tracker/CVE-2026-54370) / 1 | same libacl1 | non-applicable | getfacl/setfacl/chacl and libacl are absent; no privileged recursive ACL workflow. |
| [CVE-2026-82049](https://github.com/python/cpython/issues/157190) / 1 | Python binary 3.12.14 | already mitigated | Stable Python 3.14.7 vendor runtime, package python-3.14 3.14.7_git20260925-r0. Upstream identifies the 3.14+ hardlink behavior change as preventing this tarfile bypass. No beta interpreter selected; full Python 3.14 tests and real PostgreSQL container journey pass. Cloud intake stays disabled. |
| [CVE-2026-85091](https://security-tracker.debian.org/tracker/CVE-2026-85091) / 1 | zlib1g 1:1.3.dfsg+really1.3.1-1+b1; Debian zlib | already mitigated | Vendor-patched zlib 1.3.2.1_rc20260601-r0; runtime reports 1.3.2.1-motley. Fix evidence below; not a claim that the raw version string alone is safe. |

The nine util-linux-derived package matches for each of its four advisories are:
bsdutils `1:2.41.5-0+deb13u1`;
libblkid1, liblastlog2-2, libmount1, libsmartcols1, libuuid1, mount and util-linux
`2.41.5-0+deb13u1`; login `1:4.16.0-2+really2.41.5-0+deb13u1`.
The final thirteen-advisory classification totals are **9 non-applicable, 4 already mitigated**.
No unresolved High is relabeled build-only merely because it came from a base image.

### Native DNS-printer audit

The [vendor glibc advisory](https://images.chainguard.dev/security/CGA-h7xx-fhh3-vw6v)
uses an execution-path non-applicability determination, not an upstream patch. We therefore
inspected the actual replacement filesystems independently rather than adopting a blanket waiver.
A read-only host `readelf --dyn-syms --wide` audit covered **173 API ELF files and 44 web ELF files**,
including prefixed compatibility aliases of ns_printrr, ns_printrrf and fp_nquery.
No undefined callers were found. Both images retain the __fp_nquery export in libresolv.so.2;
the byte-level cross-check found these names only in that provider, not other ELF files.
Application source has no references to these functions or ctypes/cffi/dlopen entrypoints.

The only unreadable file was the base image's /etc/shadow (not an executable/library); no ELF
inspection failed. Device nodes were explicitly excluded from export extraction after the first
extraction could not recreate them without privileges. No privilege was granted to read either.
The initial exact-name matcher was expanded to include prefixed aliases rather than incorrectly
equating absent public names with absence of compatibility code. The final alias-aware audit is
retained as `dns-symbol-audit-aliases.jsonl` alongside the raw scans.
Its SHA-256 is `c00149cbe7f8cf8d6340e90d3679c5a21f8dfe9a0e880fe5c053cefb2bb64fd4`.
This is bounded evidence for these image digests and the locked application, not proof about
arbitrary future native extensions, FFI, shell access or code execution. Reassess on such changes.

## Frontend zlib and prior npm findings

| Advisory | Baseline package / final classification | Evidence |
| --- | --- | --- |
| CVE-2026-85091 | Alpine zlib 1.3.2-r0 → **already mitigated** | Final Wolfi zlib 1.3.2.1_rc20260601-r0 contains the targeted patch. Node 22.23.2 reports zlib 1.3.2.1-motley; /proc/self/maps confirms it actually loads /usr/lib/libz.so.1.3.2.1-motley. Native Sharp PNG processing passes. Unsuppressed scan has zero High. |
| GHSA-mwp4-54f8-5fhr | npm's ip-address 10.1.0; **already mitigated** | Runtime npm tree physically removed previously; absent in new final image. |
| GHSA-rgw5-rvv9-x895 | npm's brace-expansion 2.0.2; **already mitigated** | Same removal, independently retained advisory. |
| GHSA-mh99-v99m-4gvg | npm's brace-expansion 2.0.2; **already mitigated** | Same removal. |
| GHSA-3jxr-9vmj-r5cp | npm's brace-expansion 2.0.2; **already mitigated** | Same removal; separate advisory retained. |
| GHSA-w4pp-8pjf-rmxw | npm's pacote 19.0.2 and 20.0.1 (2 matches); **already mitigated** | Both nested npm copies absent. |
| GHSA-c2c7-rcm5-vvqj | npm's picomatch 4.0.3; **already mitigated** | Runtime npm absent; application lockfile retained. |
| GHSA-52v5-jr5w-gjxr | npm's sigstore 3.1.0; **already mitigated** | Runtime npm absent; no certificate or signature checks relaxed. |

The historical eight npm matches were build/tooling dependencies installed in the final runtime,
not findings confined to discarded image layers. The new runtime never installs npm/npx/corepack;
the builder still uses npm ci. Smoke tests assert npm/npx paths absent. Production npm audit is
zero vulnerabilities, but is not used as a substitute for image scanning.

### Patch and image provenance

- [Wolfi zlib package recipe](https://github.com/wolfi-dev/os/blob/main/zlib.yaml) selects
  1.3.2.1_rc20260601-r0 and explicitly applies
  [the gz_write stalled-buffer patch](https://github.com/wolfi-dev/os/blob/main/zlib/0001-gz_write-don-t-keep-a-pointer-into-callers-buffer-on.patch).
  The patch clears avail_in and resets next_in on the error path, preventing retention of the
  caller's buffer. Compare [upstream issue 1310](https://github.com/madler/zlib/issues/1310) and
  fix `df84af25dc1942490e1d1c899a07619152a46148`; vendor patch commit
  `74e8280d25987b66e657d088eaa3c8a7169cafab`.
- [Vendor strfmon fix evidence](https://images.chainguard.dev/security/CGA-4ccq-wxhx-49rv)
  records the 2.44-r4 stable-branch backport and reproducer behavior. The
  [2.44-r6 package recipe](https://github.com/wolfi-dev/os/blob/main/glibc-2.44.yaml) pins
  source `b4f51887c48ac82acfdb13f96d9eab5d120cb2b7`. This differs from the DNS-printer
  advisory's applicability determination; the two are not conflated.
- [ncurses upstream fix](https://invisible-island.net/ncurses/NEWS.html#index-t20251213)
  predates the installed 6.6.20260926-r0 package.
- [Python 3.14.7 release](https://www.python.org/downloads/release/python-3147/) is stable.
  The [upstream tarfile issue](https://github.com/python/cpython/issues/157190) documents
  the 3.14+ behavior change; the scanner's old 3.14.0b1 suggestion did not cause use of a beta.

The API uses digest-pinned matching Chainguard Python development/runtime stages. Only the
installed application venv (without pip) and explicit application files reach the final image.
It has no shell, pip, Perl, mount/nsenter or ACL tools. A shell-free Python entrypoint preserves
PORT, access-log suppression and graceful shutdown timeouts. Test dependencies stay in a
separate test stage. The web stays on **Node 22**, using pinned Wolfi base plus
`nodejs-22-minimal=22.23.2-r1`; a glibc Node 22 builder keeps Sharp's native ABI compatible.
The final web base still includes its shell/apk: it is not claimed to be shellless or tooling-free.
Exact base digests are pinned in the Dockerfiles. No product/lifecycle/HITL implementation changes.

## Validation and residual risk

- Fresh local Ruff, lint, TypeScript, 76 frontend tests and production Next.js build: pass.
- Local backend: 255 passed, 10 existing PostgreSQL-only skips.
- Actual replacement Python 3.14 test image, locally and in CI: 255 passed, same 10 skips.
- Fresh remote real-PostgreSQL contract selection: **59 passed**.
- Both production images: supplied PORT, HTTP health/readiness, non-root/read-only operation,
  static assets, failed-config safety, runtime tool absence and graceful SIGTERM pass.
- Real disposable PostgreSQL container journey: exact restart/resume, checkpoints, decisions,
  audit continuity, FPU, owner isolation, replay, outage/recovery and in-flight SIGTERM pass.
  This is synthetic container evidence, **not Firebase or canonical cloud browser E2E**.
- Fresh production npm audit: zero vulnerabilities. API build pip check: pass.
- Repository links/secret-pattern scan: 84 Markdown / 320 text files, zero findings; whitespace: pass.
- Initial API builds failed because the PyPI watchfiles index timed out. A build-only
  60-second pip timeout allowed the unchanged dependency set to install; TLS verification,
  resolver behavior and failure exit status remain intact.

There are **no residual High/Critical findings**. Unchanged policy allows the remaining Medium
matches; they are not suppressed or claimed fixed. Both images: glibc-2.44 2.44-r6,
CVE-2026-77117, CVE-2026-80489, CVE-2026-8674, CVE-2026-89092. API additionally:
python-3.14 3.14.7_git20260925-r0, CVE-2026-87910 and CVE-2025-15367.
These remain dependency-maintenance follow-ups; reevaluate if severity or reachability changes.

Independent Cloud Shell evidence remains under `movebooks-image-security-evidence-90479d5`
in the operator's home (includes the later c80c920 API build). Web source tree is unchanged by
the timeout-only commit. API raw JSON SHA-256:
`3545504e8b8f4e556200b510f471603afbcb5ba7cc62fdc0d62147f6e55496d6`;
web raw JSON:
`23b876cce1f6d21dfe2536098e8ac9f69052730923a1cf4524be79fa3cdc44f2`.
These independent images differ from CI image IDs; do not mix their hashes.

All smoke/scanner containers completed; disposable stopped symbol-audit containers were removed.
Image archives, extracted public filesystems and scanner cache remain as non-sensitive operator
evidence, not running services. Existing GCP stopped resources/retained storage remain unchanged.
Next: human review of the image-only changes and evidence. Keep PR #13 unmerged and overall cloud
validation AMBER; do not resume compute or identity validation under this image-only task.
