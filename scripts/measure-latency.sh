#!/usr/bin/env bash
# Measures response times of public, read-only PHYGO endpoints that query
# Supabase, to compare the function region before and after a change
# (for example iad1 -> fra1). Sends only anonymous GET requests: no login,
# no token, no write. Run it from your own computer (Italy), not from a server
# in another country, so the numbers reflect your users.
#
#   bash scripts/measure-latency.sh https://phygo.vercel.app 20
#
# Prints, per endpoint, the median and 90th percentile of time to first byte
# and the total time, in milliseconds. Run it twice before the change and twice
# after; the first requests after a deploy include cold starts.
set -euo pipefail
BASE=${1:?usage: measure-latency.sh <base-url> [requests]}
N=${2:-20}
ENDPOINTS=(
  "/api/conditions-library/list?lang=it"
  "/api/search?q=spalla"
)
pct() { sort -n | awk -v p="$1" '{a[NR]=$1} END {i=int(NR*p+0.999); if(i<1)i=1; printf "%d", a[i]}'; }
printf "%-40s %8s %8s %8s %8s\n" endpoint ttfb_p50 ttfb_p90 total_p50 total_p90
for path in "${ENDPOINTS[@]}"; do
  ttfb=(); total=()
  for _ in $(seq "$N"); do
    read -r t1 t2 code < <(curl -s -o /dev/null -w '%{time_starttransfer} %{time_total} %{http_code}\n' "$BASE$path")
    [ "$code" = 200 ] || { echo "$path answered $code" >&2; continue; }
    ttfb+=("$(awk -v t="$t1" 'BEGIN{printf "%d", t*1000}')")
    total+=("$(awk -v t="$t2" 'BEGIN{printf "%d", t*1000}')")
  done
  printf "%-40s %8s %8s %8s %8s\n" "$path" \
    "$(printf '%s\n' "${ttfb[@]}" | pct 0.5)" "$(printf '%s\n' "${ttfb[@]}" | pct 0.9)" \
    "$(printf '%s\n' "${total[@]}" | pct 0.5)" "$(printf '%s\n' "${total[@]}" | pct 0.9)"
done
