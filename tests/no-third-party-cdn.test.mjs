// The browser loads no code from third-party CDNs: every such request sends
// the user's IP and browser to a provider not named in the privacy notice.
// The pdf.js worker is served from our own domain (lib/pdfWorker.ts), copied
// by next.config.js from the pdfjs-dist build that react-pdf uses.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const walk = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : /\.(ts|tsx|js|mjs)$/.test(f) ? [p] : [];
  });
// Comments may mention a CDN (to explain why it is not used); code may not.
const code = (file) => readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

test('no script, worker or stylesheet is loaded from a third-party CDN', () => {
  const CDN = /https?:\/\/(cdnjs\.cloudflare\.com|unpkg\.com|cdn\.jsdelivr\.net|cdn\.skypack\.dev|esm\.sh)\//;
  const offenders = ['app', 'components', 'lib', 'contexts', 'utils'].filter(existsSync).flatMap(walk).filter((f) => CDN.test(code(f)));
  assert.deepEqual(offenders, []);
});

test('the pdf.js worker is the one react-pdf uses, copied at build time', () => {
  // The pdfjs-dist that react-pdf itself resolves, and the copied file next.config.js produces.
  const fromReactPdf = createRequire(createRequire(import.meta.url).resolve('react-pdf'));
  const { version } = fromReactPdf('pdfjs-dist/package.json');
  const copied = join('public', 'pdfjs', version, 'pdf.worker.min.mjs');
  assert.ok(existsSync(copied), `${copied} exists after the build (next.config.js)`);
  const original = join(fromReactPdf.resolve('pdfjs-dist/package.json'), '..', 'build', 'pdf.worker.min.mjs');
  assert.ok(readFileSync(copied).equals(readFileSync(original)), 'identical to the installed worker');
  assert.match(readFileSync('lib/pdfWorker.ts', 'utf8'), /\/pdfjs\/\$\{version\}\/pdf\.worker\.min\.mjs/);
});
