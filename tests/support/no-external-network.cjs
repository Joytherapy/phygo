// Preloaded into the app under test (NODE_OPTIONS=--require, see app.mjs).
// Any fetch to a host other than the local fake servers is refused and logged,
// so no test can reach a real service (Supabase, OpenAI, Daily, e-mail, ...),
// even when the code under test has a hard-coded external URL.
const allowed = new Set(['127.0.0.1', 'localhost', '::1', '[::1]']);
const realFetch = globalThis.fetch;
globalThis.fetch = function guardedFetch(input, init) {
  const raw = input instanceof URL ? input.href : typeof input === 'string' ? input : input?.url;
  let host = '';
  try {
    host = new URL(raw).hostname;
  } catch {
    // Relative or unusual input: let the real fetch decide (it cannot leave the machine without a host).
  }
  if (host && !allowed.has(host)) {
    console.error(`[test network guard] blocked external request to ${host}`);
    return Promise.reject(new TypeError(`external network blocked in tests: ${host}`));
  }
  return realFetch(input, init);
};
