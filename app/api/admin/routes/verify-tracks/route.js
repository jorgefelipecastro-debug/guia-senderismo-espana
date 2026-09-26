import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../../lib/supabase-admin';
import { fetchRelationTracks } from '../../../../../lib/route-geometry-import';
import { recordServerError } from '../../../../../lib/monitoring';

export const dynamic = 'force-dynamic';
export const maxDuration = 180;

export async function POST(request) {
  const supabase = getSupabaseAdmin();
  const { data: control, error: authError } = await supabase.from('route_import_control').select('import_key,enabled').eq('id', true).single();
  const supplied = Buffer.from(String(request.headers.get('x-encumbrate-import-key') || ''));
  const expected = Buffer.from(String(control?.import_key || ''));
  if (authError || !control?.enabled || !supplied.length || supplied.length !== expected.length || !timingSafeEqual(supplied, expected))
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });

  const { data: routes, error: claimError } = await supabase.rpc('claim_route_geometry_batch', { p_limit: 12 });
  if (claimError) return NextResponse.json({ error: 'No se pudo reservar el lote de trazados.' }, { status: 500 });
  if (!routes?.length) return NextResponse.json({ done: true, checked: 0 });
  try {
    const tracks = await fetchRelationTracks(routes.map(route => route.relation_id));
    let ready = 0, missing = 0;
    for (const route of routes) {
      const segments = tracks.get(String(route.relation_id));
      const { error } = await supabase.rpc('finish_route_geometry_check', {
        p_route_id: route.route_id, p_segments: segments || null,
      });
      if (error) throw error;
      if (segments) ready++; else missing++;
    }
    return NextResponse.json({ done: false, checked: routes.length, ready, missing });
  } catch (error) {
    await recordServerError(error, { route: '/api/admin/routes/verify-tracks' });
    return NextResponse.json({ error: 'La fuente de trazados no responde; se reintentará sin descartar rutas.' }, { status: 503 });
  }
}
