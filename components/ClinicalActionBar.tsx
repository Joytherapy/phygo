'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Plus, Check, Loader2, Search, User } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'
import { usePatientContext } from '@/contexts/PatientContext'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type ContentType = 'exercise' | 'clinical_test' | 'questionnaire' | 'condition' | 'anatomical_zone'

const ACTION_LABELS: Record<ContentType, string> = {
  exercise: 'Add to Treatment Plan',
  clinical_test: 'Use with Patient',
  questionnaire: 'Start for Patient',
  condition: 'Use as Clinical Reference',
  anatomical_zone: 'Use with Patient',
}

type PatientOption = { id: string; name: string }

export default function ClinicalActionBar({
  contentType,
  contentId,
  payload,
}: {
  contentType: ContentType
  contentId: string
  payload?: Record<string, any>
}) {
  const { currentPatient, setCurrentPatient } = usePatientContext()
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [showPicker, setShowPicker] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PatientOption[]>([])
  const [searching, setSearching] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 })
  const [mounted, setMounted] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const pickerRef = useRef<HTMLDivElement>(null)

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

  const openPicker = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setCoords({
        top: rect.bottom + window.scrollY + 6,
        left: rect.left + window.scrollX,
        width: 240,
      })
    }
    setShowPicker(true)
  }

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

  const saveReference = async (patientId: string) => {
    setStatus('saving')
    const { error } = await supabase.from('patient_clinical_references').insert({
      patient_id: patientId,
      content_type: contentType,
      content_id: contentId,
      payload: payload || null,
    })
    if (!error) {
      setStatus('saved')
      setTimeout(() => setStatus('idle'), 2000)
    } else {
      console.error('Errore salvataggio riferimento clinico:', error)
      setStatus('idle')
    }
  }

  const handlePickPatient = async (patient: PatientOption) => {
    setCurrentPatient(patient)
    setShowPicker(false)
    setQuery('')
    setResults([])
    await saveReference(patient.id)
  }

  const handleClick = async () => {
    if (status !== 'idle') return
    if (!currentPatient) {
      openPicker()
      return
    }
    await saveReference(currentPatient.id)
  }

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleClick}
        disabled={status === 'saving'}
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors disabled:opacity-70"
        style={{ background: 'rgba(79,124,255,0.12)', color: '#4F7CFF' }}
      >
        {status === 'saving' && <Loader2 size={12} className="animate-spin" />}
        {status === 'saved' && <Check size={12} />}
        {status === 'idle' && <Plus size={12} />}
        {status === 'saved'
          ? `Added${currentPatient ? ` for ${currentPatient.name}` : ''}`
          : currentPatient
          ? ACTION_LABELS[contentType]
          : 'Select patient'}
      </button>

      {mounted && showPicker &&
        createPortal(
          <div
            ref={pickerRef}
            style={{ position: 'absolute', top: coords.top, left: coords.left, width: coords.width, zIndex: 9999 }}
            className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#12131a] shadow-2xl p-3"
          >
            <div className="relative mb-2">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink/30 dark:text-white/30" />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => searchPatients(e.target.value)}
                placeholder="Search patient..."
                className="w-full text-xs rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-white/5 pl-8 pr-2 py-2 outline-none focus:border-[#4F7CFF]"
              />
            </div>

            {searching && (
              <p className="text-[11px] text-ink/40 dark:text-white/40 px-1 py-1">Searching...</p>
            )}

            {!searching && query && results.length === 0 && (
              <p className="text-[11px] text-ink/40 dark:text-white/40 px-1 py-1">No patients found.</p>
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
          </div>,
          document.body
        )}
    </>
  )
}