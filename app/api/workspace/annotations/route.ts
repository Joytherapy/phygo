import { NextRequest, NextResponse } from 'next/server'
import { requireWorkspaceUser, requireWorkspaceDocumentAccess, requireWorkspaceNotebookPageAccess } from '@/lib/workspace/authServer'
import type { AnnotationTargetType, AnnotationType } from '@/lib/workspace/types'

// GET  /api/workspace/annotations?targetType=document&targetId=<uuid>
// POST /api/workspace/annotations { target_type, target_id, page_number?, type, data }
//
// target_id is NEVER trusted at face value: for target_type='document' it is
// resolved through requireWorkspaceDocumentAccess (owner_id = caller); for
// target_type='notebook_page' through requireWorkspaceNotebookPageAccess
// (ownership derived via the parent notebook, same as its RLS policy) — so
// a target_id supplied by the client can only ever point at that caller's
// own document or notebook page, never someone else's — see PHYGO Workspace
// API/handler audit, §19/§33.
const VALID_TARGET_TYPES: AnnotationTargetType[] = ['document', 'notebook_page']
const VALID_TYPES: AnnotationType[] = ['highlight', 'stroke', 'text', 'shape', 'image', 'knowledge_card']

export async function GET(req: NextRequest) {
  const { user, supabase, unauthorized } = await requireWorkspaceUser()
  if (unauthorized) return unauthorized

  const targetType = req.nextUrl.searchParams.get('targetType') as AnnotationTargetType | null
  const targetId = req.nextUrl.searchParams.get('targetId')

  if (!targetType || !VALID_TARGET_TYPES.includes(targetType)) {
    return NextResponse.json({ error: 'targetType must be one of document | notebook_page' }, { status: 400 })
  }
  if (!targetId) return NextResponse.json({ error: 'targetId is required' }, { status: 400 })

  if (targetType === 'document') {
    const { error } = await requireWorkspaceDocumentAccess(supabase, user.id, targetId)
    if (error) return error
  } else {
    const { error } = await requireWorkspaceNotebookPageAccess(supabase, user.id, targetId)
    if (error) return error
  }

  const { data, error: queryError } = await supabase
    .from('workspace_annotations')
    .select('*')
    .eq('owner_id', user.id)
    .eq('target_type', targetType)
    .eq('target_id', targetId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })

  if (queryError) return NextResponse.json({ error: queryError.message }, { status: 500 })
  return NextResponse.json({ annotations: data })
}

export async function POST(req: NextRequest) {
  const { user, supabase, unauthorized } = await requireWorkspaceUser()
  if (unauthorized) return unauthorized

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'invalid body' }, { status: 400 })

  const targetType = body.target_type as AnnotationTargetType
  const targetId = body.target_id as string
  const type = body.type as AnnotationType

  if (!targetType || !VALID_TARGET_TYPES.includes(targetType)) {
    return NextResponse.json({ error: 'target_type must be one of document | notebook_page' }, { status: 400 })
  }
  if (!targetId) return NextResponse.json({ error: 'target_id is required' }, { status: 400 })
  if (!type || !VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: 'type must be one of highlight | stroke | text | shape | image | knowledge_card' }, { status: 400 })
  }
  if (!body.data || typeof body.data !== 'object') {
    return NextResponse.json({ error: 'data is required' }, { status: 400 })
  }

  if (targetType === 'document') {
    const { error } = await requireWorkspaceDocumentAccess(supabase, user.id, targetId)
    if (error) return error
  } else {
    const { error } = await requireWorkspaceNotebookPageAccess(supabase, user.id, targetId)
    if (error) return error
  }

  const pageNumber = typeof body.page_number === 'number' ? body.page_number : null
  if (targetType === 'document' && pageNumber === null) {
    return NextResponse.json({ error: 'page_number is required for document annotations' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('workspace_annotations')
    .insert({
      owner_id: user.id,
      target_type: targetType,
      target_id: targetId,
      page_number: pageNumber,
      type,
      data: body.data,
    })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ annotation: data }, { status: 201 })
}
