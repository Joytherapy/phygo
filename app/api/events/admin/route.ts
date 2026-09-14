import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Admin queue: every event regardless of moderation_status, newest first.
// The events-admin page filters client-side by moderation_status (pending
// review vs. already approved/rejected) so one endpoint covers both the
// "to review" queue and the "manage everything" list.
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('events admin list error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ events: data }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
  } catch (err) {
    console.error('events admin list error:', err);
    return NextResponse.json({ error: 'Failed to load events' }, { status: 500 });
  }
}

// Manual event creation — there is no automated discovery source wired up
// yet (see PHASE 10 notes), so this is how new events get into the system
// today: an admin fills in the form on events-admin and it lands here.
// Admin-authored events are approved immediately (no self-review queue)
// but stay verification_status='unverified' by default unless the admin
// sets a different one.
export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.title || !body.event_type || !body.category || !body.location_type || !body.start_date) {
      return NextResponse.json(
        { error: 'title, event_type, category, location_type e start_date sono obbligatori' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('events')
      .insert({
        title: body.title,
        description: body.description ?? null,
        event_type: body.event_type,
        category: body.category,
        sub_category: body.sub_category ?? null,
        audience: body.audience ?? 'both',
        professional_level: body.professional_level ?? null,
        organizer: body.organizer ?? null,
        organizer_website: body.organizer_website ?? null,
        official_url: body.official_url ?? null,
        registration_url: body.registration_url ?? null,
        location_type: body.location_type,
        country: body.country ?? null,
        city: body.city ?? null,
        venue: body.venue ?? null,
        address: body.address ?? null,
        latitude: body.latitude ?? null,
        longitude: body.longitude ?? null,
        start_date: body.start_date,
        end_date: body.end_date ?? null,
        timezone: body.timezone ?? null,
        language: body.language ?? null,
        price: body.price ?? null,
        currency: body.currency ?? null,
        is_free: body.is_free ?? false,
        registration_deadline: body.registration_deadline ?? null,
        speakers: body.speakers ?? [],
        topics: body.topics ?? [],
        tags: body.tags ?? [],
        image: body.image ?? null,
        source: body.source ?? 'manual',
        source_url: body.source_url ?? null,
        source_last_checked: new Date().toISOString(),
        status: body.status ?? 'upcoming',
        verification_status: body.verification_status ?? 'unverified',
        moderation_status: 'approved',
        is_featured: body.is_featured ?? false,
      })
      .select()
      .single();

    if (error) {
      console.error('events admin create error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ event: data });
  } catch (err) {
    console.error('events admin create error:', err);
    return NextResponse.json({ error: 'Create failed' }, { status: 500 });
  }
}
