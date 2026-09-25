import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// Shared server-side Supabase client for every /api/workspace/* route.
// Uses the ANON key + the caller's own session cookie (never the service
// role key) so that Postgres RLS — not application code — is what enforces
// "a user can only see their own Workspace content". Also applies the same
// `cache: 'no-store'` fetch override used in api/pelvic-floor/structures,
// centralized here instead of copy-pasted per route (see strategic audit §11).
export function getWorkspaceServerClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll() {
          // no-op: API routes don't need to refresh the session cookie
        },
      },
      global: { fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' }) },
    }
  )
}

/** Resolves the current user or returns a 401 response the caller should return as-is. */
export async function requireWorkspaceUser() {
  const supabase = getWorkspaceServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { user: null, supabase, unauthorized: NextResponse.json({ error: 'unauthorized' }, { status: 401 }) }
  }
  return { user, supabase, unauthorized: null as null }
}

// Shared ownership helpers (PHYGO Workspace API/handler audit — every route
// that touches a document or annotation goes through one of these instead of
// re-deriving ownership logic inline). RLS is still the backstop (see
// sql/2026-09_workspace_foundation.sql); these just give routes a clean
// 404-vs-500-vs-200 without a raw query copy-pasted into every handler.

export async function requireWorkspaceDocumentAccess(
  supabase: ReturnType<typeof getWorkspaceServerClient>,
  userId: string,
  documentId: string
) {
  const { data, error } = await supabase
    .from('workspace_documents')
    .select('id, owner_id, storage_key, folder_id, deleted_at')
    .eq('id', documentId)
    .eq('owner_id', userId)
    .maybeSingle()

  if (error) return { document: null, error: NextResponse.json({ error: error.message }, { status: 500 }) }
  if (!data) return { document: null, error: NextResponse.json({ error: 'not found' }, { status: 404 }) }
  return { document: data, error: null as null }
}

export async function requireWorkspaceFolderAccess(
  supabase: ReturnType<typeof getWorkspaceServerClient>,
  userId: string,
  folderId: string
) {
  const { data, error } = await supabase
    .from('workspace_folders')
    .select('id, owner_id, parent_id, deleted_at')
    .eq('id', folderId)
    .eq('owner_id', userId)
    .maybeSingle()

  if (error) return { folder: null, error: NextResponse.json({ error: error.message }, { status: 500 }) }
  if (!data) return { folder: null, error: NextResponse.json({ error: 'not found' }, { status: 404 }) }
  return { folder: data, error: null as null }
}

export async function requireWorkspaceNotebookAccess(
  supabase: ReturnType<typeof getWorkspaceServerClient>,
  userId: string,
  notebookId: string
) {
  const { data, error } = await supabase
    .from('workspace_notebooks')
    .select('id, owner_id, folder_id, name, starred, last_opened_at, last_page_id, deleted_at')
    .eq('id', notebookId)
    .eq('owner_id', userId)
    .maybeSingle()

  if (error) return { notebook: null, error: NextResponse.json({ error: error.message }, { status: 500 }) }
  if (!data) return { notebook: null, error: NextResponse.json({ error: 'not found' }, { status: 404 }) }
  return { notebook: data, error: null as null }
}

// A notebook page carries no owner_id of its own — ownership is derived
// through its parent notebook, exactly like the workspace_notebook_pages_owner
// RLS policy enforces it at the DB level (sql/2026-09_workspace_foundation.sql).
// Two simple queries here (rather than a single embedded-join query) keep
// this in the same explicit style as the other *Access helpers and avoid
// depending on PostgREST's embedded-filter syntax for something security
// relevant.
export async function requireWorkspaceNotebookPageAccess(
  supabase: ReturnType<typeof getWorkspaceServerClient>,
  userId: string,
  pageId: string
) {
  const { data: page, error: pageError } = await supabase
    .from('workspace_notebook_pages')
    .select('id, notebook_id, position, template, content')
    .eq('id', pageId)
    .maybeSingle()

  if (pageError) return { page: null, notebook: null, error: NextResponse.json({ error: pageError.message }, { status: 500 }) }
  if (!page) return { page: null, notebook: null, error: NextResponse.json({ error: 'not found' }, { status: 404 }) }

  const { notebook, error } = await requireWorkspaceNotebookAccess(supabase, userId, page.notebook_id)
  if (error) return { page: null, notebook: null, error }

  return { page, notebook, error: null as null }
}
