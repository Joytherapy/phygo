import { NextRequest, NextResponse } from 'next/server'
import { requireWorkspaceUser } from '@/lib/workspace/authServer'

// PATCH  /api/workspace/knowledge-saves/[id]  { personal_note }
// DELETE /api/workspace/knowledge-saves/[id]
//
// Every query is scoped to `.eq('owner_id', user.id)` in addition to RLS —
// the same belt-and-suspenders pattern as the rest of /api/workspace/* — so
// a caller can never touch another user's saved reference even if `id` is
// guessed or replayed.

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { user, supabase, unauthorized } = await requireWorkspaceUser()
  if (unauthorized) return unauthorized

  const body = await req.json().catch(() => null)
  if (!body || typeof body.personal_note !== 'string') {
    return NextResponse.json({ error: 'personal_note (string) is required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('workspace_knowledge_saves')
    .update({ personal_note: body.personal_note })
    .eq('id', params.id)
    .eq('owner_id', user.id)
    .select('*')
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'not found' }, { status: 404 })
  return NextResponse.json({ save: data })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { user, supabase, unauthorized } = await requireWorkspaceUser()
  if (unauthorized) return unauthorized

  const { error } = await supabase.from('workspace_knowledge_saves').delete().eq('id', params.id).eq('owner_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
