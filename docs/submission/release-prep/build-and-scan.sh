#!/usr/bin/env bash
# MoveBooks AI — Stage B: verify source, build API + web (linux/amd64), check ADK imports, run pinned Grype.
# Run in Google Cloud Shell ONLY after explicit approval. Author-reviewed; NOT executed when written.
# Does: local builds + scans only. Does NOT: push images/git, deploy, touch IAM/Firestore/Firebase, call any model.
# Usage: bash build-and-scan.sh [path/to/mb-01d105c.tar]   (needs <tar>.sha256 beside it)
set -Eeuo pipefail
if [[ $- == *x* ]]; then echo "Refusing to run with xtrace: it would expose Firebase values." >&2; exit 2; fi
umask 022   # evidence must stay readable by the root-in-container scanner (it runs with --cap-drop=ALL, as in CI)

readonly COMMIT=01d105c8348ade37b1a02df0a1f95b0c3c00a5f4
readonly TREE=6c5b3872fa1afa6a5dfa75e4f9b3d27c21056a3c
readonly PROJECT=movebooks-ai
readonly GRYPE=anchore/grype@sha256:8c2c9234a345577a6d321a4753aa3ee1276d8975c8452d2344a56b57733ecad3
readonly SHORT=${COMMIT:0:7}
readonly TAR=${1:-$HOME/mb-$SHORT.tar}
readonly MIN_DOCKER_GB=10 MIN_HOME_GB=3 MIN_MEM_MB=1500 MAX_DB_AGE_H=72

fail() { echo "BLOCKED: $*" >&2; exit 1; }
trap 'echo "BLOCKED: unexpected failure at line $LINENO (exit $?). Stopped; nothing was pushed or deployed." >&2' ERR
now() { date -u +%Y%m%dT%H%M%SZ; }
TS=$(now)
E=$HOME/evidence-$SHORT-$TS
mkdir "$E"                                  # fails if it exists; never overwrites
echo "Evidence directory: $E"

# ---------- 1. Source integrity ----------
[[ -f $TAR && -f $TAR.sha256 ]] || fail "missing $TAR or $TAR.sha256 (run Stage A first)"
( cd "$(dirname "$TAR")" && sha256sum -c "$(basename "$TAR").sha256" ) | tee "$E/source-verification.txt"
cp "$TAR.sha256" "$E/source-archive.sha256"
SRC=$HOME/mb-build-$SHORT-$TS
mkdir "$SRC"; tar -xf "$TAR" -C "$SRC"
V=$E/.verify-git; mkdir "$V"
GIT_DIR=$V git init -q --bare
[[ $(GIT_DIR=$V GIT_WORK_TREE=$SRC git add -A -f && GIT_DIR=$V GIT_WORK_TREE=$SRC git write-tree) == "$TREE" ]] \
  || fail "extracted tree hash does not match $TREE"
[[ $(git get-tar-commit-id < "$TAR") == "$COMMIT" ]] || fail "embedded commit id does not match $COMMIT"
echo "source OK: tree $TREE, commit $COMMIT" | tee -a "$E/source-verification.txt"

# ---------- 2. Environment ----------
[[ $(gcloud config get-value project 2>/dev/null) == "$PROJECT" ]] || fail "gcloud project is not $PROJECT"
docker version --format 'docker server {{.Server.Version}}' > "$E/preflight.txt"
[[ $(docker info -f '{{.OSType}}/{{.Architecture}}') == linux/x86_64 ]] || fail "Docker host is not linux/x86_64"
ROOT=$(docker info -f '{{.DockerRootDir}}')
avail_gb() { df --output=avail -BG "$1" | tail -1 | tr -dc 0-9; }
{ df -h "$ROOT" "$HOME"; free -m; } >> "$E/preflight.txt"
(( $(avail_gb "$ROOT") >= MIN_DOCKER_GB )) || fail "Docker disk < ${MIN_DOCKER_GB}G free"
(( $(avail_gb "$HOME") >= MIN_HOME_GB )) || fail "home disk < ${MIN_HOME_GB}G free (image archives are kept)"
(( $(awk '/MemAvailable/{print int($2/1024)}' /proc/meminfo) >= MIN_MEM_MB )) || fail "available memory < ${MIN_MEM_MB}M"
echo "environment OK"

