import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const AUTO_PUBLISH_TYPES = ['Systematic Review', 'Meta-analysis', 'RCT'];
const AUTO_PUBLISH_THRESHOLD = 70;

export async function GET() {
  try {
    const { data: papers, error } = await supabase
      .from('research_papers')
      .select('id, study_type, relevance_score, status')
      .eq('status', 'pending_review');

    if (error) {
      return NextResponse.json({ error: 'Errore lettura papers' }, { status: 500 });
    }

    const toPublish = (papers || []).filter(
      (p) =>
        AUTO_PUBLISH_TYPES.includes(p.study_type || '') &&
        (p.relevance_score || 0) >= AUTO_PUBLISH_THRESHOLD
    );

    if (toPublish.length === 0) {
      return NextResponse.json({ message: 'Nessun paper da pubblicare con la nuova soglia', updated: 0 });
    }

    const { error: updateError } = await supabase
      .from('research_papers')
      .update({ status: 'published' })
      .in('id', toPublish.map((p) => p.id));

    if (updateError) {
      return NextResponse.json({ error: 'Errore update' }, { status: 500 });
    }

    return NextResponse.json({ updated: toPublish.length, ids: toPublish.map((p) => p.id) });
  } catch (err) {
    console.error('republish-check error:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
