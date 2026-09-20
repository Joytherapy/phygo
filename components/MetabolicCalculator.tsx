'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Flame, Activity, Ruler, Check, Loader2, Search, User, Pencil, X, Printer, Apple } from 'lucide-react';
import { usePatientContext } from '@/contexts/PatientContext';
import { useUiStrings, useLanguage } from '@/contexts/LanguageContext';
import { getFoodExamplesByMacro } from '@/lib/foodExamples';
import type {
  ActivityLevel,
  Goal,
  MacroStrategy,
  MetabolicInput,
  MetabolicResult,
  Sex,
} from '@/lib/metabolicCalculator';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Identita' cromatica del calcolatore: eredita l'indaco/violetto di Clinical
// Toolkit (#6366F1/#8B5CF6) per il badge/CTA, ma per il grafico a barre dei
// macronutrienti usa i primi 3 slot categoriali validati dalla dataviz skill
// (blu/arancio/aqua) — colore per IDENTITA' di serie, mai per brand.
const MACRO_COLOR = {
  protein: { light: '#2a78d6', dark: '#3987e5' },
  carbs: { light: '#eb6834', dark: '#d95926' },
  fat: { light: '#1baf7a', dark: '#199e70' },
};

type PatientOption = { id: string; name: string };
type Mode = 'professional' | 'patient';

