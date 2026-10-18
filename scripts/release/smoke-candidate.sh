#!/usr/bin/env bash
# MoveBooks AI — read-only smoke test of a no-traffic candidate (tag URLs printed by `gcloud run deploy --tag`).
# Sends only GET/unauthenticated requests plus one origin-less POST that must be refused. No sign-in, no writes,
# no model calls. Exit 0 only if every check passes.
# Usage: bash smoke-candidate.sh <web-tag-url> [<api-tag-url>]
#   With an API URL, uses `gcloud auth print-identity-token` (Cloud Run IAM only, no Firebase identity).
set -Euo pipefail
WEB=${1:?usage: smoke-candidate.sh <web-tag-url> [<api-tag-url>]}; WEB=${WEB%/}
API=${2:-}; API=${API%/}
pass=0; failed=0
check() {  # name expected-status actual-status [body-grep]
  if [[ $3 == "$2" ]]; then echo "PASS  $1 ($3)"; pass=$((pass + 1))
  else echo "FAIL  $1 (expected $2, got $3)"; failed=$((failed + 1)); fi
}
code() { curl -sS -o /tmp/mb-smoke-body -w '%{http_code}' --max-time 30 "$@" 2>/dev/null || echo 000; }

check "web landing page"                       200 "$(code "$WEB/")"
check "web workspace page serves (client-side sign-in)" 200 "$(code "$WEB/workspace")"
check "proxy identity needs Google sign-in"     401 "$(code "$WEB/api/v1/identity")"
# Before 5b5d736 this returned 404 (route not exposed): the migration picker could never load.
check "proxy exposes migration list (auth required)" 401 "$(code "$WEB/api/v1/migration-sessions?limit=20")"
check "proxy refuses unknown list query"        404 "$(code "$WEB/api/v1/migration-sessions?owner=other")"
check "proxy refuses unexposed route"           404 "$(code "$WEB/api/v1/admin")"
check "proxy refuses origin-less write"         403 "$(code -X POST -H 'Content-Type: application/json' -d '{}' "$WEB/api/v1/migration-sessions")"

if [[ -n $API ]]; then
  check "private API refuses anonymous callers"  403 "$(code "$API/healthz")"
  TOKEN=$(gcloud auth print-identity-token 2>/dev/null) || { echo "FAIL  no gcloud identity token"; exit 1; }
  H="Authorization: Bearer $TOKEN"
  check "API health"                            200 "$(code -H "$H" "$API/healthz")"
  check "API ready (database reachable)"        200 "$(code -H "$H" "$API/readyz")"
  check "API runtime"                           200 "$(code -H "$H" "$API/v1/runtime")"
  mode=$(python3 -c 'import json;print(json.load(open("/tmp/mb-smoke-body"))["model_mode"])' 2>/dev/null || echo unknown)
  check "API model mode is deterministic-only"  deterministic-only "$mode"
  # Cloud Run IAM token is not a Firebase identity: the API itself must still refuse the owner-scoped list.
  check "API list requires Firebase identity"    401 "$(code -H "X-Serverless-Authorization: Bearer $TOKEN" "$API/v1/migration-sessions")"
fi
rm -f /tmp/mb-smoke-body
echo "RESULT: $pass passed, $failed failed"
(( failed == 0 ))
