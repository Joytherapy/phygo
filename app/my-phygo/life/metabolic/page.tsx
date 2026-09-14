'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Flame, ArrowLeft, Calendar, RefreshCw, Sparkles, TrendingUp, TrendingDown, Minus, Scale, ArrowRight, Target } from 'lucide-react'
import { useUiStrings } from '@/contexts/LanguageContext'
import MetabolicCalculator from '@/components/MetabolicCalculator'
import WeightTrendChart from '@/components/WeightTrendChart'
import { calculateGoalProjection, type AdaptiveInsightResult } from '@/lib/metabolicCalculator'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type HistoryEntry = {
  id: string
  created_at: string
  weight_kg: number
  tdee: number
  calorie_target: number
  protein_g: number
  carbs_g: number
  fat_g: number
}

// Sostituisce {placeholder} in una stringa i18n con valori runtime — le
// uniche interpolazioni usate in tutta l'app finora erano statiche, questa
// e' la prima stringa dinamica (Phygo Adapt) quindi niente libreria i18n
// dedicata: un replace mirato basta e non introduce dipendenze nuove.
function interpolate(template: string, values: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (match, key) => (key in values ? String(values[key]) : match))
}

// Vista paziente del Metabolic Calculator (§17 del brief: "avoid overwhelming
// the patient with formulas"). Se esiste gia' un profilo salvato, la pagina
// apre mostrando solo il target di oggi — il calcolatore completo (form +
// formule + editing macro) resta a un click di distanza, non e' il default.
export default function MyPhygoLifeMetabolicPage() {
  const router = useRouter()
  const ui = useUiStrings().myPhygoLife
  const calcUi = useUiStrings().metabolicCalculator
  const [checking, setChecking] = useState(true)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [adaptiveInsight, setAdaptiveInsight] = useState<AdaptiveInsightResult | null>(null)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [showCalculator, setShowCalculator] = useState(false)
  const [goalWeightInput, setGoalWeightInput] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.push('/my-phygo/login')
        return
      }
      setChecking(false)

      const res = await fetch('/api/metabolic/save')
      if (res.ok) {
        const data = await res.json()
        setHistory(data.profiles || [])
        setAdaptiveInsight(data.adaptiveInsight ?? null)
      }
      setLoadingHistory(false)
    })
  }, [router])

  if (checking) {
    return <div className="relative pt-40 text-center text-ink/40 dark:text-white/40">…</div>
  }

  const latest = history[0] ?? null
  const showTodaysTarget = latest && !showCalculator
  // La history arriva piu'-recente-prima (per la lista); il grafico vuole
  // l'ordine cronologico.
  const chronologicalHistory = useMemo(() => [...history].reverse(), [history])

  const goalProjection = useMemo(() => {
    if (!goalWeightInput || !latest || !adaptiveInsight?.available) return null
    const target = Number(goalWeightInput)
    if (!Number.isFinite(target) || target <= 0) return null
    return calculateGoalProjection({
      currentWeightKg: latest.weight_kg,
      targetWeightKg: target,
      dailyRateKg: adaptiveInsight.insight.dailyRateKg,
    })
  }, [goalWeightInput, latest, adaptiveInsight])

  return (
    <div className="relative max-w-2xl mx-auto pt-40 pb-24 px-6">
      <a
        href="/my-phygo/life"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink/50 dark:text-white/50 hover:text-ink dark:hover:text-white transition-colors mb-6"
      >
        <ArrowLeft size={13} />
        {ui.backToHome}
      </a>

      <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#6366F1] mb-2">{ui.badge}</p>
      <h1 className="font-display text-4xl font-bold tracking-tight text-ink dark:text-white mb-8">
        {ui.metabolicCardTitle}
      </h1>

      {loadingHistory ? null : showTodaysTarget && latest ? (
        <>
          <div className="relative overflow-hidden rounded-[28px] border border-[#6366F1]/20 bg-gradient-to-b from-[#6366F1]/[0.07] to-transparent p-8 text-center mb-4">
            <div
              className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[320px] h-[320px] rounded-full opacity-30 blur-[90px]"
              style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.6) 0%, rgba(139,92,246,0.5) 100%)' }}
            />
            <div className="relative">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#6366F1]/10">
                <Flame size={22} className="text-[#6366F1]" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink/40 dark:text-white/40 mb-1">
                {calcUi.todaysTargetHeading}
              </p>
              <p className="font-display text-5xl font-bold text-ink dark:text-white mb-6">
                {latest.calorie_target} <span className="text-lg font-semibold text-ink/40 dark:text-white/40">{calcUi.kcalPerDaySuffix}</span>
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-white/60 dark:bg-white/[0.04] py-3">
                  <p className="text-lg font-bold text-ink dark:text-white">{latest.protein_g}g</p>
                  <p className="text-[11px] text-ink/40 dark:text-white/40">{calcUi.proteinLabel}</p>
                </div>
                <div className="rounded-2xl bg-white/60 dark:bg-white/[0.04] py-3">
                  <p className="text-lg font-bold text-ink dark:text-white">{latest.carbs_g}g</p>
                  <p className="text-[11px] text-ink/40 dark:text-white/40">{calcUi.carbsLabel}</p>
                </div>
                <div className="rounded-2xl bg-white/60 dark:bg-white/[0.04] py-3">
                  <p className="text-lg font-bold text-ink dark:text-white">{latest.fat_g}g</p>
                  <p className="text-[11px] text-ink/40 dark:text-white/40">{calcUi.fatLabel}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Phygo Adapt — l'insight che solo Phygo puo' offrire: il TDEE
              ricalibrato sul trend di peso reale del paziente nel tempo,
              non ottenibile da una calcolatrice TDEE isolata. */}
          {adaptiveInsight && (
            <div className="relative overflow-hidden rounded-[24px] border border-amber-400/25 bg-gradient-to-b from-amber-400/[0.06] to-transparent p-6 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-400/15">
                  <Sparkles size={13} className="text-amber-500" />
                </span>
                <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-amber-600 dark:text-amber-400">
                  {calcUi.adaptiveBadge}
                </p>
              </div>

              {adaptiveInsight.available ? (
                <>
                  <div className="flex items-baseline gap-2 mb-1">
                    <p className="font-display text-3xl font-bold text-ink dark:text-white">
                      {adaptiveInsight.insight.impliedTdee}
                    </p>
                    <p className="text-sm font-semibold text-ink/40 dark:text-white/40">{calcUi.kcalPerDaySuffix}</p>
                    <span className="ml-1 inline-flex items-center gap-1 text-xs font-semibold">
                      {adaptiveInsight.insight.deltaFromFormula > 20 && (
                        <span className="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400">
                          <TrendingUp size={12} /> +{adaptiveInsight.insight.deltaFromFormula}
                        </span>
                      )}
                      {adaptiveInsight.insight.deltaFromFormula < -20 && (
                        <span className="inline-flex items-center gap-0.5 text-rose-600 dark:text-rose-400">
                          <TrendingDown size={12} /> {adaptiveInsight.insight.deltaFromFormula}
                        </span>
                      )}
                      {Math.abs(adaptiveInsight.insight.deltaFromFormula) <= 20 && (
                        <span className="inline-flex items-center gap-0.5 text-ink/40 dark:text-white/40">
                          <Minus size={12} />
                        </span>
                      )}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-ink/60 dark:text-white/60 mb-2">{calcUi.adaptiveHeading}</p>
                  <p className="text-xs text-ink/50 dark:text-white/50 leading-relaxed mb-3">
                    {adaptiveInsight.insight.deltaFromFormula > 20
                      ? interpolate(calcUi.adaptiveDeltaAbove, { value: adaptiveInsight.insight.deltaFromFormula })
                      : adaptiveInsight.insight.deltaFromFormula < -20
                      ? interpolate(calcUi.adaptiveDeltaBelow, { value: Math.abs(adaptiveInsight.insight.deltaFromFormula) })
                      : calcUi.adaptiveDeltaMatch}
                  </p>
                  <p className="text-[11px] text-ink/40 dark:text-white/40">
                    {interpolate(calcUi.adaptiveBasedOn, {
                      days: adaptiveInsight.insight.daysSpanned,
                      entries: adaptiveInsight.insight.entriesUsed,
                    })}
                  </p>

                  {/* Proiezione dell'obiettivo — estende Phygo Adapt usando
                      il ritmo reale gia' osservato, non una stima teorica. */}
                  <div className="mt-4 pt-4 border-t border-amber-400/15">
                    <div className="flex items-center gap-2 mb-2">
                      <Target size={12} className="text-amber-500" />
                      <label className="text-[11px] font-semibold text-ink/60 dark:text-white/60">
                        {calcUi.goalWeightLabel}
                      </label>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="number"
                        inputMode="decimal"
                        step="0.1"
                        value={goalWeightInput}
                        onChange={(e) => setGoalWeightInput(e.target.value)}
                        placeholder={calcUi.goalWeightPlaceholder}
                        className="w-24 text-sm rounded-lg border border-black/10 dark:border-white/15 bg-white dark:bg-white/5 px-2.5 py-2 outline-none focus:border-amber-400/50"
                      />
                      <span className="text-xs text-ink/40 dark:text-white/40">kg</span>
                    </div>
                    {!goalWeightInput ? (
                      <p className="text-[11px] text-ink/40 dark:text-white/40">{calcUi.goalWeightHint}</p>
                    ) : goalProjection ? (
                      <p className="text-xs text-ink/70 dark:text-white/70 leading-relaxed">
                        {goalProjection.achievable
                          ? interpolate(calcUi.projectionAchievable, {
                              days: goalProjection.daysRemaining,
                              date: new Date(goalProjection.projectedDate).toLocaleDateString(undefined, {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                              }),
                            })
                          : goalProjection.reason === 'wrong_direction'
                          ? calcUi.projectionWrongDirection
                          : calcUi.projectionNoProgress}
                      </p>
                    ) : null}
                  </div>
                </>
              ) : (
                <p className="text-xs text-ink/50 dark:text-white/50 leading-relaxed">{calcUi.adaptiveNotEnoughData}</p>
              )}
              <p className="text-[11px] text-ink/40 dark:text-white/40 mt-3 italic">{calcUi.adaptiveExplain}</p>
            </div>
          )}

          {/* Richiamo diretto allo Shop, categoria "Body Composition" — i
              dati di peso che alimentano sia il target di oggi sia Phygo
              Adapt dipendono da pesate regolari e affidabili, quindi il
              rimando a una bilancia sta proprio dove il paziente vede il
              valore di quei dati. */}
          <a
            href="/my-phygo/shop?category=Body%20Composition"
            className="flex items-center justify-between gap-3 rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl p-4 mb-6 hover:border-[#6366F1]/30 transition-colors group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#6366F1]/10 text-[#6366F1]">
                <Scale size={15} />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink dark:text-white truncate">{ui.scaleReminderHeading}</p>
                <p className="text-xs text-ink/40 dark:text-white/40">{ui.scaleReminderCta}</p>
              </div>
            </div>
            <ArrowRight size={15} className="text-ink/30 dark:text-white/30 group-hover:translate-x-1 transition-transform shrink-0" />
          </a>

          <button
            onClick={() => setShowCalculator(true)}
            className="w-full flex items-center justify-center gap-2 rounded-full border border-black/10 dark:border-white/15 py-3 text-sm font-semibold text-ink/70 dark:text-white/70 hover:border-[#6366F1]/40 hover:text-[#6366F1] transition-colors mb-10"
          >
            <RefreshCw size={14} />
            {ui.recalculatePrompt}
          </button>

          {history.length >= 2 && (
            <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl p-5 mb-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink/40 dark:text-white/40 mb-3">
                {calcUi.weightTrendHeading}
              </p>
              <WeightTrendChart data={chronologicalHistory.map((h) => ({ date: h.created_at, weightKg: h.weight_kg }))} />
            </div>
          )}

          {history.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink/40 dark:text-white/40 mb-3">
                {calcUi.historyHeading}
              </p>
              <div className="space-y-2">
                {history.map((h) => (
                  <div
                    key={h.id}
                    className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl p-4 flex items-center gap-3"
                  >
                    <Calendar size={14} className="text-ink/30 dark:text-white/30 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-ink/40 dark:text-white/40">
                        {new Date(h.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                      <p className="text-sm text-ink/70 dark:text-white/70">
                        {h.weight_kg} kg — TDEE {h.tdee} {calcUi.kcalPerDaySuffix}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {!latest && (
            <p className="text-sm text-ink/50 dark:text-white/50 mb-6">{ui.noProfileYet}</p>
          )}
          <MetabolicCalculator mode="patient" />
        </>
      )}
    </div>
  )
}