export default function MetabolicCalculator({
  mode = 'professional',
  patientId = null,
}: {
  mode?: Mode;
  patientId?: string | null;
}) {
  const ui = useUiStrings().metabolicCalculator;
  const { lang } = useLanguage();
  const { currentPatient, setCurrentPatient } = usePatientContext();

  const [sex, setSex] = useState<Sex>('male');
  const [age, setAge] = useState('35');
  const [weightKg, setWeightKg] = useState('75');
  const [heightCm, setHeightCm] = useState('175');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderate');
  const [bodyFatPct, setBodyFatPct] = useState('');
  const [goal, setGoal] = useState<Goal>('maintain');
  const [macroStrategy, setMacroStrategy] = useState<MacroStrategy>('balanced');
  const [customPct, setCustomPct] = useState({ protein: 30, carbs: 40, fat: 30 });

  const [calculating, setCalculating] = useState(false);
  const [result, setResult] = useState<MetabolicResult | null>(null);
  const [editingMacros, setEditingMacros] = useState(false);
  const [showFoodExamples, setShowFoodExamples] = useState(false);

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [showPicker, setShowPicker] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PatientOption[]>([]);

  const effectivePatientId = patientId ?? currentPatient?.id ?? null;

  function buildInput(): MetabolicInput {
    return {
      sex,
      age: Number(age),
      weightKg: Number(weightKg),
      heightCm: Number(heightCm),
      activityLevel,
      bodyFatPct: bodyFatPct ? Number(bodyFatPct) : null,
      goal,
      macroStrategy,
      customMacroPct: macroStrategy === 'custom' ? customPct : null,
    };
  }

  async function calculate(overrideInput?: MetabolicInput) {
    setCalculating(true);
    setSaveStatus('idle');
    try {
      const res = await fetch('/api/metabolic/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(overrideInput ?? buildInput()),
      });
      const data = await res.json();
      if (data.result) setResult(data.result);
    } catch (err) {
      console.error('metabolic calculate error:', err);
    } finally {
      setCalculating(false);
    }
  }

  function applyCustomPct(next: { protein: number; carbs: number; fat: number }) {
    setCustomPct(next);
    setMacroStrategy('custom');
    calculate({ ...buildInput(), macroStrategy: 'custom', customMacroPct: next });
  }

  async function searchPatients(text: string) {
    setQuery(text);
    if (!text.trim()) {
      setResults([]);
      return;
    }
    const { data } = await supabase.from('patients').select('id, name').ilike('name', `%${text.trim()}%`).limit(6);
    setResults(data || []);
  }

  async function save(targetPatientId: string | null) {
    setSaveStatus('saving');
    try {
      const res = await fetch('/api/metabolic/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...buildInput(), patientId: targetPatientId, lang }),
      });
      const data = await res.json();
      if (data.saved) {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2500);
      } else {
        setSaveStatus('idle');
      }
    } catch (err) {
      console.error('metabolic save error:', err);
      setSaveStatus('idle');
    }
  }

  async function handleSaveClick() {
    if (mode === 'patient') {
      await save(null); // il server risolve il patient_id dal proprio user id
      return;
    }
    if (effectivePatientId) {
      await save(effectivePatientId);
    } else {
      setShowPicker(true);
    }
  }

  const invalid = result && result.warnings.length > 0;
  const patientNameForPrint = mode === 'professional' ? currentPatient?.name ?? null : null;
  const printedOn = new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="max-w-3xl">
      {/* --- FORM (nascosto in stampa) --- */}
      <div className="print:hidden rounded-[24px] border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-5">
          <div>
            <label className="block text-xs font-semibold text-ink/50 dark:text-white/50 mb-1.5">{ui.sexLabel}</label>
            <div className="flex rounded-xl overflow-hidden border border-black/10 dark:border-white/15">
              {(['male', 'female'] as Sex[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setSex(s)}
                  className="flex-1 text-sm py-2.5 font-medium transition-colors"
                  style={
                    sex === s
                      ? { background: 'rgba(99,102,241,0.15)', color: '#6366F1' }
                      : { color: 'inherit' }
                  }
                >
                  {s === 'male' ? ui.sexOptions.male : ui.sexOptions.female}
                </button>
              ))}
            </div>
          </div>
          <NumberField label={ui.ageLabel} value={age} onChange={setAge} />
          <NumberField label={ui.weightLabel} value={weightKg} onChange={setWeightKg} step="0.1" />
          <NumberField label={ui.heightLabel} value={heightCm} onChange={setHeightCm} />
          <NumberField label={`${ui.bodyFatLabel}`} value={bodyFatPct} onChange={setBodyFatPct} placeholder="—" step="0.1" />
          <div>
            <label className="block text-xs font-semibold text-ink/50 dark:text-white/50 mb-1.5">{ui.activityLabel}</label>
            <select
              value={activityLevel}
              onChange={(e) => setActivityLevel(e.target.value as ActivityLevel)}
              className="w-full text-sm rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-white/5 px-3 py-2.5 outline-none focus:border-[#6366F1]"
            >
              {(['sedentary', 'light', 'moderate', 'very', 'extreme'] as ActivityLevel[]).map((a) => (
                <option key={a} value={a}>
                  {ui.activityLevels[a]}
                </option>
              ))}
            </select>
          </div>
        </div>
        <p className="text-[11px] text-ink/40 dark:text-white/40 mb-5 -mt-3">{ui.bodyFatOptionalHint}</p>

        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-xs font-semibold text-ink/50 dark:text-white/50 mb-1.5">{ui.goalLabel}</label>
            <div className="grid grid-cols-2 gap-2">
              {(['maintain', 'fat_loss', 'muscle_gain', 'performance'] as Goal[]).map((g) => (
                <button
                  key={g}
                  onClick={() => setGoal(g)}
                  className="text-xs font-semibold rounded-xl py-2.5 px-2 border transition-colors text-left"
                  style={
                    goal === g
                      ? { background: 'rgba(99,102,241,0.12)', borderColor: 'rgba(99,102,241,0.4)', color: '#6366F1' }
                      : { borderColor: 'rgba(0,0,0,0.1)' }
                  }
                >
                  {ui.goals[g]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink/50 dark:text-white/50 mb-1.5">{ui.macroStrategyLabel}</label>
            <select
              value={macroStrategy === 'custom' ? 'balanced' : macroStrategy}
              onChange={(e) => setMacroStrategy(e.target.value as MacroStrategy)}
              className="w-full text-sm rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-white/5 px-3 py-2.5 outline-none focus:border-[#6366F1]"
            >
              {(['balanced', 'high_protein', 'high_carb', 'low_carb'] as MacroStrategy[]).map((m) => (
                <option key={m} value={m}>
                  {ui.macroStrategies[m]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={() => calculate()}
          disabled={calculating}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-[0_4px_14px_-4px_rgba(99,102,241,0.5)] transition-transform hover:scale-[1.02] disabled:opacity-70"
          style={{ background: 'linear-gradient(90deg, #6366F1 0%, #8B5CF6 100%)' }}
        >
          {calculating && <Loader2 size={16} className="animate-spin" />}
          {result ? ui.recalculateCta : ui.calculateCta}
        </button>
      </div>

      {/* --- RESULTS --- */}
      {result && (
        <div className="mt-6 print:mt-0">
          {/* Intestazione visibile SOLO in stampa — trasforma i risultati in un referto stampabile/PDF */}
          <div className="hidden print:flex items-center justify-between mb-8 pb-4 border-b border-black/10">
            <div className="flex items-center gap-2 font-display font-bold text-lg text-ink">
              <img
                src="/logo-mark.png"
                alt="Phygo"
                className="h-8 w-8 rounded-lg object-cover"
              />
              Phygo — {ui.resultsHeading}
            </div>
            <div className="text-right text-xs text-ink/50">
              {patientNameForPrint && <p className="font-semibold">{ui.printedForLabel} {patientNameForPrint}</p>}
              <p>{ui.printedOnLabel} {printedOn}</p>
            </div>
          </div>

          {invalid && (
            <div className="print:hidden mb-5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
              {ui.invalidInputWarning}
            </div>
          )}

          <div className="flex items-center justify-between mb-4 print:hidden">
            <h3 className="text-lg font-bold text-ink dark:text-white">{ui.resultsHeading}</h3>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink/50 dark:text-white/50 hover:text-[#6366F1] transition-colors"
            >
              <Printer size={13} />
              {ui.printCta}
            </button>
          </div>

          {/* Hero TDEE — il numero che conta di piu', trattato con enfasi visiva reale */}
          <div className="relative overflow-hidden rounded-[28px] border border-[#6366F1]/20 bg-gradient-to-b from-[#6366F1]/[0.07] to-transparent print:border print:border-black/10 print:from-white print:to-white p-7 mb-4 text-center">
            <div
              className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[320px] h-[320px] rounded-full opacity-30 blur-[90px] print:hidden"
              style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.6) 0%, rgba(139,92,246,0.5) 100%)' }}
            />
            <div className="relative">
              <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#6366F1]/10 print:hidden">
                <Flame size={20} className="text-[#6366F1]" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#6366F1] mb-1">{ui.tdeeLabel}</p>
              <p className="font-display text-6xl font-bold tracking-tight text-ink dark:text-white print:text-ink">
                {result.tdee}
                <span className="text-lg font-semibold text-ink/40 dark:text-white/40 ml-2">{ui.kcalPerDaySuffix}</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <StatCard icon={Activity} label={ui.bmrLabel} value={`${result.bmr}`} suffix={ui.kcalPerDaySuffix} accent="#8B5CF6" />
            <StatCard icon={Ruler} label={ui.bmiLabel} value={`${result.bmi}`} suffix={ui.bmiCategories[result.bmiCategory]} accent="#6366F1" />
          </div>

          {(result.leanBodyMassKg != null || result.fatMassKg != null) && (
            <p className="text-xs text-ink/45 dark:text-white/45 mb-6">
              {result.leanBodyMassKg != null && `${ui.leanBodyMassLabel}: ${result.leanBodyMassKg} kg`}
              {result.leanBodyMassKg != null && result.fatMassKg != null && ' · '}
              {result.fatMassKg != null && `${ui.fatMassLabel}: ${result.fatMassKg} kg`}
              {' — '}
              <span className="italic">{ui.estimateNote}</span>
            </p>
          )}

          {/* Scenari calorici */}
          <p className="text-xs font-semibold uppercase tracking-wide text-ink/40 dark:text-white/40 mb-2">{ui.calorieScenariosHeading}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
            {(['maintain', 'fat_loss', 'muscle_gain', 'performance'] as Goal[]).map((g) => (
              <div
                key={g}
                className="rounded-xl border px-3 py-2.5"
                style={
                  g === goal
                    ? { borderColor: 'rgba(99,102,241,0.4)', background: 'rgba(99,102,241,0.08)' }
                    : { borderColor: 'rgba(0,0,0,0.06)' }
                }
              >
                <p className="text-[10px] font-semibold uppercase text-ink/40 dark:text-white/40">{ui.goals[g]}</p>
                <p className="text-sm font-bold text-ink dark:text-white">{result.calorieTargets[g]} <span className="text-[10px] font-normal text-ink/40 dark:text-white/40">{ui.kcalPerDaySuffix}</span></p>
              </div>
            ))}
          </div>

          {/* Macronutrienti */}
          <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink/40 dark:text-white/40">{ui.macronutrientsHeading}</p>
            <div className="flex items-center gap-3 print:hidden">
              <button
                onClick={() => setShowFoodExamples((v) => !v)}
                className={
                  showFoodExamples
                    ? 'inline-flex items-center gap-1 text-xs font-semibold text-[#6366F1]'
                    : 'inline-flex items-center gap-1.5 rounded-full pl-1.5 pr-3 py-1 text-xs font-bold text-[#6366F1] bg-gradient-to-r from-[#6366F1]/10 to-[#8B5CF6]/10 border border-[#6366F1]/20 shadow-[0_1px_3px_rgba(99,102,241,0.15)] hover:shadow-[0_3px_10px_rgba(99,102,241,0.25)] hover:scale-[1.03] transition-all'
                }
              >
                {showFoodExamples ? (
                  <>
                    <X size={12} />
                    {ui.hideFoodExamplesCta}
                  </>
                ) : (
                  <>
                    <span className="relative flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#6366F1]/15">
                      <Apple size={11} />
                      <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-[#8B5CF6] animate-pulse" />
                    </span>
                    {ui.foodExamplesCta}
                  </>
                )}
              </button>
              <button
                onClick={() => setEditingMacros((v) => !v)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#6366F1]"
              >
                {editingMacros ? <X size={12} /> : <Pencil size={12} />}
                {editingMacros ? ui.doneEditingCta : ui.editMacrosCta}
              </button>
            </div>
          </div>

          <div className="rounded-[20px] border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] print:border-black/10 p-5">
            <MacroBar result={result} />
          </div>

          {/* Esempi alimentari — rende concreti i grammi target (es. "142g
              proteine") con alimenti comuni, senza diventare un database
              alimentare o un piano nutrizionale: valori generali per 100g,
              lista volutamente corta, disclaimer sempre visibile. */}
          {showFoodExamples && (
            <div className="print:hidden relative overflow-hidden mt-4 rounded-[24px] border border-black/[0.06] dark:border-white/10 bg-gradient-to-b from-white to-[#FBFBFE] dark:from-white/[0.05] dark:to-white/[0.02] shadow-[0_1px_2px_rgba(16,24,40,0.04)] dark:shadow-none p-6">
              <div
                className="pointer-events-none absolute -top-16 -right-16 w-[220px] h-[220px] rounded-full opacity-[0.07] dark:opacity-[0.12] blur-[70px]"
                style={{ background: 'radial-gradient(circle, #6366F1 0%, #8B5CF6 100%)' }}
              />
              <div className="relative flex items-center gap-2.5 mb-5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#6366F1]/10">
                  <Apple size={14} className="text-[#6366F1]" />
                </span>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-ink dark:text-white">{ui.foodExamplesCta}</p>
              </div>

              <div className="relative grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-0">
                {(['protein', 'carbs', 'fat'] as const).map((macro, i) => {
                  const color =
                    macro === 'protein' ? MACRO_COLOR.protein.light : macro === 'carbs' ? MACRO_COLOR.carbs.light : MACRO_COLOR.fat.light;
                  return (
                    <div key={macro} className={i > 0 ? 'sm:border-l sm:border-black/[0.06] sm:dark:border-white/10 sm:pl-6' : ''}>
                      <div className="flex items-baseline justify-between gap-2 mb-3">
                        <div className="flex items-center gap-1.5">
                          <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: color }} />
                          <p className="text-[11px] font-bold uppercase tracking-wide text-ink dark:text-white">
                            {macro === 'protein' ? ui.proteinLabel : macro === 'carbs' ? ui.carbsLabel : ui.fatLabel}
                          </p>
                        </div>
                        <span className="text-[10px] font-medium text-ink/35 dark:text-white/35">{ui.perHundredGramsSuffix}</span>
                      </div>
                      <ul className="space-y-1">
                        {getFoodExamplesByMacro(lang, macro).map((food) => (
                          <li
                            key={food.id}
                            className="flex items-center justify-between gap-2 -mx-2 px-2 py-1.5 rounded-lg hover:bg-black/[0.025] dark:hover:bg-white/[0.03] transition-colors"
                          >
                            <span className="text-xs text-ink/65 dark:text-white/65 truncate">{food.name}</span>
                            <span
                              className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums"
                              style={{ background: `${color}1A`, color }}
                            >
                              {food.gramsPer100g}g
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>

              <p className="relative text-[11px] text-ink/40 dark:text-white/40 mt-5 pt-4 border-t border-black/[0.06] dark:border-white/10 italic">
                {ui.foodExamplesDisclaimer}
              </p>
            </div>
          )}

          {editingMacros && (
            <div className="print:hidden mt-4 grid grid-cols-3 gap-3">
              {(['protein', 'carbs', 'fat'] as const).map((k) => (
                <div key={k}>
                  <label className="block text-[11px] font-semibold text-ink/50 dark:text-white/50 mb-1">
                    {k === 'protein' ? ui.proteinLabel : k === 'carbs' ? ui.carbsLabel : ui.fatLabel} %
                  </label>
                  <input
                    type="number"
                    value={customPct[k]}
                    onChange={(e) => applyCustomPct({ ...customPct, [k]: Number(e.target.value) })}
                    className="w-full text-sm rounded-lg border border-black/10 dark:border-white/15 bg-white dark:bg-white/5 px-2.5 py-2 outline-none focus:border-[#6366F1]"
                  />
                </div>
              ))}
            </div>
          )}

          <p className="text-[11px] text-ink/40 dark:text-white/40 mt-5 mb-6 print:text-ink/60">{ui.disclaimer}</p>

          {/* Salvataggio (nascosto in stampa) */}
          <div className="relative print:hidden">
            <button
              onClick={handleSaveClick}
              disabled={saveStatus === 'saving'}
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold border transition-colors disabled:opacity-70"
              style={{ borderColor: 'rgba(99,102,241,0.35)', color: '#6366F1', background: 'rgba(99,102,241,0.06)' }}
            >
              {saveStatus === 'saving' && <Loader2 size={14} className="animate-spin" />}
              {saveStatus === 'saved' && <Check size={14} />}
              {mode === 'professional'
                ? effectivePatientId
                  ? ui.saveToPatientCta
                  : ui.selectPatientPrompt
                : ui.saveCta}
            </button>

            {showPicker && mode === 'professional' && (
              <div className="absolute top-full left-0 mt-2 w-64 rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#12131a] shadow-2xl p-3 z-20">
                <div className="relative mb-2">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink/30 dark:text-white/30" />
                  <input
                    autoFocus
                    type="text"
                    value={query}
                    onChange={(e) => searchPatients(e.target.value)}
                    className="w-full text-xs rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-white/5 pl-8 pr-2 py-2 outline-none focus:border-[#6366F1]"
                  />
                </div>
                <div className="space-y-0.5 max-h-48 overflow-y-auto">
                  {results.map((p) => (
                    <button
                      key={p.id}
                      onClick={async () => {
                        setCurrentPatient(p);
                        setShowPicker(false);
                        setQuery('');
                        setResults([]);
                        await save(p.id);
                      }}
                      className="w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-[#6366F1]/10 transition-colors"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#6366F1]/15 text-[#6366F1]">
                        <User size={12} />
                      </span>
                      <span className="text-xs font-medium text-ink dark:text-white truncate">{p.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  step,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  step?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-ink/50 dark:text-white/50 mb-1.5">{label}</label>
      <input
        type="number"
        step={step ?? '1'}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full text-sm rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-white/5 px-3 py-2.5 outline-none focus:border-[#6366F1]"
      />
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  suffix,
  accent,
}: {
  icon: typeof Flame;
  label: string;
  value: string;
  suffix: string;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-gradient-to-b from-white to-[#FBFBFE] dark:from-white/[0.05] dark:to-white/[0.02] print:from-white print:to-white print:border-black/10 shadow-[0_1px_2px_rgba(16,24,40,0.04)] dark:shadow-none p-4">
      <div className="flex h-8 w-8 items-center justify-center rounded-xl mb-2 print:hidden" style={{ background: `${accent}1f` }}>
        <Icon size={16} style={{ color: accent }} />
      </div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-ink/40 dark:text-white/40 mb-0.5">{label}</p>
      <p className="text-xl font-bold text-ink dark:text-white leading-tight">{value}</p>
      <p className="text-[10px] text-ink/40 dark:text-white/40">{suffix}</p>
    </div>
  );
}

// Barra segmentata Proteine/Carboidrati/Grassi — 3 slot categoriali
// pre-validati (dataviz skill: primi 3 dell'ordine di default, all-pairs
// sicuri in entrambi i temi). Colori come CSS custom properties che si
// invertono in dark mode (stesso meccanismo consigliato dalla skill),
// cosi' un solo set di elementi serve entrambi i temi. Etichette sempre
// visibili sotto la barra (grammi + %) cosi' l'identita' non dipende mai
// dal solo colore (richiesto dal contrasto ridotto dei toni chiari).
// La larghezza dei segmenti transiziona (transition-[width]) cosi' un
// ricalcolo (es. editing manuale delle percentuali) si vede animarsi
// invece di scattare di colpo.
function MacroBar({ result }: { result: MetabolicResult }) {
  const ui = useUiStrings().metabolicCalculator;
  const { proteinG, carbsG, fatG, proteinPct, carbsPct, fatPct, proteinGPerKg } = result.macros;

  const segments = [
    { key: 'protein', label: ui.proteinLabel, g: proteinG, pct: proteinPct, varName: '--macro-protein', extra: `${proteinGPerKg} ${ui.perKgSuffix}` },
    { key: 'carbs', label: ui.carbsLabel, g: carbsG, pct: carbsPct, varName: '--macro-carbs', extra: null },
    { key: 'fat', label: ui.fatLabel, g: fatG, pct: fatPct, varName: '--macro-fat', extra: null },
  ];

  return (
    <div className="macro-bar-root">
      <style>{`
        .macro-bar-root {
          --macro-protein: ${MACRO_COLOR.protein.light};
          --macro-carbs: ${MACRO_COLOR.carbs.light};
          --macro-fat: ${MACRO_COLOR.fat.light};
        }
        .dark .macro-bar-root {
          --macro-protein: ${MACRO_COLOR.protein.dark};
          --macro-carbs: ${MACRO_COLOR.carbs.dark};
          --macro-fat: ${MACRO_COLOR.fat.dark};
        }
      `}</style>

      <div className="flex h-7 w-full rounded-full overflow-hidden gap-[2px] bg-black/[0.04] dark:bg-white/[0.04] print:border print:border-black/10">
        {segments.map((s) => (
          <div
            key={s.key}
            style={{ width: `${Math.max(s.pct, 2)}%`, background: `var(${s.varName})` }}
            className="h-full first:rounded-l-full last:rounded-r-full transition-[width] duration-500 ease-out"
          />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3 mt-3">
        {segments.map((s) => (
          <div key={s.key} className="flex items-start gap-2">
            <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: `var(${s.varName})` }} />
            <div>
              <p className="text-xs font-semibold text-ink dark:text-white">{s.label}</p>
              <p className="text-sm font-bold text-ink dark:text-white">
                {s.g} g <span className="text-xs font-normal text-ink/45 dark:text-white/45">({s.pct}%)</span>
              </p>
              {s.extra && <p className="text-[10px] text-ink/40 dark:text-white/40">{s.extra}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
