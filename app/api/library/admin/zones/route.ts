import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/adminServer';
import { createClient } from '@supabase/supabase-js';
import { lazy } from '@/lib/lazy';

const supabase = lazy(() => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
));

export async function GET(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const { data: zones } = await supabase.from('body_zones').select('*').order('sort_order');
  const { data: zoneItems } = await supabase.from('body_zone_items').select('*');
  return NextResponse.json({ zones, zoneItems });
}

export async function POST(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    const { zoneId, itemId } = await req.json();
    if (!zoneId || !itemId) {
      return NextResponse.json({ error: 'zoneId e itemId richiesti' }, { status: 400 });
    }
    const { error } = await supabase
      .from('body_zone_items')
      .upsert({ zone_id: zoneId, item_id: itemId }, { onConflict: 'zone_id,item_id' });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Link failed' }, { status: 500 });
  }
}
