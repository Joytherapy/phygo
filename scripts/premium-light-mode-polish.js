#!/usr/bin/env node
/**
 * premium-light-mode-polish.js
 *
 * Rende le card (riquadri) del sito piu' "premium" in MODALITA' GIORNO,
 * su tutte le pagine della Dashboard e non solo (la modalita' notte NON
 * viene toccata). Il problema: le card sfumano troppo nello sfondo
 * perche' hanno un bordo troppo leggero e un'ombra troppo debole.
 *
 * Cosa fa, in 3 punti:
 *  1. Rende l'ombra delle card ("shadow-soft" e "shadow-lift") un po'
 *     piu' marcata - e' definita in un unico punto (tailwind.config.js)
 *     quindi questo da solo migliora TUTTE le pagine che la usano.
 *  2. Rende il bordo delle card un po' piu' visibile ovunque nel sito
 *     (border-black/[0.06] -> [0.08], [0.08] -> [0.11], [0.09] -> [0.12]).
 *  3. Rende lo sfondo bianco delle card un po' piu' pieno nella pagina
 *     principale della Dashboard e nelle pagine simili (bg-white/90 ->
 *     bg-white/95, che e' gia' il valore piu' usato nel resto del sito).
 *
 * Non tocca NESSUN colore, nessun testo, nessuna funzione: solo questi
 * valori di bordo/ombra/sfondo. Facile da annullare se non piace.
 *
 * COME USARLO
 * -----------
 *   node scripts/premium-light-mode-polish.js            (anteprima)
 *   node scripts/premium-light-mode-polish.js --apply     (applica davvero)
 */

const fs = require('fs');
const path = require('path');

const APPLY = process.argv.includes('--apply');
const ROOT = path.join(__dirname, '..');
const APP_DIR = path.join(ROOT, 'app');
const TAILWIND_CONFIG = path.join(ROOT, 'tailwind.config.js');

// ---------- 1) tailwind.config.js: ombre piu' marcate ----------
const TAILWIND_REPLACEMENTS = [
  {
    label: 'ombra "soft" (card normali)',
    from: `soft: "0 2px 8px rgba(11, 13, 18, 0.04), 0 12px 32px rgba(11, 13, 18, 0.06)",`,
    to: `soft: "0 2px 10px rgba(11, 13, 18, 0.07), 0 16px 40px rgba(11, 13, 18, 0.12)",`,
  },
  {
    label: 'ombra "lift" (card al passaggio del mouse)',
    from: `lift: "0 8px 24px rgba(11, 13, 18, 0.06), 0 30px 60px rgba(11, 13, 18, 0.10)",`,
    to: `lift: "0 8px 28px rgba(11, 13, 18, 0.10), 0 30px 70px rgba(11, 13, 18, 0.16)",`,
  },
];

// ---------- 2) + 3) sostituzioni di classi dentro le pagine (app/**/*.tsx) ----------
// Attenzione all'ORDINE: dal piu' specifico al meno specifico, per non
// sostituire due volte lo stesso punto.
const CLASS_REPLACEMENTS = [
  { from: /border-black\/\[0\.09\]/g, to: 'border-black/[0.12]' },
  { from: /border-black\/\[0\.08\]/g, to: 'border-black/[0.11]' },
  { from: /border-black\/\[0\.06\]/g, to: 'border-black/[0.08]' },
  { from: /bg-white\/90\b/g, to: 'bg-white/95' },
];

function walkTsxFiles(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkTsxFiles(full, out);
    } else if (entry.isFile() && /\.(tsx|ts)$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

function main() {
  console.log(APPLY ? 'Applico le modifiche...\n' : 'Anteprima (nessun file modificato ancora)...\n');

  // --- tailwind.config.js ---
  let twContent = fs.readFileSync(TAILWIND_CONFIG, 'utf8');
  let twChanged = 0;
  for (const r of TAILWIND_REPLACEMENTS) {
    if (twContent.includes(r.from)) {
      console.log(`[trovato] tailwind.config.js -> ${r.label}`);
      twContent = twContent.replace(r.from, r.to);
      twChanged++;
    } else if (twContent.includes(r.to)) {
      console.log(`[gia' fatto] tailwind.config.js -> ${r.label}`);
    } else {
      console.log(`[NON TROVATO - controllare a mano] tailwind.config.js -> ${r.label}`);
    }
  }

  // --- app/**/*.tsx ---
  const files = walkTsxFiles(APP_DIR);
  let totalFileChanges = 0;
  let totalReplacements = 0;
  const changedFiles = [];

  for (const file of files) {
    const original = fs.readFileSync(file, 'utf8');
    let content = original;
    let fileReplacements = 0;
    for (const r of CLASS_REPLACEMENTS) {
      const matches = content.match(r.from);
      if (matches) {
        fileReplacements += matches.length;
        content = content.replace(r.from, r.to);
      }
    }
    if (fileReplacements > 0) {
      totalFileChanges++;
      totalReplacements += fileReplacements;
      changedFiles.push({ file: path.relative(ROOT, file), count: fileReplacements });
      if (APPLY) {
        fs.writeFileSync(file, content, 'utf8');
      }
    }
  }

  console.log(`\nFile di pagina da aggiornare: ${totalFileChanges} (${totalReplacements} punti in totale)`);
  if (changedFiles.length) {
    console.log('\nPagine toccate:');
    for (const c of changedFiles.slice(0, 60)) console.log(`  ${c.file}  (${c.count})`);
    if (changedFiles.length > 60) console.log(`  ... e altre ${changedFiles.length - 60}`);
  }

  if (!APPLY) {
    console.log('\n(Anteprima soltanto - nessun file modificato. Rilancia con --apply per applicare davvero.)');
    return;
  }

  fs.writeFileSync(TAILWIND_CONFIG, twContent, 'utf8');
  console.log('\nFatto. tailwind.config.js aggiornato e pagine aggiornate.');
  console.log('Ricorda di salvare/riavviare il server (npm run dev) per vedere il cambiamento nel browser.');
}

main();
