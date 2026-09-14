import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const MAX_LIMIT = 60;

function datePresetRange(preset: string | null): { from?: string; to?: string } {
  if (!preset) return {};
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  switch (preset) {
    case 'today': {
      const end = new Date(startOfToday);
      end.setDate(end.getDate() + 1);
      return { from: startOfToday.toISOString(), to: end.toISOString() };
    }
    case 'week': {
      const end = new Date(startOfToday);
      end.setDate(end.getDate() + 7);
      return { from: startOfToday.toISOString(), to: end.toISOString() };
    }
    case 'month': {
      const end = new Date(startOfToday);
      end.setMonth(end.getMonth() + 1);
      return { from: startOfToday.toISOString(), to: end.toISOString() };
    }
    case '3months': {
      const end = new Date(startOfToday);
      end.setMonth(end.getMonth() + 3);
      return { from: startOfToday.toISOString(), to: end.toISOString() };
    }
    default:
      return {};
  }
}

// Public Events discovery feed. Only ever returns moderation_status='approved'
// rows — pending/rejected events stay invisible outside the admin queue
// (see app/api/events/admin). Supports the filter set from the Events brief:
// category/type/date-preset/location/free-paid/audience/level + free-text
// search across title/city/country/topics, plus simple pagination.
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const params = url.searchParams;

    const q = params.get('q')?.trim();
    const category = params.get('category');
    const eventType = params.get('eventType');
    const locationType = params.get('locationType'); // online | in_person | hybrid
    const audience = params.get('audience');
    const level = params.get('level');
    const country = params.get('country');
    const city = params.get('city');
    const free = params.get('free'); // 'true' | 'false'
    const featured = params.get('featured'); // 'true'
    const datePreset = params.get('datePreset'); // today|week|month|3months
    const dateFrom = params.get('dateFrom');
    const dateTo = params.get('dateTo');
    const includePast = params.get('includePast') === 'true';
    const limit = Math.min(parseInt(params.get('limit') || '20', 10) || 20, MAX_LIMIT);
    const offset = Math.max(parseInt(params.get('offset') || '0', 10) || 0, 0);

    let query = supabase
      .from('events')
      .select('*', { count: 'exact' })
      .eq('moderation_status', 'approved')
      .neq('status', 'cancelled');

    if (!includePast) {
      query = query.gte('start_date', new Date().toISOString());
    }
    if (category) query = query.eq('category', category);
    if (eventType) query = query.eq('event_type', eventType);
    if (locationType) query = query.eq('location_type', locationType);
    if (audience) query = query.in('audience', audience === 'both' ? ['both'] : [audience, 'both']);
    if (level) query = query.eq('professional_level', level);
    if (country) query = query.eq('country', country);
    if (city) query = query.eq('city', city);
    if (free === 'true') query = query.eq('is_free', true);
    if (free === 'false') query = query.eq('is_free', false);
    if (featured === 'true') query = query.eq('is_featured', true);

    const preset = datePresetRange(datePreset);
    const from = dateFrom || preset.from;
    const to = dateTo || preset.to;
    if (from) query = query.gte('start_date', from);
    if (to) query = query.lt('start_date', to);

    if (q) {
      const escaped = q.replace(/[%_]/g, (c) => `\\${c}`);
      query = query.or(
        `title.ilike.%${escaped}%,city.ilike.%${escaped}%,country.ilike.%${escaped}%,organizer.ilike.%${escaped}%`
      );
    }

    query = query.order('start_date', { ascending: true }).range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('events list error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { events: data, total: count ?? 0, limit, offset },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (err) {
    console.error('events list error:', err);
    return NextResponse.json({ error: 'Failed to load events' }, { status: 500 });
  }
}
