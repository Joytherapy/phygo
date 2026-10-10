#!/usr/bin/env node
/**
 * fix-exercise-card-crop.js
 *
 * Piccola correzione mirata a app/dashboard/exercise-library/page.tsx.
 *
 * Perche' serve: ora che le foto sono state ritagliate/ricentrate con
 * scripts/trim-exercise-image-margins.js, il soggetto e' gia' ben centrato
 * dentro ogni foto con un margine uniforme piccolo. Il CSS "object-top"
 * (scelto PRIMA del ritaglio per proteggere la testa dei personaggi dentro
 * foto enormi e sbilanciate) ora fa l'effetto opposto in alcuni casi: su
 * esercizi fotografati in basso nel fotogramma (affondi, esercizi a terra),
 * "object-top" mostra la parte ALTA della foto gia' stretta - cioe' aria
 * vuota sopra la testa del personaggio invece del personaggio stesso.
 *
 * Questo script toglie "object-top" (tre punti nel file: la card della
 * griglia e le due immagini nella vista di dettaglio), lasciando il
 * ritaglio centrato di default - corretto ora che le foto sono gia'
 * centrate alla fonte.
 *
 * COME USARLO
 * -----------
 *   node scripts/fix-exercise-card-crop.js            (anteprima: mostra cosa cambierebbe)
 *   node scripts/fix-exercise-card-crop.js --apply     (applica davvero la modifica)
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
    label: 'card della griglia (img principale)',
    from: `className="relative z-[1] w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.04]"`,
    to: `className="relative z-[1] w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"`,
  },
  {
    label: 'vista di dettaglio, immagine "Posizione iniziale"',
    from: `alt="Posizione iniziale"\n                      className="w-full h-52 object-cover object-top"`,
    to: `alt="Posizione iniziale"\n                      className="w-full h-52 object-cover"`,
  },
  {
    label: 'vista di dettaglio, immagine "Posizione finale"',
    from: `alt="Posizione finale"\n                      className="w-full h-52 object-cover object-top"`,
    to: `alt="Posizione finale"\n                      className="w-full h-52 object-cover"`,
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
    console.log(`[gia' corretto] ${r.label}`);
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
