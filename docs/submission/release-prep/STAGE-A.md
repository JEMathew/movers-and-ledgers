# STAGE A — Source archive, transfer and Cloud Shell preflight

Pinned values: commit `01d105c8348ade37b1a02df0a1f95b0c3c00a5f4`, tree `6c5b3872fa1afa6a5dfa75e4f9b3d27c21056a3c`, project `movebooks-ai`.
Nothing here deploys, pushes, changes IAM or calls a model. No existing directory is deleted or overwritten.

## Status of checks
| Check | Status |
|---|---|
| Local branch/HEAD/tree/clean worktree (read-only, 17:37 IST) | **Verified** |
| Archive of the commit: tree hash matches; embedded commit matches; all Dockerfile inputs present (scratch copy) | **Verified** |
| Mac archive + SHA-256 | **Pending (user)** — authoritative checksum comes from the Mac |
| Cloud Shell integrity, project, Docker, memory, disk | **Not executed** |

## 1. On the Mac
```bash
cd ~/Downloads/Intuit/movebooks-submission-integration
test "$(git rev-parse --abbrev-ref HEAD)" = delivery/submission-integration \
 && test "$(git rev-parse HEAD)" = 01d105c8348ade37b1a02df0a1f95b0c3c00a5f4 \
 && test -z "$(git status --porcelain --untracked-files=all -- . ':!docs/submission/release-prep')" && echo "worktree OK"
test ! -e ~/Downloads/mb-01d105c.tar && git archive --format=tar -o ~/Downloads/mb-01d105c.tar 01d105c
(cd ~/Downloads && shasum -a 256 mb-01d105c.tar | tee mb-01d105c.tar.sha256)
```
(`release-prep/` is excluded from the clean check because it holds these new, uncommitted preparation files; the archive is built from the commit, so it never contains them.) Note the printed checksum.

## 2. Upload
Cloud Shell: **⋮ → Upload → Choose files**: `mb-01d105c.tar` and `mb-01d105c.tar.sha256`. If Cloud Shell offers to overwrite an existing file, cancel and rename the Mac copies. Also upload `build-and-scan.sh` (Stage B, do not run yet).

## 3. Verify and extract in Cloud Shell (new unique directory)
```bash
( set -euo pipefail; cd ~
  sha256sum -c mb-01d105c.tar.sha256
  D=~/mb-01d105c-$(date -u +%Y%m%dT%H%M%SZ); mkdir "$D"; echo "extract dir: $D"
  tar -xf mb-01d105c.tar -C "$D"
  T=$(mktemp -d); export GIT_DIR=$T GIT_WORK_TREE="$D"; git init -q --bare
  git add -A -f; test "$(git write-tree)" = 6c5b3872fa1afa6a5dfa75e4f9b3d27c21056a3c && echo "tree hash OK"
  unset GIT_DIR GIT_WORK_TREE
  git get-tar-commit-id < mb-01d105c.tar | grep -x 01d105c8348ade37b1a02df0a1f95b0c3c00a5f4 && echo "embedded commit OK" )
```
The tree-hash check is the independent proof; the embedded commit ID is a secondary check only.

## 4. Environment preflight
```bash
( set -euo pipefail
  test "$(gcloud config get-value project 2>/dev/null)" = movebooks-ai && echo "project OK"
  docker version --format 'docker server {{.Server.Version}}'
  R=$(docker info -f '{{.DockerRootDir}}'); df -h "$R" ~; free -m | sed -n 1,2p
  test "$(df --output=avail -BG "$R" | tail -1 | tr -dc 0-9)" -ge 10 && echo "docker disk >=10G OK"
  test "$(df --output=avail -BG ~ | tail -1 | tr -dc 0-9)" -ge 3 && echo "home disk >=3G OK"
  test "$(awk '/MemAvailable/{print int($2/1024)}' /proc/meminfo)" -ge 1500 && echo "memory >=1.5G OK" )
```
All five "OK" lines must print. **Stop and paste the output.** Do not start Stage B until the user approves.
