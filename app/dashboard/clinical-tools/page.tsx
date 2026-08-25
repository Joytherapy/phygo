'use client';

import { useState, useEffect } from 'react';
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
      <ResultBox score={total} max={6} interpretation={total === 6 ? 'Completa autonomia' : total >= 4 ? 'Compromissione moderata' : 'Compromissione severa'} />
    </div>
  );
}

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
          <ButtonGroup options={item.options} value={scores[item.key]} onChange={(v) => setScores((s) => ({ ...s, [item.key]: v }))} />
        </div>
      ))}
      <ResultBox score={total} max={100} interpretation={total <= 40 ? 'Dipendenza severa — necessita riabilitazione' : total <= 60 ? 'Dipendenza moderata' : total < 100 ? 'Dipendenza lieve' : 'Indipendente'} />
    </div>
  );
}

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
        <ButtonGroup options={Array.from({ length: item.max + 1 }, (_, v) => ({ v, l: String(v) }))} value={scores[item.key]} onChange={(v) => setScores((s) => ({ ...s, [item.key]: v }))} />
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
      <ResultBox score={total} max={28} interpretation={total >= 19 ? 'Basso rischio di caduta' : total >= 15 ? 'Rischio moderato' : 'Elevato rischio di caduta'} />
    </div>
  );
}

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
          <ButtonGroup options={[{ v: 0, l: 'No' }, { v: item.max, l: `Sì (${item.max})` }]} value={scores[item.key]} onChange={(v) => setScores((s) => ({ ...s, [item.key]: v }))} />
        </div>
      ))}
      <ResultBox score={total} interpretation={total >= 2 ? 'Rischio di caduta significativo' : 'Rischio basso'} />
    </div>
  );
}

const BERG_ITEMS = [
  'Posizione seduta a stazione eretta', 'Stazione eretta senza appoggio', 'Posizione seduta senza schienale',
  'Da stazione eretta a seduta', 'Trasferimenti', 'Stazione eretta a occhi chiusi', 'Stazione eretta a piedi uniti',
  'Raggiungere in avanti con braccio teso', 'Raccogliere un oggetto da terra', 'Girarsi a guardare indietro',
  'Girarsi di 360°', 'Posizionare alternativamente il piede su un gradino', "Stazione eretta con un piede davanti all'altro",
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
          <ButtonGroup options={[0, 1, 2, 3, 4].map((v) => ({ v, l: String(v) }))} value={scores[i]} onChange={(v) => setScores((s) => ({ ...s, [i]: v }))} />
        </div>
      ))}
      <ResultBox score={total} max={56} interpretation={total >= 41 ? 'Basso rischio di caduta' : total >= 21 ? 'Rischio moderato' : 'Elevato rischio di caduta'} />
    </div>
  );
}

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
          <ButtonGroup options={item.options} value={scores[item.key]} onChange={(v) => setScores((s) => ({ ...s, [item.key]: v }))} />
        </div>
      ))}
      <ResultBox score={total} max={125} interpretation={total >= 45 ? 'Rischio alto' : total >= 25 ? 'Rischio moderato' : 'Rischio basso'} />
    </div>
  );
}

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
            <button key={l.v} onClick={() => setValue(l.v)} className={`w-full text-left rounded-xl p-3 transition-all ${value === l.v ? 'bg-gradient-to-r from-[#4F7CFF]/15 to-[#32D6A0]/15 border border-[#4F7CFF]/40' : 'bg-black/[0.02] dark:bg-white/[0.02] border border-transparent'}`}>
              <span className="text-sm font-bold mr-2">{l.l}</span>
              <span className="text-sm text-ink/60 dark:text-white/60">{l.desc}</span>
            </button>
          ))}
        </div>
      </div>
      {selected && <ResultBox score={selected.v} interpretation={`Grado ${selected.l} — ${selected.desc}`} />}
    </div>
  );
}

function NRSPainScale() {
  const [value, setValue] = useState<number | null>(null);
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4">
        <p className="text-sm font-semibold mb-3">Intensità del dolore percepito (0 = nessun dolore, 10 = peggior dolore immaginabile)</p>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 11 }, (_, v) => (
            <button key={v} onClick={() => setValue(v)} className={`w-10 h-10 rounded-full text-sm font-bold transition-all ${value === v ? 'bg-gradient-to-r from-[#4F7CFF] to-[#32D6A0] text-white' : 'bg-black/5 dark:bg-white/10 text-ink/60 dark:text-white/60'}`}>
              {v}
            </button>
          ))}
        </div>
      </div>
      {value !== null && <ResultBox score={value} max={10} interpretation={value === 0 ? 'Nessun dolore' : value <= 3 ? 'Dolore lieve' : value <= 6 ? 'Dolore moderato' : 'Dolore severo'} />}
    </div>
  );
}

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
        <ButtonGroup options={[{ v: 0, l: 'Incapace di mantenere piedi uniti 10s' }, { v: 1, l: 'Semi-tandem <10s' }, { v: 2, l: 'Tandem <3s' }, { v: 3, l: 'Tandem 3-9,9s' }, { v: 4, l: 'Tandem ≥10s' }]} value={balance ?? undefined} onChange={setBalance} />
      </div>
      <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4">
        <p className="text-sm font-semibold mb-2">Velocità del cammino su 4 metri</p>
        <ButtonGroup options={[{ v: 0, l: 'Incapace' }, { v: 1, l: '>8,70s' }, { v: 2, l: '6,21-8,70s' }, { v: 3, l: '4,82-6,20s' }, { v: 4, l: '<4,82s' }]} value={gait ?? undefined} onChange={setGait} />
      </div>
      <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4">
        <p className="text-sm font-semibold mb-2">Alzata dalla sedia x5 ripetizioni</p>
        <ButtonGroup options={[{ v: 0, l: 'Incapace o >60s' }, { v: 1, l: '16,7-59,9s' }, { v: 2, l: '13,7-16,69s' }, { v: 3, l: '11,2-13,69s' }, { v: 4, l: '<11,2s' }]} value={chair ?? undefined} onChange={setChair} />
      </div>
      {answered && <ResultBox score={total} max={12} interpretation={total >= 10 ? 'Performance fisica buona' : total >= 7 ? 'Performance fisica limitata' : 'Performance fisica scarsa — alto rischio di disabilità'} />}
    </div>
  );
}

function MMSEScale() {
  const [value, setValue] = useState<number | null>(null);
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4">
        <p className="text-sm font-semibold mb-3">Punteggio totale ottenuto</p>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 31 }, (_, v) => (
            <button key={v} onClick={() => setValue(v)} className={`w-9 h-9 rounded-full text-xs font-semibold transition-all ${value === v ? 'bg-gradient-to-r from-[#4F7CFF] to-[#32D6A0] text-white' : 'bg-black/5 dark:bg-white/10 text-ink/60 dark:text-white/60'}`}>
              {v}
            </button>
          ))}
        </div>
      </div>
      {value !== null && <ResultBox score={value} max={30} interpretation={value >= 24 ? 'Funzione cognitiva normale' : value >= 18 ? 'Decadimento cognitivo lieve-moderato' : 'Decadimento cognitivo severo'} />}
    </div>
  );
}

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
        <ButtonGroup options={[{ v: 1, l: 'Assente' }, { v: 2, l: 'Al dolore' }, { v: 3, l: 'Alla voce' }, { v: 4, l: 'Spontanea' }]} value={eye ?? undefined} onChange={setEye} />
      </div>
      <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4">
        <p className="text-sm font-semibold mb-2">Risposta verbale (V)</p>
        <ButtonGroup options={[{ v: 1, l: 'Assente' }, { v: 2, l: 'Suoni incomprensibili' }, { v: 3, l: 'Parole inappropriate' }, { v: 4, l: 'Confusa' }, { v: 5, l: 'Orientata' }]} value={verbal ?? undefined} onChange={setVerbal} />
      </div>
      <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4">
        <p className="text-sm font-semibold mb-2">Risposta motoria (M)</p>
        <ButtonGroup options={[{ v: 1, l: 'Assente' }, { v: 2, l: 'Estensione al dolore' }, { v: 3, l: 'Flessione al dolore' }, { v: 4, l: 'Retrazione al dolore' }, { v: 5, l: 'Localizza il dolore' }, { v: 6, l: 'Obbedisce ai comandi' }]} value={motor ?? undefined} onChange={setMotor} />
      </div>
      {answered && <ResultBox score={total} max={15} interpretation={total >= 13 ? 'Trauma lieve' : total >= 9 ? 'Trauma moderato' : 'Trauma grave'} />}
    </div>
  );
}

