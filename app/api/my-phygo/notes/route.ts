import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/sessionServer';
import { serviceClient } from '@/lib/verification';
import { PATIENT_NOTE_COLUMNS, toPatientNote } from '@/lib/myPhygo/patientNote';

export const dynamic = 'force-dynamic';

// The signed-in patient's session notes, reduced to what was written for them
// (lib/myPhygo/patientNote.ts). The patient record is resolved here from the
// session (patients.patient_user_id), never taken from the request, and the
// notes are read with the service role, so this does not depend on a patient
// RLS policy on notes (sql/2026-10-16_patient_notes_policy_PROPOSED.sql removes
// the one that let patients read every column).
export async function GET() {
  const gate = await requireUser();
  if (!gate.ok) return gate.response;
  const db = serviceClient();
  if (!db) return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });

  const { data: records, error: recordsError } = await db
    .from('patients')
    .select('id')
    .eq('patient_user_id', gate.user.id);
  if (recordsError) {
    console.error('my-phygo notes: patient lookup failed:', recordsError.code, recordsError.message);
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }
  const ids = (records ?? []).map((r: { id: string }) => r.id);
  if (ids.length === 0) return NextResponse.json({ notes: [] }, { headers: { 'cache-control': 'no-store' } });

  const { data, error } = await db
    .from('notes')
    .select(PATIENT_NOTE_COLUMNS)
    .in('patient_id', ids)
    .order('created_at', { ascending: false });
  if (error) {
    console.error('my-phygo notes: read failed:', error.code, error.message);
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }

  return NextResponse.json({ notes: (data ?? []).map(toPatientNote) }, { headers: { 'cache-control': 'no-store' } });
}
