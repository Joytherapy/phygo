import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data, error } = await adminSupabase
      .from('pelvic_floor_rehab')
      .select('*')
      .order('category', { ascending: true });

    if (error) {
      console.error('pelvic floor rehab list error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ rehab: data ?? [] });
  } catch (err) {
    console.error('pelvic floor rehab list error:', err);
    return NextResponse.json({ error: 'Failed to load rehab content' }, { status: 500 });
  }
}
