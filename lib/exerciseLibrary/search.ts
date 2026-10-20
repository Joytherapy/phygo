// Server-only search in the Exercises section (`exercises` with source
// 'exercise_animatic', names in `exercise_translations`), returned in the same
// ExerciseEntry shape the note uses for wger exercises, so a note exercise can
// carry its video and steps. provider 'exercises' + provider_id = exercises.id
// is what the home programme keeps as reference (lib/care/program.ts), and
// what /api/my-phygo/exercise-media serves to the patient.
import type { SupabaseClient } from '@supabase/supabase-js'
import type { ExerciseEntry } from '@/lib/exercise-providers/types'
import { chooseMedia, type AssetRow } from '@/lib/care/exerciseMedia'
import { getTranslatedExercisesBatch, type ExerciseLang } from '@/lib/exerciseTranslation'

const SIGNED_URL_TTL_SECONDS = 60 * 30

export const toExerciseLang = (lang: string | null | undefined): ExerciseLang =>
  lang === 'en' || lang === 'es' || lang === 'fr' ? lang : 'it'

// PostgREST pattern characters typed by a user are matched literally.
const literal = (s: string) => s.replace(/[%_*,()\\]/g, ' ').trim()

/**
 * Exercises whose English name contains one of the keywords, best first:
 * keywords in the order given, then exact name, name starting with the
 * keyword, shorter name. Names and steps come back in `lang`.
 */
export async function searchLibraryExercises(db: SupabaseClient, keywords: string[], lang: string, limit = 5): Promise<ExerciseEntry[]> {
  const words = keywords.map(literal).filter((k) => k.length >= 2).slice(0, 4)
  const ranked: string[] = []
  const source = new Map<string, { name: string; instructions: string[] | null; tips: string | null }>()
  for (const word of words) {
    const { data, error } = await db
      .from('exercise_translations')
      .select('exercise_id, name, instructions, tips')
      .eq('lang', 'en')
      .ilike('name', `%${word}%`)
      .limit(25)
    if (error) {
      console.error('library search: names failed:', error.code)
      return []
    }
    const w = word.toLowerCase()
    const score = (name: string) => {
      const n = name.toLowerCase()
      return (n === w ? 0 : n.startsWith(w) ? 1 : 2) * 1000 + n.length
    }
    for (const row of [...(data ?? [])].sort((a, b) => score(a.name) - score(b.name))) {
      if (!source.has(row.exercise_id)) {
        source.set(row.exercise_id, { name: row.name, instructions: row.instructions, tips: row.tips })
        ranked.push(row.exercise_id)
      }
    }
    if (ranked.length >= limit * 3) break
  }
  if (ranked.length === 0) return []

  const { data: rows, error: exError } = await db
    .from('exercises')
    .select('id, source, archived_at, primary_muscle, secondary_muscles, equipment, category, body_region, difficulty, tags')
    .in('id', ranked.slice(0, 60))
    .eq('source', 'exercise_animatic')
    .is('archived_at', null)
  if (exError) {
    console.error('library search: exercises failed:', exError.code)
    return []
  }
  const usable = new Map((rows ?? []).filter((r) => r.source === 'exercise_animatic' && !r.archived_at).map((r) => [r.id as string, r]))
  const ids = ranked.filter((id) => usable.has(id)).slice(0, limit)
  if (ids.length === 0) return []

  // The translation helper types these fields as text; in the table the steps are a JSON array.
  const translated = (await getTranslatedExercisesBatch(
    ids.map((id) => ({ exercise_id: id, ...source.get(id)! })) as unknown as Parameters<typeof getTranslatedExercisesBatch>[0],
    toExerciseLang(lang),
  )) as unknown as Map<string, { name: string | null; instructions: unknown; tips: string | null }>

  const { data: assets } = await db
    .from('exercise_assets')
    .select('exercise_id, asset_type, variant, is_default, storage_bucket, storage_key')
    .in('exercise_id', ids)
  const media = chooseMedia(((assets ?? []) as AssetRow[]).filter((a) => ids.includes(a.exercise_id)))
  const byBucket = new Map<string, string[]>()
  for (const m of Array.from(media.values())) {
    for (const a of [m.video, m.image]) if (a) byBucket.set(a.storage_bucket, [...(byBucket.get(a.storage_bucket) ?? []), a.storage_key])
  }
  const signed = new Map<string, string>()
  for (const [bucket, keys] of Array.from(byBucket.entries())) {
    const { data } = await db.storage.from(bucket).createSignedUrls(keys, SIGNED_URL_TTL_SECONDS)
    for (const s of data ?? []) if (s.signedUrl && s.path) signed.set(`${bucket}::${s.path}`, s.signedUrl)
  }
  const url = (a?: AssetRow) => (a ? signed.get(`${a.storage_bucket}::${a.storage_key}`) ?? null : null)

  return ids.map((id) => {
    const ex = usable.get(id)!
    const original = source.get(id)!
    const text = translated.get(id) ?? original
    const m = media.get(id) ?? {}
    return {
      internal_id: `exercises-${id}`,
      provider: 'exercises',
      provider_id: id,
      name: text.name || original.name,
      description: text.tips ?? null,
      instructions: Array.isArray(text.instructions) ? text.instructions : null,
      body_region: ex.body_region ?? null,
      primary_muscle: ex.primary_muscle ?? null,
      secondary_muscles: ex.secondary_muscles ?? null,
      equipment: ex.equipment ?? null,
      difficulty: ex.difficulty ?? null,
      category: ex.category ?? null,
      tags: ex.tags ?? null,
      media: { image_url: url(m.image), gif_url: null, video_url: url(m.video) },
      license: null,
      language: toExerciseLang(lang),
    }
  })
}
