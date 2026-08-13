'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Mic,
  Square,
  CheckCircle2,
  FileText,
  Save,
  Sparkles,
  Target,
  Stethoscope,
  AlertTriangle,
  Dumbbell,
  ImagePlus,
  Pencil,
  Trash2,
  Plus,
  Search,
  X,
} from 'lucide-react'
import Navbar from '@/components/Navbar'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Patient = {
  id: string
  name: string
  age: number | null
  main_condition: string | null
}

export default function OfficialSessionPage() {
  const params = useParams()
  const router = useRouter()
  const patientId = params.id as string

  const [patient, setPatient] = useState<Patient | null>(null)
  const [loadingPatient, setLoadingPatient] = useState(true)

  const [phase, setPhase] = useState<'idle' | 'listening' | 'processing' | 'done'>('idle')
  const [interim, setInterim] = useState('')
  const [textInput, setTextInput] = useState('')
  const [showTextInput, setShowTextInput] = useState(false)
  const [finalNote, setFinalNote] = useState<any>(null)
  const [aiError, setAiError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [voiceSupported, setVoiceSupported] = useState(false)
  const [recordingLang, setRecordingLang] = useState('it-IT')

  const [clinicalInsight, setClinicalInsight] = useState<any>(null)
  const [rehabPhases, setRehabPhases] = useState<any[]>([])
  const [exerciseEntries, setExerciseEntries] = useState<any[]>([])
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null)
  const [editingExercise, setEditingExercise] = useState<string | null>(null)
  const [evidenceLevel, setEvidenceLevel] = useState<string | null>(null)

  const [showAddExercise, setShowAddExercise] = useState(false)
  const [exerciseSearchQuery, setExerciseSearchQuery] = useState('')
  const [exerciseSearchResults, setExerciseSearchResults] = useState<any[]>([])
  const [exerciseSearching, setExerciseSearching] = useState(false)

  const [showAskPhygo, setShowAskPhygo] = useState(false)
  const [askQuestion, setAskQuestion] = useState('')
  const [askAnswer, setAskAnswer] = useState<string | null>(null)
  const [askLoading, setAskLoading] = useState(false)

  const [clinicalContext, setClinicalContext] = useState('')
  const [uploadedFileNames, setUploadedFileNames] = useState<string[]>([])
  const [scanSummary, setScanSummary] = useState<string | null>(null)
  const [scanAnalyzing, setScanAnalyzing] = useState(false)

  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    setVoiceSupported(!!SR)
  }, [])

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('patients')
        .select('id, name, age, main_condition')
        .eq('id', patientId)
        .single()
      setPatient(data)
      setLoadingPatient(false)
    }
    load()
  }, [patientId])
  const formatPhaseText = (text: string) => {
    if (!text) return ''
    const pattern =
      /\s*((?:Fase\s*\d+|Settimana\s*\d+|Prima settimana|Seconda settimana|Terza settimana|Quarta settimana|Quinta settimana|Sesta settimana|Settima settimana|Ottava settimana|Giorno\s*\d+|Giorni\s*\d+)\s*[:\(])/gi
    return text.replace(pattern, '\n\n$1').trim()
  }

  const generateNote = useCallback(
    async (raw: string) => {
      setPhase('processing')
      setAiError(null)

      try {
        const res = await fetch('/api/generate-note', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript: raw, lang: recordingLang }),
        })

        if (!res.ok) {
          throw new Error('request failed')
        }

        const data = await res.json()
        const note = data.note ?? {}
        setFinalNote(note)

        let rehabPhasesLocal: any[] = []

        if (note.assessment) {
          try {
            const kbRes = await fetch('/api/knowledge-lookup', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ assessment: note.assessment, primaryCondition: note.primaryCondition, lang: note.language || 'it' }),
            })
            const kbData = await kbRes.json()
            setClinicalInsight(kbData.match || null)
            setRehabPhases(kbData.phases || [])
            setEvidenceLevel(kbData.evidenceLevel || null)
            rehabPhasesLocal = kbData.phases || []
          } catch (kbErr) {
            console.error('Knowledge lookup failed:', kbErr)
          }
        }

        let planText = note.plan
        let exercisesArr = note.exercises

        if (rehabPhasesLocal.length > 0) {
          try {
            const refineRes = await fetch('/api/refine-plan', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                transcript: raw,
                assessment: note.assessment,
                planDraft: note.plan,
                phases: rehabPhasesLocal,
                lang: note.language || recordingLang,
              }),
            })
            const refineData = await refineRes.json()
            if (refineData.plan) planText = refineData.plan
          } catch (err) {
            console.error('Errore refine-plan:', err)
          }

          try {
            const exRes = await fetch('/api/refine-exercises', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                transcript: raw,
                assessment: note.assessment,
                exercisesDraft: note.exercises,
                phases: rehabPhasesLocal,
                lang: note.language || recordingLang,
              }),
            })
            const exData = await exRes.json()
            if (exData.exercises) exercisesArr = exData.exercises
          } catch (err) {
            console.error('Errore refine-exercises:', err)
          }
        }

        let exerciseEntriesArr: any[] = []
        if (Array.isArray(exercisesArr) && exercisesArr.length > 0) {
          try {
            const eiRes = await fetch('/api/exercise-intelligence', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                exercisesDraft: exercisesArr,
                assessment: note.assessment,
                primaryCondition: note.primaryCondition,
                lang: note.language || recordingLang,
              }),
            })
            const eiData = await eiRes.json()
            if (Array.isArray(eiData.exercises)) exerciseEntriesArr = eiData.exercises
          } catch (err) {
            console.error('Errore exercise-intelligence:', err)
          }
        }
        setExerciseEntries(exerciseEntriesArr)

        setFinalNote((prev: any) =>
          prev ? { ...prev, plan: planText, exercises: exercisesArr } : prev
        )

        setPhase('done')
      } catch (err) {
        console.error('Errore generazione nota:', err)
        setAiError('Could not generate the note. Please try again.')
        setPhase('idle')
      }
    },
    [recordingLang]
  )

  const startVoice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return

    setPhase('listening')
    setFinalNote(null)
    setSaved(false)
    setClinicalInsight(null)
    setRehabPhases([])

    const recognition = new SR()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = recordingLang

    let finalTranscript = ''

    recognition.onresult = (event: any) => {
      let interimText = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript
        if (event.results[i].isFinal) finalTranscript += t + ' '
        else interimText += t
      }
      setInterim(finalTranscript + interimText)
    }

    recognition.onend = () => {
      const raw = finalTranscript.trim()
      if (!raw) {
        setPhase('idle')
        return
      }
      generateNote(raw)
    }

    recognitionRef.current = recognition
    recognition.start()
  }

  const stopVoice = () => recognitionRef.current?.stop?.()

  const submitTextInput = () => {
    const raw = textInput.trim()
    if (!raw) return
    setShowTextInput(false)
    setTextInput('')
    setFinalNote(null)
    setSaved(false)
    setClinicalInsight(null)
    setRehabPhases([])
    generateNote(raw)
  }

  const updateField = (field: string, value: string) => {
    setFinalNote((prev: any) => (prev ? { ...prev, [field]: value } : prev))
  }

  const updateExerciseDosing = (key: string, field: string, value: string) => {
    setExerciseEntries((prev) =>
      prev.map((ex: any, i: number) => {
        const exKey = ex.internal_id || String(i)
        if (exKey !== key) return ex
        const numFields = ['sets', 'reps', 'duration_seconds', 'frequency_per_week']
        const parsedValue = numFields.includes(field)
          ? value === '' ? null : Number(value)
          : value
        return { ...ex, dosing: { ...ex.dosing, [field]: parsedValue } }
      })
    )
  }

  const removeExercise = (key: string) => {
    setExerciseEntries((prev) =>
      prev.filter((ex: any, i: number) => (ex.internal_id || String(i)) !== key)
    )
  }

  const searchExerciseDb = async (query: string) => {
    setExerciseSearchQuery(query)
    if (!query.trim()) {
      setExerciseSearchResults([])
      return
    }
    setExerciseSearching(true)
    try {
      const res = await fetch(`/api/exercise-search?q=${encodeURIComponent(query.trim())}`)
      const data = await res.json()
      setExerciseSearchResults(data.exercises || [])
    } catch (err) {
      console.error('Errore ricerca esercizio:', err)
      setExerciseSearchResults([])
    } finally {
      setExerciseSearching(false)
    }
  }

  const addExerciseToList = (entry: any) => {
    setExerciseEntries((prev) => [
      ...prev,
      {
        ...entry,
        internal_id: `${entry.internal_id}-${Date.now()}`,
        source_type: 'professional',
        dosing: {
          sets: null,
          reps: null,
          duration_seconds: null,
          frequency_per_week: null,
          notes: null,
        },
        clinical_check: null,
      },
    ])
    setShowAddExercise(false)
    setExerciseSearchQuery('')
    setExerciseSearchResults([])
  }

  const askPhygoAI = async () => {
    if (!askQuestion.trim()) return
    setAskLoading(true)
    setAskAnswer(null)
    try {
      const noteContext = finalNote
        ? `Subjective: ${finalNote.subjective || ''}. Objective: ${finalNote.objective || ''}. Assessment: ${finalNote.assessment || ''}. Plan: ${finalNote.plan || ''}.`
        : ''
      const res = await fetch('/api/ask-phygo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: askQuestion, noteContext }),
      })
      const data = await res.json()
      setAskAnswer(data.answer || 'Could not generate an answer.')
    } catch (err) {
      console.error('Errore ask-phygo:', err)
      setAskAnswer('Error during the request. Please try again.')
    } finally {
      setAskLoading(false)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    setScanSummary(null)
    setScanAnalyzing(true)

    const fileArray = Array.from(files)
    setUploadedFileNames(fileArray.map((f) => f.name))
    const readers = fileArray.map(
      (file) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(file)
        })
    )

    Promise.all(readers)
      .then(async (base64Images) => {
        try {
          const res = await fetch('/api/analyze-scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              images: base64Images,
              language: recordingLang,
              context: [finalNote?.subjective, finalNote?.assessment, finalNote?.plan, clinicalContext]
                .filter(Boolean)
                .join(' '),
            }),
          })
          const data = await res.json()
          setScanSummary(data.summary || 'Could not analyze document.')
        } catch (err) {
          console.error('Scan analysis failed:', err)
          setScanSummary('Could not analyze document.')
        } finally {
          setScanAnalyzing(false)
        }
      })
      .catch((err) => {
        console.error('Failed to read files:', err)
        setScanAnalyzing(false)
      })
  }

  const saveNote = async () => {
    if (!finalNote) return
    setSaving(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setSaving(false)
      return
    }

    const { error } = await supabase.from('notes').insert({
      patient_id: patientId,
      user_id: user.id,
      subjective: finalNote.subjective || null,
      objective: finalNote.objective || null,
      assessment: finalNote.assessment || null,
      plan: finalNote.plan || null,
      exercises: finalNote.exercises || null,
      summary_for_patient: finalNote.summaryForPatient || null,
      language: finalNote.language || null,
    })

    if (!error) {
      setSaved(true)
    }
    setSaving(false)
  }

  if (loadingPatient) {
    return (
      <div className="relative min-h-screen bg-white dark:bg-[#08090b]">
        <Navbar />
        <div className="pt-40 text-center text-ink/40 dark:text-white/40">Loading...</div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-white dark:bg-[#08090b] overflow-hidden transition-colors">
      <Navbar />

      <div
        className="pointer-events-none absolute -top-60 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full opacity-20 dark:opacity-25 blur-[140px]"
        style={{
          background: 'radial-gradient(circle, rgba(79,124,255,0.6) 0%, rgba(50,214,160,0.5) 100%)',
        }}
      />

      <div className="relative max-w-4xl mx-auto pt-40 pb-20 px-6">
        <button
          onClick={() => router.push(`/dashboard/patients/${patientId}`)}
          className="flex items-center gap-1.5 text-sm text-ink/50 dark:text-white/50 hover:text-ink dark:hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft size={15} />
          Back to {patient?.name || 'patient'}
        </button>

        <div className="flex items-start justify-between mb-10">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#4F7CFF] mb-3">
              New session note
            </p>
            <h1 className="font-display text-4xl font-bold tracking-tight text-ink dark:text-white">
              {patient?.name}
            </h1>
          </div>

          <select
            value={recordingLang}
            onChange={(e) => setRecordingLang(e.target.value)}
            className="text-[12px] rounded-lg border border-black/15 dark:border-white/10 bg-black/[0.03] dark:bg-white/10 px-2 py-1.5"
          >
            <option value="it-IT">🇮🇹 Italiano</option>
            <option value="en-US">🇬🇧 English</option>
            <option value="es-ES">🇪🇸 Español</option>
            <option value="fr-FR">🇫🇷 Français</option>
          </select>
        </div>

        {phase === 'idle' && !finalNote && (
          <div className="rounded-[28px] border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl p-10 text-center">
            <p className="text-sm text-ink/50 dark:text-white/50 mb-6">
              Record the session or write your notes directly.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              {voiceSupported && (
                <button
                  onClick={startVoice}
                  className="flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_30px_rgba(79,124,255,0.35)] transition-transform hover:scale-105"
                  style={{ background: 'linear-gradient(90deg, #4F7CFF 0%, #32D6A0 100%)' }}
                >
                  <Mic size={16} />
                  Start Recording
                </button>
              )}
              <button
                onClick={() => setShowTextInput(!showTextInput)}
                className="flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-transform hover:scale-105"
                style={{
                  background: 'rgba(79,124,255,0.16)',
                  color: '#4F7CFF',
                  border: '1.5px solid rgba(79,124,255,0.35)',
                }}
              >
                <FileText size={16} />
                Write instead
              </button>
            </div>

            {aiError && <p className="mt-4 text-xs text-red-500">{aiError}</p>}

            {showTextInput && (
              <div className="mt-6 text-left space-y-3">
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Write your session notes here..."
                  rows={5}
                  className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/5 p-3 text-sm outline-none focus:border-[#4F7CFF]"
                />
                <button
                  onClick={submitTextInput}
                  disabled={!textInput.trim()}
                  className="rounded-full px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                  style={{ background: 'linear-gradient(90deg, #4F7CFF 0%, #32D6A0 100%)' }}
                >
                  Generate note
                </button>
              </div>
            )}
          </div>
        )}

        {phase === 'listening' && (
          <div className="rounded-[28px] border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl p-10 text-center">
            <motion.span
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full text-white"
              style={{ background: 'linear-gradient(135deg, #4F7CFF 0%, #32D6A0 100%)' }}
            >
              <Mic size={24} />
            </motion.span>
            <p className="text-sm italic text-ink/60 dark:text-white/60 mb-6 min-h-[40px]">
              {interim || 'Listening...'}
            </p>
            <button
              onClick={stopVoice}
              className="inline-flex items-center gap-2 rounded-full bg-ink dark:bg-white text-white dark:text-ink px-6 py-3 text-sm font-semibold"
            >
              <Square size={13} fill="currentColor" />
              Stop Recording
            </button>
          </div>
        )}

        {phase === 'processing' && (
          <div className="rounded-[28px] border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl p-10 text-center">
            <p className="text-sm text-ink/50 dark:text-white/50">Generating clinical documentation...</p>
          </div>
        )}

        {phase === 'done' && finalNote && (
          <div className="space-y-4">
            {[
              { label: 'Subjective', field: 'subjective' },
              { label: 'Objective', field: 'objective' },
              { label: 'Assessment', field: 'assessment' },
              { label: 'Plan', field: 'plan' },
            ].map((section) => (
              <div
                key={section.field}
                className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl p-5"
              >
                <p className="text-xs font-semibold tracking-[0.15em] uppercase text-[#4F7CFF] mb-2">
                  {section.label}
                </p>
                <p
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => updateField(section.field, e.currentTarget.textContent || '')}
                  className="text-sm text-ink/70 dark:text-white/70 leading-relaxed outline-none rounded px-1 -mx-1 focus:bg-black/5 dark:focus:bg-white/10 cursor-text"
                >
                  {finalNote[section.field] || '—'}
                </p>
              </div>
            ))}

            <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-semibold tracking-[0.15em] uppercase text-[#4F7CFF]">
                  Exercises
                </p>
                <button
                  onClick={() => setShowAddExercise((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold"
                  style={{
                    background: 'rgba(79,124,255,0.12)',
                    color: '#4F7CFF',
                  }}
                >
                  {showAddExercise ? <X size={12} /> : <Plus size={12} />}
                  {showAddExercise ? 'Cancel' : 'Add exercise'}
                </button>
              </div>

              {showAddExercise && (
                <div className="mb-4 rounded-2xl bg-black/[0.03] dark:bg-white/5 p-4">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30 dark:text-white/30" />
                    <input
                      type="text"
                      value={exerciseSearchQuery}
                      onChange={(e) => searchExerciseDb(e.target.value)}
                      placeholder="Search exercises (e.g. plank, bridge, squat)..."
                      autoFocus
                      className="w-full text-sm rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-white/10 pl-9 pr-3 py-2 outline-none focus:border-[#4F7CFF]"
                    />
                  </div>
                  {exerciseSearching && (
                    <p className="text-xs text-ink/40 dark:text-white/40 mt-2">Searching...</p>
                  )}
                  {!exerciseSearching && exerciseSearchQuery && exerciseSearchResults.length === 0 && (
                    <p className="text-xs text-ink/40 dark:text-white/40 mt-2">No exercises found.</p>
                  )}
                  {exerciseSearchResults.length > 0 && (
                    <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
                      {exerciseSearchResults.map((result: any) => (
                        <div
                          key={result.internal_id}
                          onClick={() => addExerciseToList(result)}
                          className="flex items-center gap-3 rounded-xl bg-white dark:bg-white/10 p-2.5 cursor-pointer hover:bg-[#4F7CFF]/5 dark:hover:bg-[#4F7CFF]/10 transition-colors"
                        >
                          {result.media?.image_url ? (
                            <img
                              src={result.media.image_url}
                              alt={result.name}
                              className="h-10 w-10 rounded-lg object-cover shrink-0 bg-black/5 dark:bg-white/10"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-lg shrink-0 bg-black/5 dark:bg-white/10" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-ink dark:text-white truncate">
                              {result.name}
                            </p>
                            {result.primary_muscle && (
                              <p className="text-[10px] text-ink/40 dark:text-white/40">
                                {result.primary_muscle}
                              </p>
                            )}
                          </div>
                          <Plus size={14} className="text-[#4F7CFF] shrink-0" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {exerciseEntries.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {exerciseEntries.map((ex: any, i: number) => {
                    const key = ex.internal_id || String(i)
                    const isOpen = expandedExercise === key
                    const isEditing = editingExercise === key
                    const hasDetails = ex.description || (Array.isArray(ex.instructions) && ex.instructions.length > 0)
                    return (
                      <div
                        key={key}
                        className={`rounded-2xl bg-black/[0.03] dark:bg-white/5 p-4 flex flex-col gap-3 ${(isOpen || isEditing) ? 'sm:col-span-2' : ''}`}
                      >
                        <div className="flex gap-3">
                          <div
                            onClick={() => !isEditing && hasDetails && setExpandedExercise(isOpen ? null : key)}
                            className={`flex gap-3 flex-1 min-w-0 ${!isEditing && hasDetails ? 'cursor-pointer' : ''}`}
                          >
                            {ex.media?.image_url ? (
                              <img
                                src={ex.media.image_url}
                                alt={ex.name}
                                className="h-16 w-16 rounded-xl object-cover shrink-0 bg-black/5 dark:bg-white/10"
                              />
                            ) : (
                              <div className="h-16 w-16 rounded-xl shrink-0 bg-black/5 dark:bg-white/10 flex items-center justify-center text-[10px] text-ink/30 dark:text-white/30 text-center px-1">
                                No image
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-ink dark:text-white truncate">
                                {ex.name}
                              </p>
                              {ex.primary_muscle && (
                                <p className="text-[11px] text-ink/40 dark:text-white/40 mt-0.5">
                                  {ex.primary_muscle}
                                </p>
                              )}
                              {!isEditing && (ex.dosing?.sets || ex.dosing?.reps || ex.dosing?.duration_seconds) && (
                                <p className="text-[11px] text-ink/50 dark:text-white/50 mt-1">
                                  {ex.dosing?.sets && `${ex.dosing.sets} sets`}
                                  {ex.dosing?.sets && ex.dosing?.reps && ' × '}
                                  {ex.dosing?.reps && `${ex.dosing.reps} reps`}
                                  {ex.dosing?.duration_seconds && ` · ${ex.dosing.duration_seconds}s`}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-1.5">
                                {ex.provider === 'custom' && (
                                  <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400">
                                    Custom exercise
                                  </span>
                                )}
                                {!isEditing && hasDetails && (
                                  <span className="text-[10px] font-medium text-[#4F7CFF]">
                                    {isOpen ? 'Hide details ▲' : 'How to do it ▼'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-start gap-1 shrink-0">
                            <button
                              onClick={() => setEditingExercise(isEditing ? null : key)}
                              className="p-1.5 rounded-lg text-ink/40 dark:text-white/40 hover:bg-black/5 dark:hover:bg-white/10 hover:text-[#4F7CFF] transition-colors"
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              onClick={() => removeExercise(key)}
                              className="p-1.5 rounded-lg text-ink/40 dark:text-white/40 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        {isEditing && (
                          <div className="pt-2 border-t border-black/5 dark:border-white/10 grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] text-ink/40 dark:text-white/40">Sets</label>
                              <input
                                type="number"
                                value={ex.dosing?.sets ?? ''}
                                onChange={(e) => updateExerciseDosing(key, 'sets', e.target.value)}
                                className="w-full text-xs rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-white/10 px-2 py-1.5"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-ink/40 dark:text-white/40">Reps</label>
                              <input
                                type="number"
                                value={ex.dosing?.reps ?? ''}
                                onChange={(e) => updateExerciseDosing(key, 'reps', e.target.value)}
                                className="w-full text-xs rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-white/10 px-2 py-1.5"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-ink/40 dark:text-white/40">Duration (s)</label>
                              <input
                                type="number"
                                value={ex.dosing?.duration_seconds ?? ''}
                                onChange={(e) => updateExerciseDosing(key, 'duration_seconds', e.target.value)}
                                className="w-full text-xs rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-white/10 px-2 py-1.5"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-ink/40 dark:text-white/40">Freq/week</label>
                              <input
                                type="number"
                                value={ex.dosing?.frequency_per_week ?? ''}
                                onChange={(e) => updateExerciseDosing(key, 'frequency_per_week', e.target.value)}
                                className="w-full text-xs rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-white/10 px-2 py-1.5"
                              />
                            </div>
                            <div className="col-span-2">
                              <label className="text-[10px] text-ink/40 dark:text-white/40">Notes</label>
                              <textarea
                                value={ex.dosing?.notes ?? ''}
                                onChange={(e) => updateExerciseDosing(key, 'notes', e.target.value)}
                                rows={2}
                                className="w-full text-xs rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-white/10 px-2 py-1.5"
                              />
                            </div>
                            <button
                              onClick={() => setEditingExercise(null)}
                              className="col-span-2 mt-1 rounded-full px-4 py-1.5 text-[11px] font-semibold text-white self-start"
                              style={{ background: 'linear-gradient(90deg, #4F7CFF 0%, #32D6A0 100%)' }}
                            >
                              Done
                            </button>
                          </div>
                        )}

                        {!isEditing && isOpen && hasDetails && (
                          <div className="pt-2 border-t border-black/5 dark:border-white/10">
                            {ex.description && (
                              <p className="text-xs text-ink/60 dark:text-white/60 leading-relaxed">
                                {ex.description}
                              </p>
                            )}
                            {Array.isArray(ex.instructions) && ex.instructions.length > 0 && (
                              <ol className="mt-2 text-xs text-ink/60 dark:text-white/60 leading-relaxed space-y-1 list-decimal list-inside">
                                {ex.instructions.map((step: string, j: number) => (
                                  <li key={j}>{step}</li>
                                ))}
                              </ol>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : Array.isArray(finalNote.exercises) && finalNote.exercises.length > 0 && (
                <ul className="text-sm text-ink/70 dark:text-white/70 leading-relaxed space-y-1">
                  {finalNote.exercises.map((ex: string, i: number) => (
                    <li key={i}>• {ex}</li>
                  ))}
                </ul>
              )}
            </div>

            {clinicalInsight && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-[24px] border border-[#0F1B2E]/10 dark:border-white/10 bg-gradient-to-br from-[#0F1B2E]/[0.02] to-white dark:from-white/[0.02] dark:to-white/[0.03] p-6"
              >
                <div className="flex items-start justify-between mb-5 gap-3">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                      Clinical Insights
                    </span>
                    <h4 className="mt-1 text-base font-semibold text-ink dark:text-white">
                      {clinicalInsight.condition_name}
                    </h4>
                  </div>
                  {evidenceLevel && (
                    <span className="shrink-0 rounded-full bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                      {evidenceLevel === 'high' ? '★★★★☆ Strong' : '★★★☆☆ Moderate'}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="flex gap-3">
                    <Target size={16} className="mt-0.5 shrink-0 text-[#4F7CFF]" />
                    <div>
                      <p className="text-xs font-semibold text-ink/50 dark:text-white/50 mb-1">Goals</p>
                      <p className="text-sm text-ink/70 dark:text-white/70 leading-relaxed">{clinicalInsight.goals}</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Stethoscope size={16} className="mt-0.5 shrink-0 text-[#4F7CFF]" />
                    <div>
                      <p className="text-xs font-semibold text-ink/50 dark:text-white/50 mb-1">Clinical Tests</p>
                      <p className="text-sm text-ink/70 dark:text-white/70 leading-relaxed">{clinicalInsight.clinical_tests}</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-500" />
                    <div>
                      <p className="text-xs font-semibold text-ink/50 dark:text-white/50 mb-1">Red Flags</p>
                      <p className="text-sm text-ink/70 dark:text-white/70 leading-relaxed">{clinicalInsight.red_flags}</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Dumbbell size={16} className="mt-0.5 shrink-0 text-[#4F7CFF]" />
                    <div>
                      <p className="text-xs font-semibold text-ink/50 dark:text-white/50 mb-1">Typical Exercises</p>
                      <p className="text-sm text-ink/70 dark:text-white/70 leading-relaxed">{clinicalInsight.typical_exercises}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-black/5 dark:border-white/10">
                  <p className="font-mono text-[11px] tracking-tight text-ink/45 dark:text-white/45">
                    {clinicalInsight.source} ({clinicalInsight.source_date}) — Clinical decision support, not a diagnosis.
                  </p>
                </div>

                <div className="mt-4">
                  <button
                    onClick={() => setShowAskPhygo((prev) => !prev)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4F7CFF] hover:underline"
                  >
                    <Sparkles size={12} />
                    Ask Phygo AI for more insight
                  </button>
                  {showAskPhygo && (
                    <div className="mt-3 space-y-2 rounded-2xl bg-black/[0.03] dark:bg-white/5 p-4">
                      <textarea
                        value={askQuestion}
                        onChange={(e) => setAskQuestion(e.target.value)}
                        placeholder="e.g. What else should I consider for this case?"
                        className="w-full rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-white/10 p-2.5 text-xs text-ink/80 dark:text-white/80 focus:outline-none focus:ring-2 focus:ring-[#4F7CFF]/30"
                        rows={2}
                      />
                      <button
                        onClick={askPhygoAI}
                        disabled={askLoading}
                        className="rounded-full bg-ink dark:bg-white px-4 py-1.5 text-[11px] font-semibold text-white dark:text-ink disabled:opacity-50"
                      >
                        {askLoading ? 'Thinking...' : 'Ask'}
                      </button>
                      {askAnswer && (
                        <p className="text-xs text-ink/70 dark:text-white/70 whitespace-pre-line leading-relaxed pt-1">
                          {askAnswer}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {rehabPhases.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-[24px] border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl p-6"
              >
                <span className="text-xs font-semibold tracking-[0.15em] uppercase text-[#4F7CFF] mb-4 block">
                  Rehab Protocol
                </span>
                                <div className="grid gap-4 sm:grid-cols-3">
                  {rehabPhases.map((p) => (
                    <div
                      key={p.id}
                      className={`rounded-2xl bg-black/[0.03] dark:bg-white/5 p-4 ${
                        (p.phase_exercises?.length || 0) > 300 ? 'sm:col-span-3' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#4F7CFF] text-[11px] font-bold text-white">
                          {p.phase_number}
                        </span>
                        <p className="text-sm font-semibold text-ink dark:text-white">{p.phase_name}</p>
                      </div>
                      <p className="text-[11px] text-ink/40 dark:text-white/40 mb-3">{p.typical_duration}</p>
                      <p className="text-xs text-ink/60 dark:text-white/60 leading-relaxed mb-2">
                        <span className="font-medium">Goals: </span>
                        {p.phase_goals}
                      </p>
                      <p className="text-xs text-ink/60 dark:text-white/60 leading-relaxed mb-2">
                        <span className="font-medium">Exercises: </span>
                        <span className="whitespace-pre-line">{formatPhaseText(p.phase_exercises)}</span>
                      </p>
                      <p className="text-[11px] text-ink/40 dark:text-white/40 leading-relaxed">
                        <span className="font-medium">Progress when: </span>
                        {p.criteria_to_progress}
                      </p>
                    </div>
                  ))}
                </div>

              </motion.div>
            )}

            <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl p-5 space-y-3">
              <input
                type="text"
                value={clinicalContext}
                onChange={(e) => setClinicalContext(e.target.value)}
                placeholder="Clinical context (optional): e.g. suspected osteoarthritis, acute trauma"
                className="w-full text-[12px] rounded-lg border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/10 px-3 py-2"
              />
              <label
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold cursor-pointer"
                style={{
                  background: 'rgba(50,214,160,0.10)',
                  color: '#1a9c74',
                  border: '1px solid rgba(50,214,160,0.22)',
                }}
              >
                <ImagePlus size={14} />
                Upload scan
                <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
              </label>

              {uploadedFileNames.length > 0 && (
                <p className="text-[11px] text-ink/50 dark:text-white/50">
                  {uploadedFileNames.length === 1
                    ? `1 file: ${uploadedFileNames[0]}`
                    : `${uploadedFileNames.length} files: ${uploadedFileNames.join(', ')}`}
                </p>
              )}
              {scanAnalyzing && (
                <span className="text-[11px] text-ink/50 dark:text-white/50 italic">Analyzing document...</span>
              )}
              {scanSummary && !scanAnalyzing && (
                <div
                  className="mt-2 w-full rounded-xl px-3.5 py-2.5 text-[12px] leading-relaxed"
                  style={{ background: 'rgba(50,214,160,0.06)', border: '1px solid rgba(50,214,160,0.18)' }}
                >
                  <span className="font-semibold text-[11px] uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                    Document summary
                  </span>
                  <p className="mt-1 whitespace-pre-line">{scanSummary}</p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={saveNote}
                disabled={saving || saved}
                className="flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_30px_rgba(79,124,255,0.35)] transition-transform hover:scale-105 disabled:opacity-60"
                style={{ background: 'linear-gradient(90deg, #4F7CFF 0%, #32D6A0 100%)' }}
              >
                {saved ? <CheckCircle2 size={16} /> : <Save size={16} />}
                {saved ? 'Saved' : saving ? 'Saving...' : 'Save note'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
