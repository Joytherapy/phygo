import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { paperId, action } = await req.json();

    if (!paperId || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Richiesta non valida' }, { status: 400 });
    }

    const newStatus = action === 'approve' ? 'published' : 'rejected';

    const { error } = await supabase
      .from('research_papers')
      .update({ status: newStatus })
      .eq('id', paperId);

    if (error) {
      return NextResponse.json({ error: 'Errore aggiornamento' }, { status: 500 });
    }

    return NextResponse.json({ success: true, status: newStatus });
  } catch (err) {
    console.error('admin review error:', err);
    return NextResponse.json({ error: 'Review failed' }, { status: 500 });
  }
}