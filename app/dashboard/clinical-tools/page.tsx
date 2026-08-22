'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { ClipboardList } from 'lucide-react';

type ScaleKey = 'katz' | 'barthel' | 'tinetti' | 'conley' | 'berg' | 'morse' | 'ashworth' | 'nrs' | 'sppb' | 'mmse' | 'gcs' | 'tug' | 'sixmwt';

const SCALES: { key: ScaleKey; name: string; subtitle: string }[] = [
  { key: 'katz', name: 'Katz Index', subtitle: 'Autonomia nelle ADL' },
  { key: 'barthel', name: 'Barthel Index', subtitle: 'Disabilità funzionale' },
  { key: 'tinetti', name: 'Tinetti Scale', subtitle: 'Equilibrio e andatura' },
  { key: 'conley', name: 'Conley Scale', subtitle: 'Rischio di caduta' },
  { key: 'berg', name: 'Berg Balance Scale', subtitle: 'Equilibrio (gold standard)' },
  { key: 'morse', name: 'Morse Fall Scale', subtitle: 'Rischio di caduta' },
  { key: 'ashworth', name: 'Modified Ashworth', subtitle: 'Spasticità' },
  { key: 'nrs', name: 'NRS Pain Scale', subtitle: 'Intensità del dolore' },
  { key: 'sppb', name: 'SPPB', subtitle: 'Performance fisica' },
  { key: 'mmse', name: 'MMSE', subtitle: 'Screening cognitivo' },
  { key: 'gcs', name: 'Glasgow Coma Scale', subtitle: 'Stato di coscienza' },
  { key: 'tug', name: 'Timed Up and Go', subtitle: 'Mobilità funzionale' },
  { key: 'sixmwt', name: '6-Minute Walk Test', subtitle: 'Capacità aerobica' },
];

