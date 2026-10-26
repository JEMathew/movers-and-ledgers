# P0-04 local runtime security candidate — 25 October 2026

This is a local packaging update only. No image publication, preview or production deployment, GitHub push/merge, inference, financial write, or infrastructure change was performed. Protected-preview acceptance requires separate authorization.

## Immutable inputs and output

| Identity | SHA-256 |
| --- | --- |
| Unchanged application commit | `b8ca01eadbfc055da81177959ed800ba4d0d505e` |
| Original linux/amd64 image manifest | `e10a3c555ace95ba3efb13ec79a279d0df2162f25e37633d51568a4566849cb3` |
| Original local OCI index containing that manifest | `f8e19ce2dc1494e5cc29943a5457f78e9bcfdfd47aa41ceab8ae3d86e6d40b5b` |
| Official Node donor linux/amd64 manifest | `ea11b74b986d520137cdef9a5346e447a00f275ecc4abc0055b7151226231e09` |
| Replacement linux/amd64 image manifest | `538b676ee5cb1a03802e8acbda13eab4ce572f3e8fcabbbbc4afea47e69fb4c4` |
| Replacement local OCI index | `00920c54bd693b7e4a073beca249470fa6a63d269eed88db48cd5ed9a75d52b0` |
| Replacement image config | `7c804efcbb2fdb60abb64dac79f6bd4b7e2019b2341679a292453788d45533c6` |

The only changed repository files are `apps/web/Dockerfile.runtime-security` and this document. All eight files of the approved application commit remain unchanged. The normal application Dockerfile is unchanged. The overlay consumes the exact approved compiled image, rather than rebuilding product assets. Its inherited application-revision label remains `b8ca01e…`; the separate local receipt associates the packaging commit and Dockerfile hash with the replacement image.

## Root cause and smallest change

The three Brotli APK libraries originated in the final Wolfi runtime base, not the build stage. A later runtime layer installed `nodejs-22-minimal=22.23.2-r1`. The previous scan recorded three Critical matches for CVE-2026-111497 and two High matches for CVE-2026-105482 / CVE-2026-106069.

| Runtime component | Before | After |
| --- | --- | --- |
| Node | Wolfi `nodejs-22-minimal` 22.23.2-r1 | Official executable 22.23.4, positively catalogued as a binary |
| libbrotlicommon1 | 1.2.0-r5 | 1.2.0-r7 |
| libbrotlidec1 | 1.2.0-r5 | 1.2.0-r7 |
| libbrotlienc1 | 1.2.0-r5 | 1.2.0-r7 |

APK inventory changes from 28 to 27 packages: only the obsolete Node APK is removed; no APK is added; only those three Brotli versions change. The following eight existing packages are explicitly retained at their original versions to prevent automatic removal: c-ares 1.34.8-r4, libicu78 78.3-r4, icu78-data-full 78.3-r4, libssl3 3.6.5-r5, libcrypto3 3.6.5-r5, libnghttp2-14 1.70.0-r5, libstdc++ 16.2.0-r1, and libuv 1.53.0-r0. All remaining APK versions are identical.

Only `/usr/local/bin/node` and `/usr/local/LICENSE` are copied from the donor, to `/usr/bin/node` and `/usr/share/licenses/node/LICENSE`. No npm, Yarn, Debian libraries, or development tools are copied. Wolfi, linux/amd64, UID/GID 65532, `node server.js`, environment, working directory and the complete image Config object are preserved.

## Donor provenance and licensing

