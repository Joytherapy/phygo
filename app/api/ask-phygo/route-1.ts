import { NextRequest, NextResponse } from 'next/server'
import { requireWorkspaceUser, requireWorkspaceNotebookAccess } from '@/lib/workspace/authServer'
import type { NotebookPageFormat, NotebookPageTemplate } from '@/lib/workspace/types'

const VALID_TEMPLATES: NotebookPageTemplate[] = ['blank', 'ruled', 'grid', 'dotted']
const VALID_FORMATS: NotebookPageFormat[] = ['a4', 'letter', 'square']

// POST /api/workspace/notebooks/:id/pages
//   { after_position?, template?, format?, paper_color? }               -> new blank page
//   { duplicate_from_page_id }                                          -> copy of an existing page
// Either shape appends a page right after `after_position` (or at the end
// when omitted) — this is both "add page" and "duplicate page" from the
// i18n strings (notebook.newPage / notebook.duplicatePage), split by which
// fields are present rather than two separate routes.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { user, supabase, unauthorized } = await requireWorkspaceUser()
  if (unauthorized) return unauthorized

  const { error: accessError } = await requireWorkspaceNotebookAccess(supabase, user.id, params.id)
  if (accessError) return accessError

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'invalid body' }, { status: 400 })

  const { data: existingPages, error: listError } = await supabase
    .from('workspace_notebook_pages')
    .select('id, position, template, content')
    .eq('notebook_id', params.id)
    .order('position', { ascending: true })

  if (listError) return NextResponse.json({ error: listError.message }, { status: 500 })

  let template: NotebookPageTemplate = 'blank'
  let content: Record<string, unknown> = { format: 'a4' as NotebookPageFormat, paperColor: '#FFFFFF' }
  let afterPosition = existingPages?.length ? existingPages[existingPages.length - 1].position : -1

  if (typeof body.duplicate_from_page_id === 'string') {
    const source = existingPages?.find((p) => p.id === body.duplicate_from_page_id)
    if (!source) return NextResponse.json({ error: 'source page not found' }, { status: 404 })
    template = source.template
    content = source.content || content
    afterPosition = source.position
  } else {
    if (VALID_TEMPLATES.includes(body.template)) template = body.template
    if (typeof body.after_position === 'number') afterPosition = body.after_position
    const format: NotebookPageFormat = VALID_FORMATS.includes(body.format) ? body.format : 'a4'
    const paperColor = typeof body.paper_color === 'string' ? body.paper_color : '#FFFFFF'
    content = { format, paperColor }
  }

  // Pages after the insertion point shift down by one position so the new
  // page lands exactly after `afterPosition` — simplest correct approach
  // for a per-notebook page list that's realistically dozens of pages, not
  // thousands.
  const toShift = (existingPages || []).filter((p) => p.position > afterPosition)
  if (toShift.length > 0) {
    await Promise.all(
      toShift.map((p) => supabase.from('workspace_notebook_pages').update({ position: p.position + 1 }).eq('id', p.id))
    )
  }

  const { data: page, error } = await supabase
    .from('workspace_notebook_pages')
    .insert({ notebook_id: params.id, position: afterPosition + 1, template, content })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.from('workspace_notebooks').update({ last_page_id: page.id }).eq('id', params.id).eq('owner_id', user.id)

  return NextResponse.json({ page }, { status: 201 })
}
