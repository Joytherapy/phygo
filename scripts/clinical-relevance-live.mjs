#!/usr/bin/env node
// Manual check of the clinical relevance with the REAL model, in an isolated
// environment: the app runs locally against an in-memory Supabase stand-in
// (tests/support/fake-supabase.mjs) holding only synthetic content
// (tests/support/clinical-world.mjs). No real database, no patient, nothing
// is stored anywhere: the only external call is to OpenAI, forwarded by the
// stand-in with the key given in OPENAI_API_KEY_LIVE (never printed).
//
// Each synthetic case goes through the same API calls as the note panel; the
// output of every section, the exercises, papers and condition sheet with
// their pertinence, and the coherence checks are written to a report for
// human review (docs/clinical/verifica-manuale-modello-reale.md).
//
// Usage (from the repository root, after `npm ci`):
//   node scripts/clinical-relevance-live.mjs --build          # once: builds the app for the stand-in
//   OPENAI_API_KEY_LIVE=… node scripts/clinical-relevance-live.mjs --out ./clinical-live-report [--repeat 2] [--cases shoulderLeft,kneeRight]
// The build is bound to the stand-in's port: run the test suite's own build
// again before running the tests.
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { startFakeSupabase, sessionCookie } from '../tests/support/fake-supabase.mjs';
import { startApp, testEnv } from '../tests/support/app.mjs';
import { CASES, CLIN, checkInputOf, loadClinical, runPipeline, worldTables } from '../tests/support/clinical-world.mjs';

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};
const FAKE_PORT = Number(opt('fake-port', 54890));
const APP_PORT = Number(opt('app-port', 3890));
const fakeUrl = `http://127.0.0.1:${FAKE_PORT}`;

