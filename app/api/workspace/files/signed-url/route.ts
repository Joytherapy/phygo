import { NextRequest, NextResponse } from 'next/server'
import { requireWorkspaceUser } from '@/lib/workspace/authServer'

// GET /api/workspace/files/signed-url?key=<owner_id>/<uuid>.<ext>
//
// Generic sibling of documents/[id]/signed-url — that one resolves a
// storage_key through a workspace_documents row (a whole imported PDF);
// this one signs an arbitrary object in the same private `workspace-files`
// bucket directly by its key, for content that isn't its own top-level
// document row — currently just inserted/photographed images living inside
// an 'image' annotation's data (see ImageAnnotationLayer.tsx). Ownership
// isn't looked up via a table here (there is none to check), so it's
// enforced the same way documents/route.ts enforces it on the WRITE side:
// the key must start with the caller's own `${user.id}/`, which is also
// all Storage's own RLS would ever have allowed that user to upload under
// in the first place.
export async function GET(req: NextRequest) {
  const { user, supabase, unauthorized } = await requireWorkspaceUser()
  if (unauthorized) return unauthorized

  const key = req.nextUrl.searchParams.get('key')
  if (!key) return NextResponse.json({ error: 'key is required' }, { status: 400 })
  if (!key.startsWith(`${user.id}/`)) {
    return NextResponse.json({ error: 'key must be within the caller’s own folder' }, { status: 403 })
  }

  const { data: signed, error } = await supabase.storage.from('workspace-files').createSignedUrl(key, 60 * 30) // 30 minutes — matches documents/[id]/signed-url

  if (error || !signed) {
    return NextResponse.json({ error: error?.message || 'could not sign url' }, { status: 500 })
  }

  return NextResponse.json({ url: signed.signedUrl, expires_in: 60 * 30 })
}
