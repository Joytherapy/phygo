import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const { data: categories } = await supabase
    .from('library_categories')
    .select('id, name, slug')
    .order('sort_order');

  const { data: subcategories } = await supabase
    .from('library_subcategories')
    .select('id, category_id, name, slug')
    .order('sort_order');

  const { data: items } = await supabase
    .from('library_items')
    .select('*')
    .order('sort_order');

  return NextResponse.json({ categories, subcategories, items });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      id,
      subcategory_id,
      title,
      goal,
      level,
      body_position,
      equipment,
      steps,
      reps_duration,
      easier_option,
      harder_option,
      tip,
      safety_note,
      sort_order,
    } = body;

    if (!subcategory_id || !title || !level || !body_position) {
      return NextResponse.json({ error: 'Campi obbligatori mancanti' }, { status: 400 });
    }

    const payload = {
      subcategory_id,
      title,
      goal: goal || null,
      level,
      body_position,
      equipment: equipment || 'None',
      steps: steps || [],
      reps_duration: reps_duration || null,
      easier_option: easier_option || null,
      harder_option: harder_option || null,
      tip: tip || null,
      safety_note: safety_note || null,
      sort_order: sort_order ?? 0,
      updated_at: new Date().toISOString(),
    };

    if (id) {
      const { error } = await supabase.from('library_items').update(payload).eq('id', id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, id });
    } else {
      const { data, error } = await supabase.from('library_items').insert(payload).select('id').single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, id: data.id });
    }
  } catch (err) {
    console.error('library admin save error:', err);
    return NextResponse.json({ error: 'Save failed' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'id mancante' }, { status: 400 });

    const { error } = await supabase.from('library_items').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('library admin delete error:', err);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}
