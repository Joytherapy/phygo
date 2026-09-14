import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getUserId() {
  const cookieStore = cookies();
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();
  return user?.id ?? null;
}

// Toggle-style save/unsave for "My Events". POST saves, DELETE unsaves —
// both idempotent (saving twice or unsaving an already-removed row is a
// no-op success, not an error), mirroring how the rest of the app treats
// patient_clinical_references adds/removes.
export async function POST(req: Request) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { eventId } = await req.json();
    if (!eventId) return NextResponse.json({ error: 'eventId mancante' }, { status: 400 });

    const { error } = await supabase
      .from('user_saved_events')
      .upsert({ user_id: userId, event_id: eventId }, { onConflict: 'user_id,event_id', ignoreDuplicates: true });

    if (error) {
      console.error('event save error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ saved: true });
  } catch (err) {
    console.error('event save error:', err);
    return NextResponse.json({ error: 'Save failed' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const eventId = new URL(req.url).searchParams.get('eventId');
    if (!eventId) return NextResponse.json({ error: 'eventId mancante' }, { status: 400 });

    const { error } = await supabase
      .from('user_saved_events')
      .delete()
      .eq('user_id', userId)
      .eq('event_id', eventId);

    if (error) {
      console.error('event unsave error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ saved: false });
  } catch (err) {
    console.error('event unsave error:', err);
    return NextResponse.json({ error: 'Unsave failed' }, { status: 500 });
  }
}
