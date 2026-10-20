// My Phygo profile photo: a private Storage bucket (never a public URL — this
// is a patient of a health app), one file per patient at "<user id>/avatar.jpg".
// The patient's own profiles.avatar_url holds that path (not a URL) so the
// portal knows a photo exists; it is shown through a short-lived signed URL.
// The bucket and its policies: sql/2026-10-19_patient_avatars_PROPOSED.sql.

import type { SupabaseClient } from '@supabase/supabase-js'

export const AVATAR_BUCKET = 'patient-avatars'
export const MAX_AVATAR_BYTES = 10 * 1024 * 1024
export const AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const SIDE = 512
const SIGNED_URL_SECONDS = 60 * 60

export const avatarPath = (userId: string) => `${userId}/avatar.jpg`

export type AvatarError = 'too_big' | 'unsupported' | 'unavailable' | 'failed'

/** Centre-crops the picture to a square and re-encodes it as a 512px JPEG,
 *  so every photo is small, the same shape, and stripped of its metadata
 *  (EXIF, location) by the re-encoding. */
export async function squareJpeg(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const side = Math.min(bitmap.width, bitmap.height)
  const canvas = document.createElement('canvas')
  canvas.width = SIDE
  canvas.height = SIDE
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas unavailable')
  ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, SIDE, SIDE)
  bitmap.close?.()
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('encode failed'))), 'image/jpeg', 0.88))
}

const isMissingBucket = (err: unknown) => /bucket not found/i.test(String((err as { message?: string })?.message ?? err))

/** Validates, resizes and uploads the photo; returns the stored path. */
export async function uploadAvatar(supabase: SupabaseClient, userId: string, file: File): Promise<{ path: string } | { error: AvatarError }> {
  if (!AVATAR_TYPES.includes(file.type)) return { error: 'unsupported' }
  if (file.size > MAX_AVATAR_BYTES) return { error: 'too_big' }
  let blob: Blob
  try {
    blob = await squareJpeg(file)
  } catch {
    return { error: 'unsupported' }
  }
  const path = avatarPath(userId)
  const { error } = await supabase.storage.from(AVATAR_BUCKET).upload(path, blob, { upsert: true, contentType: 'image/jpeg', cacheControl: '60' })
  if (error) return { error: isMissingBucket(error) ? 'unavailable' : 'failed' }
  return { path }
}

export async function removeAvatar(supabase: SupabaseClient, userId: string): Promise<boolean> {
  const { error } = await supabase.storage.from(AVATAR_BUCKET).remove([avatarPath(userId)])
  return !error
}

/** A short-lived URL to show the stored photo, or null when there is none. */
export async function avatarUrl(supabase: SupabaseClient, path: string | null | undefined): Promise<string | null> {
  if (!path || path.startsWith('http')) return null
  const { data, error } = await supabase.storage.from(AVATAR_BUCKET).createSignedUrl(path, SIGNED_URL_SECONDS)
  if (error || !data?.signedUrl) return null
  return data.signedUrl
}
