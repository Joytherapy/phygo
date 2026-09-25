import { NextRequest, NextResponse } from 'next/server'
import { requireWorkspaceUser } from '@/lib/workspace/authServer'

// PATCH  /api/workspace/folders/:id  -> { name?, parent_id?, color?, starred?, sort_order? }
// DELETE /api/workspace/folders/:id  -> soft delete (move to trash); children cascade via ON DELETE CASCADE
//                                       only once a folder is *permanently* purged from Trash — a soft
//                                       delete here just stamps deleted_at on this row.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { user, supabase, unauthorized } = await requireWorkspaceUser()
  if (unauthorized) return unauthorized

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'invalid body' }, { status: 400 })

  const patch: Record<string, unknown> = {}
  if (typeof body.name === 'string' && body.name.trim()) patch.name = body.name.trim()
  if ('parent_id' in body) {
    if (body.parent_id === params.id) {
      return NextResponse.json({ error: 'a folder cannot be its own parent' }, { status: 400 })
    }
    patch.parent_id = body.parent_id ?? null
  }
  if (typeof body.color === 'string' || body.color === null) patch.color = body.color
  if (typeof body.starred === 'boolean') patch.starred = body.starred
  if (typeof body.sort_order === 'number') patch.sort_order = body.sort_order
  if (body.restore === true) patch.deleted_at = null

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'nothing to update' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('workspace_folders')
    .update(patch)
    .eq('id', params.id)
    .eq('owner_id', user.id)
    .select('*')
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'not found' }, { status: 404 })
  return NextResponse.json({ folder: data })
}

// ?permanent=1 hard-deletes the folder row. Note: workspace_documents.folder_id
// is ON DELETE SET NULL (not CASCADE — see sql/2026-09_workspace_foundation.sql),
// so any documents inside are orphaned to the Workspace root rather than
// deleted with the folder; sub-folders DO cascade (parent_id is ON DELETE
// CASCADE). This is deliberate: permanently deleting a folder should never
// silently destroy a PDF the user spent time annotating.
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { user, supabase, unauthorized } = await requireWorkspaceUser()
  if (unauthorized) return unauthorized

  const permanent = req.nextUrl.searchParams.get('permanent') === '1'

  if (permanent) {
    const { error: deleteError, data } = await supabase
      .from('workspace_folders')
      .delete()
      .eq('id', params.id)
      .eq('owner_id', user.id)
      .select('id')
      .maybeSingle()

    if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 })
    if (!data) return NextResponse.json({ error: 'not found' }, { status: 404 })
    return NextResponse.json({ ok: true, permanent: true })
  }

  const { data, error } = await supabase
    .from('workspace_folders')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', params.id)
    .eq('owner_id', user.id)
    .select('id')
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'not found' }, { status: 404 })
  return NextResponse.json({ ok: true })
}
