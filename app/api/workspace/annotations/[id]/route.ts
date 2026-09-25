import { NextRequest, NextResponse } from 'next/server'
import { requireWorkspaceUser } from '@/lib/workspace/authServer'

// PATCH  /api/workspace/annotations/:id  -> { data?, page_number? }  (owner-scoped update, e.g. moving/resizing/recoloring)
// DELETE /api/workspace/annotations/:id  -> soft delete
//
// Ownership here is enforced directly with .eq('owner_id', user.id) rather
// than a document-access lookup first: the annotation row itself already
// carries owner_id (see sql/2026-09_workspace_foundation.sql), so a single
// scoped query is both simpler and exactly as strict — RLS enforces the same
// thing underneath regardless.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { user, supabase, unauthorized } = await requireWorkspaceUser()
  if (unauthorized) return unauthorized

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'invalid body' }, { status: 400 })

  const patch: Record<string, unknown> = {}
  if (body.data && typeof body.data === 'object') patch.data = body.data
  if (typeof body.page_number === 'number') patch.page_number = body.page_number

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'nothing to update' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('workspace_annotations')
    .update(patch)
    .eq('id', params.id)
    .eq('owner_id', user.id)
    .select('*')
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'not found' }, { status: 404 })
  return NextResponse.json({ annotation: data })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { user, supabase, unauthorized } = await requireWorkspaceUser()
  if (unauthorized) return unauthorized

  const { data, error } = await supabase
    .from('workspace_annotations')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', params.id)
    .eq('owner_id', user.id)
    .select('id')
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'not found' }, { status: 404 })
  return NextResponse.json({ ok: true })
}
