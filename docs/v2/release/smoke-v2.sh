#!/usr/bin/env bash
# MoveBooks AI V2 — read-only smoke checks for a V2 web candidate (preview or tagged revision).
# GET requests only; no sign-in, no writes, no model calls. Run after scripts/release/smoke-candidate.sh.
# Usage: bash docs/v2/release/smoke-v2.sh <web-url>
set -Euo pipefail
WEB=${1:?usage: smoke-v2.sh <web-url>}; WEB=${WEB%/}
# The local HTTPS tunnel to a private preview uses a self-signed certificate; trust it for localhost only.
k=(); [[ $WEB == https://localhost:* ]] && k=(-k)
pass=0; failed=0; body=$(mktemp); trap 'rm -f "$body"' EXIT
ok()   { echo "PASS  $1"; pass=$((pass + 1)); }
bad()  { echo "FAIL  $1"; failed=$((failed + 1)); }
get()  { curl "${k[@]}" -sS -D "$body.h" -o "$body" -w '%{http_code}' --max-time 30 "$1" 2>/dev/null || echo 000; }
hdr()  { tr -d '\r' < "$body.h" | awk -v k="$1" 'tolower($1)==tolower(k)":" {sub(/^[^:]*: /,""); print}'; }

[[ $(get "$WEB/") == 200 ]] && ok "landing 200" || bad "landing 200"
grep -q "Prove every total" "$body" && ok "V2 landing served (not a cached V1 page)" || bad "V2 landing served"
grep -q "Built on Google Cloud and powered by Gemini AI" "$body" && ok "approved attribution line" || bad "approved attribution line"
grep -q "Gemini AI planned" "$body" && bad "old attribution copy removed" || ok "old attribution copy removed"
grep -q 'href="/play"' "$body" && bad "Play hidden from navigation (flag off)" || ok "Play hidden from navigation (flag off)"
[[ $(hdr cache-control) == "public, max-age=0, s-maxage=60, must-revalidate" ]] && ok "static HTML cached at most 60s" || bad "static HTML cache header: $(hdr cache-control)"
css=$(grep -oE '/_next/static/[^"]+\.css' "$body" | head -1)
if [[ -n $css && $(get "$WEB$css") == 200 ]]; then ok "landing stylesheet resolves"; else bad "landing stylesheet resolves ($css)"; fi
[[ $(hdr cache-control) == *immutable* ]] && ok "hashed stylesheet immutable" || bad "hashed stylesheet immutable"
for route in /sign-in /workspace /assess /plan-map-approve /migrate-resolve /validate-configure /onboard-fpu /trust /learn /guide /simulator /support /feedback /try-your-data /play; do
  code=$(get "$WEB$route"); [[ $code == 200 || $code == 307 ]] && ok "route $route ($code)" || bad "route $route ($code)"
done
[[ $(get "$WEB/trust") == 200 && $(hdr cache-control) == *no-store* ]] && ok "dynamic HTML stays private, no-store" || bad "dynamic HTML private"
echo "RESULT: $pass passed, $failed failed"
(( failed == 0 ))
