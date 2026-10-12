import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Cancels one appointment as the signed-in clinician: the row stays, with
 * status 'cancelled', so it leaves the agenda and the patient's portal (both
 * hide cancelled appointments) without deleting clinical history.
 *
 * The database decides who may do this ("Verified physios update
 * appointments for their own patients": own patient and can_manage_patients()).
 * A refused update returns no row rather than an error, so success means
 * exactly one row came back.
 */
export async function cancelAppointment(supabase: SupabaseClient, id: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('appointments')
    .update({ status: 'cancelled' })
    .eq('id', id)
    .select('id')
  return !error && (data?.length ?? 0) === 1
}
