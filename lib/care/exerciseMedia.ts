// Which stored files show an exercise of the Exercises section to the patient:
// one landscape video (the default one), one vertical video for phones and one
// start image, chosen exactly as /api/exercise-library/list chooses them.
export type AssetRow = { exercise_id: string; asset_type: string; variant: string | null; is_default: boolean | null; storage_bucket: string; storage_key: string }
export type MediaRefs = { video?: AssetRow; vertical?: AssetRow; image?: AssetRow }

export function chooseMedia(assets: AssetRow[]): Map<string, MediaRefs> {
  const out = new Map<string, MediaRefs>()
  for (const a of assets) {
    const m = out.get(a.exercise_id) ?? {}
    const vertical = a.variant === 'vertical' || a.variant === 'vertical-female'
    if (a.asset_type === 'video' && vertical) m.vertical ??= a
    else if (a.asset_type === 'video' && a.is_default) m.video = a
    else if (a.asset_type === 'image_start' && (a.is_default || !m.image)) m.image = a
    out.set(a.exercise_id, m)
  }
  return out
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export const isUuid = (v: unknown): v is string => typeof v === 'string' && UUID.test(v)
