'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { motion } from 'framer-motion'
import { ArrowLeft, Camera, Plus, X, Loader2, Check, Award, GraduationCap, Stethoscope } from 'lucide-react'
import Navbar from '@/components/Navbar'
import ProfessionalVerificationCard, { type VerificationSummary } from '@/components/ProfessionalVerificationCard'
import VerificationBadge from '@/components/VerificationBadge'
import { useUiStrings } from '@/contexts/LanguageContext'
import { useRoleUi, type PracticeStage } from '@/lib/i18n/roleStrings'
import { lazy } from '@/lib/lazy'
import { PageBackdrop } from '@/components/ui/premium'

const supabase = lazy(() => createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
))

type Credential = { id: string; label: string }

export default function ProfilePage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const ui = useUiStrings()
  const t = ui.profilePage
  const common = ui.common
  const roleUi = useRoleUi()

  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [saved, setSaved] = useState(false)

  // "Become a Professional" transition (see sql/2026-09_role_aware.sql) — a
  // Student account keeps its whole Workspace, folders, documents, notebooks
  // and preferences; only practice_stage changes, which unlocks Patients and
  // Agenda in the main navigation (components/Navbar.tsx, middleware.ts).
  const [practiceStage, setPracticeStage] = useState<PracticeStage>('professional')
  const [confirmingActivate, setConfirmingActivate] = useState(false)
  const [activating, setActivating] = useState(false)
  const [activated, setActivated] = useState(false)

  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [verification, setVerification] = useState<VerificationSummary | null>(null)
  const [showVerification, setShowVerification] = useState(false)
  const [credentials, setCredentials] = useState<Credential[]>([])
  const [newCredential, setNewCredential] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUserId(user.id)

      const { data } = await supabase
        .from('profiles')
        .select('display_name, bio, avatar_url, credentials, practice_stage')
        .eq('id', user.id)
        .single()

      if (data) {
        setDisplayName(data.display_name || user.user_metadata?.display_name || '')
        setBio(data.bio || '')
        setAvatarUrl(data.avatar_url || null)
        setCredentials(Array.isArray(data.credentials) ? data.credentials : [])
        if (data.practice_stage === 'student' || data.practice_stage === 'professional') {
          setPracticeStage(data.practice_stage)
        }
      }
      setLoading(false)
    }
    load()
  }, [router])

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !userId) return

    setUploadingAvatar(true)
    const fileExt = file.name.split('.').pop()
    const filePath = `${userId}/avatar.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true })

    if (!uploadError) {
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
      setAvatarUrl(`${data.publicUrl}?t=${Date.now()}`)
    }
    setUploadingAvatar(false)
  }

  const addCredential = () => {
    if (!newCredential.trim()) return
    setCredentials([...credentials, { id: crypto.randomUUID(), label: newCredential.trim() }])
    setNewCredential('')
  }

  const removeCredential = (id: string) => {
    setCredentials(credentials.filter((c) => c.id !== id))
  }

  const handleSave = async () => {
    if (!userId) return
    setSaving(true)

    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: displayName || null,
        bio: bio || null,
        avatar_url: avatarUrl,
        credentials,
      })
      .eq('id', userId)

    if (!error) {
      await supabase.auth.updateUser({ data: { display_name: displayName } })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
    setSaving(false)
  }

  const handleActivateProfessional = async () => {
    if (!userId) return
    setActivating(true)
    const { error } = await supabase
      .from('profiles')
      .update({ practice_stage: 'professional' })
      .eq('id', userId)

    if (!error) {
      setPracticeStage('professional')
      setConfirmingActivate(false)
      setActivated(true)
      setTimeout(() => setActivated(false), 2500)
    }
    setActivating(false)
  }

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/)
    if (!parts[0]) return '··'
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  if (loading) {
    return (
      <div className="relative min-h-screen bg-[#f7f7f8] dark:bg-[#050608]">
        <Navbar />
        <div className="pt-40 text-center text-ink/55 dark:text-white/40">{common.loading}</div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-[#f7f7f8] dark:bg-[#050608] overflow-hidden transition-colors">
      <Navbar />

      <PageBackdrop />

      <div className="relative max-w-2xl mx-auto pt-40 pb-24 px-6">
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-1.5 text-sm text-ink/60 dark:text-white/50 hover:text-ink dark:hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft size={15} />
          {common.backToPatients}
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full border border-[#7C83FF]/20 dark:border-[#7C83FF]/25 bg-gradient-to-r from-[#7C83FF]/[0.07] to-[#A78BFA]/[0.07] backdrop-blur-xl text-[11px] font-semibold tracking-[0.15em] uppercase mb-3">
            <span className="bg-gradient-to-r from-[#7C83FF] to-[#A78BFA] bg-clip-text text-transparent">{t.eyebrow}</span>
          </div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-ink dark:text-white">
            {t.heading}
          </h1>
          <p className="mt-2 text-sm text-ink/60 dark:text-white/50 max-w-md leading-relaxed">
            {t.subtitle}
          </p>
        </motion.div>

        <div className="flex items-center gap-5 mb-10">
          <div className="relative">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Profile"
                className="h-20 w-20 rounded-full object-cover shadow-lg"
              />
            ) : (
              <div
                className="flex h-20 w-20 items-center justify-center rounded-full text-white text-xl font-bold shadow-lg"
                style={{ background: 'linear-gradient(135deg, #7C83FF 0%, #8B5CF6 100%)' }}
              >
                {getInitials(displayName)}
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-white dark:bg-[#12131a] border border-black/10 dark:border-white/10 shadow-md text-ink/60 dark:text-white/60 hover:text-ink dark:hover:text-white transition-colors"
            >
              {uploadingAvatar ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>
          <div>
            <p className="text-sm font-semibold text-ink dark:text-white">{t.photoLabel}</p>
            <p className="text-xs text-ink/55 dark:text-white/40">{t.photoHint}</p>
            <div className="mt-2">
              <VerificationBadge
                summary={verification && { ...verification, practiceStage }}
                expanded={showVerification}
                onClick={verification?.status === 'verified' ? () => setShowVerification((s) => !s) : undefined}
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="text-sm font-medium text-ink/60 dark:text-white/50">
              {t.displayNameLabel}
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={t.displayNamePlaceholder}
              className="w-full mt-1.5 rounded-xl border border-black/10 dark:border-white/10 bg-white/85 dark:bg-white/[0.02] px-4 py-3 outline-none transition focus:border-[#8B95FF] focus:ring-4 focus:ring-[#8B95FF]/15 text-ink dark:text-white"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-ink/60 dark:text-white/50">
              {t.bioLabel}
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              placeholder={t.bioPlaceholder}
              className="w-full mt-1.5 rounded-xl border border-black/10 dark:border-white/10 bg-white/85 dark:bg-white/[0.02] px-4 py-3 outline-none transition focus:border-[#8B95FF] focus:ring-4 focus:ring-[#8B95FF]/15 text-ink dark:text-white resize-none"
            />
          </div>

          {/* The registration number is submitted for review here, never saved
              directly from the browser: only PHYGO can mark it verified. */}
          {/* Only the badge next to the photo by default: students never see the
              card (verification is for qualified physiotherapists), and once
              verified it collapses into the badge, which reopens it. A student
              who switches to professional sees it right away. */}
          <ProfessionalVerificationCard
            onChange={setVerification}
            hidden={practiceStage === 'student' || (verification?.status === 'verified' && !showVerification)}
          />

          <div>
            <label className="text-sm font-medium text-ink/60 dark:text-white/50 mb-2 block">
              {t.credentialsLabel}
            </label>
            <div className="space-y-2 mb-3">
              {credentials.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-3 rounded-xl border border-black/[0.09] dark:border-white/10 bg-white/95 dark:bg-white/[0.03] px-4 py-2.5"
                >
                  <Award size={14} className="text-[#7C83FF] shrink-0" />
                  <span className="text-sm text-ink dark:text-white flex-1">{c.label}</span>
                  <button
                    onClick={() => removeCredential(c.id)}
                    className="text-ink/30 dark:text-white/30 hover:text-red-500 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newCredential}
                onChange={(e) => setNewCredential(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCredential()}
                placeholder={t.credentialPlaceholder}
                className="flex-1 rounded-xl border border-black/10 dark:border-white/10 bg-white/85 dark:bg-white/[0.02] px-4 py-2.5 text-sm outline-none transition focus:border-[#8B95FF] focus:ring-4 focus:ring-[#8B95FF]/15 text-ink dark:text-white"
              />
              <button
                onClick={addCredential}
                className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-[#7C83FF] border border-[#7C83FF]/30 hover:bg-[#7C83FF]/10 transition-colors"
              >
                <Plus size={14} />
                {t.add}
              </button>
            </div>
          </div>

          {practiceStage === 'student' && (
            <div className="rounded-2xl border border-[#32D6A0]/25 bg-[#32D6A0]/[0.05] p-5">
              <label className="text-sm font-medium text-ink/60 dark:text-white/60 flex items-center gap-1.5">
                <Stethoscope size={14} className="text-[#32D6A0]" />
                {roleUi.transition.sectionTitle}
              </label>
              <p className="mt-2 text-sm text-ink/70 dark:text-white/70">{roleUi.transition.prompt}</p>

              {!confirmingActivate ? (
                <button
                  onClick={() => setConfirmingActivate(true)}
                  className="mt-3 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white shadow-soft transition-transform hover:scale-[1.02]"
                  style={{ background: 'linear-gradient(90deg, #A78BFA 0%, #7C83FF 100%)' }}
                >
                  <GraduationCap size={14} />
                  {roleUi.transition.cta}
                </button>
              ) : (
                <div className="mt-3 rounded-xl border border-black/10 dark:border-white/10 bg-white/90 dark:bg-white/[0.03] p-4">
                  <p className="text-sm font-semibold text-ink dark:text-white">{roleUi.transition.confirmTitle}</p>
                  <p className="mt-1 text-xs text-ink/60 dark:text-white/50">{roleUi.transition.confirmBody}</p>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={handleActivateProfessional}
                      disabled={activating}
                      className="flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
                      style={{ background: 'linear-gradient(90deg, #A78BFA 0%, #7C83FF 100%)' }}
                    >
                      {activating && <Loader2 size={12} className="animate-spin" />}
                      {roleUi.transition.confirm}
                    </button>
                    <button
                      onClick={() => setConfirmingActivate(false)}
                      disabled={activating}
                      className="rounded-full px-4 py-2 text-xs font-semibold text-ink/60 dark:text-white/60 border border-black/10 dark:border-white/10"
                    >
                      {roleUi.transition.cancel}
                    </button>
                  </div>
                </div>
              )}

              {activated && (
                <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-[#32D6A0]">
                  <Check size={12} />
                  {roleUi.transition.activated}
                </p>
              )}
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold bg-ink text-white shadow-[0_10px_30px_-12px_rgba(15,23,42,0.55)] hover:bg-ink/90 dark:bg-white dark:text-ink dark:shadow-[0_10px_30px_-10px_rgba(255,255,255,0.25)] dark:hover:bg-white/90 transition-transform hover:scale-[1.01] disabled:opacity-60"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            {saved && <Check size={14} />}
            {saved ? common.saved : saving ? common.saving : t.saveProfile}
          </button>
        </div>
      </div>
    </div>
  )
}
