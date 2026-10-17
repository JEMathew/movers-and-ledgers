#!/usr/bin/env bash
# MoveBooks AI — Stage A: archive one exact commit with checksum and provenance (run on the Mac, in the repo).
# Read-only on the repository; writes three new files and refuses to overwrite existing ones.
# Usage: bash scripts/release/stage-a-archive.sh <commit-or-branch> [output-dir]
set -Eeuo pipefail
fail() { echo "BLOCKED: $*" >&2; exit 1; }
REF=${1:?usage: stage-a-archive.sh <commit-or-branch> [output-dir]}
OUT=${2:-$HOME/Downloads}
COMMIT=$(git rev-parse --verify "$REF^{commit}") || fail "unknown ref $REF"
TREE=$(git rev-parse "$COMMIT^{tree}")
SHORT=${COMMIT:0:7}
TAR=$OUT/mb-$SHORT.tar
for f in "$TAR" "$TAR.sha256" "$TAR.provenance"; do [[ ! -e $f ]] || fail "$f already exists; not overwriting"; done
for f in services/api/Dockerfile apps/web/Dockerfile apps/web/package-lock.json pyproject.toml; do
  git cat-file -e "$COMMIT:$f" 2>/dev/null || fail "commit $SHORT lacks $f"
done
git archive --format=tar -o "$TAR" "$COMMIT"
[[ $(git get-tar-commit-id < "$TAR") == "$COMMIT" ]] || fail "embedded commit id mismatch"
( cd "$OUT" && { command -v sha256sum >/dev/null && sha256sum "mb-$SHORT.tar" || shasum -a 256 "mb-$SHORT.tar"; } > "mb-$SHORT.tar.sha256" )
printf 'commit=%s\ntree=%s\nref=%s\ncreated_utc=%s\n' "$COMMIT" "$TREE" "$REF" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > "$TAR.provenance"
cat "$TAR.sha256" "$TAR.provenance"
echo "Stage A OK. Upload these three files and scripts/release/build-and-scan.sh to Cloud Shell, then (after approval):"
echo "  EXPECT_COMMIT=$COMMIT bash build-and-scan.sh ~/mb-$SHORT.tar"
