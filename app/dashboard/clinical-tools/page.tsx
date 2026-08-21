'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { ClipboardList } from 'lucide-react';

type ScaleKey = 'katz' | 'barthel' | 'tinetti' | 'conley' | 'berg' | 'morse' | 'ashworth' | 'nrs' | 'sppb';

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
  'Stazione eretta con un piede davanti all\'altro',
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

export default function ClinicalToolsPage() {
  const [activeScale, setActiveScale] = useState<ScaleKey>('katz');

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
              Assessment
            </span>{' '}
            Scales
          </h1>
        </div>

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

        {activeScale === 'katz' && <KatzScale />}
        {activeScale === 'barthel' && <BarthelScale />}
        {activeScale === 'tinetti' && <TinettiScale />}
        {activeScale === 'conley' && <ConleyScale />}
        {activeScale === 'berg' && <BergBalanceScale />}
        {activeScale === 'morse' && <MorseFallScale />}
        {activeScale === 'ashworth' && <AshworthScale />}
        {activeScale === 'nrs' && <NRSPainScale />}
        {activeScale === 'sppb' && <SPPBScale />}
      </div>
    </div>
  );
}
