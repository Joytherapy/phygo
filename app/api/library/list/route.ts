import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export const dynamic = 'force-dynamic';

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
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
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single();

    const allowedPlans = ['pro', 'super_pro'];
    if (!profile || !allowedPlans.includes(profile.plan)) {
      return NextResponse.json({ error: 'Pro Library richiede piano Pro o Super Pro' }, { status: 403 });
    }

    const { data: categories, error: catError } = await adminSupabase
      .from('library_categories')
      .select('id, name, slug, description, sort_order')
      .order('sort_order');

    if (catError) {
      return NextResponse.json({ error: 'Errore lettura categorie' }, { status: 500 });
    }

    const { data: subcategories } = await adminSupabase
      .from('library_subcategories')
      .select('id, category_id, name, slug, sort_order')
      .order('sort_order');

    const { data: items } = await adminSupabase
      .from('library_items')
      .select('*')
      .order('sort_order');

    return NextResponse.json({ categories, subcategories, items });
  } catch (err) {
    console.error('library list error:', err);
    return NextResponse.json({ error: 'List failed' }, { status: 500 });
  }
}
