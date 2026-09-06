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
      .from('manual_therapy_concepts')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('manual therapy concepts list error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ concepts: data ?? [] });
  } catch (err) {
    console.error('manual therapy concepts list error:', err);
    return NextResponse.json({ error: 'Failed to load concepts' }, { status: 500 });
  }
}