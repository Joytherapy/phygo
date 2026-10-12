// Proves that tests/support/no-external-network.cjs refuses every kind of
// outbound connection, using only addresses that can never reach a real
// service: 192.0.2.1 (TEST-NET-1, RFC 5737, reserved for documentation) and
// names under .invalid (RFC 2606, never resolve). A loopback server must stay
// reachable.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const GUARD = fileURLToPath(new URL('./support/no-external-network.cjs', import.meta.url));

// Runs a small script in a fresh Node process with the guard preloaded, as the app is started.
function run(script) {
  const res = spawnSync(process.execPath, ['--require', GUARD, '--input-type=module', '-e', script], {
    env: { PATH: process.env.PATH },
    encoding: 'utf8',
    timeout: 20000,
  });
  return { out: res.stdout.trim(), err: res.stderr };
}

const ATTEMPTS = {
  'fetch to a host name': `await fetch('https://guard-test.invalid/x')`,
  'fetch to an IP address': `await fetch('http://192.0.2.1/x')`,
  'node:http request': `const m = await import('node:http'); await new Promise((ok, ko) => m.get('http://192.0.2.1/x', ok).on('error', ko))`,
  'node:https request': `const m = await import('node:https'); await new Promise((ok, ko) => m.get('https://guard-test.invalid/x', ok).on('error', ko))`,
  'node:net connect': `const m = await import('node:net'); await new Promise((ok, ko) => m.connect({ host: '192.0.2.1', port: 443 }, ok).on('error', ko))`,
  'node:net connect (port, host)': `const m = await import('node:net'); await new Promise((ok, ko) => m.connect(80, '192.0.2.1', ok).on('error', ko))`,
  'node:tls connect': `const m = await import('node:tls'); await new Promise((ok, ko) => m.connect({ host: 'guard-test.invalid', port: 443 }, ok).on('error', ko))`,
};

for (const [label, attempt] of Object.entries(ATTEMPTS)) {
  test(`network guard refuses: ${label}`, () => {
    const { out, err } = run(`try { ${attempt}; console.log('CONNECTED'); } catch (e) { console.log('REFUSED ' + e.message); }`);
    assert.match(out, /^REFUSED .*external network blocked in tests/, `${out} ${err}`);
    assert.match(err, /\[test network guard\] blocked external request to/);
  });
}

test('network guard allows loopback (the fake servers)', () => {
  const { out, err } = run(`
    const http = await import('node:http');
    const server = http.createServer((q, r) => r.end('ok')).listen(0, '127.0.0.1');
    await new Promise((r) => server.on('listening', r));
    const { port } = server.address();
    const a = await (await fetch('http://127.0.0.1:' + port)).text();
    const b = await new Promise((ok) => http.get('http://localhost:' + port, (r) => { let d = ''; r.on('data', (c) => (d += c)); r.on('end', () => ok(d)); }));
    console.log(a + b);
    server.close();`);
  assert.equal(out, 'okok', err);
});
