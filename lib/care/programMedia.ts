// Signed links (30 minutes, private bucket) to the video and image of the
// Exercises-section exercises in the active items of these patients' current
// home programmes, and of nothing else. The caller decides which patients the
// signed-in user may see: the patient themself (/api/my-phygo/exercise-media)
// or the clinician who owns the record (/api/care/exercise-media).
import type { SupabaseClient } from '@supabase/supabase-js'
import { isMissingTable, LIBRARY_SOURCE } from './program'
import { chooseMedia, isUuid, type AssetRow } from './exerciseMedia'

export const MEDIA_TTL_SECONDS = 60 * 30
export type ProgramMedia = Record<string, { video_url: string | null; video_vertical_url: string | null; image_url: string | null }>
type Failure = { where: string; code?: string; message?: string }

const CURRENT = ['active', 'maintenance', 'paused']

export async function programMediaFor(db: SupabaseClient, patientIds: string[]): Promise<{ media: ProgramMedia } | { error: Failure }> {
  if (patientIds.length === 0) return { media: {} }
  const { data: programs, error: programsError } = await db.from('care_programs').select('id, patient_id, status').in('patient_id', patientIds).in('status', CURRENT)
  if (isMissingTable(programsError)) return { media: {} }
  if (programsError) return { error: { where: 'programmes', ...programsError } }
  const programIds = (programs ?? [])
    .filter((p: { patient_id: string; status: string }) => patientIds.includes(p.patient_id) && CURRENT.includes(p.status))
    .map((p: { id: string }) => p.id)
  if (programIds.length === 0) return { media: {} }

  const { data: items, error: itemsError } = await db
    .from('care_program_items')
    .select('program_id, exercise_source, exercise_ref, active')
    .in('program_id', programIds)
    .eq('exercise_source', LIBRARY_SOURCE)
    .eq('active', true)
  if (itemsError) return { error: { where: 'items', ...itemsError } }
  const refs = Array.from(new Set(
    (items ?? [])
      .filter((i: { program_id: string; exercise_source: string | null; active: boolean }) => programIds.includes(i.program_id) && i.exercise_source === LIBRARY_SOURCE && i.active)
      .map((i: { exercise_ref: string | null }) => i.exercise_ref)
      .filter(isUuid),
  )).slice(0, 100)
  if (refs.length === 0) return { media: {} }

  const { data: assets, error: assetsError } = await db
    .from('exercise_assets')
    .select('exercise_id, asset_type, variant, is_default, storage_bucket, storage_key')
    .in('exercise_id', refs)
  if (assetsError) return { error: { where: 'assets', ...assetsError } }
  const chosen = chooseMedia(((assets ?? []) as AssetRow[]).filter((a) => refs.includes(a.exercise_id)))

  const byBucket = new Map<string, string[]>()
  for (const m of Array.from(chosen.values())) {
    for (const a of [m.video, m.vertical, m.image]) if (a) byBucket.set(a.storage_bucket, [...(byBucket.get(a.storage_bucket) ?? []), a.storage_key])
  }
  const signed = new Map<string, string>()
  for (const [bucket, keys] of Array.from(byBucket.entries())) {
    const { data, error } = await db.storage.from(bucket).createSignedUrls(keys, MEDIA_TTL_SECONDS)
    if (error || !data) {
      console.error('programme media: signing failed:', error?.message)
      continue
    }
    for (const s of data) if (s.signedUrl && s.path) signed.set(`${bucket}::${s.path}`, s.signedUrl)
  }
  const url = (a?: AssetRow) => (a ? signed.get(`${a.storage_bucket}::${a.storage_key}`) ?? null : null)

  const media: ProgramMedia = {}
  for (const [id, m] of Array.from(chosen.entries())) {
    const entry = { video_url: url(m.video), video_vertical_url: url(m.vertical), image_url: url(m.image) }
    if (entry.video_url || entry.video_vertical_url || entry.image_url) media[id] = entry
  }
  return { media }
}
