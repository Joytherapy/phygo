import { NextRequest, NextResponse } from 'next/server'
import { requireWorkspaceUser } from '@/lib/workspace/authServer'

// GET  /api/workspace/knowledge-saves            — list the caller's saved knowledge references
// POST /api/workspace/knowledge-saves { knowledge_type, knowledge_id, title, category?, section_label?, href?, personal_note? }
//
// "Save to Workspace" — a personal reference list independent of any one
// document/page (contrast with the 'knowledge_card' annotation, which is
// PINNED to a specific document page). Stores a REFERENCE (id + display
// fields), never a copy of the underlying knowledge_base content — see
// sql/2026-09_workspace_study_panel.sql.
//
// Same anon-key + RLS pattern as every other /api/workspace/* route
// (lib/workspace/authServer.ts) — never the service role — so a caller can
// only ever read/write their own rows; owner_id is always taken from the
// authenticated session, never trusted from the request body.

const VALID_KNOWLEDGE_TYPES = ['condition', 'structure', 'test'] as const

export async function GET() {
  const { user, supabase, unauthorized } = await requireWorkspaceUser()
  if (unauthorized) return unauthorized

  const { data, error } = await supabase
    .from('workspace_knowledge_saves')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ saves: data })
}

export async function POST(req: NextRequest) {
  const { user, supabase, unauthorized } = await requireWorkspaceUser()
  if (unauthorized) return unauthorized

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'invalid body' }, { status: 400 })

  const knowledgeType = body.knowledge_type as string
  const knowledgeId = body.knowledge_id as string
  const title = body.title as string

  if (!VALID_KNOWLEDGE_TYPES.includes(knowledgeType as any)) {
    return NextResponse.json({ error: 'knowledge_type must be one of condition | structure | test' }, { status: 400 })
  }
  if (!knowledgeId) return NextResponse.json({ error: 'knowledge_id is required' }, { status: 400 })
  if (!title) return NextResponse.json({ error: 'title is required' }, { status: 400 })

  // Idempotent: re-saving something already saved just returns/refreshes
  // the existing row rather than erroring on the unique(owner_id,
  // knowledge_type, knowledge_id) constraint — a student clicking "Save to
  // Workspace" twice shouldn't see a failure.
  const { data, error } = await supabase
    .from('workspace_knowledge_saves')
    .upsert(
      {
        owner_id: user.id,
        knowledge_type: knowledgeType,
        knowledge_id: knowledgeId,
        title,
        category: body.category ?? null,
        section_label: body.section_label ?? null,
        href: body.href ?? null,
        personal_note: body.personal_note ?? null,
      },
      { onConflict: 'owner_id,knowledge_type,knowledge_id' }
    )
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ save: data }, { status: 201 })
}
