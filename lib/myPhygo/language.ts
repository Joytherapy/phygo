import type { SupabaseClient } from '@supabase/supabase-js'
import type { AppLang } from '@/lib/i18n/uiStrings'

/**
 * Saves the language a patient used to sign in or join as their profile
 * preference. My Phygo follows profiles.preferred_language (LanguageContext),
 * which defaults to 'it' and which patients have no other way to set, so
 * without this a patient who came from the English site would see My Phygo in
 * Italian after the next reload. Best effort: a failure never blocks sign-in.
 */
export async function rememberPortalLanguage(supabase: SupabaseClient, lang: AppLang): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) await supabase.from('profiles').update({ preferred_language: lang }).eq('id', user.id)
  } catch {
    /* the language stays as it was */
  }
}