function ButtonGroup({
  options,
  value,
  onChange,
}: {
  options: { v: number; l: string }[];
  value: number | undefined;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.v}
          onClick={() => onChange(opt.v)}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
            value === opt.v
              ? 'bg-gradient-to-r from-[#4F7CFF] to-[#32D6A0] text-white'
              : 'bg-black/5 dark:bg-white/10 text-ink/60 dark:text-white/60'
          }`}
        >
          {opt.l}
        </button>
      ))}
    </div>
  );
}

function ScaleDescription({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] p-4 mb-4">
      <p className="text-sm text-ink/60 dark:text-white/60 leading-relaxed">{text}</p>
    </div>
  );
}

const SCALE_DESCRIPTIONS: Record<ScaleKey, string> = {
  katz: "Misura il grado di autonomia dell'anziano in 6 attività di base della vita quotidiana (ADL): fare il bagno, vestirsi, uso della toilette, trasferimenti, continenza, alimentazione. Ogni item è dicotomico (indipendente/dipendente). Utile per una valutazione rapida dell'autosufficienza globale, meno sensibile ai cambiamenti rispetto a scale più dettagliate come il Barthel.",
  barthel: "Scala di disabilità funzionale tra le più utilizzate nella pratica riabilitativa, valuta 10 attività della vita quotidiana con punteggi differenziati (0-15 punti per item) in base al livello di assistenza necessario. Un punteggio ≤40 indica generalmente la necessità di un ricovero riabilitativo intensivo. Va tipicamente somministrata all'ingresso e alla dimissione per misurare l'efficacia del trattamento.",
  tinetti: "Valuta equilibrio (13 item) e andatura (9 item) con osservazione diretta del paziente durante compiti standardizzati (alzarsi dalla sedia, stare in piedi, girarsi, camminare). Il punteggio combinato orienta il rischio di caduta: sotto i 19 punti il rischio è considerato elevato. Richiede l'osservazione diretta del movimento, non è compilabile solo con un'intervista.",
  conley: "Scala di screening rapido del rischio di caduta, basata su 6 domande (storia di cadute, vertigini, incontinenza urgente, deterioramento cognitivo, agitazione, deficit di giudizio). Pensata per un utilizzo veloce al momento del ricovero ospedaliero, un punteggio ≥2 indica un rischio significativo che giustifica misure preventive.",
  berg: "Considerata il gold standard per la valutazione dell'equilibrio in ambito riabilitativo e geriatrico. Composta da 14 compiti funzionali (da seduto a in piedi, stazione eretta a occhi chiusi, raggiungere in avanti, girarsi, stazione monopodalica) ciascuno valutato 0-4. Più lunga da somministrare rispetto alla Tinetti ma con maggiore sensibilità nei range intermedi di funzione.",
  morse: "Scala di screening del rischio di caduta molto diffusa in ambito ospedaliero internazionale, alternativa alla Conley. Valuta 6 fattori (storia di cadute, diagnosi secondaria, ausilio per la deambulazione, terapia endovenosa, tipo di andatura, stato mentale) con pesi diversi. Va ripetuta periodicamente durante la degenza, non solo all'ingresso.",
  ashworth: "Scala di valutazione clinica della spasticità (0-4, con il grado intermedio 1+ nella versione modificata), basata sulla resistenza percepita dall'esaminatore durante lo stiramento passivo rapido del muscolo. È soggettiva e dipende dall'esperienza del valutatore, ma resta lo strumento clinico più diffuso per il monitoraggio della spasticità nel tempo.",
  nrs: "Scala numerica di autovalutazione del dolore, da 0 (nessun dolore) a 10 (peggior dolore immaginabile). Semplice, rapida, ampiamente validata; il paziente stesso indica il numero che meglio rappresenta l'intensità del dolore percepito in quel momento.",
  sppb: "Batteria composita di performance fisica molto utilizzata in geriatria, combina tre test cronometrati (equilibrio in piedi in posizioni progressivamente più impegnative, velocità del cammino su 4 metri, tempo per alzarsi 5 volte dalla sedia) in un punteggio 0-12. Un punteggio basso predice un aumentato rischio di disabilità, ospedalizzazione e mortalità.",
  mmse: "Test di screening cognitivo più utilizzato al mondo, esplora orientamento spazio-temporale, memoria immediata e differita, attenzione/calcolo, linguaggio e prassia costruttiva in circa 10 minuti. Il punteggio va corretto per età e scolarità del paziente secondo le tabelle normative italiane. Non è uno strumento diagnostico da solo, ma un valido screening di primo livello.",
  gcs: "Scala standard per la valutazione dello stato di coscienza dopo trauma cranico o evento neurologico acuto, basata su tre componenti indipendenti (apertura degli occhi, risposta verbale, risposta motoria). Il punteggio totale classifica la gravità del trauma: 13-15 lieve, 9-12 moderato, 3-8 grave (quest'ultimo generalmente associato a necessità di protezione delle vie aeree).",
  tug: "Test rapido e semplice di mobilità funzionale: il paziente si alza da una sedia, cammina 3 metri, si gira, torna e si siede, mentre viene cronometrato il tempo totale. Un tempo superiore a 20 secondi è generalmente associato a un aumentato rischio di caduta e a difficoltà nelle attività della vita quotidiana.",
  sixmwt: "Misura la distanza massima percorribile in 6 minuti camminando al proprio passo, su un percorso piano di lunghezza nota. Riflette la capacità funzionale aerobica sub-massimale ed è ampiamente utilizzato in cardiologia, pneumologia e riabilitazione geriatrica per monitorare l'evoluzione della capacità di esercizio nel tempo.",
};

function ResultBox({ score, max, interpretation }: { score: number; max?: number; interpretation: string }) {
  return (
    <div className="rounded-2xl bg-gradient-to-r from-[#4F7CFF]/10 to-[#32D6A0]/10 border border-[#4F7CFF]/20 p-5 text-center">
      <p className="text-3xl font-bold">{score}{max !== undefined ? ` / ${max}` : ''}</p>
      <p className="text-sm text-ink/60 dark:text-white/60 mt-1">{interpretation}</p>
    </div>
  );
}

// --- KATZ ---
const KATZ_ITEMS = [
  { key: 'bathing', label: 'Fare il bagno' },
  { key: 'dressing', label: 'Vestirsi' },
  { key: 'toileting', label: 'Toilette' },
  { key: 'transferring', label: 'Spostarsi (letto/sedia)' },
  { key: 'continence', label: 'Continenza' },
  { key: 'feeding', label: 'Alimentazione' },
];

function KatzScale() {
  const [scores, setScores] = useState<Record<string, number>>({});
  const total = KATZ_ITEMS.reduce((sum, item) => sum + (scores[item.key] ?? 0), 0);

  return (
    <div className="space-y-4">
      {KATZ_ITEMS.map((item) => (
        <div key={item.key} className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4">
          <p className="text-sm font-semibold mb-2">{item.label}</p>
          <ButtonGroup
            options={[{ v: 0, l: 'Dipendente' }, { v: 1, l: 'Indipendente' }]}
            value={scores[item.key]}
            onChange={(v) => setScores((s) => ({ ...s, [item.key]: v }))}
          />
        </div>
      ))}
      <ResultBox
        score={total}
        max={6}
        interpretation={total === 6 ? 'Completa autonomia' : total >= 4 ? 'Compromissione moderata' : 'Compromissione severa'}
      />
    </div>
  );
}

// --- BARTHEL ---
const BARTHEL_ITEMS = [
  { key: 'feeding', label: 'Alimentazione', options: [{ v: 0, l: 'Incapace' }, { v: 5, l: 'Necessita assistenza' }, { v: 10, l: 'Indipendente' }] },
  { key: 'bathing', label: 'Fare il bagno', options: [{ v: 0, l: 'Dipendente' }, { v: 5, l: 'Indipendente' }] },
  { key: 'grooming', label: 'Igiene personale', options: [{ v: 0, l: 'Necessita aiuto' }, { v: 5, l: 'Indipendente' }] },
  { key: 'dressing', label: 'Vestirsi', options: [{ v: 0, l: 'Dipendente' }, { v: 5, l: 'Necessita aiuto' }, { v: 10, l: 'Indipendente' }] },
  { key: 'bowel', label: 'Controllo defecazione', options: [{ v: 0, l: 'Incontinente' }, { v: 5, l: 'Occasionale' }, { v: 10, l: 'Continente' }] },
  { key: 'bladder', label: 'Controllo minzione', options: [{ v: 0, l: 'Incontinente' }, { v: 5, l: 'Occasionale' }, { v: 10, l: 'Continente' }] },
  { key: 'toilet', label: 'Uso del bagno', options: [{ v: 0, l: 'Dipendente' }, { v: 5, l: 'Necessita aiuto' }, { v: 10, l: 'Indipendente' }] },
  { key: 'transfer', label: 'Trasferimenti sedia/letto', options: [{ v: 0, l: 'Incapace' }, { v: 5, l: 'Grande assistenza' }, { v: 10, l: 'Minima assistenza' }, { v: 15, l: 'Indipendente' }] },
  { key: 'mobility', label: 'Deambulazione', options: [{ v: 0, l: 'Immobile' }, { v: 5, l: 'Con aiuto' }, { v: 10, l: 'Con ausilio' }, { v: 15, l: 'Indipendente' }] },
  { key: 'stairs', label: 'Salire le scale', options: [{ v: 0, l: 'Incapace' }, { v: 5, l: 'Con aiuto' }, { v: 10, l: 'Indipendente' }] },
];

function BarthelScale() {
  const [scores, setScores] = useState<Record<string, number>>({});
  const total = Object.values(scores).reduce((s, v) => s + v, 0);

  return (
    <div className="space-y-4">
      {BARTHEL_ITEMS.map((item) => (
        <div key={item.key} className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4">
          <p className="text-sm font-semibold mb-2">{item.label}</p>
          <ButtonGroup
            options={item.options}
            value={scores[item.key]}
            onChange={(v) => setScores((s) => ({ ...s, [item.key]: v }))}
          />
        </div>
      ))}
      <ResultBox
        score={total}
        max={100}
        interpretation={total <= 40 ? 'Dipendenza severa — necessita riabilitazione' : total <= 60 ? 'Dipendenza moderata' : total < 100 ? 'Dipendenza lieve' : 'Indipendente'}
      />
    </div>
  );
}

// --- TINETTI ---
const TINETTI_BALANCE = [
  { key: 'sitting', label: 'Equilibrio da seduto', max: 1 },
  { key: 'rising', label: 'Alzarsi dalla sedia', max: 2 },
  { key: 'attempts', label: 'Tentativo di alzarsi', max: 2 },
  { key: 'standing', label: 'Equilibrio in stazione eretta (5 sec)', max: 2 },
  { key: 'standing_prolonged', label: 'Equilibrio in stazione eretta prolungata', max: 2 },
  { key: 'eyes_closed', label: 'Equilibrio a occhi chiusi', max: 1 },
  { key: 'turn_360', label: "Girarsi di 360°", max: 2 },
  { key: 'sitting_down', label: 'Sedersi', max: 2 },
];

const TINETTI_GAIT = [
  { key: 'initiation', label: 'Inizio della deambulazione', max: 1 },
  { key: 'step_length', label: 'Lunghezza e altezza del passo', max: 1 },
  { key: 'symmetry', label: 'Simmetria del passo', max: 1 },
  { key: 'continuity', label: 'Continuità del passo', max: 1 },
  { key: 'trajectory', label: 'Traiettoria', max: 2 },
  { key: 'trunk', label: 'Tronco', max: 2 },
];

function TinettiScale() {
  const [scores, setScores] = useState<Record<string, number>>({});
  const balanceTotal = TINETTI_BALANCE.reduce((s, i) => s + (scores[i.key] ?? 0), 0);
  const gaitTotal = TINETTI_GAIT.reduce((s, i) => s + (scores[i.key] ?? 0), 0);
  const total = balanceTotal + gaitTotal;

  const renderItems = (items: typeof TINETTI_BALANCE) =>
    items.map((item) => (
      <div key={item.key} className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4">
        <p className="text-sm font-semibold mb-2">{item.label}</p>
        <ButtonGroup
          options={Array.from({ length: item.max + 1 }, (_, v) => ({ v, l: String(v) }))}
          value={scores[item.key]}
          onChange={(v) => setScores((s) => ({ ...s, [item.key]: v }))}
        />
      </div>
    ));

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-ink/50 dark:text-white/50 mb-3">Equilibrio (max 16)</h3>
        <div className="space-y-3">{renderItems(TINETTI_BALANCE)}</div>
      </div>
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-ink/50 dark:text-white/50 mb-3">Andatura (max 12)</h3>
        <div className="space-y-3">{renderItems(TINETTI_GAIT)}</div>
      </div>
      <ResultBox
        score={total}
        max={28}
        interpretation={total >= 19 ? 'Basso rischio di caduta' : total >= 15 ? 'Rischio moderato' : 'Elevato rischio di caduta'}
      />
    </div>
  );
}

// --- CONLEY ---
const CONLEY_ITEMS = [
  { key: 'c1', label: 'Precedenti cadute (ultimi 3 mesi)', max: 2 },
  { key: 'c2', label: 'Vertigini o capogiri (ultimi 3 mesi)', max: 1 },
  { key: 'c3', label: "Incapace di trattenere urine/feci mentre si reca in bagno (ultimi 3 mesi)", max: 1 },
  { key: 'c4', label: "Deterioramento cognitivo (marcia strascicata, base d'appoggio ampia, instabile)", max: 1 },
  { key: 'c5', label: 'Agitato (attività motoria eccessiva, non finalizzata)', max: 2 },
  { key: 'c6', label: 'Deterioramento della capacità di giudizio / mancanza del senso del pericolo', max: 3 },
];

function ConleyScale() {
  const [scores, setScores] = useState<Record<string, number>>({});
  const total = CONLEY_ITEMS.reduce((s, i) => s + (scores[i.key] ?? 0), 0);

  return (
    <div className="space-y-4">
      {CONLEY_ITEMS.map((item) => (
        <div key={item.key} className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4">
          <p className="text-sm font-semibold mb-2">{item.label}</p>
          <ButtonGroup
            options={[{ v: 0, l: 'No' }, { v: item.max, l: `Sì (${item.max})` }]}
            value={scores[item.key]}
            onChange={(v) => setScores((s) => ({ ...s, [item.key]: v }))}
          />
        </div>
      ))}
      <ResultBox
        score={total}
        interpretation={total >= 2 ? 'Rischio di caduta significativo' : 'Rischio basso'}
      />
    </div>
  );
}

// --- BERG BALANCE SCALE ---
const BERG_ITEMS = [
  'Posizione seduta a stazione eretta',
  'Stazione eretta senza appoggio',
  'Posizione seduta senza schienale',
  'Da stazione eretta a seduta',
  'Trasferimenti',
  'Stazione eretta a occhi chiusi',
  'Stazione eretta a piedi uniti',
  'Raggiungere in avanti con braccio teso',
  'Raccogliere un oggetto da terra',
  'Girarsi a guardare indietro',
  'Girarsi di 360°',
  'Posizionare alternativamente il piede su un gradino',
  "Stazione eretta con un piede davanti all'altro",
  'Stazione eretta su un piede solo',
];

function BergBalanceScale() {
  const [scores, setScores] = useState<Record<number, number>>({});
  const total = BERG_ITEMS.reduce((s, _, i) => s + (scores[i] ?? 0), 0);

  return (
    <div className="space-y-4">
      {BERG_ITEMS.map((label, i) => (
        <div key={i} className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4">
          <p className="text-sm font-semibold mb-2">{i + 1}. {label}</p>
          <ButtonGroup
            options={[0, 1, 2, 3, 4].map((v) => ({ v, l: String(v) }))}
            value={scores[i]}
            onChange={(v) => setScores((s) => ({ ...s, [i]: v }))}
          />
        </div>
      ))}
      <ResultBox
        score={total}
        max={56}
        interpretation={total >= 41 ? 'Basso rischio di caduta' : total >= 21 ? 'Rischio moderato' : 'Elevato rischio di caduta'}
      />
    </div>
  );
}

// --- MORSE FALL SCALE ---
function MorseFallScale() {
  const [scores, setScores] = useState<Record<string, number>>({});
  const total = Object.values(scores).reduce((s, v) => s + v, 0);

  const items: { key: string; label: string; options: { v: number; l: string }[] }[] = [
    { key: 'history', label: 'Storia di cadute (attuale o negli ultimi 3 mesi)', options: [{ v: 0, l: 'No' }, { v: 25, l: 'Sì (25)' }] },
    { key: 'secondary', label: 'Diagnosi secondaria', options: [{ v: 0, l: 'No' }, { v: 15, l: 'Sì (15)' }] },
    { key: 'aid', label: 'Ausilio per la deambulazione', options: [{ v: 0, l: 'Nessuno/riposo a letto/assistenza infermieristica' }, { v: 15, l: 'Bastone/stampelle/deambulatore' }, { v: 30, l: 'Si appoggia ai mobili' }] },
    { key: 'iv', label: 'Terapia endovenosa / accesso venoso', options: [{ v: 0, l: 'No' }, { v: 20, l: 'Sì (20)' }] },
    { key: 'gait', label: 'Andatura', options: [{ v: 0, l: 'Normale/riposo a letto/immobile' }, { v: 10, l: 'Debole' }, { v: 20, l: 'Compromessa' }] },
    { key: 'mental', label: 'Stato mentale', options: [{ v: 0, l: 'Orientato sulle proprie capacità' }, { v: 15, l: 'Sovrastima le proprie capacità' }] },
  ];

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.key} className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4">
          <p className="text-sm font-semibold mb-2">{item.label}</p>
          <ButtonGroup
            options={item.options}
            value={scores[item.key]}
            onChange={(v) => setScores((s) => ({ ...s, [item.key]: v }))}
          />
        </div>
      ))}
      <ResultBox
        score={total}
        max={125}
        interpretation={total >= 45 ? 'Rischio alto' : total >= 25 ? 'Rischio moderato' : 'Rischio basso'}
      />
    </div>
  );
}

// --- MODIFIED ASHWORTH SCALE ---
function AshworthScale() {
  const [value, setValue] = useState<number | null>(null);

  const levels = [
    { v: 0, l: '0', desc: 'Nessun aumento del tono muscolare' },
    { v: 1, l: '1', desc: 'Lieve aumento del tono, con arresto minimo o a fine ROM' },
    { v: 1.5, l: '1+', desc: "Lieve aumento del tono, con arresto in meno della metà del ROM" },
    { v: 2, l: '2', desc: 'Aumento più marcato del tono per la maggior parte del ROM, arto ancora mobilizzabile facilmente' },
    { v: 3, l: '3', desc: 'Considerevole aumento del tono, movimento passivo difficoltoso' },
    { v: 4, l: '4', desc: 'Parte rigida in flessione o estensione' },
  ];

  const selected = levels.find((l) => l.v === value);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4">
        <p className="text-sm font-semibold mb-3">Grado di spasticità osservato</p>
        <div className="space-y-2">
          {levels.map((l) => (
            <button
              key={l.v}
              onClick={() => setValue(l.v)}
              className={`w-full text-left rounded-xl p-3 transition-all ${
                value === l.v
                  ? 'bg-gradient-to-r from-[#4F7CFF]/15 to-[#32D6A0]/15 border border-[#4F7CFF]/40'
                  : 'bg-black/[0.02] dark:bg-white/[0.02] border border-transparent'
              }`}
            >
              <span className="text-sm font-bold mr-2">{l.l}</span>
              <span className="text-sm text-ink/60 dark:text-white/60">{l.desc}</span>
            </button>
          ))}
        </div>
      </div>
      {selected && (
        <ResultBox score={selected.v} interpretation={`Grado ${selected.l} — ${selected.desc}`} />
      )}
    </div>
  );
}

// --- NRS PAIN SCALE ---
function NRSPainScale() {
  const [value, setValue] = useState<number | null>(null);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4">
        <p className="text-sm font-semibold mb-3">Intensità del dolore percepito (0 = nessun dolore, 10 = peggior dolore immaginabile)</p>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 11 }, (_, v) => (
            <button
              key={v}
              onClick={() => setValue(v)}
              className={`w-10 h-10 rounded-full text-sm font-bold transition-all ${
                value === v
                  ? 'bg-gradient-to-r from-[#4F7CFF] to-[#32D6A0] text-white'
                  : 'bg-black/5 dark:bg-white/10 text-ink/60 dark:text-white/60'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>
      {value !== null && (
        <ResultBox
          score={value}
          max={10}
          interpretation={value === 0 ? 'Nessun dolore' : value <= 3 ? 'Dolore lieve' : value <= 6 ? 'Dolore moderato' : 'Dolore severo'}
        />
      )}
    </div>
  );
}

