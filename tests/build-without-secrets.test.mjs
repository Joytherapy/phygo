// Vercel Preview builds run without Production secrets. A client created when
// a module loads (new OpenAI(...), createClient(...), createBrowserClient(...))
// makes "next build" fail there, because Next.js loads every route module
// while it builds. These checks keep clients behind lib/lazy.ts.
// The full proof is a build with no application variables (see the PR).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const walk = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : /\.(ts|tsx)$/.test(f) ? [p] : [];
  });

test('no Supabase or OpenAI client is created when a module loads', () => {
  const offenders = ['app', 'lib', 'components', 'contexts', 'utils']
    .flatMap(walk)
    .filter((file) => /^(export )?(const|let|var) [A-Za-z_$][\w$]* *= *(new OpenAI|createClient|createBrowserClient|createServerClient)\(/m.test(readFileSync(file, 'utf8')));
  assert.deepEqual(offenders, [], 'wrap these with lazy(() => ...) from lib/lazy.ts');
});

test('lazy() creates the client on first use, once, and keeps method binding', async () => {
  // lib/lazy.ts is plain TypeScript without types at runtime: strip the generics to load it.
  const source = readFileSync('lib/lazy.ts', 'utf8')
    .replace(/export function lazy<T extends object>\(factory: \(\) => T\): T/, 'function lazy(factory)')
    .replace(/let instance: T \| undefined;/, 'let instance;')
    .replace(/\{\} as T/, '{}');
  const lazy = new Function(`${source}; return lazy;`)();
  let created = 0;
  const client = lazy(() => {
    created++;
    return { name: 'client', hello() { return `hi from ${this.name}`; }, nested: { value: 1 } };
  });
  assert.equal(created, 0, 'nothing is created when the module loads');
  const { hello } = client;
  assert.equal(hello(), 'hi from client', 'methods keep their object');
  assert.equal(client.nested.value, 1);
  assert.ok('hello' in client);
  assert.equal(created, 1, 'created once, on first use');
  assert.throws(() => lazy(() => { throw new Error('missing key'); }).anything, /missing key/, 'a missing variable fails the use, not the import');
});
