'use client'

// My Phygo profile: the patient chooses the name they see, a photo (private
// bucket, see lib/myPhygo/avatar.ts) and a personal goal shown on their home.
// Only the patient's own profiles row is written (display_name, bio,
// avatar_url); the clinician's record of the patient is never touched.

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Camera, Check, Loader2, Trash2, UserRound } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import LanguageMenu from '@/components/LanguageMenu'
import { useMyPhygoStrings } from '@/lib/i18n/myPhygoStrings'
import { MyAvatar, myPhygoSupabase as supabase, useMyProfile } from '@/components/myPhygo/MyProfileContext'
import { AVATAR_TYPES, removeAvatar, uploadAvatar, type AvatarError } from '@/lib/myPhygo/avatar'
import { PageEyebrow, PRIMARY_BTN, SECONDARY_BTN, INPUT_FOCUS, SURFACE } from '@/components/ui/premium'

const NAME_MAX = 40
const GOAL_MAX = 140

export default function MyPhygoProfilePage() {
  const router = useRouter()
  const t = useMyPhygoStrings().profile
  const { lang, setLang } = useLanguage()
  const { userId, email, profile, photoUrl, reload } = useMyProfile()
  const [name, setName] = useState('')
  const [goal, setGoal] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle')
  const [photoBusy, setPhotoBusy] = useState(false)
  const [photoError, setPhotoError] = useState<AvatarError | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push('/my-phygo/login')
    })
  }, [router])

  useEffect(() => {
    if (profile && !loaded) {
      setName(profile.displayName ?? '')
      setGoal(profile.goal ?? '')
      setLoaded(true)
    }
  }, [profile, loaded])

  const photoMessage: Record<AvatarError, string> = { too_big: t.photoTooBig, unsupported: t.photoUnsupported, unavailable: t.photoUnavailable, failed: t.photoError }

  const onPickPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !userId) return
    setPhotoBusy(true)
    setPhotoError(null)
    const result = await uploadAvatar(supabase, userId, file)
    if ('error' in result) {
      setPhotoError(result.error)
    } else {
      const { error } = await supabase.from('profiles').update({ avatar_url: result.path }).eq('id', userId)
      if (error) setPhotoError('failed')
      else await reload()
    }
    setPhotoBusy(false)
  }

  const onRemovePhoto = async () => {
    if (!userId) return
    setPhotoBusy(true)
    setPhotoError(null)
    const removed = await removeAvatar(supabase, userId)
    const { error } = await supabase.from('profiles').update({ avatar_url: null }).eq('id', userId)
    if (!removed || error) setPhotoError('failed')
    await reload()
    setPhotoBusy(false)
  }

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return
    setSaving(true)
    setStatus('idle')
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: name.trim().slice(0, NAME_MAX) || null, bio: goal.trim().slice(0, GOAL_MAX) || null })
      .eq('id', userId)
    setSaving(false)
    if (error) {
      setStatus('error')
      return
    }
    await reload()
    setStatus('saved')
  }

  const label = 'mb-1.5 block text-sm font-medium text-ink/75 dark:text-white/70'
  const field = `w-full rounded-xl border border-black/[0.08] bg-white px-4 py-3 text-sm text-ink outline-none transition placeholder:text-ink/35 dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-white dark:placeholder:text-white/30 ${INPUT_FOCUS}`
  const hint = 'mt-1.5 text-xs leading-relaxed text-ink/50 dark:text-white/45'

  return (
    <div className="relative mx-auto max-w-2xl px-6 pb-24 pt-36">
      <Link
        href="/my-phygo/home"
        className="-ml-2 mb-4 flex w-fit min-h-[40px] items-center gap-1.5 rounded-full px-2 text-sm text-ink/60 transition-colors hover:text-ink dark:text-white/50 dark:hover:text-white"
      >
        <ArrowLeft size={15} aria-hidden />
        {t.backHome}
      </Link>

      <PageEyebrow icon={UserRound}>{t.eyebrow}</PageEyebrow>
      <h1 className="mt-1.5 font-display text-3xl font-semibold tracking-[-0.035em] text-ink dark:text-white sm:text-4xl">{t.title}</h1>
      <p className="mt-2 text-[15px] text-ink/60 dark:text-white/55">{t.subtitle}</p>

      <section className={`${SURFACE} mt-8 p-6 sm:p-7`} aria-labelledby="photo-heading">
        <h2 id="photo-heading" className="font-display text-base font-semibold text-ink dark:text-white">{t.photo}</h2>
        <div className="mt-4 flex flex-wrap items-center gap-5">
          <div className="relative" data-testid="profile-photo">
            <MyAvatar name={name || profile?.displayName || email} photoUrl={photoUrl} size={96} />
            {photoBusy && (
              <span className="absolute inset-0 grid place-items-center rounded-full bg-black/40 text-white">
                <Loader2 size={20} className="animate-spin" aria-hidden />
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={photoBusy || !userId}
                className={`inline-flex min-h-[40px] items-center gap-2 rounded-full px-4 text-sm font-semibold transition disabled:opacity-50 ${PRIMARY_BTN}`}
              >
                <Camera size={15} aria-hidden />
                {photoBusy ? t.uploading : photoUrl ? t.changePhoto : t.addPhoto}
              </button>
              {photoUrl && (
                <button
                  type="button"
                  onClick={onRemovePhoto}
                  disabled={photoBusy}
                  className={`inline-flex min-h-[40px] items-center gap-2 rounded-full px-4 text-sm font-semibold transition disabled:opacity-50 ${SECONDARY_BTN}`}
                >
                  <Trash2 size={14} aria-hidden />
                  {t.removePhoto}
                </button>
              )}
            </div>
            <p className={hint}>{t.photoHint}</p>
            {photoError && (
              <p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">
                {photoMessage[photoError]}
              </p>
            )}
            <input ref={fileRef} type="file" accept={AVATAR_TYPES.join(',')} onChange={onPickPhoto} className="hidden" data-testid="photo-input" />
          </div>
        </div>
      </section>

      <form onSubmit={onSave} className={`${SURFACE} mt-4 space-y-5 p-6 sm:p-7`}>
        <div>
          <label htmlFor="mp-name" className={label}>{t.nameLabel}</label>
          <input id="mp-name" value={name} maxLength={NAME_MAX} onChange={(e) => setName(e.target.value)} className={field} autoComplete="nickname" />
          <p className={hint}>{t.nameHint}</p>
        </div>
        <div>
          <label htmlFor="mp-goal" className={label}>{t.goalLabel}</label>
          <textarea id="mp-goal" value={goal} maxLength={GOAL_MAX} onChange={(e) => setGoal(e.target.value)} rows={2} placeholder={t.goalPlaceholder} className={`${field} resize-none`} />
          <div className="flex items-start justify-between gap-3">
            <p className={hint}>{t.goalHint}</p>
            <p className="mt-1.5 text-xs tabular-nums text-ink/40 dark:text-white/35">{goal.length}/{GOAL_MAX}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className={label}>{t.languageLabel}</span>
          <LanguageMenu value={lang} onChange={setLang} />
        </div>
        {email && (
          <div>
            <span className={label}>{t.emailLabel}</span>
            <p className="rounded-xl border border-black/[0.05] bg-black/[0.02] px-4 py-3 text-sm text-ink/60 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-white/55">{email}</p>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button type="submit" disabled={saving || !userId} className={`inline-flex min-h-[44px] items-center gap-2 rounded-full px-6 text-sm font-semibold transition disabled:opacity-50 ${PRIMARY_BTN}`}>
            {saving ? t.saving : t.save}
          </button>
          {status === 'saved' && (
            <span role="status" className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
              <Check size={15} aria-hidden />
              {t.saved}
            </span>
          )}
          {status === 'error' && <span role="alert" className="text-sm text-red-600 dark:text-red-400">{t.saveError}</span>}
        </div>
      </form>
    </div>
  )
}