// --- SPPB ---
function SPPBScale() {
  const [balance, setBalance] = useState<number | null>(null);
  const [gait, setGait] = useState<number | null>(null);
  const [chair, setChair] = useState<number | null>(null);
  const total = (balance ?? 0) + (gait ?? 0) + (chair ?? 0);
  const answered = balance !== null && gait !== null && chair !== null;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4">
        <p className="text-sm font-semibold mb-2">Test di equilibrio (piedi uniti, semi-tandem, tandem)</p>
        <ButtonGroup
          options={[
            { v: 0, l: 'Incapace di mantenere piedi uniti 10s' },
            { v: 1, l: 'Semi-tandem <10s' },
            { v: 2, l: 'Tandem <3s' },
            { v: 3, l: 'Tandem 3-9,9s' },
            { v: 4, l: 'Tandem ≥10s' },
          ]}
          value={balance ?? undefined}
          onChange={setBalance}
        />
      </div>
      <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4">
        <p className="text-sm font-semibold mb-2">Velocità del cammino su 4 metri</p>
        <ButtonGroup
          options={[
            { v: 0, l: 'Incapace' },
            { v: 1, l: '>8,70s' },
            { v: 2, l: '6,21-8,70s' },
            { v: 3, l: '4,82-6,20s' },
            { v: 4, l: '<4,82s' },
          ]}
          value={gait ?? undefined}
          onChange={setGait}
        />
      </div>
      <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4">
        <p className="text-sm font-semibold mb-2">Alzata dalla sedia x5 ripetizioni</p>
        <ButtonGroup
          options={[
            { v: 0, l: 'Incapace o >60s' },
            { v: 1, l: '16,7-59,9s' },
            { v: 2, l: '13,7-16,69s' },
            { v: 3, l: '11,2-13,69s' },
            { v: 4, l: '<11,2s' },
          ]}
          value={chair ?? undefined}
          onChange={setChair}
        />
      </div>
      {answered && (
        <ResultBox
          score={total}
          max={12}
          interpretation={total >= 10 ? 'Performance fisica buona' : total >= 7 ? 'Performance fisica limitata' : 'Performance fisica scarsa — alto rischio di disabilità'}
        />
      )}
    </div>
  );
}