if (args.includes('--build')) {
  const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'build'], { env: testEnv(fakeUrl), stdio: 'inherit' });
  child.on('exit', (code) => process.exit(code ?? 1));
} else {
  const key = process.env.OPENAI_API_KEY_LIVE;
  // OPENAI_LIVE_BASE_URL: only to check this script against a local stand-in of OpenAI.
  const base = (process.env.OPENAI_LIVE_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
  if (!key) {
    console.error('OPENAI_API_KEY_LIVE is not set: nothing to do.');
    process.exit(2);
  }
  const outDir = resolve(opt('out', './clinical-live-report'));
  const repeat = Math.max(1, Number(opt('repeat', 2)));
  const names = (opt('cases', '') || Object.keys(CASES).join(',')).split(',').map((s) => s.trim()).filter((n) => CASES[n]);

  const { K } = await loadClinical();
  const fake = await startFakeSupabase({ port: FAKE_PORT, users: { 'tok-clin': CLIN }, tables: worldTables() });
  fake.state.openaiForward = async (body) => {
    const res = await fetch(`${base}/chat/completions`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` }, body: JSON.stringify(body) });
    return { status: res.status, json: await res.json().catch(() => ({ error: { message: 'invalid response' } })) };
  };
  const app = await startApp({ fakeUrl: fake.url, port: APP_PORT });
  const post = async (path, body) => {
    const res = await fetch(`${app.url}${path}`, { method: 'POST', headers: { 'content-type': 'application/json', cookie: sessionCookie('tok-clin', CLIN) }, body: JSON.stringify(body) });
    return res.json();
  };

  const runs = [];
  try {
    // The cases in a row, `repeat` times: the model does not always answer the same.
    for (let r = 1; r <= repeat; r++) {
      for (const name of names) {
        process.stdout.write(`${name} #${r}… `);
        const out = await runPipeline(post, CASES[name].transcript);
        const issues = K.checkOutput(checkInputOf(out));
        runs.push({
          name, repeat: r, transcript: out.transcript, note: out.note, removed: out.removed,
          kb: { match: out.kb.match?.condition_name ?? null, relevance: out.kb.relevance ?? null, reason: out.kb.relevanceReason ?? null, others: (out.kb.others ?? []).map((o) => ({ region: o.region, side: o.side, match: o.match?.condition_name ?? null, relevance: o.relevance ?? null, reason: o.relevanceReason ?? null })) },
          papers: out.papers.map((p) => ({ title: p.title, relevance: p.relevance, reason: p.relevance_reason ?? null, regions: p.regions ?? [] })),
          exercises: out.exercises.map((e) => ({ name: e.name, draft: e.draft, relevance: e.relevance, reason: e.relevance_reason ?? null, match: e.match_status, suggestion: e.suggested_match?.name ?? null })),
          excluded: out.excluded, issues,
        });
        console.log(`${issues.length} checks`);
      }
    }
  } finally {
    await app.stop();
    await fake.close();
  }

  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'report.json'), JSON.stringify(runs, null, 2));
  const host = new URL(base).host;
  const real = host === 'api.openai.com';
  const md = [
    `# Verifica ${real ? 'con il modello reale' : 'con un SOSTITUTO del modello (non il modello reale)'} (casi sintetici, ambiente isolato)`,
    '',
    `Modello interrogato tramite: ${host}. Esecuzioni: ${runs.length}. Da revisionare a mano: per ogni sezione esito, gravità e se serve revisione umana.`,
    '',
  ];
  for (const run of runs) {
    md.push(`## ${run.name} — ripetizione ${run.repeat}`, '', `**Trascrizione:** ${run.transcript}`, '');
    for (const [k, v] of Object.entries(run.note ?? {})) md.push(`- **${k}:** ${typeof v === 'string' ? v : JSON.stringify(v)}`);
    md.push('', '**Tolto dalla bozza (non detto dal fisioterapista):**', ...(run.removed.length ? run.removed.map((x) => `- ${x.section} · ${x.kind} · «${x.text}»`) : ['- niente']));
    md.push('', `**Scheda clinica:** ${run.kb.match ?? '—'}${run.kb.relevance ? ` (${run.kb.relevance}${run.kb.reason ? `: ${run.kb.reason}` : ''})` : ''}`);
    for (const o of run.kb.others) md.push(`- altro distretto trattato: ${o.region}${o.side ? ` (${o.side})` : ''} → ${o.match ?? 'nessuna scheda'}${o.relevance ? ` (${o.relevance})` : ''}${o.reason ? ` · ${o.reason}` : ''}`);
    md.push('', '**Studi:**', ...(run.papers.length ? run.papers.map((p) => `- ${p.title} — ${p.relevance}${p.reason ? ` (${p.reason})` : ''}${p.regions.length ? ` · distretti: ${p.regions.join(', ')}` : ''}`) : ['- nessuno']));
    md.push('', '**Esercizi:**', ...(run.exercises.length ? run.exercises.map((e) => `- ${e.name}${e.draft && e.draft !== e.name ? ` (dalla nota: ${e.draft})` : ''} — ${e.relevance}${e.reason ? ` (${e.reason})` : ''} · corrispondenza: ${e.match}${e.suggestion ? ` (suggerito: ${e.suggestion})` : ''}`) : ['- nessuno']));
    md.push('', '**Esclusi:**', ...(run.excluded.length ? run.excluded.map((e) => `- ${e.name} — ${e.reason} (${(e.regions ?? []).join(', ')})`) : ['- nessuno']));
    md.push('', '**Controlli di coerenza:**', ...(run.issues.length ? run.issues.map((i) => `- ${i.severity} · ${i.kind} · ${i.item}${i.section ? ` (${i.section})` : ''}`) : ['- nessuno']));
    md.push('', '| Sezione | Esito | Gravità | Che cosa | Revisione umana |', '|---|---|---|---|---|');
    for (const s of ['Rilievi', 'Valutazione', 'Piano', 'Follow-up', 'Ragionamento clinico', 'Scheda e protocollo', 'Studi', 'Esercizi', 'Controlli di coerenza']) md.push(`| ${s} | | | | |`);
    md.push('');
  }
  writeFileSync(join(outDir, 'report.md'), md.join('\n'));
  console.log(`Report: ${join(outDir, 'report.md')}`);
}
