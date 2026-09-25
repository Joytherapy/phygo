import { NextResponse } from 'next/server'
import { requireWorkspaceUser } from '@/lib/workspace/authServer'

// GET /api/workspace/documents/:id/signed-url
// The `workspace-files` bucket is private, so the PDF viewer needs a short-lived
// signed URL rather than a public one. Issued per-open (not cached client-side
// beyond the session) so a revoked/deleted document stops being viewable quickly.
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { user, supabase, unauthorized } = await requireWorkspaceUser()
  if (unauthorized) return unauthorized

  const { data: doc, error: docError } = await supabase
    .from('workspace_documents')
    .select('storage_key')
    .eq('id', params.id)
    .eq('owner_id', user.id)
    .is('deleted_at', null)
    .maybeSingle()

  if (docError) return NextResponse.json({ error: docError.message }, { status: 500 })
  if (!doc) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const { data: signed, error: signError } = await supabase.storage
    .from('workspace-files')
    .createSignedUrl(doc.storage_key, 60 * 30) // 30 minutes

  if (signError || !signed) {
    return NextResponse.json({ error: signError?.message || 'could not sign url' }, { status: 500 })
  }

  return NextResponse.json({ url: signed.signedUrl, expires_in: 60 * 30 })
}
