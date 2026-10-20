import type { SupabaseClient } from '@supabase/supabase-js'
import type { AppLang } from '@/lib/i18n/uiStrings'

/**
 * Saves the language someone used to sign in (or join) as their profile
 * preference. The dashboard and My Phygo follow profiles.preferred_language
 * (LanguageContext), which defaults to 'it', so without this an account that
 * came from the English site would open in Italian. Best effort: a failure
 * never blocks sign-in.
 */
export async function rememberLanguage(supabase: SupabaseClient, lang: AppLang): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) await supabase.from('profiles').update({ preferred_language: lang }).eq('id', user.id)
  } catch {
    /* the language stays as it was */
  }
}