// --- MMSE ---
function MMSEScale() {
  const [value, setValue] = useState<number | null>(null);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4">
        <p className="text-sm font-semibold mb-3">Punteggio totale ottenuto</p>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 31 }, (_, v) => (
            <button
              key={v}
              onClick={() => setValue(v)}
              className={`w-9 h-9 rounded-full text-xs font-semibold transition-all ${
                value === v
                  ? 'bg-gradient-to-r from-[#4F7CFF] to-[#32D6A0] text-white'
                  : 'bg-black/5 dark:bg-white/10 text-ink/60 dark:text-white/60'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>
      {value !== null && (
        <ResultBox
          score={value}
          max={30}
          interpretation={value >= 24 ? 'Funzione cognitiva normale' : value >= 18 ? 'Decadimento cognitivo lieve-moderato' : 'Decadimento cognitivo severo'}
        />
      )}
    </div>
  );
}

// --- GLASGOW COMA SCALE ---
function GCSScale() {
  const [eye, setEye] = useState<number | null>(null);
  const [verbal, setVerbal] = useState<number | null>(null);
  const [motor, setMotor] = useState<number | null>(null);
  const total = (eye ?? 0) + (verbal ?? 0) + (motor ?? 0);
  const answered = eye !== null && verbal !== null && motor !== null;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4">
        <p className="text-sm font-semibold mb-2">Apertura degli occhi (E)</p>
        <ButtonGroup
          options={[
            { v: 1, l: 'Assente' },
            { v: 2, l: 'Al dolore' },
            { v: 3, l: 'Alla voce' },
            { v: 4, l: 'Spontanea' },
          ]}
          value={eye ?? undefined}
          onChange={setEye}
        />
      </div>
      <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4">
        <p className="text-sm font-semibold mb-2">Risposta verbale (V)</p>
        <ButtonGroup
          options={[
            { v: 1, l: 'Assente' },
            { v: 2, l: 'Suoni incomprensibili' },
            { v: 3, l: 'Parole inappropriate' },
            { v: 4, l: 'Confusa' },
            { v: 5, l: 'Orientata' },
          ]}
          value={verbal ?? undefined}
          onChange={setVerbal}
        />
      </div>
      <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4">
        <p className="text-sm font-semibold mb-2">Risposta motoria (M)</p>
        <ButtonGroup
          options={[
            { v: 1, l: 'Assente' },
            { v: 2, l: 'Estensione al dolore' },
            { v: 3, l: 'Flessione al dolore' },
            { v: 4, l: 'Retrazione al dolore' },
            { v: 5, l: 'Localizza il dolore' },
            { v: 6, l: 'Obbedisce ai comandi' },
          ]}
          value={motor ?? undefined}
          onChange={setMotor}
        />
      </div>
      {answered && (
        <ResultBox
          score={total}
          max={15}
          interpretation={total >= 13 ? 'Trauma lieve' : total >= 9 ? 'Trauma moderato' : 'Trauma grave'}
        />
      )}
    </div>
  );
}

// --- TIMED UP AND GO ---
function TUGScale() {
  const [seconds, setSeconds] = useState<number | null>(null);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4">
        <p className="text-sm font-semibold mb-3">Tempo cronometrato</p>
        <div className="flex items-center gap-3">
          <input
            type="number"
            step="0.1"
            value={seconds ?? ''}
            onChange={(e) => setSeconds(e.target.value ? parseFloat(e.target.value) : null)}
            placeholder="0.0"
            className="w-28 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-black/20 px-3 py-2 text-sm outline-none focus:border-[#4F7CFF]"
          />
          <span className="text-sm text-ink/50 dark:text-white/50">secondi</span>
        </div>
      </div>
      {seconds !== null && (
        <ResultBox
          score={seconds}
          interpretation={seconds <= 10 ? 'Mobilità normale' : seconds <= 20 ? 'Mobilità nella norma per anziano fragile' : 'Rischio di caduta aumentato — approfondire'}
        />
      )}
    </div>
  );
}

// --- 6-MINUTE WALK TEST ---
function SixMWTScale() {
  const [meters, setMeters] = useState<number | null>(null);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4">
        <p className="text-sm font-semibold mb-3">Distanza percorsa</p>
        <div className="flex items-center gap-3">
          <input
            type="number"
            value={meters ?? ''}
            onChange={(e) => setMeters(e.target.value ? parseFloat(e.target.value) : null)}
            placeholder="0"
            className="w-28 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-black/20 px-3 py-2 text-sm outline-none focus:border-[#4F7CFF]"
          />
          <span className="text-sm text-ink/50 dark:text-white/50">metri</span>
        </div>
      </div>
      {meters !== null && (
        <ResultBox
          score={meters}
          interpretation="Confronta con i valori normativi attesi per età, sesso, altezza e peso del paziente (equazioni di riferimento come Enright & Sherrill)"
        />
      )}
    </div>
  );
}
type BodyRegion = 'knee' | 'shoulder' | 'hip' | 'spine' | 'ankle' | 'elbow-wrist' | 'cervical';

interface OrthoTest {
  name: string;
  targets: string;
  procedure: string;
  positive: string;
  accuracy: string;
}

const REGIONS: { key: BodyRegion; label: string }[] = [
  { key: 'knee', label: 'Knee' },
  { key: 'shoulder', label: 'Shoulder' },
  { key: 'hip', label: 'Hip' },
  { key: 'spine', label: 'Lumbar Spine' },
  { key: 'ankle', label: 'Ankle/Foot' },
  { key: 'elbow-wrist', label: 'Elbow/Wrist' },
  { key: 'cervical', label: 'Cervical Spine' },
];

const KNEE_TESTS: OrthoTest[] = [
  {
    name: 'Lachman Test',
    targets: 'Legamento crociato anteriore (LCA)',
    procedure: "Paziente supino, ginocchio flesso a 20-30°. L'esaminatore stabilizza il femore con una mano e con l'altra applica una forza anteriore sulla tibia prossimale, valutando l'entità della traslazione anteriore e la qualità dell'arresto finale (end-feel).",
    positive: "Aumentata traslazione anteriore della tibia rispetto al lato controlaterale, con end-feel molle o assente (non netto e deciso).",
    accuracy: 'Sensibilità 80-87%, specificità 90-97% — considerato il test clinico singolo più accurato per la diagnosi di lesione del LCA, superiore al cassetto anteriore.',
  },
  {
    name: 'Cassetto Anteriore (Anterior Drawer Test)',
    targets: 'Legamento crociato anteriore (LCA)',
    procedure: "Paziente supino, anca flessa a 45°, ginocchio flesso a 90°, piede stabilizzato sul lettino. L'esaminatore afferra la tibia prossimale con entrambe le mani e applica una trazione anteriore.",
    positive: "Aumentata traslazione anteriore della tibia rispetto al lato controlaterale.",
    accuracy: "Sensibilità 40-90% (ampia variabilità in letteratura, meno affidabile del Lachman), specificità generalmente >90%. La flessione a 90° può essere limitata dalla guardia muscolare del paziente o dal dolore in fase acuta, riducendone l'accuratezza rispetto al Lachman.",
  },
  {
    name: 'Cassetto Posteriore (Posterior Drawer Test)',
    targets: 'Legamento crociato posteriore (LCP)',
    procedure: "Stessa posizione del cassetto anteriore, ma la forza applicata dall'esaminatore è diretta posteriormente sulla tibia prossimale.",
    positive: "Aumentata traslazione posteriore della tibia rispetto al lato controlaterale.",
    accuracy: 'Considerato il test più accurato per il LCP, con specificità generalmente elevata (>90%); sensibilità variabile in letteratura.',
  },
  {
    name: 'McMurray Test',
    targets: 'Menischi (mediale e laterale)',
    procedure: "Paziente supino, ginocchio flesso al massimo. L'esaminatore applica una rotazione tibiale (esterna per il menisco mediale, interna per il laterale) mentre estende gradualmente il ginocchio, palpando la rima articolare.",
    positive: "Click, schiocco o dolore palpabile/udibile durante la manovra, riproducibile a livello della rima articolare.",
    accuracy: 'Sensibilità moderata-bassa (35-60% a seconda degli studi), specificità elevata (85-95%) — utile per confermare quando positivo, meno affidabile per escludere una lesione quando negativo.',
  },
  {
    name: 'Test di Thessaly',
    targets: 'Menischi (mediale e laterale)',
    procedure: "Paziente in appoggio monopodalico sull'arto da esaminare con ginocchio flesso a 20°, mano dell'esaminatore di supporto. Il paziente ruota il tronco e il ginocchio internamente ed esternamente mantenendo la flessione.",
    positive: "Dolore alla rima articolare mediale o laterale, spesso associato a sensazione di blocco articolare.",
    accuracy: "Sensibilità e specificità elevate in diversi studi (intorno all'85-90% per entrambe), superiore al McMurray in alcune comparazioni dirette, ma richiede la capacità del paziente di reggere il carico monopodalico.",
  },
  {
    name: 'Valgus Stress Test',
    targets: 'Legamento collaterale mediale (LCM)',
    procedure: "Paziente supino, ginocchio in leggera flessione (20-30°). L'esaminatore applica una forza in valgo (verso l'interno) alla gamba, stabilizzando la coscia.",
    positive: "Dolore e/o apertura eccessiva della rima articolare mediale rispetto al lato controlaterale.",
    accuracy: 'Test clinico consolidato per il LCM; il grado di apertura articolare orienta la severità della lesione (I-III).',
  },
  {
    name: 'Varus Stress Test',
    targets: 'Legamento collaterale laterale (LCL)',
    procedure: "Stessa posizione del valgus test, ma la forza applicata è diretta in varo (verso l'esterno).",
    positive: "Dolore e/o apertura eccessiva della rima articolare laterale rispetto al lato controlaterale.",
    accuracy: 'Test clinico consolidato per il LCL, meno frequentemente lesionato isolatamente rispetto al LCM.',
  },
  {
    name: "Patellar Apprehension Test",
    targets: 'Instabilità/lussazione femoro-rotulea',
    procedure: "Paziente supino, ginocchio in leggera flessione. L'esaminatore applica una pressione laterale sul margine mediale della rotula, spingendola lateralmente.",
    positive: "Il paziente contrae il quadricipite in risposta o mostra evidente apprensione/resistenza al movimento, per timore di sublussazione.",
    accuracy: 'Test clinico classico per instabilità rotulea, alta specificità quando la risposta di apprensione è chiara e riproducibile.',
  },
];

type Category = 'functional' | 'orthopedic';

export default function ClinicalToolsPage() {
  const [category, setCategory] = useState<Category>('functional');
  const [activeScale, setActiveScale] = useState<ScaleKey>('katz');
  const [activeRegion, setActiveRegion] = useState<BodyRegion>('knee');

  return (
    <div className="relative min-h-screen bg-white dark:bg-[#08090b] text-ink dark:text-white overflow-hidden transition-colors">
      <Navbar />

      <div
        className="pointer-events-none absolute -top-60 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full opacity-20 dark:opacity-25 blur-[140px]"
        style={{
          background: 'radial-gradient(circle, rgba(79,124,255,0.6) 0%, rgba(50,214,160,0.5) 100%)',
        }}
      />

      <div className="relative max-w-3xl mx-auto px-6 pt-40 pb-24">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-black/[0.08] dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] backdrop-blur-xl text-xs font-semibold tracking-[0.15em] uppercase mb-4">
            <ClipboardList size={14} />
            Clinical Tools
          </div>
          <h1 className="font-display text-6xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-[#4F7CFF] to-[#32D6A0] bg-clip-text text-transparent">
              Clinical
            </span>{' '}
            Toolkit
          </h1>
        </div>

        <div className="flex justify-center mb-10">
          <div className="inline-flex rounded-full border border-black/[0.08] dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] backdrop-blur-xl p-1">
            {(['functional', 'orthopedic'] as Category[]).map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${
                  category === c
                    ? 'bg-gradient-to-r from-[#4F7CFF] to-[#32D6A0] text-white'
                    : 'text-ink/60 dark:text-white/60 hover:text-ink dark:hover:text-white'
                }`}
              >
                {c === 'functional' ? 'Functional Scales' : 'Orthopedic Tests'}
              </button>
            ))}
          </div>
        </div>

        {category === 'functional' && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-10">
              {SCALES.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setActiveScale(s.key)}
                  className={`text-left rounded-2xl border p-4 transition-all ${
                    activeScale === s.key
                      ? 'border-[#4F7CFF] bg-[#4F7CFF]/5'
                      : 'border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03]'
                  }`}
                >
                  <p className="text-sm font-semibold">{s.name}</p>
                  <p className="text-xs text-ink/50 dark:text-white/50 mt-0.5">{s.subtitle}</p>
                </button>
              ))}
            </div>

            <ScaleDescription text={SCALE_DESCRIPTIONS[activeScale]} />

            {activeScale === 'katz' && <KatzScale />}
            {activeScale === 'barthel' && <BarthelScale />}
            {activeScale === 'tinetti' && <TinettiScale />}
            {activeScale === 'conley' && <ConleyScale />}
            {activeScale === 'berg' && <BergBalanceScale />}
            {activeScale === 'morse' && <MorseFallScale />}
            {activeScale === 'ashworth' && <AshworthScale />}
            {activeScale === 'nrs' && <NRSPainScale />}
            {activeScale === 'sppb' && <SPPBScale />}
            {activeScale === 'mmse' && <MMSEScale />}
            {activeScale === 'gcs' && <GCSScale />}
            {activeScale === 'tug' && <TUGScale />}
            {activeScale === 'sixmwt' && <SixMWTScale />}
          </>
        )}

                {category === 'orthopedic' && (
          <>
            <div className="flex flex-wrap justify-center gap-2 mb-10">
              {REGIONS.map((r) => (
                <button
                  key={r.key}
                  onClick={() => setActiveRegion(r.key)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                    activeRegion === r.key
                      ? 'bg-gradient-to-r from-[#4F7CFF] to-[#32D6A0] text-white'
                      : 'bg-black/5 dark:bg-white/10 text-ink/60 dark:text-white/60'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            {activeRegion === 'knee' && (
              <div className="space-y-4">
                {KNEE_TESTS.map((t) => (
                  <div
                    key={t.name}
                    className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-5"
                  >
                    <p className="text-base font-semibold text-ink dark:text-white">{t.name}</p>
                    <p className="text-xs font-medium text-[#4F7CFF] mt-0.5 mb-3">{t.targets}</p>
                    <div className="space-y-2 text-sm text-ink/70 dark:text-white/70 leading-relaxed">
                      <p><span className="font-semibold text-ink/50 dark:text-white/50">Procedura: </span>{t.procedure}</p>
                      <p><span className="font-semibold text-ink/50 dark:text-white/50">Positivo se: </span>{t.positive}</p>
                      <p className="text-xs text-ink/50 dark:text-white/50 pt-1">{t.accuracy}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeRegion !== 'knee' && (
              <div className="text-center py-16">
                <p className="text-ink/40 dark:text-white/40 text-sm">
                  {REGIONS.find((r) => r.key === activeRegion)?.label} tests coming soon.
                </p>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}