function TUGScale() {
  const [seconds, setSeconds] = useState<number | null>(null);
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4">
        <p className="text-sm font-semibold mb-3">Tempo cronometrato</p>
        <div className="flex items-center gap-3">
          <input type="number" step="0.1" value={seconds ?? ''} onChange={(e) => setSeconds(e.target.value ? parseFloat(e.target.value) : null)} placeholder="0.0" className="w-28 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-black/20 px-3 py-2 text-sm outline-none focus:border-[#4F7CFF]" />
          <span className="text-sm text-ink/50 dark:text-white/50">secondi</span>
        </div>
      </div>
      {seconds !== null && <ResultBox score={seconds} interpretation={seconds <= 10 ? 'Mobilità normale' : seconds <= 20 ? 'Mobilità nella norma per anziano fragile' : 'Rischio di caduta aumentato — approfondire'} />}
    </div>
  );
}

function SixMWTScale() {
  const [meters, setMeters] = useState<number | null>(null);
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4">
        <p className="text-sm font-semibold mb-3">Distanza percorsa</p>
        <div className="flex items-center gap-3">
          <input type="number" value={meters ?? ''} onChange={(e) => setMeters(e.target.value ? parseFloat(e.target.value) : null)} placeholder="0" className="w-28 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-black/20 px-3 py-2 text-sm outline-none focus:border-[#4F7CFF]" />
          <span className="text-sm text-ink/50 dark:text-white/50">metri</span>
        </div>
      </div>
      {meters !== null && <ResultBox score={meters} interpretation="Confronta con i valori normativi attesi per età, sesso, altezza e peso del paziente (equazioni di riferimento come Enright & Sherrill)" />}
    </div>
  );
}

type Category = 'functional' | 'orthopedic' | 'pelvic-floor';
type BodyRegion = 'knee' | 'shoulder' | 'hip' | 'spine' | 'ankle' | 'elbow-wrist' | 'cervical';

interface OrthoTest {
  name: string;
  targets: string;
  procedure: string;
  positive: string;
  accuracy: string;
}

interface PelvicFloorTest {
  slug: string;
  name: string;
  category: string;
  procedure: string;
  interpretation: string;
}

const PELVIC_FLOOR_CATEGORY_LABELS: Record<string, string> = {
  neuropathy: 'Test Neuropatici',
  manual_assessment: 'Valutazione Manuale',
  urodynamic: 'Test Urodinamici',
  questionnaire: 'Questionari',
};

// ===================== SF-36 (RAND 36-Item Health Survey 1.0 — dominio pubblico, RAND Corporation) =====================

type SF36Domain = 'PF' | 'RP' | 'RE' | 'VT' | 'MH' | 'SF' | 'BP' | 'GH';

const SF36_DOMAIN_LABELS: Record<SF36Domain, string> = {
  PF: 'Attività Fisica',
  RP: 'Limitazioni di Ruolo — Fisico',
  RE: 'Limitazioni di Ruolo — Emotivo',
  VT: 'Vitalità/Energia',
  MH: 'Salute Mentale',
  SF: 'Attività Sociali',
  BP: 'Dolore Fisico',
  GH: 'Salute Generale',
};

const OPT_HEALTH1 = [{ v: 1, l: 'Eccellente' }, { v: 2, l: 'Molto buona' }, { v: 3, l: 'Buona' }, { v: 4, l: 'Discreta' }, { v: 5, l: 'Scadente' }];
const OPT_CHANGE = [{ v: 1, l: 'Decisamente migliore' }, { v: 2, l: 'Leggermente migliore' }, { v: 3, l: 'Più o meno uguale' }, { v: 4, l: 'Leggermente peggiore' }, { v: 5, l: 'Decisamente peggiore' }];
const OPT_LIMIT3 = [{ v: 1, l: "Sì, mi limita molto" }, { v: 2, l: "Sì, mi limita un po'" }, { v: 3, l: 'No, non mi limita affatto' }];
const OPT_YESNO = [{ v: 1, l: 'Sì' }, { v: 2, l: 'No' }];
const OPT_EXTENT5 = [{ v: 1, l: 'Per niente' }, { v: 2, l: 'Un poco' }, { v: 3, l: 'Moderatamente' }, { v: 4, l: 'Molto' }, { v: 5, l: 'Moltissimo' }];
const OPT_PAIN6 = [{ v: 1, l: 'Nessuno' }, { v: 2, l: 'Molto lieve' }, { v: 3, l: 'Lieve' }, { v: 4, l: 'Moderato' }, { v: 5, l: 'Forte' }, { v: 6, l: 'Molto forte' }];
const OPT_FREQ6 = [{ v: 1, l: 'Sempre' }, { v: 2, l: 'Quasi sempre' }, { v: 3, l: 'Molto spesso' }, { v: 4, l: 'Qualche volta' }, { v: 5, l: 'Raramente' }, { v: 6, l: 'Mai' }];
const OPT_FREQ5 = [{ v: 1, l: 'Sempre' }, { v: 2, l: 'Quasi sempre' }, { v: 3, l: 'A volte' }, { v: 4, l: 'Raramente' }, { v: 5, l: 'Mai' }];
const OPT_TRUEFALSE5 = [{ v: 1, l: 'Assolutamente vero' }, { v: 2, l: 'Abbastanza vero' }, { v: 3, l: 'Non so' }, { v: 4, l: 'Abbastanza falso' }, { v: 5, l: 'Assolutamente falso' }];

const RECODE_5_DESC = [100, 75, 50, 25, 0];
const RECODE_5_ASC = [0, 25, 50, 75, 100];
const RECODE_3 = [0, 50, 100];
const RECODE_2 = [0, 100];
const RECODE_6_DESC = [100, 80, 60, 40, 20, 0];
const RECODE_6_ASC = [0, 20, 40, 60, 80, 100];

interface SF36ItemDef {
  id: number;
  domain: SF36Domain | null;
  text: string;
  options: { v: number; l: string }[];
  recode: number[];
}