# ---------- 3. Firebase build configuration (never printed, never traced) ----------
if [[ -z ${NEXT_PUBLIC_FIREBASE_API_KEY:-} ]]; then
  read -rsp "Firebase web API key (input hidden): " NEXT_PUBLIC_FIREBASE_API_KEY </dev/tty; echo
fi
[[ $NEXT_PUBLIC_FIREBASE_API_KEY =~ ^AIza[0-9A-Za-z_-]{35}$ ]] || fail "Firebase API key has an unexpected format (value not shown)"
if [[ -z ${NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:-} ]]; then
  read -rp "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN (the reviewed repo variable value): " NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN </dev/tty
fi
[[ $NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN =~ ^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$ && $NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN == *.* ]] \
  || fail "auth domain has an unexpected format"
export NEXT_PUBLIC_FIREBASE_API_KEY NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
echo "firebase auth domain: $NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN (key: [hidden])" | tee "$E/firebase-config-record.txt"
redact() { python3 -u -c 'import os,sys
k=os.environ.get("NEXT_PUBLIC_FIREBASE_API_KEY","")
for l in sys.stdin: sys.stdout.write(l.replace(k,"[REDACTED]") if k else l)'; }

# ---------- 4. Builds (exact reviewed args; unique tags, nothing overwritten) ----------
API_TAG=mb-api:$SHORT-$TS; WEB_TAG=mb-web:$SHORT-$TS
export BUILDKIT_PROGRESS=plain
cd "$SRC"
echo "Building API (follow: tail -f $E/api-build.log) ..."
docker build --platform linux/amd64 --pull --no-cache -f services/api/Dockerfile -t "$API_TAG" . 2>&1 | redact > "$E/api-build.log"
tail -n 2 "$E/api-build.log"
echo "Building web (follow: tail -f $E/web-build.log) ..."
docker build --platform linux/amd64 --pull --no-cache -f apps/web/Dockerfile -t "$WEB_TAG" \
  --build-arg NEXT_PUBLIC_IDENTITY_MODE=firebase \
  --build-arg NEXT_PUBLIC_API_BASE_URL=/api \
  --build-arg NEXT_PUBLIC_FIREBASE_PROJECT_ID="$PROJECT" \
  --build-arg NEXT_PUBLIC_FIREBASE_API_KEY \
  --build-arg NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN . 2>&1 | redact > "$E/web-build.log"
tail -n 2 "$E/web-build.log"

# ---------- 5. Image identity + structure, ADK/genai import check ----------
for n in api web; do
  tag=$([[ $n == api ]] && echo "$API_TAG" || echo "$WEB_TAG")
  docker image inspect "$tag" > "$E/$n-inspect.json"
  python3 - "$E/$n-inspect.json" <<'PY'
import json, sys
i = json.load(open(sys.argv[1]))[0]
assert i["Os"] == "linux" and i["Architecture"] == "amd64", "not linux/amd64"
assert i["Config"]["User"] == "65532:65532", "runtime user is not 65532:65532"
print(i["Id"])
PY
  docker save "$tag" -o "$E/$n.tar"; chmod 644 "$E/$n.tar"
  ( cd "$E" && sha256sum "$n.tar" > "$n.tar.sha256" )
done

read -r -d '' PYCHECK <<'PY' || true
import google.adk as adk, google.genai as genai
from google.genai import types
assert types.ThinkingLevel.LOW
from agents.reasoning.adk import generation_config
c = generation_config("gemini-3.5-flash-lite")
assert c.thinking_config.thinking_level == types.ThinkingLevel.LOW and c.temperature is None
import firebase_admin, google.cloud.firestore, movebooks_api.settings
print("google-adk", adk.__version__, "google-genai", genai.__version__, "imports OK")
PY
docker run --rm --network none --read-only --cap-drop ALL --security-opt no-new-privileges \
  --entrypoint python "$API_TAG" -c "$PYCHECK" | tee "$E/api-adk-check.txt"

# ---------- 6. Pinned Grype scans (flags mirror the reviewed CI gate) ----------
scan() {
  local n=$1 rc=0
  docker run --rm --user=0:0 --cap-drop=ALL --security-opt=no-new-privileges --memory=2g \
    -e GRYPE_CHECK_FOR_APP_UPDATE=false -v "$E:/scan:ro" "$GRYPE" \
    "docker-archive:/scan/$n.tar" --fail-on high -o json \
    > "$E/$n-grype.json" 2> "$E/$n-grype.stderr.log" || rc=$?
  echo "$rc" > "$E/$n-scan-exit-code.txt"
}
scan api; scan web

# ---------- 7. Strict gate (fail closed) ----------
read -r -d '' GATE <<'PY' || true
import collections, datetime as dt, hashlib, json, pathlib, sys, tarfile
E = pathlib.Path(sys.argv[1]); n = sys.argv[2]; maxh = float(sys.argv[3]); problems = []
try: rc = int((E / f"{n}-scan-exit-code.txt").read_text())
except Exception: rc = -1
if rc != 0: problems.append(f"scanner exit code {rc} (non-zero = findings or scanner/database error)")
try: scan = json.loads((E / f"{n}-grype.json").read_text())
except Exception as e: scan = {}; problems.append(f"unreadable scan JSON ({type(e).__name__})")
matches = scan.get("matches")
if not isinstance(matches, list): problems.append("scan has no matches list"); matches = []
counts = collections.Counter(m["vulnerability"]["severity"] for m in matches)
for sev in ("Critical", "High"):
    if counts[sev]: problems.append(f"{counts[sev]} {sev} vulnerabilities")
ignored = scan.get("ignoredMatches") or []
if ignored: problems.append(f"{len(ignored)} ignored findings")
t = tarfile.open(E / f"{n}.tar"); man = json.load(t.extractfile("manifest.json"))
digest = "sha256:" + hashlib.sha256(t.extractfile(man[0]["Config"]).read()).hexdigest()
img = scan.get("source", {}).get("target", {}).get("imageID")
if img != digest: problems.append("scanner imageID does not match the exported image configuration digest")
def find(o, k):
    if isinstance(o, dict):
        if k in o: return o[k]
        for v in o.values():
            r = find(v, k)
            if r is not None: return r
    elif isinstance(o, list):
        for v in o:
            r = find(v, k)
            if r is not None: return r
db = scan.get("descriptor", {}).get("db"); built = find(db, "built"); valid = find(db, "valid"); age = None
if not built: problems.append("vulnerability database 'built' timestamp not found")
else:
    b = dt.datetime.fromisoformat(str(built).replace("Z", "+00:00"))
    if b.tzinfo is None: b = b.replace(tzinfo=dt.timezone.utc)
    age = (dt.datetime.now(dt.timezone.utc) - b).total_seconds() / 3600
    if age > maxh: problems.append(f"vulnerability database is {age:.0f}h old (max {maxh:.0f}h)")
if valid is False: problems.append("vulnerability database reported invalid")
res = {"image": n, "gate": "BLOCKED" if problems else "PASS", "problems": problems,
       "scan_exit_code": rc, "severity_counts": dict(counts), "ignored_findings": len(ignored),
       "image_config_digest": digest, "scanner_image_id": img, "db_built": built,
       "db_age_hours": None if age is None else round(age, 1),
       "grype_version": scan.get("descriptor", {}).get("version"), "total_matches": len(matches)}
(E / f"{n}-security.json").write_text(json.dumps(res, indent=2) + "\n")
print(json.dumps(res)); sys.exit(1 if problems else 0)
PY
BLOCKED_IMAGES=()
for n in api web; do python3 -c "$GATE" "$E" "$n" "$MAX_DB_AGE_H" || BLOCKED_IMAGES+=("$n"); done

# ---------- 8. Evidence + verdict ----------
for n in api web; do docker image inspect "$( [[ $n == api ]] && echo "$API_TAG" || echo "$WEB_TAG")" --format '{{.Id}}' > "$E/$n-image-id.txt"; done
( cd "$E" && find . -maxdepth 1 -type f ! -name SHA256SUMS -print0 | sort -z | xargs -0 sha256sum > SHA256SUMS )
if (( ${#BLOCKED_IMAGES[@]} )); then
  echo; echo "RESULT: BLOCKED (${BLOCKED_IMAGES[*]}) — see $E/*-security.json. Archives preserved. Nothing pushed or deployed."
  exit 1
fi
echo; echo "RESULT: PASS — both images built, ADK/genai verified, zero Critical/High, zero ignored, fresh DB."
echo "Evidence (keep private; web image embeds the Firebase web key): $E"
echo "Next: explicit approval for registry push (NOT done by this script)."
