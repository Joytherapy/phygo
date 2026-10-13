#!/usr/bin/env bash
# Runs tests/release_states.test.mjs against the CURRENT production code
# (default: origin/main) with RELEASE_CODE=old, to show what that code's API
# exposes in release states S1, S2 and S2+B. Uses a temporary git worktree,
# the fake servers and the external-network guard of this branch; nothing
# real is contacted.
#   bash tests/release_states_old.sh [git-ref]
set -euo pipefail
cd "$(dirname "$0")/.."
REF=${1:-origin/main}
WT="$(mktemp -d)/old"
git worktree add -q --detach "$WT" "$REF"
trap 'git worktree remove --force "$WT"' EXIT
ln -s "$(cd node_modules && pwd -P)" "$WT/node_modules"
mkdir -p "$WT/tests"
cp -r tests/support tests/run.sh tests/release_states.test.mjs "$WT/tests/"
echo "release states, old code: $(git rev-parse --short "$REF")"
(cd "$WT" && RELEASE_CODE=old bash tests/run.sh)
