// Who signs the patient documents: the signed-in clinician's name and titles
// from their own profile (profiles.display_name and credentials, edited in
// Dashboard > Profile). No e-mail address is ever printed in their place.
import type { SupabaseClient } from '@supabase/supabase-js'

export type ClinicianSignature = { name: string; credentials: string }

export function signatureFrom(profile: { display_name?: unknown; credentials?: unknown } | null, metadataName?: unknown): ClinicianSignature | null {
  const name = (typeof profile?.display_name === 'string' && profile.display_name.trim()) || (typeof metadataName === 'string' && metadataName.trim()) || ''
  if (!name) return null
  const credentials = Array.isArray(profile?.credentials)
    ? profile!.credentials
        .map((c: any) => (typeof c === 'string' ? c : typeof c?.label === 'string' ? c.label : ''))
        .map((c: string) => c.trim())
        .filter(Boolean)
        .slice(0, 3)
        .join(', ')
    : ''
  return { name: name.slice(0, 120), credentials: credentials.slice(0, 200) }
}

export async function loadClinicianSignature(db: SupabaseClient): Promise<ClinicianSignature | null> {
  const { data: { user } } = await db.auth.getUser()
  if (!user) return null
  const { data } = await db.from('profiles').select('display_name, credentials').eq('id', user.id).maybeSingle()
  return signatureFrom(data, user.user_metadata?.display_name)
}
