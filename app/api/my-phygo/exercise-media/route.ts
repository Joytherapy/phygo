import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/sessionServer';
import { serviceClient } from '@/lib/verification';
import { isMissingTable, LIBRARY_SOURCE } from '@/lib/care/program';
import { chooseMedia, isUuid, type AssetRow } from '@/lib/care/exerciseMedia';

export const dynamic = 'force-dynamic';

const SIGNED_URL_TTL_SECONDS = 60 * 30;

// Videos and images of the Exercises section for the signed-in patient's own
// home programme, and nothing else: the patient record comes from the session
// (patients.patient_user_id), the exercises are those of the active items of
// that patient's current programmes, and the files stay in the private bucket,
// reached only through short-lived signed links. Nothing is taken from the
// request, so a patient cannot ask for another exercise or another patient's.
export async function GET() {
  const gate = await requireUser();
  if (!gate.ok) return gate.response;
  const db = serviceClient();
  if (!db) return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  const empty = () => NextResponse.json({ media: {} }, { headers: { 'cache-control': 'no-store' } });
  const failed = (where: string, error: { code?: string; message?: string }) => {
    console.error(`my-phygo exercise media: ${where} failed:`, error.code, error.message);
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  };

  const { data: records, error: recordsError } = await db.from('patients').select('id').eq('patient_user_id', gate.user.id);
  if (recordsError) return failed('patient lookup', recordsError);
  const patientIds = (records ?? []).map((r: { id: string }) => r.id);
  if (patientIds.length === 0) return empty();

  const { data: programs, error: programsError } = await db
    .from('care_programs')
    .select('id, patient_id, status')
    .in('patient_id', patientIds)
    .in('status', ['active', 'maintenance', 'paused']);
  if (isMissingTable(programsError)) return empty();
  if (programsError) return failed('programmes', programsError);
  const programIds = (programs ?? [])
    .filter((p: { patient_id: string; status: string }) => patientIds.includes(p.patient_id) && ['active', 'maintenance', 'paused'].includes(p.status))
    .map((p: { id: string }) => p.id);
  if (programIds.length === 0) return empty();

  const { data: items, error: itemsError } = await db
    .from('care_program_items')
    .select('program_id, exercise_source, exercise_ref, active')
    .in('program_id', programIds)
    .eq('exercise_source', LIBRARY_SOURCE)
    .eq('active', true);
  if (itemsError) return failed('items', itemsError);
  const refs = Array.from(new Set(
    (items ?? [])
      .filter((i: { program_id: string; exercise_source: string | null; active: boolean }) => programIds.includes(i.program_id) && i.exercise_source === LIBRARY_SOURCE && i.active)
      .map((i: { exercise_ref: string | null }) => i.exercise_ref)
      .filter(isUuid),
  )).slice(0, 100);
  if (refs.length === 0) return empty();

  const { data: assets, error: assetsError } = await db
    .from('exercise_assets')
    .select('exercise_id, asset_type, variant, is_default, storage_bucket, storage_key')
    .in('exercise_id', refs);
  if (assetsError) return failed('assets', assetsError);
  const chosen = chooseMedia(((assets ?? []) as AssetRow[]).filter((a) => refs.includes(a.exercise_id)));

  const byBucket = new Map<string, string[]>();
  for (const m of Array.from(chosen.values())) {
    for (const a of [m.video, m.vertical, m.image]) {
      if (a) byBucket.set(a.storage_bucket, [...(byBucket.get(a.storage_bucket) ?? []), a.storage_key]);
    }
  }
  const signed = new Map<string, string>();
  for (const [bucket, keys] of Array.from(byBucket.entries())) {
    const { data, error } = await db.storage.from(bucket).createSignedUrls(keys, SIGNED_URL_TTL_SECONDS);
    if (error || !data) {
      console.error('my-phygo exercise media: signing failed:', error?.message);
      continue;
    }
    for (const s of data) if (s.signedUrl && s.path) signed.set(`${bucket}::${s.path}`, s.signedUrl);
  }
  const url = (a?: AssetRow) => (a ? signed.get(`${a.storage_bucket}::${a.storage_key}`) ?? null : null);

  const media: Record<string, { video_url: string | null; video_vertical_url: string | null; image_url: string | null }> = {};
  for (const [id, m] of Array.from(chosen.entries())) {
    const entry = { video_url: url(m.video), video_vertical_url: url(m.vertical), image_url: url(m.image) };
    if (entry.video_url || entry.video_vertical_url || entry.image_url) media[id] = entry;
  }
  return NextResponse.json({ media, expires_in: SIGNED_URL_TTL_SECONDS }, { headers: { 'cache-control': 'no-store' } });
}