const SF36_ITEMS: SF36ItemDef[] = [
  { id: 1, domain: 'GH', text: 'In generale, direbbe che la sua salute è:', options: OPT_HEALTH1, recode: RECODE_5_DESC },
  { id: 2, domain: null, text: 'Rispetto a un anno fa, come valuterebbe la sua salute in generale, adesso?', options: OPT_CHANGE, recode: RECODE_5_DESC },
  { id: 3, domain: 'PF', text: 'Attività intense, come correre, sollevare oggetti pesanti, praticare sport faticosi', options: OPT_LIMIT3, recode: RECODE_3 },
  { id: 4, domain: 'PF', text: "Attività di moderato impegno, come spostare un tavolo, usare l'aspirapolvere, andare in bicicletta", options: OPT_LIMIT3, recode: RECODE_3 },
  { id: 5, domain: 'PF', text: 'Sollevare o portare le borse della spesa', options: OPT_LIMIT3, recode: RECODE_3 },
  { id: 6, domain: 'PF', text: 'Salire diverse rampe di scale', options: OPT_LIMIT3, recode: RECODE_3 },
  { id: 7, domain: 'PF', text: 'Salire una sola rampa di scale', options: OPT_LIMIT3, recode: RECODE_3 },
  { id: 8, domain: 'PF', text: 'Piegarsi, inginocchiarsi o chinarsi', options: OPT_LIMIT3, recode: RECODE_3 },
  { id: 9, domain: 'PF', text: 'Camminare per più di un chilometro', options: OPT_LIMIT3, recode: RECODE_3 },
  { id: 10, domain: 'PF', text: 'Camminare per alcune centinaia di metri', options: OPT_LIMIT3, recode: RECODE_3 },
  { id: 11, domain: 'PF', text: 'Camminare per circa cento metri', options: OPT_LIMIT3, recode: RECODE_3 },
  { id: 12, domain: 'PF', text: 'Fare il bagno o vestirsi da soli', options: OPT_LIMIT3, recode: RECODE_3 },
  { id: 13, domain: 'RP', text: 'Ha dovuto ridurre il tempo dedicato al lavoro o ad altre attività', options: OPT_YESNO, recode: RECODE_2 },
  { id: 14, domain: 'RP', text: 'Ha ottenuto meno di quanto avrebbe voluto', options: OPT_YESNO, recode: RECODE_2 },
  { id: 15, domain: 'RP', text: 'Ha dovuto limitare alcuni tipi di lavoro o di altre attività', options: OPT_YESNO, recode: RECODE_2 },
  { id: 16, domain: 'RP', text: 'Ha avuto difficoltà nello svolgere il lavoro o altre attività (per esempio, le è costato uno sforzo maggiore)', options: OPT_YESNO, recode: RECODE_2 },
  { id: 17, domain: 'RE', text: 'Ha dovuto ridurre il tempo dedicato al lavoro o ad altre attività', options: OPT_YESNO, recode: RECODE_2 },
  { id: 18, domain: 'RE', text: 'Ha ottenuto meno di quanto avrebbe voluto', options: OPT_YESNO, recode: RECODE_2 },
  { id: 19, domain: 'RE', text: 'Ha svolto il lavoro o le altre attività con meno cura del solito', options: OPT_YESNO, recode: RECODE_2 },
  { id: 20, domain: 'SF', text: 'In che misura la salute fisica o i problemi emotivi hanno interferito con le sue normali attività sociali con famiglia, amici o vicini?', options: OPT_EXTENT5, recode: RECODE_5_DESC },
  { id: 21, domain: 'BP', text: 'Quanto dolore fisico ha provato?', options: OPT_PAIN6, recode: RECODE_6_DESC },
  { id: 22, domain: 'BP', text: 'Quanto il dolore ha interferito con il suo normale lavoro (compreso il lavoro fuori casa e le faccende domestiche)?', options: OPT_EXTENT5, recode: RECODE_5_DESC },
  { id: 23, domain: 'VT', text: 'Si è sentito pieno di energia e vitalità?', options: OPT_FREQ6, recode: RECODE_6_DESC },
  { id: 24, domain: 'MH', text: 'È stato/a una persona molto nervosa?', options: OPT_FREQ6, recode: RECODE_6_ASC },
  { id: 25, domain: 'MH', text: 'Si è sentito così giù di morale che niente riusciva a tirarla su?', options: OPT_FREQ6, recode: RECODE_6_ASC },
  { id: 26, domain: 'MH', text: 'Si è sentito calmo e sereno?', options: OPT_FREQ6, recode: RECODE_6_DESC },
  { id: 27, domain: 'VT', text: 'Ha avuto molta energia?', options: OPT_FREQ6, recode: RECODE_6_DESC },
  { id: 28, domain: 'MH', text: 'Si è sentito scoraggiato e triste?', options: OPT_FREQ6, recode: RECODE_6_ASC },
  { id: 29, domain: 'VT', text: 'Si è sentito sfinito?', options: OPT_FREQ6, recode: RECODE_6_ASC },
  { id: 30, domain: 'MH', text: 'È stato/a una persona felice?', options: OPT_FREQ6, recode: RECODE_6_DESC },
  { id: 31, domain: 'VT', text: 'Si è sentito stanco?', options: OPT_FREQ6, recode: RECODE_6_ASC },
  { id: 32, domain: 'SF', text: 'Per quanto tempo la salute fisica o i problemi emotivi hanno interferito con le sue attività sociali (visitare amici, parenti, ecc.)?', options: OPT_FREQ5, recode: RECODE_5_ASC },
  { id: 33, domain: 'GH', text: "Mi sembra di ammalarmi un po' più facilmente delle altre persone", options: OPT_TRUEFALSE5, recode: RECODE_5_ASC },
  { id: 34, domain: 'GH', text: 'Sono sano/a quanto chiunque altro conosca', options: OPT_TRUEFALSE5, recode: RECODE_5_DESC },
  { id: 35, domain: 'GH', text: 'Mi aspetto che la mia salute peggiori', options: OPT_TRUEFALSE5, recode: RECODE_5_ASC },
  { id: 36, domain: 'GH', text: 'La mia salute è eccellente', options: OPT_TRUEFALSE5, recode: RECODE_5_DESC },
];

