import { NextRequest, NextResponse } from 'next/server'
import { requireWorkspaceUser } from '@/lib/workspace/authServer'

// GET    /api/workspace/notebooks/:id  -> { notebook, pages } — pages ordered by position,
//                                          so the client has the whole page list up front
//                                          and only fetches per-page annotations on demand.
// PATCH  /api/workspace/notebooks/:id  -> { name?, folder_id?, starred?, touch_opened?, restore? }
// DELETE /api/workspace/notebooks/:id  -> soft delete (move to trash); ?permanent=1 hard-deletes
//                                          (pages cascade via ON DELETE CASCADE on notebook_id)
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { user, supabase, unauthorized } = await requireWorkspaceUser()
  if (unauthorized) return unauthorized

  const { data: notebook, error: notebookError } = await supabase
    .from('workspace_notebooks')
    .select('*')
    .eq('id', params.id)
    .eq('owner_id', user.id)
    .maybeSingle()

  if (notebookError) return NextResponse.json({ error: notebookError.message }, { status: 500 })
  if (!notebook) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const { data: pages, error: pagesError } = await supabase
    .from('workspace_notebook_pages')
    .select('*')
    .eq('notebook_id', notebook.id)
    .order('position', { ascending: true })

  if (pagesError) return NextResponse.json({ error: pagesError.message }, { status: 500 })
  return NextResponse.json({ notebook, pages: pages || [] })
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
  if (typeof body.last_page_id === 'string') patch.last_page_id = body.last_page_id
  if (body.touch_opened === true) patch.last_opened_at = new Date().toISOString()
  if (body.restore === true) patch.deleted_at = null

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'nothing to update' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('workspace_notebooks')
    .update(patch)
    .eq('id', params.id)
    .eq('owner_id', user.id)
    .select('*')
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'not found' }, { status: 404 })
  return NextResponse.json({ notebook: data })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { user, supabase, unauthorized } = await requireWorkspaceUser()
  if (unauthorized) return unauthorized

  const permanent = req.nextUrl.searchParams.get('permanent') === '1'

  if (permanent) {
    const { data, error: deleteError } = await supabase
      .from('workspace_notebooks')
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
    .from('workspace_notebooks')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', params.id)
    .eq('owner_id', user.id)
    .select('id')
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'not found' }, { status: 404 })
  return NextResponse.json({ ok: true })
}
