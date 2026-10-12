#!/usr/bin/env bash
# Integration tests against a fake Supabase (tests/support/fake-supabase.mjs).
# Builds the app with test-only configuration, then runs every tests/*.test.mjs.
# No real database, storage, OpenAI, Daily or e-mail service is contacted.
#
#   bash tests/run.sh
#
# Note: this replaces the .next build directory with a test build; run
# `npm run build` again before `npm start` with your real configuration.
set -euo pipefail
cd "$(dirname "$0")/.."
export FAKE_SUPABASE_PORT=${FAKE_SUPABASE_PORT:-54329}
node --input-type=module -e "
  import { testEnv } from './tests/support/app.mjs';
  const env = testEnv('http://127.0.0.1:${FAKE_SUPABASE_PORT}');
  for (const [k, v] of Object.entries(env)) if (!['PATH', 'HOME', 'NODE_ENV', 'NODE_OPTIONS'].includes(k)) console.log('export ' + k + '=' + JSON.stringify(v));
" > /tmp/phygo-test-env.sh
# shellcheck disable=SC1091
source /tmp/phygo-test-env.sh
rm -rf .next/cache/fetch-cache
node node_modules/next/dist/bin/next build > /tmp/phygo-test-build.log 2>&1 || { tail -40 /tmp/phygo-test-build.log; exit 1; }
node --test --test-concurrency=1 tests/*.test.mjs
