import { NextRequest, NextResponse } from 'next/server'
import { requireWorkspaceUser } from '@/lib/workspace/authServer'

// GET  /api/workspace/documents?folder_id=<uuid|root>  -> documents in a folder ('root' or omitted = top level)
// POST /api/workspace/documents  -> { name, storage_key, mime_type?, size_bytes?, page_count?, folder_id? }
//      Called AFTER the client has already uploaded the PDF bytes directly to
//      Supabase Storage (bucket `workspace-files`, path `<owner_id>/<uuid>.pdf`)
//      using the shared browser client — storage RLS enforces that a user can
//      only write under their own folder, so no server upload endpoint is
//      needed for the file bytes themselves, only for this metadata row.
export async function GET(req: NextRequest) {
  const { user, supabase, unauthorized } = await requireWorkspaceUser()
  if (unauthorized) return unauthorized

  const folderId = req.nextUrl.searchParams.get('folder_id')

  let query = supabase
    .from('workspace_documents')
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
  return NextResponse.json({ documents: data })
}

export async function POST(req: NextRequest) {
  const { user, supabase, unauthorized } = await requireWorkspaceUser()
  if (unauthorized) return unauthorized

  const body = await req.json().catch(() => null)
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  const storageKey = typeof body?.storage_key === 'string' ? body.storage_key : ''

  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 })
  if (!storageKey) return NextResponse.json({ error: 'storage_key is required' }, { status: 400 })
  if (!storageKey.startsWith(`${user.id}/`)) {
    // Defense in depth: the row must point at a path storage RLS actually let this user write.
    return NextResponse.json({ error: 'storage_key must be within the caller’s own folder' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('workspace_documents')
    .insert({
      owner_id: user.id,
      folder_id: body.folder_id ?? null,
      name,
      storage_key: storageKey,
      mime_type: body.mime_type || 'application/pdf',
      size_bytes: typeof body.size_bytes === 'number' ? body.size_bytes : null,
      page_count: typeof body.page_count === 'number' ? body.page_count : null,
    })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ document: data }, { status: 201 })
}