The digest-pinned official `node:22.23.4-bookworm-slim` executable and LICENSE were compared byte-for-byte with the [official Node.js release archive](https://nodejs.org/dist/v22.23.4/node-v22.23.4-linux-x64.tar.xz). The archive checksum was authenticated using the [signed release checksums](https://nodejs.org/dist/v22.23.4/SHASUMS256.txt.asc) and the [official release key](https://github.com/nodejs/release-keys/blob/main/keys/5BE8A3F6C8A5C01D106C0AD820B1A390B168D356.asc).

- Valid signing fingerprint: `5BE8A3F6C8A5C01D106C0AD820B1A390B168D356`.
- Archive SHA-256: `1805bcd35e6815559bd2eb97db438d3fdb0eb3a5e6a977b7c1badca76337e9ce`.
- Executable SHA-256: `94efd062ed066c1a0b332e18249859c905e920eeada5df55d24c99b919629a90`.
- LICENSE SHA-256: `c738ae413cf561f174e34f6961f8ca458aae2369a73640dda6234c629b98bcc4`.

Both copied-file hashes and the Node version are asserted during the image build. The complete upstream license, including bundled dependency notices, is retained.

## Validation results

- Grype 0.119.0, pinned image `anchore/grype@sha256:8c2c9234a345577a6d321a4753aa3ee1276d8975c8452d2344a56b57733ecad3`, scanned the exact replacement archive with unchanged `--fail-on high`: exit 0, zero matches, zero ignored matches. No custom exclusions, VEX exceptions or threshold changes. Scanner built-in defaults were unchanged.
- Database built **2026-10-24 17:45:29 UTC / 23:15:29 IST**; valid and 3.408 hours old at the explicit 72-hour freshness check (2026-10-24 21:09:57 UTC). The already refreshed database was mounted read-only for the scan. Recheck freshness before any later release action.
- Syft 1.55.0 positively identifies `pkg:generic/node@22.23.4` at `/usr/bin/node`, through its binary classifier, and all three Brotli APKs at 1.2.0-r7. Scanner image: `anchore/syft@sha256:4cc92b64ca74ffca4c94d4c8fcc01f217731375300be14d0b6eeb2e82eaa110a`.
- Production npm audit: zero vulnerabilities. Full frontend suite: **992 tests / 70 files PASS**, including saved-result restoration, pairing, account switching, identity/proxy, migration and Academy tests. Application build artifacts were reused unchanged; no application rebuild was required. Prior offline-agent results were not rerun or represented as fresh runtime validation.
- ELF x86-64 executable runs against existing glibc 2.44. Loaded libraries are libdl, libstdc++, libm, libgcc_s, libpthread, libc and the existing ELF interpreter. No missing/new library requirement. The minimal image has no `ldd`; loaded-library evidence was collected through Node's runtime report.
- Next.js 15.5.28 starts successfully as UID 65532. Trusted HTTPS returns 204 with certificate authorization true; no MoveBooks or Gemini API was called. Brotli compression/decompression round-trip passes. Sharp 0.35.5 loads its native module and resizes/encodes PNG successfully.
- Inspector session is null and its port is closed under the unchanged intended startup configuration. The upstream executable includes inspector capability; this check does not assert that debugging is impossible if an operator changes flags or signals the process.
- All **2,211** application/media file and symlink entries match the original image. Comparison manifest SHA-256: `79a6736ddc3282ef0177365edc9dce74e27266d9dfbf63e8f5ea34424f65fa8a`. Fonts, Next.js, Sharp, saved-result code, all nine videos and captions are unchanged.
- **54 media checks PASS**: nine sets of MP4/VTT/JPG/TXT content checks plus MP4 HEAD and byte-range checks. Landing page, both Learn URLs, workspace/sign-in and actual migration routes return 200, matching the baseline.
- Additional route probes: `/prepare` returns 404 in both images because it is not an application route; the intended route is `/plan-map-approve`. `/api/v1/identity` returns the same fail-closed 503 in both images because the local containers lack private API configuration. These are not new runtime regressions; authenticated end-to-end behavior is **not verified** by local HTTP probes.

## Reproduction and evidence

Retain the original OCI archive and replacement archive. Load the original archive into the local Docker image store, confirm that its pinned index resolves to the original amd64 manifest above, and use an empty build-context directory:

```sh
docker buildx build --load --platform linux/amd64 --provenance=mode=min \
  -f apps/web/Dockerfile.runtime-security \
  -t movebooks-p0-04:runtime-security-20261025 /path/to/empty-context
```

The actual build used the existing Colima Docker engine and a context containing evidence files; the recipe copies nothing from that context. Reproduction requires access to the original local image and the exact signed APK versions. Do not silently substitute another base or newer packages. A future rebuild must receive its own immutable digest and scan; byte-identical digest reproduction across builder timestamps is not claimed.

Raw evidence is retained locally under `movebooks-p0-04-runtime-evidence-20261025/implementation/` alongside the isolated worktree: build metadata, OCI archive, signature verification, package inventories, Grype JSON, SBOM, runtime probes, regression log, dependency audit, application/media hashes and route responses. The post-commit `release-receipt.json` records the packaging SHA and evidence hashes.

## Decision and remaining limitations

**GO to request separate protected-preview authorization for this exact replacement artifact.** No deployment is authorized by this record. Hosted Account B saved-result acceptance and existing authenticated API invocation still require the protected preview. The OpenTelemetry/ADK blocker remains unchanged and outside this remediation. A clean current web scan is not a guarantee against future advisories; continue the existing scan and freshness gates. No product behavior, inference policy, financial logic or account-isolation code changed.
