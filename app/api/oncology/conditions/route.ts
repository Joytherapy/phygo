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
      .from('oncology_conditions')
      .select('*')
      .order('system', { ascending: true });

    if (error) {
      console.error('oncology conditions list error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ conditions: data ?? [] });
  } catch (err) {
    console.error('oncology conditions list error:', err);
    return NextResponse.json({ error: 'Failed to load conditions' }, { status: 500 });
  }
}
