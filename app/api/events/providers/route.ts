import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Public list of trusted training-provider organizations (event_sources
// table). These are course-catalog businesses (New Master, PhisioVit,
// FisioScience, etc.) whose full, ever-changing calendar Phygo cannot
// mirror event-by-event — shown as outbound links on the Events discovery
// page so users can always reach each provider's complete, current schedule.
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('event_sources')
      .select('id, name, base_url, country, description, courses_note')
      .eq('active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('event sources list error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { providers: data },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (err) {
    console.error('event sources list error:', err);
    return NextResponse.json({ error: 'Failed to load providers' }, { status: 500 });
  }
}
