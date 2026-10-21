import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/sessionServer';
import { serviceClient } from '@/lib/verification';
import { MEDIA_TTL_SECONDS, programMediaFor } from '@/lib/care/programMedia';

export const dynamic = 'force-dynamic';

// Videos and images of the Exercises section for the signed-in patient's own
// home programme, and nothing else: the patient record comes from the session
// (patients.patient_user_id), never from the request, so a patient cannot ask
// for another exercise or another patient's (lib/care/programMedia.ts).
export async function GET() {
  const gate = await requireUser();
  if (!gate.ok) return gate.response;
  const db = serviceClient();
  if (!db) return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });

  const { data: records, error: recordsError } = await db.from('patients').select('id').eq('patient_user_id', gate.user.id);
  if (recordsError) {
    console.error('my-phygo exercise media: patient lookup failed:', recordsError.code, recordsError.message);
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }
  const result = await programMediaFor(db, (records ?? []).map((r: { id: string }) => r.id));
  if ('error' in result) {
    console.error(`my-phygo exercise media: ${result.error.where} failed:`, result.error.code, result.error.message);
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }
  return NextResponse.json({ media: result.media, expires_in: MEDIA_TTL_SECONDS }, { headers: { 'cache-control': 'no-store' } });
}
