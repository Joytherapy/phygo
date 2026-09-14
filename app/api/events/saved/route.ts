import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Backs the "My Events" page: returns every event the current user has
// saved, joined with the event row. The page itself buckets these into
// Upcoming/Past by comparing start_date to now — kept simple here so the
// endpoint stays a single flat "saved" list (mirrors patient_clinical_
// references: one table, client-side grouping).
export async function GET(req: Request) {
  try {
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

    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { data, error } = await supabase
      .from('user_saved_events')
      .select('created_at, events(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('saved events error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const events = (data ?? [])
      .map((row) => row.events)
      .filter((e): e is NonNullable<typeof e> => Boolean(e));

    return NextResponse.json({ events }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
  } catch (err) {
    console.error('saved events error:', err);
    return NextResponse.json({ error: 'Failed to load saved events' }, { status: 500 });
  }
}