const SF36_SECTIONS: { title: string; ids: number[] }[] = [
  { title: 'Salute generale', ids: [1] },
  { title: 'Cambiamento rispetto a un anno fa (informativo, non incluso nei punteggi)', ids: [2] },
  { title: 'La sua salute la limita attualmente in queste attività? Se sì, quanto?', ids: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
  { title: 'Nelle ultime 4 settimane, a causa della sua salute FISICA, ha avuto uno di questi problemi sul lavoro o in altre attività abituali?', ids: [13, 14, 15, 16] },
  { title: 'Nelle ultime 4 settimane, a causa di problemi EMOTIVI (es. sentirsi depresso o ansioso), ha avuto uno di questi problemi sul lavoro o in altre attività abituali?', ids: [17, 18, 19] },
  { title: 'Attività sociali e dolore', ids: [20, 21, 22] },
  { title: 'Nelle ultime 4 settimane, per quanto tempo...', ids: [23, 24, 25, 26, 27, 28, 29, 30, 31] },
  { title: 'Attività sociali (continua)', ids: [32] },
  { title: 'Quanto sono vere o false per lei le seguenti affermazioni?', ids: [33, 34, 35, 36] },
];

function SF36Scale() {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const domainOrder: SF36Domain[] = ['PF', 'RP', 'RE', 'VT', 'MH', 'SF', 'BP', 'GH'];
  const domainScores = domainOrder.map((d) => {
    const items = SF36_ITEMS.filter((it) => it.domain === d);
    const values = items
      .map((it) => (answers[it.id] ? it.recode[answers[it.id] - 1] : null))
      .filter((v): v is number => v !== null);
    const avg = values.length > 0 ? Math.round((values.reduce((s, v) => s + v, 0) / values.length) * 10) / 10 : null;
    return { domain: d, score: avg, answered: values.length, total: items.length };
  });
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="space-y-6">
      {SF36_SECTIONS.map((sec) => (
        <div key={sec.title}>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-ink/50 dark:text-white/50 mb-3">{sec.title}</h4>
          <div className="space-y-3">
            {sec.ids.map((id) => {
              const item = SF36_ITEMS.find((it) => it.id === id)!;
              return (
                <div key={id} className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4">
                  <p className="text-sm font-semibold mb-2">{id}. {item.text}</p>
                  <ButtonGroup options={item.options} value={answers[id]} onChange={(v) => setAnswers((s) => ({ ...s, [id]: v }))} />
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <div className="rounded-2xl bg-gradient-to-r from-[#4F7CFF]/10 to-[#32D6A0]/10 border border-[#4F7CFF]/20 p-5">
        <p className="text-sm font-semibold mb-3">Punteggi per dominio (0-100, più alto = stato di salute percepito migliore) — {answeredCount}/36 domande compilate</p>
        <div className="grid grid-cols-2 gap-3">
          {domainScores.map((d) => (
            <div key={d.domain} className="rounded-xl bg-white/60 dark:bg-white/[0.04] p-3">
              <p className="text-xs text-ink/50 dark:text-white/50">{SF36_DOMAIN_LABELS[d.domain]}</p>
              <p className="text-xl font-bold">{d.score !== null ? d.score : '—'}</p>
              <p className="text-[10px] text-ink/40 dark:text-white/40">{d.answered}/{d.total} risposte</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ===================== PFDI-20 (algoritmo di punteggio validato, domande riformulate) =====================

const OPT_PFDI = [
  { v: 0, l: 'No' },
  { v: 1, l: 'Sì — per niente' },
  { v: 2, l: 'Sì — un poco' },
  { v: 3, l: 'Sì — moderatamente' },
  { v: 4, l: 'Sì — molto' },
];

const PFDI_POPDI: { id: string; text: string }[] = [
  { id: 'p1', text: 'Sensazione di pressione nella zona pelvica' },
  { id: 'p2', text: 'Sensazione di un rigonfiamento o di qualcosa che "scende" dalla vagina' },
  { id: 'p3', text: 'Rigonfiamento o massa vaginale che si può vedere o toccare' },
  { id: 'p4', text: "Necessità di spingere con le dita in vagina o intorno al retto per svuotare completamente l'intestino" },
  { id: 'p5', text: 'Sensazione di svuotamento incompleto della vescica dopo la minzione' },
  { id: 'p6', text: 'Necessità di spingere un rigonfiamento vaginale per riuscire a urinare o completare la minzione' },
];

const PFDI_CRADI: { id: string; text: string }[] = [
  { id: 'c1', text: 'Necessità di sforzarsi eccessivamente per evacuare' },
  { id: 'c2', text: 'Sensazione di evacuazione incompleta al termine della defecazione' },
  { id: 'c3', text: 'Perdita involontaria di feci liquide' },
  { id: 'c4', text: 'Perdita involontaria di feci solide' },
  { id: 'c5', text: 'Perdita involontaria di gas intestinali' },
  { id: 'c6', text: "Dolore durante l'evacuazione" },
  { id: 'c7', text: 'Urgenza intestinale improvvisa e forte, con difficoltà a trattenersi' },
  { id: 'c8', text: 'Protrusione di parte del retto durante o dopo la defecazione, che richiede di essere ridotta manualmente' },
];

const PFDI_UDI: { id: string; text: string }[] = [
  { id: 'u1', text: 'Frequenza urinaria eccessiva' },
  { id: 'u2', text: 'Perdita di urina associata a un forte stimolo improvviso (urgenza)' },
  { id: 'u3', text: 'Perdita di urina associata a tosse, starnuti o risate' },
  { id: 'u4', text: 'Perdita di urina in piccole quantità (gocciolamento)' },
  { id: 'u5', text: 'Difficoltà a svuotare completamente la vescica' },
  { id: 'u6', text: 'Dolore o fastidio nella zona pelvica o genitale' },
];

function PFDI20Scale() {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const subscales = [
    { key: 'POPDI', label: 'Prolasso Genitale (POPDI-6)', items: PFDI_POPDI },
    { key: 'CRADI', label: 'Colon-Retto-Ano (CRADI-8)', items: PFDI_CRADI },
    { key: 'UDI', label: 'Urinario (UDI-6)', items: PFDI_UDI },
  ];
  const subscaleScores = subscales.map((s) => {
    const values = s.items.map((it) => answers[it.id]).filter((v): v is number => v !== undefined);
    const avg = values.length > 0 ? (values.reduce((a, b) => a + b, 0) / values.length) * 25 : null;
    return { ...s, score: avg !== null ? Math.round(avg * 10) / 10 : null, answered: values.length };
  });
  const totalScore = subscaleScores.reduce((sum, s) => sum + (s.score ?? 0), 0);
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="space-y-6">
      {subscales.map((s) => (
        <div key={s.key}>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-ink/50 dark:text-white/50 mb-3">{s.label}</h4>
          <div className="space-y-3">
            {s.items.map((item) => (
              <div key={item.id} className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4">
                <p className="text-sm font-semibold mb-2">{item.text}</p>
                <ButtonGroup options={OPT_PFDI} value={answers[item.id]} onChange={(v) => setAnswers((a) => ({ ...a, [item.id]: v }))} />
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="rounded-2xl bg-gradient-to-r from-[#4F7CFF]/10 to-[#32D6A0]/10 border border-[#4F7CFF]/20 p-5">
        <p className="text-sm font-semibold mb-3">Punteggi per sottoscala (0-100, più alto = maggiore disagio) — {answeredCount}/20 domande compilate</p>
        <div className="grid grid-cols-3 gap-3 mb-3">
          {subscaleScores.map((s) => (
            <div key={s.key} className="rounded-xl bg-white/60 dark:bg-white/[0.04] p-3">
              <p className="text-xs text-ink/50 dark:text-white/50">{s.label}</p>
              <p className="text-xl font-bold">{s.score !== null ? s.score : '—'}</p>
              <p className="text-[10px] text-ink/40 dark:text-white/40">{s.answered}/{s.items.length} risposte</p>
            </div>
          ))}
        </div>
        <ResultBox score={Math.round(totalScore * 10) / 10} max={300} interpretation={totalScore <= 50 ? 'Sintomi minimi' : totalScore <= 150 ? 'Disagio moderato' : 'Disagio severo'} />
      </div>
    </div>
  );
}

// ===================== ICIQ-UI SF (algoritmo di punteggio validato, domande riformulate) =====================

const OPT_ICIQ_FREQ = [
  { v: 0, l: 'Mai' },
  { v: 1, l: 'Circa una volta a settimana o meno' },
  { v: 2, l: 'Due o tre volte a settimana' },
  { v: 3, l: 'Circa una volta al giorno' },
  { v: 4, l: 'Diverse volte al giorno' },
  { v: 5, l: 'Continuamente' },
];

const OPT_ICIQ_AMOUNT = [
  { v: 0, l: 'Nessuna' },
  { v: 2, l: 'Una piccola quantità' },
  { v: 4, l: 'Una quantità moderata' },
  { v: 6, l: 'Una grande quantità' },
];

const ICIQ_CIRCUMSTANCES = [
  'Prima di raggiungere il bagno',
  'Quando tossisce o starnutisce',
  'Durante il sonno',
  'Durante attività fisica o sforzo',
  'Dopo aver finito di urinare e essersi rivestito/a',
  'Senza un motivo evidente',
  'In modo continuo',
];

function ICIQScale() {
  const [freq, setFreq] = useState<number | undefined>(undefined);
  const [amount, setAmount] = useState<number | undefined>(undefined);
  const [impact, setImpact] = useState<number | undefined>(undefined);
  const [circumstances, setCircumstances] = useState<string[]>([]);

  const toggleCircumstance = (c: string) => {
    setCircumstances((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  };

  const total = (freq ?? 0) + (amount ?? 0) + (impact ?? 0);
  const answered = freq !== undefined && amount !== undefined && impact !== undefined;
  const severity = total <= 5 ? 'Lieve' : total <= 12 ? 'Moderato' : total <= 18 ? 'Severo' : 'Molto severo';

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4">
        <p className="text-sm font-semibold mb-2">Con quale frequenza perde urina involontariamente?</p>
        <ButtonGroup options={OPT_ICIQ_FREQ} value={freq} onChange={setFreq} />
      </div>
      <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4">
        <p className="text-sm font-semibold mb-2">Quanta urina perde di solito (con o senza protezione)?</p>
        <ButtonGroup options={OPT_ICIQ_AMOUNT} value={amount} onChange={setAmount} />
      </div>
      <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4">
        <p className="text-sm font-semibold mb-3">In generale, quanto la perdita di urina interferisce con la sua vita quotidiana? (0 = per niente, 10 = moltissimo)</p>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 11 }, (_, v) => (
            <button key={v} onClick={() => setImpact(v)} className={`w-10 h-10 rounded-full text-sm font-bold transition-all ${impact === v ? 'bg-gradient-to-r from-[#4F7CFF] to-[#32D6A0] text-white' : 'bg-black/5 dark:bg-white/10 text-ink/60 dark:text-white/60'}`}>
              {v}
            </button>
          ))}
        </div>
      </div>
      <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4">
        <p className="text-sm font-semibold mb-2">Quando perde urina? (informativo, non incluso nel punteggio — può selezionare più risposte)</p>
        <div className="flex flex-wrap gap-2">
          {ICIQ_CIRCUMSTANCES.map((c) => (
            <button key={c} onClick={() => toggleCircumstance(c)} className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${circumstances.includes(c) ? 'bg-gradient-to-r from-[#4F7CFF] to-[#32D6A0] text-white' : 'bg-black/5 dark:bg-white/10 text-ink/60 dark:text-white/60'}`}>
              {c}
            </button>
          ))}
        </div>
      </div>
      {answered && <ResultBox score={total} max={21} interpretation={`Severità: ${severity}`} />}
    </div>
  );
}

function getQuestionnaireMatch(name: string): 'sf36' | 'pfdi20' | 'iciq' | null {
  const n = name.toUpperCase();
  if (n.includes('SF-36') || n.includes('SF36')) return 'sf36';
  if (n.includes('PFDI')) return 'pfdi20';
  if (n.includes('ICIQ')) return 'iciq';
  return null;
}

const PELVIC_FLOOR_CATEGORY_ORDER = ['questionnaire', 'neuropathy', 'manual_assessment', 'urodynamic'];

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
  { name: 'Lachman Test', targets: 'Legamento crociato anteriore (LCA)', procedure: "Paziente supino, ginocchio flesso a 20-30°. L'esaminatore stabilizza il femore con una mano e con l'altra applica una forza anteriore sulla tibia prossimale, valutando l'entità della traslazione anteriore e la qualità dell'arresto finale (end-feel).", positive: "Aumentata traslazione anteriore della tibia rispetto al lato controlaterale, con end-feel molle o assente (non netto e deciso).", accuracy: 'Sensibilità 80-87%, specificità 90-97% — considerato il test clinico singolo più accurato per la diagnosi di lesione del LCA, superiore al cassetto anteriore.' },
  { name: 'Cassetto Anteriore (Anterior Drawer Test)', targets: 'Legamento crociato anteriore (LCA)', procedure: "Paziente supino, anca flessa a 45°, ginocchio flesso a 90°, piede stabilizzato sul lettino. L'esaminatore afferra la tibia prossimale con entrambe le mani e applica una trazione anteriore.", positive: "Aumentata traslazione anteriore della tibia rispetto al lato controlaterale.", accuracy: "Sensibilità 40-90% (ampia variabilità in letteratura, meno affidabile del Lachman), specificità generalmente >90%. La flessione a 90° può essere limitata dalla guardia muscolare del paziente o dal dolore in fase acuta, riducendone l'accuratezza rispetto al Lachman." },
  { name: 'Cassetto Posteriore (Posterior Drawer Test)', targets: 'Legamento crociato posteriore (LCP)', procedure: "Stessa posizione del cassetto anteriore, ma la forza applicata dall'esaminatore è diretta posteriormente sulla tibia prossimale.", positive: "Aumentata traslazione posteriore della tibia rispetto al lato controlaterale.", accuracy: 'Considerato il test più accurato per il LCP, con specificità generalmente elevata (>90%); sensibilità variabile in letteratura.' },
  { name: 'McMurray Test', targets: 'Menischi (mediale e laterale)', procedure: "Paziente supino, ginocchio flesso al massimo. L'esaminatore applica una rotazione tibiale (esterna per il menisco mediale, interna per il laterale) mentre estende gradualmente il ginocchio, palpando la rima articolare.", positive: "Click, schiocco o dolore palpabile/udibile durante la manovra, riproducibile a livello della rima articolare.", accuracy: 'Sensibilità moderata-bassa (35-60% a seconda degli studi), specificità elevata (85-95%) — utile per confermare quando positivo, meno affidabile per escludere una lesione quando negativo.' },
  { name: 'Test di Thessaly', targets: 'Menischi (mediale e laterale)', procedure: "Paziente in appoggio monopodalico sull'arto da esaminare con ginocchio flesso a 20°, mano dell'esaminatore di supporto. Il paziente ruota il tronco e il ginocchio internamente ed esternamente mantenendo la flessione.", positive: "Dolore alla rima articolare mediale o laterale, spesso associato a sensazione di blocco articolare.", accuracy: "Sensibilità e specificità elevate in diversi studi (intorno all'85-90% per entrambe), superiore al McMurray in alcune comparazioni dirette, ma richiede la capacità del paziente di reggere il carico monopodalico." },
  { name: 'Valgus Stress Test', targets: 'Legamento collaterale mediale (LCM)', procedure: "Paziente supino, ginocchio in leggera flessione (20-30°). L'esaminatore applica una forza in valgo (verso l'interno) alla gamba, stabilizzando la coscia.", positive: "Dolore e/o apertura eccessiva della rima articolare mediale rispetto al lato controlaterale.", accuracy: 'Test clinico consolidato per il LCM; il grado di apertura articolare orienta la severità della lesione (I-III).' },
  { name: 'Varus Stress Test', targets: 'Legamento collaterale laterale (LCL)', procedure: "Stessa posizione del valgus test, ma la forza applicata è diretta in varo (verso l'esterno).", positive: "Dolore e/o apertura eccessiva della rima articolare laterale rispetto al lato controlaterale.", accuracy: 'Test clinico consolidato per il LCL, meno frequentemente lesionato isolatamente rispetto al LCM.' },
  { name: "Patellar Apprehension Test", targets: 'Instabilità/lussazione femoro-rotulea', procedure: "Paziente supino, ginocchio in leggera flessione. L'esaminatore applica una pressione laterale sul margine mediale della rotula, spingendola lateralmente.", positive: "Il paziente contrae il quadricipite in risposta o mostra evidente apprensione/resistenza al movimento, per timore di sublussazione.", accuracy: 'Test clinico classico per instabilità rotulea, alta specificità quando la risposta di apprensione è chiara e riproducibile.' },
];

const SHOULDER_TESTS: OrthoTest[] = [
  { name: 'Neer Test', targets: 'Conflitto subacromiale (impingement)', procedure: "Paziente seduto o in piedi. L'esaminatore stabilizza la scapola con una mano e con l'altra solleva passivamente il braccio in flessione, sull'intero range di movimento.", positive: "Comparsa di dolore durante la flessione passiva, tipicamente tra 70° e 120°.", accuracy: 'Sensibilità 79-89%, specificità 53-59% (meta-analisi) — test sensibile, utile soprattutto per escludere il conflitto quando negativo; una positività isolata non è diagnostica.' },
  { name: 'Hawkins-Kennedy Test', targets: 'Conflitto subacromiale (impingement)', procedure: "Spalla e gomito flessi entrambi a 90°. L'esaminatore ruota internamente passivamente la spalla.", positive: "Comparsa di dolore durante la rotazione interna.", accuracy: 'Sensibilità 63-92%, specificità 25-67% (ampia variabilità in letteratura) — come il Neer, alta sensibilità ma bassa specificità: utile in combinazione con altri test, non da solo.' },
  { name: 'Empty Can Test (Jobe Test)', targets: 'Muscolo/tendine sovraspinato', procedure: "Braccio abdotto a 90° nel piano scapolare, ruotato internamente (pollice verso il basso, come svuotando una lattina). L'esaminatore applica una forza verso il basso mentre il paziente resiste.", positive: "Dolore e/o incapacità di mantenere la posizione contro resistenza.", accuracy: 'Sensibilità 50%, specificità 87% — test più specifico che sensibile per patologia del sovraspinato; una positività chiara è clinicamente significativa.' },
  { name: "Speed's Test", targets: 'Tendine del capo lungo del bicipite', procedure: "Gomito esteso, avambraccio supinato, spalla flessa a circa 90°. L'esaminatore applica una resistenza verso il basso mentre il paziente flette ulteriormente la spalla.", positive: "Dolore localizzato al solco bicipitale anteriore.", accuracy: 'Sensibilità relativamente bassa (circa 32% per lesioni SLAP in meta-analisi), specificità moderata (~61%) — va interpretato insieme al quadro clinico complessivo, non isolatamente.' },
  { name: 'Drop Arm Test', targets: 'Lesione massiva della cuffia dei rotatori (in particolare sovraspinato)', procedure: "Il braccio del paziente viene passivamente abdotto a 90°; viene chiesto di abbassarlo lentamente e controllatamente fino al fianco.", positive: "Il braccio cade bruscamente e in modo incontrollato, o il paziente avverte dolore severo durante la discesa controllata.", accuracy: 'Test ad alta specificità (fino al 97%) ma sensibilità generalmente bassa — quando positivo è fortemente suggestivo di lesione ampia della cuffia dei rotatori.' },
  { name: 'Apprehension Test (spalla)', targets: 'Instabilità gleno-omerale anteriore', procedure: "Paziente supino, spalla abdotta a 90° e gomito flesso a 90°. L'esaminatore ruota progressivamente esternamente la spalla.", positive: "Il paziente mostra apprensione, resistenza o richiede l'interruzione del test per timore di sublussazione/lussazione anteriore, più che dolore puro.", accuracy: "Test clinico classico per instabilità anteriore, alta specificità quando la risposta è di vera apprensione (non solo dolore)." },
  { name: 'Relocation Test', targets: "Instabilità gleno-omerale anteriore (conferma dell'Apprehension Test)", procedure: "Segue l'Apprehension Test: quando il paziente riporta apprensione, l'esaminatore applica una forza posteriore sulla testa omerale mantenendo la stessa posizione.", positive: "L'apprensione o il dolore si riducono significativamente con la forza posteriore applicata.", accuracy: "Aumenta la specificità diagnostica quando combinato con l'Apprehension Test positivo; la combinazione dei due test è considerata più affidabile del singolo test." },
  { name: 'Yergason Test', targets: 'Tendine del capo lungo del bicipite / stabilità del solco bicipitale', procedure: "Gomito flesso a 90°, avambraccio pronato. L'esaminatore resiste attivamente alla supinazione dell'avambraccio e alla rotazione esterna della spalla eseguite dal paziente.", positive: "Dolore al solco bicipitale, con o senza sensazione di scatto/instabilità del tendine.", accuracy: "Sensibilità generalmente bassa, specificità elevata (fino all'86%) — utile soprattutto per confermare quando positivo." },
];

const SPINE_TESTS: OrthoTest[] = [
  { name: 'Straight Leg Raise (SLR / Lasègue)', targets: 'Radicolopatia lombare da ernia del disco (in particolare L4-S1)', procedure: "Paziente supino, arto inferiore in estensione. L'esaminatore solleva passivamente la gamba mantenendo il ginocchio esteso, fino alla comparsa di sintomi o a 70-90° di flessione d'anca.", positive: "Riproduzione del dolore radicolare lungo l'arto (non solo dolore locale lombare o alla coscia posteriore) tra circa 30° e 70° di sollevamento.", accuracy: "Sensibilità elevata in popolazioni chirurgiche (fino al 90%+) ma specificità bassa (10-40%) — test utile soprattutto per escludere un'ernia discale quando negativo, meno affidabile per confermarla da solo." },
  { name: 'Crossed Straight Leg Raise', targets: 'Radicolopatia lombare da ernia del disco', procedure: "Stessa manovra dello SLR, ma eseguita sull'arto controlaterale (asintomatico) rispetto al lato dei sintomi.", positive: "Riproduzione del dolore radicolare sull'arto sintomatico durante il sollevamento dell'arto sano.", accuracy: "Specificità molto elevata (85-90%) ma sensibilità bassa (circa 25-30%) — quando positivo è fortemente suggestivo di compressione radicolare significativa, ma la sua assenza non esclude la patologia." },
  { name: 'Slump Test', targets: 'Radicolopatia lombare / tensione del sistema nervoso', procedure: "Paziente seduto, viene guidato progressivamente attraverso flessione toracolombare, flessione cervicale, estensione del ginocchio e dorsiflessione della caviglia, aggiungendo tensione neurale a ogni step.", positive: "Riproduzione dei sintomi radicolari familiari al paziente, tipicamente alleviati dall'estensione cervicale (elemento chiave per la diagnosi differenziale da una tensione puramente muscolare posteriore della coscia).", accuracy: 'Sensibilità più elevata dello SLR (circa 80-84% in alcuni studi comparativi), specificità lievemente inferiore allo SLR (circa 83%) — utile in particolare quando lo SLR risulta negativo nonostante un forte sospetto clinico.' },
  { name: "Test di Spurling", targets: 'Radicolopatia cervicale (non lombare, incluso qui come test classico complementare per la valutazione della colonna)', procedure: "Paziente seduto, collo esteso e inclinato lateralmente verso il lato sintomatico. L'esaminatore applica una lieve compressione assiale sul vertice del capo.", positive: "Riproduzione o esacerbazione del dolore radicolare irradiato all'arto superiore.", accuracy: "Specificità elevata (89-100% secondo diversi studi), sensibilità più bassa e variabile (circa 30-60%) — test utile soprattutto per confermare una compressione radicolare cervicale quando positivo." },
  { name: "Test di Schober Modificato", targets: 'Mobilità in flessione della colonna lombare', procedure: "Con il paziente in piedi, si marca un punto a livello delle spine iliache postero-superiori (linea di Jacoby) e un secondo punto 10 cm più in alto. Si misura l'aumento della distanza tra i due punti durante la flessione anteriore massima del tronco.", positive: "Non è un test di provocazione ma una misura quantitativa: un aumento inferiore a 5 cm rispetto alla posizione neutra indica una ridotta mobilità in flessione della colonna lombare.", accuracy: "Strumento di misura consolidato e riproducibile per il monitoraggio della mobilità lombare nel tempo (es. spondiloartriti, rigidità post-chirurgica), più che un test diagnostico di provocazione." },
  { name: "Prone Instability Test", targets: 'Instabilità segmentale lombare', procedure: "Paziente prono sul lettino con il tronco fuori dal bordo e i piedi appoggiati a terra (muscolatura del tronco rilassata). L'esaminatore applica una pressione postero-anteriore sui processi spinosi lombari, prima con i piedi a terra, poi facendo sollevare le gambe al paziente (attivando la muscolatura del tronco).", positive: "Dolore presente nella prima fase (muscolatura rilassata) che si riduce significativamente o scompare nella seconda fase (muscolatura attiva) — suggerisce che la stabilità attiva della muscolatura del tronco compensa un deficit di stabilità passiva.", accuracy: "Fa parte dei criteri clinici comunemente utilizzati per identificare i pazienti che potrebbero beneficiare di un programma di stabilizzazione segmentale lombare, con supporto nella letteratura sulla classificazione del mal di schiena meccanico." },
];

const HIP_TESTS: OrthoTest[] = [
  { name: 'FABER Test (Test di Patrick)', targets: "Patologia intra-articolare dell'anca (conflitto femoro-acetabolare, lesione del labbro), articolazione sacroiliaca, muscolo ileopsoas", procedure: "Paziente supino. La caviglia dell'arto da esaminare viene posizionata sopra il ginocchio controlaterale (posizione a 'figura 4': Flessione, ABduzione, Extrarotazione). L'esaminatore applica una lieve pressione verso il basso sul ginocchio flesso.", positive: "Dolore riprodotto all'inguine (suggestivo di patologia dell'anca), alla regione sacroiliaca posteriore, o incapacità del ginocchio di scendere verso il piano del lettino (limitazione di mobilità).", accuracy: 'Valori molto variabili in letteratura (sensibilità 41-93%, specificità 55-100% a seconda dello studio e della patologia indagata) — test di screening ad ampio spettro, non specifico per una singola struttura; va sempre integrato con altri test per localizzare la fonte del dolore.' },
  { name: 'FADIR Test (Impingement Test)', targets: 'Conflitto femoro-acetabolare anteriore (FAI), lesione del labbro acetabolare', procedure: "Paziente supino, anca flessa a 90°. L'esaminatore adduce e ruota internamente passivamente l'anca (Flexion, ADduction, Internal Rotation).", positive: "Riproduzione del dolore inguinale/anteriore familiare al paziente.", accuracy: "Test con la sensibilità più elevata tra i test per lesioni del labbro (fino al 99-100% in alcuni studi), ma specificità generalmente più bassa — un test negativo è quindi molto utile per escludere la patologia, un test positivo va confermato con imaging o test aggiuntivi." },
  { name: 'Thomas Test', targets: "Accorciamento/retrazione del muscolo ileopsoas e del retto femorale (flessori dell'anca)", procedure: "Paziente supino sul bordo del lettino. Il paziente porta l'anca controlaterale al petto (appiattendo la lordosi lombare) mentre l'arto da esaminare pende liberamente fuori dal lettino.", positive: "L'arto in esame non riesce a rimanere in completa estensione d'anca con la coscia appoggiata al lettino (indica retrazione dell'ileopsoas); se anche il ginocchio si estende spontaneamente, suggerisce coinvolgimento del retto femorale.", accuracy: "Test clinico consolidato per la valutazione della flessibilità dei flessori d'anca, ampiamente utilizzato nella pratica clinica per orientare il trattamento più che per una diagnosi differenziale strutturale precisa." },
  { name: 'Trendelenburg Test', targets: 'Debolezza del medio gluteo / instabilità del bacino sul piano frontale', procedure: "Il paziente sta in appoggio monopodalico su un arto, mentre l'esaminatore osserva la posizione del bacino da dietro.", positive: "Il bacino si abbassa (invece di sollevarsi) sul lato controlaterale all'arto in appoggio, indicando un'insufficienza del medio gluteo dell'arto in carico nel sostenere il bacino.", accuracy: "Test clinico classico e ampiamente utilizzato per la valutazione funzionale della stabilità del bacino, particolarmente rilevante nella riabilitazione post-protesi d'anca e nella valutazione del pattern del cammino." },
  { name: 'Scour Test (Quadrant Test)', targets: 'Patologia degenerativa intra-articolare (artrosi, lesioni condrali/labrali)', procedure: "Paziente supino, anca e ginocchio flessi a 90°. L'esaminatore applica una compressione assiale attraverso il femore mentre muove l'anca in un arco di adduzione-abduzione con rotazione.", positive: "Dolore, crepitio o sensazione di blocco durante la manovra.", accuracy: "Test di screening generale per patologia intra-articolare dell'anca, utile in combinazione con altri test più specifici piuttosto che isolatamente." },
  { name: 'Log Roll Test', targets: "Patologia intra-articolare dell'anca (test con elevata specificità per patologia capsulare/articolare)", procedure: "Paziente supino con l'arto in posizione neutra. L'esaminatore ruota passivamente l'intero arto inferiore internamente ed esternamente, facendolo 'rotolare' come un log.", positive: "Dolore riprodotto durante la rotazione, tipicamente localizzato all'inguine.", accuracy: "Test con elevata specificità per patologia intra-articolare (a differenza di molti altri test dell'anca che coinvolgono anche strutture extra-articolari), poiché isola il movimento della sola articolazione coxo-femorale senza stress su muscoli/tendini circostanti." },
];

const ANKLE_TESTS: OrthoTest[] = [
  { name: 'Anterior Drawer Test (caviglia)', targets: 'Legamento peroneo-astragalico anteriore (ATFL)', procedure: "Paziente prono o supino, piede rilassato in leggera flessione plantare. L'esaminatore stabilizza la tibia distale con una mano e con l'altra applica una trazione anteriore sul calcagno/retropiede.", positive: "Traslazione anteriore eccessiva del talo rispetto al lato controlaterale (>1 cm), con end-feel indebolito; talvolta visibile una 'fossetta' cutanea sopra il legamento (suction sign).", accuracy: 'Sensibilità 75-86%, specificità 74-88% a seconda degli studi — accuratezza migliore se eseguito 4-5 giorni dopo il trauma piuttosto che nelle primissime 48 ore.' },
  { name: 'Talar Tilt Test', targets: 'Legamento peroneo-astragalico anteriore e calcaneo-peroneale', procedure: "Paziente supino o prono, caviglia in posizione neutra. L'esaminatore applica una forza in inversione stabilizzando la gamba.", positive: "Eccessiva inclinazione/apertura del talo rispetto al lato controlaterale.", accuracy: "Test complementare all'anterior drawer per la valutazione del complesso legamentoso laterale." },
  { name: 'Squeeze Test', targets: 'Sindesmosi tibio-peroneale distale (lesione "alta" di caviglia)', procedure: "Paziente supino. L'esaminatore comprime tibia e perone l'una verso l'altro a livello del terzo medio della gamba.", positive: "Dolore riprodotto a livello della sindesmosi distale.", accuracy: "Test con alta specificità per lesione della sindesmosi, condizione che richiede un percorso riabilitativo diverso e più prolungato." },
  { name: 'External Rotation Test (Kleiger Test)', targets: 'Sindesmosi tibio-peroneale distale', procedure: "Paziente seduto con ginocchio flesso a 90°. L'esaminatore stabilizza la gamba e ruota esternamente il piede.", positive: "Dolore riprodotto a livello della sindesmosi anteriore.", accuracy: "Utilizzato in combinazione con lo Squeeze Test per aumentare l'accuratezza diagnostica." },
  { name: 'Thompson Test (Simmonds-Thompson)', targets: "Rottura del tendine d'Achille", procedure: "Paziente prono con i piedi che sporgono dal bordo del lettino. L'esaminatore comprime il polpaccio a metà altezza.", positive: "Assenza di flessione plantare del piede in risposta alla compressione del polpaccio.", accuracy: "Sensibilità 96%, specificità 93% (fino al 100% in alcuni studi) — test molto accurato per la rottura completa; le rotture parziali possono dare risultati normali." },
  { name: 'Windlass Test', targets: 'Fascite plantare', procedure: "Paziente in piedi o seduto con il piede in carico. L'esaminatore estende passivamente l'alluce mantenendo il ginocchio esteso.", positive: "Riproduzione del dolore plantare familiare, tipicamente a livello dell'inserzione calcaneale.", accuracy: 'Test clinico specifico per la fascite plantare (specificità elevata, sensibilità più variabile).' },
];

const ELBOW_WRIST_TESTS: OrthoTest[] = [
  { name: "Cozen's Test", targets: 'Epicondilite laterale (gomito del tennista)', procedure: "Paziente con gomito flesso, avambraccio pronato, pugno chiuso e polso in leggera estensione. L'esaminatore stabilizza il gomito e resiste all'estensione attiva del polso.", positive: "Dolore improvviso e acuto localizzato all'epicondilo laterale.", accuracy: "Test clinico classico per l'epicondilite laterale, spesso usato in combinazione con Mill's e Maudsley's Test." },
  { name: "Mill's Test", targets: 'Epicondilite laterale (gomito del tennista)', procedure: "Gomito esteso, avambraccio pronato. L'esaminatore palpa l'epicondilo laterale mentre passivamente flette il polso e prona ulteriormente l'avambraccio.", positive: "Dolore riprodotto a livello dell'epicondilo laterale.", accuracy: "Test complementare al Cozen's Test, basato sullo stiramento passivo." },
  { name: 'Phalen Test', targets: 'Sindrome del tunnel carpale (nervo mediano)', procedure: "Il paziente flette entrambi i polsi a 90° mantenendo il dorso delle mani a contatto, per circa 60 secondi.", positive: "Comparsa o esacerbazione di parestesie nel territorio del nervo mediano.", accuracy: 'Sensibilità mediana intorno al 70%, specificità elevata (80-93%) — generalmente più affidabile del test di Tinel.' },
  { name: "Test di Tinel (al polso)", targets: 'Sindrome del tunnel carpale (nervo mediano)', procedure: "L'esaminatore percuote leggermente e ripetutamente sopra il decorso del nervo mediano a livello del tunnel carpale.", positive: "Sensazione di formicolio/scossa elettrica irradiata nel territorio del nervo mediano.", accuracy: "Sensibilità bassa e variabile (23-67%), specificità elevata (95-99%) — un test positivo è clinicamente significativo, un negativo non esclude la sindrome." },
  { name: 'Finkelstein Test', targets: "Tenosinovite di De Quervain", procedure: "Il paziente flette il pollice all'interno del palmo, chiudendo le altre dita a pugno. L'esaminatore devia passivamente il polso verso il lato ulnare.", positive: "Dolore acuto localizzato al processo stiloideo radiale.", accuracy: "Test clinico classico per la tenosinovite di De Quervain, alta specificità quando il dolore è ben localizzato." },
  { name: 'Ligamentous Instability Test (Valgus/Varus Stress al gomito)', targets: 'Legamento collaterale ulnare (valgo) e radiale (varo) del gomito', procedure: "Gomito in leggera flessione (20-30°). L'esaminatore applica una forza in valgo o in varo.", positive: "Dolore e/o apertura eccessiva dell'interlinea articolare rispetto al lato controlaterale.", accuracy: "Test clinico consolidato per la stabilità legamentosa del gomito, rilevante negli atleti overhead." },
];

const CERVICAL_TESTS: OrthoTest[] = [
  { name: 'Spurling Test', targets: 'Radicolopatia cervicale', procedure: "Paziente seduto, collo esteso e inclinato lateralmente verso il lato sintomatico. L'esaminatore applica una lieve compressione assiale sul vertice del capo.", positive: "Riproduzione o esacerbazione del dolore radicolare irradiato all'arto superiore.", accuracy: "Specificità elevata (89-100%), sensibilità più bassa e variabile (circa 30-60%) — tra i test più specifici del cluster." },
  { name: 'Cervical Distraction Test', targets: 'Radicolopatia cervicale', procedure: "Paziente supino. L'esaminatore posiziona una mano sotto il mento e l'altra intorno all'occipite, applicando gradualmente una trazione assiale fino a circa 10-15 kg.", positive: "Riduzione o scomparsa del dolore radicolare durante la trazione.", accuracy: 'Sensibilità 44%, specificità 90-97% — test ad alta specificità, fa parte del cluster diagnostico di Wainner.' },
  { name: 'Upper Limb Tension Test A (ULTT A)', targets: 'Tensione del sistema nervoso periferico (nervo mediano), radicolopatia cervicale', procedure: "Paziente supino. L'esaminatore posiziona sequenzialmente l'arto superiore in depressione scapolare, abduzione della spalla, supinazione dell'avambraccio con estensione di polso e dita, extrarotazione della spalla, estensione del gomito, infine flessione laterale cervicale.", positive: "Riproduzione dei sintomi familiari, che si modificano con la flessione laterale cervicale.", accuracy: "Alta sensibilità ma bassa specificità — un test negativo è utile per escludere una componente di tensione neurale." },
  { name: 'Cervical Compression Test', targets: 'Radicolopatia cervicale (complementare al distraction test)', procedure: "Paziente seduto in posizione neutra. L'esaminatore applica una compressione assiale delicata sul vertice del capo.", positive: "Riproduzione del dolore radicolare irradiato all'arto superiore.", accuracy: 'Testa le stesse strutture del distraction test ma con meccanismo opposto; la combinazione dei due rafforza il sospetto diagnostico.' },
  { name: 'Test di Rotazione Cervicale Attiva', targets: 'Mobilità cervicale, elemento del cluster diagnostico per radicolopatia', procedure: "Il paziente esegue una rotazione cervicale attiva bilaterale, mentre l'esaminatore misura l'ampiezza del movimento verso il lato sintomatico.", positive: "Rotazione limitata a meno di 60° verso il lato sintomatico.", accuracy: "Elemento del cluster diagnostico di Wainner: insieme a Spurling, distraction test e ULTT positivi, aumenta sostanzialmente la probabilità di radicolopatia." },
  { name: 'Test di Estensione-Rotazione', targets: 'Patologia delle faccette articolari cervicali', procedure: "Paziente supino. L'esaminatore esegue passivamente un movimento combinato di estensione e rotazione omolaterale del collo.", positive: "Riproduzione del dolore cervicale locale (non irradiato).", accuracy: "Test utile per la diagnosi differenziale tra dolore cervicale meccanico/facettale e vera radicolopatia." },
];

export default function ClinicalToolsPage() {
  const [category, setCategory] = useState<Category>('functional');
  const [activeScale, setActiveScale] = useState<ScaleKey>('katz');
  const [activeRegion, setActiveRegion] = useState<BodyRegion>('knee');
  const [pelvicFloorTests, setPelvicFloorTests] = useState<PelvicFloorTest[] | null>(null);
  const [pelvicFloorLoading, setPelvicFloorLoading] = useState(false);
  const [pelvicFloorError, setPelvicFloorError] = useState<string | null>(null);
  const [openQuestionnaire, setOpenQuestionnaire] = useState<string | null>(null);

  useEffect(() => {
    if (category !== 'pelvic-floor' || pelvicFloorTests !== null || pelvicFloorLoading) return;
    setPelvicFloorLoading(true);
    fetch('/api/pelvic-floor/tests')
      .then((res) => res.json())
      .then((data) => {
        setPelvicFloorTests(Array.isArray(data) ? data : data.tests ?? []);
        setPelvicFloorLoading(false);
      })
      .catch(() => {
        setPelvicFloorError('Impossibile caricare i test del pavimento pelvico.');
        setPelvicFloorLoading(false);
      });
  }, [category, pelvicFloorTests, pelvicFloorLoading]);

  const pelvicFloorGrouped = (pelvicFloorTests ?? []).reduce<Record<string, PelvicFloorTest[]>>((acc, t) => {
    (acc[t.category] ??= []).push(t);
    return acc;
  }, {});

  const pelvicFloorGroupedSorted = Object.entries(pelvicFloorGrouped).sort(
    ([a], [b]) => PELVIC_FLOOR_CATEGORY_ORDER.indexOf(a) - PELVIC_FLOOR_CATEGORY_ORDER.indexOf(b)
  );

  const ortho = {
    knee: KNEE_TESTS,
    shoulder: SHOULDER_TESTS,
    hip: HIP_TESTS,
    spine: SPINE_TESTS,
    ankle: ANKLE_TESTS,
    'elbow-wrist': ELBOW_WRIST_TESTS,
    cervical: CERVICAL_TESTS,
  };

  return (
    <div className="relative min-h-screen bg-white dark:bg-[#08090b] text-ink dark:text-white overflow-hidden transition-colors">
      <Navbar />
      <div className="pointer-events-none absolute -top-60 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full opacity-20 dark:opacity-25 blur-[140px]" style={{ background: 'radial-gradient(circle, rgba(79,124,255,0.6) 0%, rgba(50,214,160,0.5) 100%)' }} />
      <div className="relative max-w-3xl mx-auto px-6 pt-40 pb-24">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-black/[0.08] dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] backdrop-blur-xl text-xs font-semibold tracking-[0.15em] uppercase mb-4">
            <ClipboardList size={14} />
            Clinical Tools
          </div>
          <h1 className="font-display text-6xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-[#4F7CFF] to-[#32D6A0] bg-clip-text text-transparent">Clinical</span>{' '}Toolkit
          </h1>
        </div>

        <div className="flex justify-center mb-10">
          <div className="inline-flex rounded-full border border-black/[0.08] dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] backdrop-blur-xl p-1">
            {(['functional', 'orthopedic', 'pelvic-floor'] as Category[]).map((c) => (
              <button key={c} onClick={() => setCategory(c)} className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${category === c ? 'bg-gradient-to-r from-[#4F7CFF] to-[#32D6A0] text-white' : 'text-ink/60 dark:text-white/60 hover:text-ink dark:hover:text-white'}`}>
                {c === 'functional' ? 'Functional Scales' : c === 'orthopedic' ? 'Orthopedic Tests' : 'Pelvic Floor'}
              </button>
            ))}
          </div>
        </div>

        {category === 'functional' && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-10">
              {SCALES.map((s) => (
                <button key={s.key} onClick={() => setActiveScale(s.key)} className={`text-left rounded-2xl border p-4 transition-all ${activeScale === s.key ? 'border-[#4F7CFF] bg-[#4F7CFF]/5' : 'border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03]'}`}>
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
                <button key={r.key} onClick={() => setActiveRegion(r.key)} className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${activeRegion === r.key ? 'bg-gradient-to-r from-[#4F7CFF] to-[#32D6A0] text-white' : 'bg-black/5 dark:bg-white/10 text-ink/60 dark:text-white/60'}`}>
                  {r.label}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {ortho[activeRegion].map((t) => (
                <div key={t.name} className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-5">
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
          </>
        )}

        {category === 'pelvic-floor' && (
          <>
            {pelvicFloorLoading && (
              <p className="text-center text-sm text-ink/50 dark:text-white/50 py-10">Caricamento test in corso...</p>
            )}
            {pelvicFloorError && (
              <p className="text-center text-sm text-red-500 py-10">{pelvicFloorError}</p>
            )}
            {!pelvicFloorLoading && !pelvicFloorError && (
              <div className="space-y-8">
                {pelvicFloorGroupedSorted.map(([cat, tests]) => (
                  <div key={cat}>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-ink/50 dark:text-white/50 mb-3">
                      {PELVIC_FLOOR_CATEGORY_LABELS[cat] ?? cat}
                    </h3>
                    <div className="space-y-4">
                      {tests.map((t) => {
                        const match = getQuestionnaireMatch(t.name);
                        const isOpen = openQuestionnaire === t.slug;
                        return (
                          <div key={t.slug} className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-5">
                            <p className="text-base font-semibold text-ink dark:text-white">{t.name}</p>
                            <div className="space-y-2 text-sm text-ink/70 dark:text-white/70 leading-relaxed mt-3">
                              <p><span className="font-semibold text-ink/50 dark:text-white/50">Procedura: </span>{t.procedure}</p>
                              <p><span className="font-semibold text-ink/50 dark:text-white/50">Interpretazione: </span>{t.interpretation}</p>
                            </div>
                            {match && (
                              <>
                                <button
                                  onClick={() => setOpenQuestionnaire(isOpen ? null : t.slug)}
                                  className="mt-4 px-4 py-2 rounded-full text-xs font-semibold bg-gradient-to-r from-[#4F7CFF] to-[#32D6A0] text-white"
                                >
                                  {isOpen ? 'Nascondi questionario' : 'Compila il questionario'}
                                </button>
                                {isOpen && (
                                  <div className="mt-5 pt-5 border-t border-black/[0.06] dark:border-white/10">
                                    {match === 'sf36' && <SF36Scale />}
                                    {match === 'pfdi20' && <PFDI20Scale />}
                                    {match === 'iciq' && <ICIQScale />}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
