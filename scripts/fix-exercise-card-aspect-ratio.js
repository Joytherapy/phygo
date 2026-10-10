#!/usr/bin/env node
/**
 * fix-exercise-card-aspect-ratio.js
 *
 * Secondo problema (dopo aver tolto "object-top" e aumentato il margine delle
 * foto): nella Libreria Esercizi, il riquadro della foto era BASSO E LARGO
 * (altezza fissa 208px, larghezza che cambia). Ma la maggior parte delle foto
 * sorgente sono una persona IN PIEDI, quindi ALTE E STRETTE (es. 320x1593
 * pixel). Per riempire un riquadro largo con una foto cosi' stretta, il sito
 * deve ingrandire moltissimo la foto - risultato: si vede solo un pezzettino
 * ingrandito del personaggio (es. solo l'anca), non piu' tutto il corpo.
 *
 * Questo script cambia il riquadro da "basso e largo" a "verticale" (rapporto
 * 4:5, come una foto ritratto), cosi' serve molto meno ingrandimento e si
 * vede molta piu' parte del personaggio. Tocca 3 punti nel file: la card
 * della griglia e le due immagini nella vista di dettaglio.
 *
 * Non serve ritoccare di nuovo le foto su Supabase: e' solo un cambiamento
 * del riquadro nella pagina (CSS).
 *
 * COME USARLO
 * -----------
 *   node scripts/fix-exercise-card-aspect-ratio.js            (anteprima)
 *   node scripts/fix-exercise-card-aspect-ratio.js --apply     (applica davvero)
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
    from: `<div className="relative h-52 overflow-hidden bg-white dark:bg-white/5">`,
    to: `<div className="relative aspect-[4/5] overflow-hidden bg-white dark:bg-white/5">`,
  },
  {
    label: 'vista di dettaglio, immagine "Posizione iniziale"',
    from: `alt="Posizione iniziale"\n                      className="w-full h-52 object-cover"`,
    to: `alt="Posizione iniziale"\n                      className="w-full aspect-[4/5] object-cover"`,
  },
  {
    label: 'vista di dettaglio, immagine "Posizione finale"',
    from: `alt="Posizione finale"\n                      className="w-full h-52 object-cover"`,
    to: `alt="Posizione finale"\n                      className="w-full aspect-[4/5] object-cover"`,
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
    console.log(`[gia\' corretto] ${r.label}`);
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
  console.log('\nNessuna modifica da scrivere (gia\' tutto corretto, o nessuna corrispondenza trovata).');
  process.exit(0);
}

fs.writeFileSync(FILE, content, 'utf8');
console.log(`\nFatto: ${FILE} aggiornato.`);
console.log('Ricorda di salvare/riavviare il server (npm run dev) per vedere il cambiamento nel browser.');
