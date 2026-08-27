'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { motion } from 'framer-motion'
import { ArrowLeft, Camera, Plus, X, Loader2, Check, Award } from 'lucide-react'
import Navbar from '@/components/Navbar'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Credential = { id: string; label: string }

export default function ProfilePage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [saved, setSaved] = useState(false)

  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
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
        .select('display_name, bio, avatar_url, credentials')
        .eq('id', user.id)
        .single()

      if (data) {
        setDisplayName(data.display_name || user.user_metadata?.display_name || '')
        setBio(data.bio || '')
        setAvatarUrl(data.avatar_url || null)
        setCredentials(Array.isArray(data.credentials) ? data.credentials : [])
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

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/)
    if (!parts[0]) return '··'
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  if (loading) {
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
        style={{ background: 'radial-gradient(circle, rgba(79,124,255,0.6) 0%, rgba(50,214,160,0.5) 100%)' }}
      />

      <div className="relative max-w-2xl mx-auto pt-40 pb-24 px-6">
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-1.5 text-sm text-ink/50 dark:text-white/50 hover:text-ink dark:hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft size={15} />
          Back to patients
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#4F7CFF] mb-2">
            Your profile
          </p>
          <h1 className="font-display text-4xl font-bold tracking-tight text-ink dark:text-white">
            Profile
          </h1>
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
                style={{ background: 'linear-gradient(135deg, #4F7CFF 0%, #32D6A0 100%)' }}
              >
                {getInitials(displayName)}
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-white dark:bg-[#12131a] border border-black/10 dark:border-white/10 shadow-md text-ink/60 dark:text-white/60 hover:text-[#4F7CFF] transition-colors"
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
            <p className="text-sm font-semibold text-ink dark:text-white">Profile photo</p>
            <p className="text-xs text-ink/40 dark:text-white/40">Visible to your patients</p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="text-sm font-medium text-ink/50 dark:text-white/50">
              Display name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Dr. Andrea Stilfer"
              className="w-full mt-1.5 rounded-xl border border-black/10 dark:border-white/10 bg-white/50 dark:bg-white/[0.02] px-4 py-3 outline-none transition focus:border-[#4F7CFF] focus:ring-4 focus:ring-[#4F7CFF]/10 text-ink dark:text-white"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-ink/50 dark:text-white/50">
              Short bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              placeholder="A few lines about your approach and experience..."
              className="w-full mt-1.5 rounded-xl border border-black/10 dark:border-white/10 bg-white/50 dark:bg-white/[0.02] px-4 py-3 outline-none transition focus:border-[#4F7CFF] focus:ring-4 focus:ring-[#4F7CFF]/10 text-ink dark:text-white resize-none"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-ink/50 dark:text-white/50 mb-2 block">
              Courses & certifications
            </label>
            <div className="space-y-2 mb-3">
              {credentials.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-3 rounded-xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] px-4 py-2.5"
                >
                  <Award size={14} className="text-[#4F7CFF] shrink-0" />
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
                placeholder="e.g. Master in Pelvic Floor Rehabilitation"
                className="flex-1 rounded-xl border border-black/10 dark:border-white/10 bg-white/50 dark:bg-white/[0.02] px-4 py-2.5 text-sm outline-none transition focus:border-[#4F7CFF] focus:ring-4 focus:ring-[#4F7CFF]/10 text-ink dark:text-white"
              />
              <button
                onClick={addCredential}
                className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-[#4F7CFF] border border-[#4F7CFF]/30 hover:bg-[#4F7CFF]/10 transition-colors"
              >
                <Plus size={14} />
                Add
              </button>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold text-white shadow-[0_8px_30px_rgba(79,124,255,0.35)] transition-transform hover:scale-[1.01] disabled:opacity-60"
            style={{ background: 'linear-gradient(90deg, #4F7CFF 0%, #32D6A0 100%)' }}
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            {saved && <Check size={14} />}
            {saved ? 'Saved' : saving ? 'Saving...' : 'Save profile'}
          </button>
        </div>
      </div>
    </div>
  )
}
