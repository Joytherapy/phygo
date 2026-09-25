import { NextRequest, NextResponse } from 'next/server'
import { requireWorkspaceUser } from '@/lib/workspace/authServer'

// GET    /api/workspace/documents/:id  -> the row (client asks storage for a signed URL separately)
// PATCH  /api/workspace/documents/:id  -> { name?, folder_id?, starred?, last_page?, last_opened_at?, page_count? }
// DELETE /api/workspace/documents/:id  -> soft delete (move to trash)
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { user, supabase, unauthorized } = await requireWorkspaceUser()
  if (unauthorized) return unauthorized

  const { data, error } = await supabase
    .from('workspace_documents')
    .select('*')
    .eq('id', params.id)
    .eq('owner_id', user.id)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'not found' }, { status: 404 })
  return NextResponse.json({ document: data })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { user, supabase, unauthorized } = await requireWorkspaceUser()
  if (unauthorized) return unauthorized

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'invalid body' }, { status: 400 })

  const patch: Record<string, unknown> = {}
  if (typeof body.name === 'string' && body.name.trim()) patch.name = body.name.trim()
  if ('folder_id' in body) patch.folder_id = body.folder_id ?? null
  if (typeof body.starred === 'boolean') patch.starred = body.starred
  if (typeof body.last_page === 'number') patch.last_page = body.last_page
  if (typeof body.page_count === 'number') patch.page_count = body.page_count
  if (body.touch_opened === true) patch.last_opened_at = new Date().toISOString()
  if (body.restore === true) patch.deleted_at = null

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'nothing to update' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('workspace_documents')
    .update(patch)
    .eq('id', params.id)
    .eq('owner_id', user.id)
    .select('*')
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'not found' }, { status: 404 })
  return NextResponse.json({ document: data })
}

// ?permanent=1 hard-deletes: removes the Storage object first, then the row
// (Trash's "Delete forever" — everything else here is the soft delete that
// Trash's default "move to trash" uses).
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { user, supabase, unauthorized } = await requireWorkspaceUser()
  if (unauthorized) return unauthorized

  const permanent = req.nextUrl.searchParams.get('permanent') === '1'

  if (permanent) {
    const { data: doc, error: fetchError } = await supabase
      .from('workspace_documents')
      .select('id, storage_key')
      .eq('id', params.id)
      .eq('owner_id', user.id)
      .maybeSingle()

    if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 })
    if (!doc) return NextResponse.json({ error: 'not found' }, { status: 404 })

    if (doc.storage_key) {
      await supabase.storage.from('workspace-files').remove([doc.storage_key])
    }

    const { error: deleteError } = await supabase
      .from('workspace_documents')
      .delete()
      .eq('id', params.id)
      .eq('owner_id', user.id)

    if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 })
    return NextResponse.json({ ok: true, permanent: true })
  }

  const { data, error } = await supabase
    .from('workspace_documents')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', params.id)
    .eq('owner_id', user.id)
    .select('id')
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'not found' }, { status: 404 })
  return NextResponse.json({ ok: true })
}
