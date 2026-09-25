import { NextRequest, NextResponse } from 'next/server'
import { requireWorkspaceUser } from '@/lib/workspace/authServer'
import type { NotebookPageFormat, NotebookPageTemplate } from '@/lib/workspace/types'

const VALID_TEMPLATES: NotebookPageTemplate[] = ['blank', 'ruled', 'grid', 'dotted']
const VALID_FORMATS: NotebookPageFormat[] = ['a4', 'letter', 'square']

// GET  /api/workspace/notebooks?folder_id=<uuid|root>  -> notebooks in a folder ('root' or omitted = top level)
// POST /api/workspace/notebooks  -> { name, folder_id?, format?, paper_color?, template? }
//      Creates the notebook row AND its first blank page in one call — a
//      notebook with zero pages is never a valid state the client has to
//      handle, unlike a folder or a document.
export async function GET(req: NextRequest) {
  const { user, supabase, unauthorized } = await requireWorkspaceUser()
  if (unauthorized) return unauthorized

  const folderId = req.nextUrl.searchParams.get('folder_id')

  let query = supabase
    .from('workspace_notebooks')
    .select('*')
    .eq('owner_id', user.id)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })

  if (!folderId || folderId === 'root') {
    query = query.is('folder_id', null)
  } else {
    query = query.eq('folder_id', folderId)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ notebooks: data })
}

export async function POST(req: NextRequest) {
  const { user, supabase, unauthorized } = await requireWorkspaceUser()
  if (unauthorized) return unauthorized

  const body = await req.json().catch(() => null)
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 })

  const template: NotebookPageTemplate = VALID_TEMPLATES.includes(body?.template) ? body.template : 'blank'
  const format: NotebookPageFormat = VALID_FORMATS.includes(body?.format) ? body.format : 'a4'
  const paperColor = typeof body?.paper_color === 'string' ? body.paper_color : '#FFFFFF'

  // If a folder is given, confirm it belongs to this user first — same
  // "clean 404 over a generic RLS failure" reasoning as folders POST.
  if (body?.folder_id) {
    const { data: parent } = await supabase
      .from('workspace_folders')
      .select('id')
      .eq('id', body.folder_id)
      .eq('owner_id', user.id)
      .is('deleted_at', null)
      .maybeSingle()
    if (!parent) return NextResponse.json({ error: 'folder not found' }, { status: 404 })
  }

  const { data: notebook, error: notebookError } = await supabase
    .from('workspace_notebooks')
    .insert({ owner_id: user.id, folder_id: body?.folder_id ?? null, name })
    .select('*')
    .single()

  if (notebookError) return NextResponse.json({ error: notebookError.message }, { status: 500 })

  const { data: page, error: pageError } = await supabase
    .from('workspace_notebook_pages')
    .insert({ notebook_id: notebook.id, position: 0, template, content: { format, paperColor } })
    .select('*')
    .single()

  if (pageError) {
    // Roll back the orphaned notebook row rather than leaving a pageless
    // notebook behind — a notebook with zero pages is a state the rest of
    // the app never expects.
    await supabase.from('workspace_notebooks').delete().eq('id', notebook.id).eq('owner_id', user.id)
    return NextResponse.json({ error: pageError.message }, { status: 500 })
  }

  const { data: updatedNotebook, error: updateError } = await supabase
    .from('workspace_notebooks')
    .update({ last_page_id: page.id })
    .eq('id', notebook.id)
    .eq('owner_id', user.id)
    .select('*')
    .single()

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  return NextResponse.json({ notebook: updatedNotebook, page }, { status: 201 })
}
