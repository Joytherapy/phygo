import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// One endpoint for every admin mutation on a single event: approve/reject
// (moderation_status), verify (verification_status), feature/unfeature
// (is_featured), cancel (status), or a full field edit — the events-admin
// page sends only the fields that change, same "patch" shape for all of
// them rather than one route per action.
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const patch: Record<string, unknown> = {};

    const allowedFields = [
      'title', 'description', 'event_type', 'category', 'sub_category',
      'audience', 'professional_level', 'organizer', 'organizer_website',
      'official_url', 'registration_url', 'location_type', 'country', 'city',
      'venue', 'address', 'latitude', 'longitude', 'start_date', 'end_date',
      'timezone', 'language', 'price', 'currency', 'is_free',
      'registration_deadline', 'speakers', 'topics', 'tags', 'image',
      'source', 'source_url', 'status', 'verification_status',
      'moderation_status', 'is_featured',
    ];

    for (const field of allowedFields) {
      if (field in body) patch[field] = body[field];
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: 'Nessun campo da aggiornare' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('events')
      .update(patch)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('events admin patch error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ event: data });
  } catch (err) {
    console.error('events admin patch error:', err);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}

// Hard delete — used for true duplicates/spam. A normal "don't show this"
// should go through PATCH { moderation_status: 'rejected' } instead, which
// keeps the record for reference.
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const { error } = await supabase.from('events').delete().eq('id', params.id);

    if (error) {
      console.error('events admin delete error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ deleted: true });
  } catch (err) {
    console.error('events admin delete error:', err);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}
