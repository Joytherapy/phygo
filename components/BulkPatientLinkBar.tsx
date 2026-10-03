'use client'

// Barra flottante per collegare PIÙ elementi (es. più esercizi scelti insieme nella Exercise
// Library) a un paziente in un solo colpo — stesso meccanismo/tabella di ClinicalActionBar.tsx
// (patient_clinical_references), ma con un insert multi-riga invece di uno singolo. Pensata per
// essere riutilizzabile anche da altre pagine a griglia in futuro, non solo dagli esercizi.

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Check, Loader2, Search, User, Link2 } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'
import { usePatientContext } from '@/contexts/PatientContext'
import { useUiStrings } from '@/contexts/LanguageContext'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type ContentType = 'exercise' | 'clinical_test' | 'questionnaire' | 'condition' | 'anatomical_zone' | 'product'

type PatientOption = { id: string; name: string }

export default function BulkPatientLinkBar({
  contentType,
  section,
  items,
  onDone,
  onCancel,
}: {
  contentType: ContentType
  /** Quale parte di Phygo ha generato il collegamento (es. "Exercise Library"), mostrata nella timeline del paziente. */
  section: string
  /** Gli elementi attualmente selezionati: id + nome leggibile (per la timeline paziente, senza dover ricostruire il nome da id sparsi). */
  items: { id: string; label: string }[]
  /** Chiamato dopo un collegamento riuscito, cosi' la pagina puo' svuotare la selezione e uscire dalla modalita'. */
  onDone: () => void
  /** Chiamato quando l'utente annulla/esce dalla selezione senza collegare nulla. */
  onCancel: () => void
}) {
  const { currentPatient, setCurrentPatient } = usePatientContext()
  const ui = useUiStrings()
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [showPicker, setShowPicker] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PatientOption[]>([])
  const [searching, setSearching] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node
      if (
        pickerRef.current &&
        !pickerRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setShowPicker(false)
      }
    }
    if (showPicker) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showPicker])

  const searchPatients = async (text: string) => {
    setQuery(text)
    if (!text.trim()) {
      setResults([])
      return
    }
    setSearching(true)
    const { data } = await supabase
      .from('patients')
      .select('id, name')
      .ilike('name', `%${text.trim()}%`)
      .limit(6)
    setResults(data || [])
    setSearching(false)
  }

  const linkAll = async (patientId: string) => {
    if (items.length === 0) return
    setStatus('saving')
    const rows = items.map((item) => ({
      patient_id: patientId,
      content_type: contentType,
      content_id: item.id,
      payload: { label: item.label, section },
    }))
    const { error } = await supabase.from('patient_clinical_references').insert(rows)
    if (!error) {
      setStatus('saved')
      setTimeout(() => {
        setStatus('idle')
        onDone()
      }, 1400)
    } else {
      console.error('Errore salvataggio collegamenti multipli al paziente:', error)
      setStatus('idle')
    }
  }

  const handlePickPatient = async (patient: PatientOption) => {
    setCurrentPatient(patient)
    setShowPicker(false)
    setQuery('')
    setResults([])
    await linkAll(patient.id)
  }

  const handleLinkClick = async () => {
    if (status !== 'idle') return
    if (!currentPatient) {
      setShowPicker(true)
      return
    }
    await linkAll(currentPatient.id)
  }

  if (!mounted) return null

  return createPortal(
    <div className="fixed bottom-0 inset-x-0 z-[9998] flex justify-center px-4 pb-6 pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-black/[0.06] dark:border-white/10 bg-white/95 dark:bg-[#12131a]/95 backdrop-blur-xl shadow-2xl pl-5 pr-2 py-2">
        <span className="text-sm font-semibold text-ink dark:text-white whitespace-nowrap">
          {ui.bulkSelection.countLabel.replace('{n}', String(items.length))}
        </span>

        <button
          type="button"
          onClick={onCancel}
          className="text-xs font-medium text-ink/40 dark:text-white/40 hover:text-ink dark:hover:text-white whitespace-nowrap"
        >
          {ui.bulkSelection.toggleOff}
        </button>

        <div className="relative">
          <button
            ref={buttonRef}
            type="button"
            onClick={handleLinkClick}
            disabled={status === 'saving' || items.length === 0}
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold text-white shadow-sm disabled:opacity-50 whitespace-nowrap"
            style={{ background: 'linear-gradient(135deg, #4F7CFF 0%, #32D6A0 100%)' }}
          >
            {status === 'saving' && <Loader2 size={13} className="animate-spin" />}
            {status === 'saved' && <Check size={13} />}
            {status === 'idle' && <Link2 size={13} />}
            {status === 'saved'
              ? ui.bulkSelection.linkedSuccess.replace('{name}', currentPatient?.name || '')
              : status === 'saving'
              ? ui.bulkSelection.linking
              : currentPatient
              ? `${ui.bulkSelection.linkButton} · ${currentPatient.name}`
              : ui.bulkSelection.linkButton}
          </button>

          {showPicker && (
            <div
              ref={pickerRef}
              className="absolute bottom-full right-0 mb-2 w-64 rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#12131a] shadow-2xl p-3"
            >
              <div className="relative mb-2">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink/30 dark:text-white/30" />
                <input
                  autoFocus
                  type="text"
                  value={query}
                  onChange={(e) => searchPatients(e.target.value)}
                  placeholder={ui.clinicalActionBar.searchPlaceholder}
                  className="w-full text-xs rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-white/5 pl-8 pr-2 py-2 outline-none focus:border-[#4F7CFF]"
                />
              </div>

              {searching && (
                <p className="text-[11px] text-ink/40 dark:text-white/40 px-1 py-1">{ui.clinicalActionBar.searching}</p>
              )}

              {!searching && query && results.length === 0 && (
                <p className="text-[11px] text-ink/40 dark:text-white/40 px-1 py-1">{ui.clinicalActionBar.noPatientsFound}</p>
              )}

              {results.length > 0 && (
                <div className="space-y-0.5 max-h-48 overflow-y-auto">
                  {results.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handlePickPatient(p)}
                      className="w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-[#4F7CFF]/10 transition-colors"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#4F7CFF]/15 text-[#4F7CFF]">
                        <User size={12} />
                      </span>
                      <span className="text-xs font-medium text-ink dark:text-white truncate">{p.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
