import { NextRequest, NextResponse } from 'next/server'
import { requireWorkspaceUser } from '@/lib/workspace/authServer'

// GET  /api/workspace/folders            -> all non-deleted folders owned by the user (flat; client builds the tree)
// POST /api/workspace/folders            -> { name, parent_id?, color? } create a folder
export async function GET() {
  const { user, supabase, unauthorized } = await requireWorkspaceUser()
  if (unauthorized) return unauthorized

  const { data, error } = await supabase
    .from('workspace_folders')
    .select('*')
    .eq('owner_id', user.id)
    .is('deleted_at', null)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ folders: data })
}

export async function POST(req: NextRequest) {
  const { user, supabase, unauthorized } = await requireWorkspaceUser()
  if (unauthorized) return unauthorized

  const body = await req.json().catch(() => null)
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  const parentId = body?.parent_id ?? null
  const color = typeof body?.color === 'string' ? body.color : null

  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 })

  // If a parent is given, confirm it belongs to this user (RLS would block the
  // insert anyway, but a clear 404 beats a generic RLS failure here).
  if (parentId) {
    const { data: parent } = await supabase
      .from('workspace_folders')
      .select('id')
      .eq('id', parentId)
      .eq('owner_id', user.id)
      .is('deleted_at', null)
      .maybeSingle()
    if (!parent) return NextResponse.json({ error: 'parent folder not found' }, { status: 404 })
  }

  const { data, error } = await supabase
    .from('workspace_folders')
    .insert({ owner_id: user.id, name, parent_id: parentId, color })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ folder: data }, { status: 201 })
}
