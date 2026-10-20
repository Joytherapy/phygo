'use client'

// The signed-in patient's own profile (name to show, goal, photo), shared by
// the portal bar, the home and the profile page so a change shows everywhere
// at once. Reads only the patient's own profiles row (RLS: own row).

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { lazy } from '@/lib/lazy'
import { avatarUrl } from '@/lib/myPhygo/avatar'

export const myPhygoSupabase = lazy(() => createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!))

export type MyProfile = { displayName: string | null; goal: string | null; avatarPath: string | null }

type Ctx = {
  userId: string | null
  email: string | null
  profile: MyProfile | null
  photoUrl: string | null
  /** The signed-in account owns patient records: it is a clinician's account,
   *  not a patient's. My Phygo then shows no patient data and never writes the
   *  shared profiles row (name, bio, photo of the professional profile). */
  isClinician: boolean | null
  /** Re-reads the profile (after a save) and refreshes the photo URL. */
  reload: () => Promise<void>
}

const MyProfileContext = createContext<Ctx>({ userId: null, email: null, profile: null, photoUrl: null, isClinician: null, reload: async () => {} })

export function MyProfileProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [profile, setProfile] = useState<MyProfile | null>(null)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [isClinician, setIsClinician] = useState<boolean | null>(null)

  const reload = useCallback(async () => {
    const supabase = myPhygoSupabase
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)
    setEmail(user.email ?? null)
    const [{ data }, { data: owned }] = await Promise.all([
      supabase.from('profiles').select('display_name, bio, avatar_url').eq('id', user.id).maybeSingle(),
      supabase.from('patients').select('id').eq('user_id', user.id).limit(1),
    ])
    const clinician = (owned?.length ?? 0) > 0
    setIsClinician(clinician)
    if (clinician) {
      setProfile(null)
      setPhotoUrl(null)
      return
    }
    const next: MyProfile = { displayName: data?.display_name ?? null, goal: data?.bio ?? null, avatarPath: data?.avatar_url ?? null }
    setProfile(next)
    setPhotoUrl(await avatarUrl(supabase, next.avatarPath))
  }, [])

  useEffect(() => {
    reload().catch((err) => console.error('My Phygo profile could not be loaded:', err))
  }, [reload])

  return <MyProfileContext.Provider value={{ userId, email, profile, photoUrl, isClinician, reload }}>{children}</MyProfileContext.Provider>
}

export function useMyProfile() {
  return useContext(MyProfileContext)
}

// Titles are not part of the initials: "dr andrea" is "A", not "DA".
const TITLES = /^(dr|dra|dott|dott\.?ssa|dottssa|prof|prof\.?ssa|sig|sig\.?ra|mr|mrs|ms|mme|mlle)\.?$/i

export function initialsOf(name: string | null | undefined) {
  const parts = (name ?? '').trim().split(/\s+/).filter((p) => p && !TITLES.test(p))
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase() || '·'
}

/** Round photo, or the initials on the accent ring when there is no photo. */
export function MyAvatar({ name, photoUrl, size = 40 }: { name: string | null | undefined; photoUrl: string | null; size?: number }) {
  return (
    <span
      aria-hidden
      className="grid shrink-0 place-items-center overflow-hidden rounded-full p-[2px]"
      style={{ width: size, height: size, background: 'conic-gradient(from 210deg, #A5B4FF, #7C83FF, #A78BFA, #A5B4FF)' }}
    >
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoUrl} alt="" className="h-full w-full rounded-full object-cover" />
      ) : (
        <span className="grid h-full w-full place-items-center rounded-full bg-[#f4f4f6] font-semibold tracking-wide text-ink dark:bg-[#111218] dark:text-white" style={{ fontSize: Math.max(11, size * 0.32) }}>
          {initialsOf(name)}
        </span>
      )}
    </span>
  )
}
