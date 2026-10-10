#!/usr/bin/env node
/**
 * revert-exercise-card-to-original.js
 *
 * Rimette il riquadro della foto, nella Libreria Esercizi, esattamente come
 * era PRIMA di tutti i cambiamenti di oggi (riquadro basso e largo, con
 * object-top per proteggere la testa). Tocca gli stessi 3 punti nel file
 * toccati dagli script precedenti, ma all'indietro.
 *
 * Usalo insieme a scripts/revert-exercise-images-to-original.js (quello
 * rimette anche le FOTO originali, non ritagliate).
 *
 * COME USARLO
 * -----------
 *   node scripts/revert-exercise-card-to-original.js            (anteprima)
 *   node scripts/revert-exercise-card-to-original.js --apply     (applica davvero)
 */

const fs = require('fs');
const path = require('path');

const APPLY = process.argv.includes('--apply');
const FILE = path.join(__dirname, '..', 'app', 'dashboard', 'exercise-library', 'page.tsx');

if (!fs.existsSync(FILE)) {
  console.error(`Non trovo il file: ${FILE}`);
  process.exit(1);
}

let content = fs.readFileSync(FILE, 'utf8');
const original = content;

const REPLACEMENTS = [
  {
    label: 'card della griglia (riquadro immagine)',
    from: `<div className="relative aspect-[4/5] overflow-hidden bg-white dark:bg-white/5">`,
    to: `<div className="relative h-52 overflow-hidden bg-white dark:bg-white/5">`,
  },
  {
    label: 'card della griglia (classe immagine)',
    from: `className="relative z-[1] w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"`,
    to: `className="relative z-[1] w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.04]"`,
  },
  {
    label: 'vista di dettaglio, immagine "Posizione iniziale"',
    from: `alt="Posizione iniziale"\n                      className="w-full aspect-[4/5] object-cover"`,
    to: `alt="Posizione iniziale"\n                      className="w-full h-52 object-cover object-top"`,
  },
  {
    label: 'vista di dettaglio, immagine "Posizione finale"',
    from: `alt="Posizione finale"\n                      className="w-full aspect-[4/5] object-cover"`,
    to: `alt="Posizione finale"\n                      className="w-full h-52 object-cover object-top"`,
  },
];

let appliedCount = 0;
for (const r of REPLACEMENTS) {
  if (content.includes(r.from)) {
    console.log(`[trovato]  ${r.label}`);
    if (APPLY) {
      content = content.replace(r.from, r.to);
    }
    appliedCount++;
  } else if (content.includes(r.to)) {
    console.log(`[gia\' originale] ${r.label}`);
  } else {
    console.log(`[NON TROVATO - controllare a mano] ${r.label}`);
  }
}

console.log(`\n${appliedCount} corrispondenze trovate da correggere su ${REPLACEMENTS.length} totali.`);

if (!APPLY) {
  console.log('\n(Anteprima soltanto - nessun file modificato. Rilancia con --apply per applicare davvero.)');
  process.exit(0);
}

if (content === original) {
  console.log('\nNessuna modifica da scrivere (gia\' tutto originale, o nessuna corrispondenza trovata).');
  process.exit(0);
}

fs.writeFileSync(FILE, content, 'utf8');
console.log(`\nFatto: ${FILE} rimesso come prima.`);
console.log('Ricorda di salvare/riavviare il server (npm run dev) per vedere il cambiamento nel browser.');
