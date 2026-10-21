import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/sessionServer';
import { serviceClient } from '@/lib/verification';
import { isUuid } from '@/lib/care/exerciseMedia';
import { MEDIA_TTL_SECONDS, programMediaFor } from '@/lib/care/programMedia';

export const dynamic = 'force-dynamic';

// The same media for the clinician who owns the patient record
// (patients.user_id = the signed-in user, as care_owns_patient in the SQL),
// used to put the exercise images in the patient's printable programme.
// Anyone else gets nothing.
export async function GET(request: Request) {
  const gate = await requireUser();
  if (!gate.ok) return gate.response;
  const patientId = new URL(request.url).searchParams.get('patient');
  if (!isUuid(patientId)) return NextResponse.json({ error: 'Invalid patient' }, { status: 400 });
  const db = serviceClient();
  if (!db) return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });

  const { data: owned, error: ownedError } = await db.from('patients').select('id, user_id').eq('id', patientId).eq('user_id', gate.user.id);
  if (ownedError) {
    console.error('care exercise media: ownership check failed:', ownedError.code, ownedError.message);
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }
  const ids = (owned ?? []).filter((p: { id: string; user_id: string }) => p.id === patientId && p.user_id === gate.user.id).map((p: { id: string }) => p.id);
  if (ids.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const result = await programMediaFor(db, ids);
  if ('error' in result) {
    console.error(`care exercise media: ${result.error.where} failed:`, result.error.code, result.error.message);
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }
  return NextResponse.json({ media: result.media, expires_in: MEDIA_TTL_SECONDS }, { headers: { 'cache-control': 'no-store' } });
}
