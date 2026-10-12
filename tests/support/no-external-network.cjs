// Preloaded into every Node process of the integration tests (NODE_OPTIONS
// --require, see app.mjs and tests/run.sh): the app under test, its workers and
// the test runner itself. It refuses any network connection to a host other
// than this machine, so no test can reach a real service (Supabase, OpenAI,
// Daily, e-mail, ...), even when the code under test has a hard-coded URL.
//
// Two layers:
//  1. globalThis.fetch: refused before anything is resolved or opened, with a
//     clear log line ("[test network guard] blocked external request to <host>").
//  2. net.Socket.prototype.connect: every TCP or TLS connection in Node goes
//     through it (http, https, tls, undici/fetch, net). Non-loopback targets are
//     refused before the host name is looked up. Unix sockets stay allowed.
// Loopback stays allowed (the fake servers listen there), so a local proxy
// could in principle relay traffic. That is why neither the app nor the test
// runner gets any proxy variable (tests/support/app.mjs builds the app's
// environment from scratch; tests/run.sh removes them for the runner), and
// why layer 1 rejects external URLs before any proxy could be involved.
// Not covered: DNS-only lookups made explicitly with node:dns, UDP sockets
// (node:dgram) and child processes that are not Node (the app does not use
// them in tests: SOFFICE_PATH / EBOOK_CONVERT_PATH are empty). The build step
// (next build) runs without the guard: it downloads the Google Fonts used by
// the layout, a public read-only request with no credentials.
const net = require('node:net');

const LOOPBACK = new Set(['127.0.0.1', 'localhost', '::1', '[::1]', '::ffff:127.0.0.1']);
const isLocal = (host) => !host || LOOPBACK.has(String(host).toLowerCase()) || /^127\./.test(String(host));
const blocked = (host) => {
  console.error(`[test network guard] blocked external request to ${host}`);
  return new Error(`external network blocked in tests: ${host}`);
};

const realFetch = globalThis.fetch;
if (realFetch) {
  globalThis.fetch = function guardedFetch(input, init) {
    const raw = input instanceof URL ? input.href : typeof input === 'string' ? input : input?.url;
    let host = '';
    try {
      host = new URL(raw).hostname;
    } catch {
      // Not an absolute URL: it cannot target another host.
    }
    if (host && !isLocal(host)) return Promise.reject(blocked(host));
    return realFetch.call(this, input, init);
  };
}

const realConnect = net.Socket.prototype.connect;
net.Socket.prototype.connect = function guardedConnect(...args) {
  // Node passes either (options[, cb]), (port[, host][, cb]), (path[, cb]) or an
  // already-normalised [options, cb] array as the first argument.
  let first = args[0];
  if (Array.isArray(first)) first = first[0];
  let host;
  let path;
  if (first && typeof first === 'object') {
    host = first.host ?? first.hostname;
    path = first.path;
  } else if (typeof first === 'number' || (typeof first === 'string' && /^\d+$/.test(first))) {
    host = typeof args[1] === 'string' ? args[1] : undefined;
  } else if (typeof first === 'string') {
    path = first;
  }
  if (!path && !isLocal(host)) {
    const err = blocked(host);
    process.nextTick(() => this.destroy(err));
    return this;
  }
  return realConnect.apply(this, args);
};
