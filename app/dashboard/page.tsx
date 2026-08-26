'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, User, Users, FileText, Activity, Search } from 'lucide-react'
import Link from 'next/link'
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
  gender: string | null
  created_at: string
}

const avatarGradient = (gender: string | null) => {
  if (gender === 'male') return 'linear-gradient(135deg, #4F7CFF 0%, #6E8FFF 100%)'
  if (gender === 'female') return 'linear-gradient(135deg, #F472B6 0%, #C084FC 100%)'
  return 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)'
}

export default function DashboardPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [condition, setCondition] = useState('')
  const [gender, setGender] = useState('')
  const [saving, setSaving] = useState(false)
  const [greeting, setGreeting] = useState('Welcome back')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const hour = new Date().getHours()
    const timeGreeting =
      hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

    supabase.auth.getUser().then(({ data: { user } }) => {
      const displayName = user?.user_metadata?.display_name
      setGreeting(displayName ? `${timeGreeting}, ${displayName}` : timeGreeting)
    })
  }, [])

  const loadPatients = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setPatients(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadPatients()
  }, [])

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setSaving(false)
      return
    }

    const { error } = await supabase.from('patients').insert({
      user_id: user.id,
      name,
      age: age ? parseInt(age) : null,
      main_condition: condition || null,
      gender: gender || null,
    })

    if (!error) {
      setName('')
      setAge('')
      setCondition('')
      setGender('')
      setShowForm(false)
      await loadPatients()
    }
    setSaving(false)
  }

  const filteredPatients = patients.filter((p) =>
    p.name.toLowerCase().includes(search.trim().toLowerCase())
  )

  return (
    <div className="relative min-h-screen bg-white dark:bg-[#08090b] overflow-hidden transition-colors">
      <Navbar />

      <div
        className="pointer-events-none absolute -top-60 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full opacity-20 dark:opacity-25 blur-[140px]"
        style={{
          background:
            'radial-gradient(circle, rgba(79,124,255,0.6) 0%, rgba(50,214,160,0.5) 100%)',
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.06] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' /%3E%3C/svg%3E\")",
        }}
      />

      <div className="relative max-w-4xl mx-auto pt-40 pb-20 px-6">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-start justify-between mb-12"
        >
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span
                className="h-1.5 w-1.5 rounded-full animate-pulse"
                style={{ background: 'linear-gradient(90deg, #4F7CFF, #32D6A0)' }}
              />
              <p className="text-xs font-semibold tracking-[0.25em] uppercase text-[#4F7CFF]">
                Dashboard
              </p>
            </div>
            <h1 className="font-display text-5xl sm:text-6xl font-bold tracking-tight leading-none text-ink dark:text-white">
              {greeting}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4F7CFF] to-[#32D6A0]">.</span>
            </h1>
            <p className="text-base text-ink/40 dark:text-white/40 mt-3">
              Here's your patient roster
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <Link
              href="/dashboard/agenda"
              className="flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-ink/70 dark:text-white/70 border border-black/10 dark:border-white/10 hover:border-[#4F7CFF]/40 transition-colors"
            >
              Schedule
            </Link>
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_30px_rgba(79,124,255,0.35)] transition-transform hover:scale-105"
              style={{
                background: 'linear-gradient(90deg, #4F7CFF 0%, #32D6A0 100%)',
              }}
            >
              {showForm ? <X size={16} /> : <Plus size={16} />}
              {showForm ? 'Cancel' : 'New patient'}
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-3 gap-4 mb-8"
        >
          {[
            { icon: Users, label: 'Patients', value: patients.length },
            { icon: FileText, label: 'Notes this month', value: 0 },
            { icon: Activity, label: 'Active plans', value: patients.length },
          ].map((stat, i) => (
            <div
              key={i}
              className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/60 dark:bg-white/[0.03] backdrop-blur-xl p-5 shadow-sm"
            >
              <stat.icon size={16} className="text-[#4F7CFF] mb-3" />
              <p className="font-display text-2xl font-bold text-ink dark:text-white">
                {stat.value}
              </p>
              <p className="text-xs text-ink/40 dark:text-white/40 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        <div className="flex items-center gap-2 mb-6 sm:hidden">
          <Link
            href="/dashboard/agenda"
            className="flex-1 flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-ink/70 dark:text-white/70 border border-black/10 dark:border-white/10"
          >
            Schedule
          </Link>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex-1 flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-lg"
            style={{ background: 'linear-gradient(90deg, #4F7CFF 0%, #32D6A0 100%)' }}
          >
            {showForm ? <X size={16} /> : <Plus size={16} />}
            {showForm ? 'Cancel' : 'New patient'}
          </button>
        </div>

        <div className="relative mb-8">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/30 dark:text-white/30" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search patients by name..."
            className="w-full rounded-full border border-black/[0.06] dark:border-white/10 bg-white/60 dark:bg-white/[0.03] backdrop-blur-xl pl-11 pr-4 py-3 text-sm outline-none transition focus:border-[#4F7CFF] focus:ring-4 focus:ring-[#4F7CFF]/10 text-ink dark:text-white"
          />
        </div>

        <AnimatePresence>
          {showForm && (
            <motion.form
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              onSubmit={handleCreatePatient}
              className="mb-10 rounded-[28px] border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.04] backdrop-blur-2xl shadow-2xl p-8 space-y-5 overflow-hidden"
            >
              <div>
                <label className="text-sm font-medium text-ink/50 dark:text-white/50">
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full mt-1.5 rounded-xl border border-black/10 dark:border-white/10 bg-white/50 dark:bg-white/[0.02] px-4 py-3 outline-none transition focus:border-[#4F7CFF] focus:ring-4 focus:ring-[#4F7CFF]/10 text-ink dark:text-white"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-ink/50 dark:text-white/50">
                  Gender
                </label>
                <div className="flex gap-2 mt-1.5">
                  {[
                    { value: 'male', label: 'Male' },
                    { value: 'female', label: 'Female' },
                    { value: '', label: 'Not specified' },
                  ].map((opt) => (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => setGender(opt.value)}
                      className={`rounded-full px-4 py-2 text-sm font-medium border transition-colors ${
                        gender === opt.value
                          ? 'text-white border-transparent'
                          : 'text-ink/50 dark:text-white/50 border-black/10 dark:border-white/10'
                      }`}
                      style={
                        gender === opt.value
                          ? { background: 'linear-gradient(90deg, #4F7CFF 0%, #32D6A0 100%)' }
                          : undefined
                      }
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-ink/50 dark:text-white/50">
                  Age
                </label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full mt-1.5 rounded-xl border border-black/10 dark:border-white/10 bg-white/50 dark:bg-white/[0.02] px-4 py-3 outline-none transition focus:border-[#4F7CFF] focus:ring-4 focus:ring-[#4F7CFF]/10 text-ink dark:text-white"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-ink/50 dark:text-white/50">
                  Main condition
                </label>
                <input
                  type="text"
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="w-full mt-1.5 rounded-xl border border-black/10 dark:border-white/10 bg-white/50 dark:bg-white/[0.02] px-4 py-3 outline-none transition focus:border-[#4F7CFF] focus:ring-4 focus:ring-[#4F7CFF]/10 text-ink dark:text-white"
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="rounded-full px-7 py-3 text-sm font-semibold text-white shadow-[0_8px_30px_rgba(79,124,255,0.35)] transition-transform hover:scale-105 disabled:opacity-60"
                style={{
                  background: 'linear-gradient(90deg, #4F7CFF 0%, #32D6A0 100%)',
                }}
              >
                {saving ? 'Saving...' : 'Save patient'}
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        {loading ? (
          <p className="text-ink/40 dark:text-white/40">Loading...</p>
        ) : patients.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-black/10 dark:border-white/15 py-20 text-center">
            <p className="text-ink/40 dark:text-white/40">
              No patients yet. Add one to get started.
            </p>
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-black/10 dark:border-white/15 py-16 text-center">
            <p className="text-ink/40 dark:text-white/40">
              No patients match "{search}".
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {filteredPatients.map((patient, i) => (
                <Link href={`/dashboard/patients/${patient.id}`} key={patient.id}>
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i, 20) * 0.03 }}
                    exit={{ opacity: 0 }}
                    className="group rounded-xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl px-4 py-3 flex items-center gap-3 shadow-sm transition-all hover:shadow-md hover:border-[#4F7CFF]/30 cursor-pointer"
                  >
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white shadow-sm"
                      style={{
                        background: avatarGradient(patient.gender),
                      }}
                    >
                      <User size={14} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink dark:text-white truncate">{patient.name}</p>
                      <p className="text-xs text-ink/50 dark:text-white/40 truncate">
                        {patient.age ? `${patient.age} years old` : ''}
                        {patient.age && patient.main_condition ? ' · ' : ''}
                        {patient.main_condition || ''}
                      </p>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}