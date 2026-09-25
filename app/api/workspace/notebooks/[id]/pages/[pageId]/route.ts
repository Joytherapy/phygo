import { NextRequest, NextResponse } from 'next/server'
import { requireWorkspaceUser, requireWorkspaceNotebookPageAccess } from '@/lib/workspace/authServer'
import type { NotebookPageFormat, NotebookPageTemplate } from '@/lib/workspace/types'

const VALID_TEMPLATES: NotebookPageTemplate[] = ['blank', 'ruled', 'grid', 'dotted']
const VALID_FORMATS: NotebookPageFormat[] = ['a4', 'letter', 'square']

// PATCH  /api/workspace/notebooks/:notebookId/pages/:pageId -> { template?, format?, paper_color? }
//        (paper settings are changed per page, exactly like GoodNotes lets
//        you re-pick size/color/template for a page you've already made)
// DELETE /api/workspace/notebooks/:notebookId/pages/:pageId -> hard delete
//        (workspace_notebook_pages has no deleted_at column — a page isn't
//        trashed/restored on its own, only the whole notebook is)
export async function PATCH(req: NextRequest, { params }: { params: { id: string; pageId: string } }) {
  const { user, supabase, unauthorized } = await requireWorkspaceUser()
  if (unauthorized) return unauthorized

  const { page, error: accessError } = await requireWorkspaceNotebookPageAccess(supabase, user.id, params.pageId)
  if (accessError) return accessError
  if (page!.notebook_id !== params.id) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'invalid body' }, { status: 400 })

  const patch: Record<string, unknown> = {}
  if (VALID_TEMPLATES.includes(body.template)) patch.template = body.template
  if (VALID_FORMATS.includes(body.format) || typeof body.paper_color === 'string') {
    const existingContent = (page!.content || {}) as Record<string, unknown>
    patch.content = {
      ...existingContent,
      ...(VALID_FORMATS.includes(body.format) ? { format: body.format } : {}),
      ...(typeof body.paper_color === 'string' ? { paperColor: body.paper_color } : {}),
    }
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'nothing to update' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('workspace_notebook_pages')
    .update(patch)
    .eq('id', params.pageId)
    .select('*')
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'not found' }, { status: 404 })
  return NextResponse.json({ page: data })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string; pageId: string } }) {
  const { user, supabase, unauthorized } = await requireWorkspaceUser()
  if (unauthorized) return unauthorized

  const { page, notebook, error: accessError } = await requireWorkspaceNotebookPageAccess(supabase, user.id, params.pageId)
  if (accessError) return accessError
  if (page!.notebook_id !== params.id) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const { count } = await supabase
    .from('workspace_notebook_pages')
    .select('id', { count: 'exact', head: true })
    .eq('notebook_id', params.id)

  if ((count ?? 0) <= 1) {
    return NextResponse.json({ error: 'a notebook must keep at least one page' }, { status: 400 })
  }

  const { error: deleteError } = await supabase.from('workspace_notebook_pages').delete().eq('id', params.pageId)
  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 })

  // If the deleted page was the notebook's "last opened" page, point it
  // back at some other page in the notebook rather than a dangling id.
  if (notebook!.last_page_id === params.pageId) {
    const { data: fallback } = await supabase
      .from('workspace_notebook_pages')
      .select('id')
      .eq('notebook_id', params.id)
      .order('position', { ascending: true })
      .limit(1)
      .maybeSingle()
    if (fallback) {
      await supabase.from('workspace_notebooks').update({ last_page_id: fallback.id }).eq('id', params.id).eq('owner_id', user.id)
    }
  }

  return NextResponse.json({ ok: true })
}
