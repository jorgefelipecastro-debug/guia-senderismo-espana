import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../../lib/supabase-admin';
import { fetchRelationTrackBatches } from '../../../../../lib/route-geometry-import';
import { navigableSegments } from '../../../../../lib/route-geometry';
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

  // Reassess cached tracks before accepting any more routes. Earlier imports
  // could contain unordered or disconnected relation members; this pass uses
  // only their saved geometry and never calls an external map provider.
  const { data: pending, error: pendingError } = await supabase.from('hiking_route_tracks')
    .select('route_id,segments').eq('status', 'ready').eq('continuity_checked', false)
    .order('route_id').limit(100);
  if (pendingError) return NextResponse.json({ error: 'No se pudieron revisar los trazados guardados.' }, { status: 500 });
  if (pending?.length) {
    let ready = 0, missing = 0;
    for (const track of pending) {
      const segments = navigableSegments(track.segments);
      const { error } = await supabase.rpc('reconcile_ready_route_geometry', {
        p_route_id: track.route_id, p_segments: segments,
      });
      if (error) return NextResponse.json({ error: 'No se pudo terminar la revisión del trazado guardado.' }, { status: 503 });
      if (segments) ready++; else missing++;
    }
    return NextResponse.json({ done: false, reconciled: pending.length, ready, missing });
  }

  const { data: routes, error: claimError } = await supabase.rpc('claim_route_geometry_batch', { p_limit: 12 });
  if (claimError) return NextResponse.json({ error: 'No se pudo reservar el lote de trazados.' }, { status: 500 });
  if (!routes?.length) return NextResponse.json({ done: true, checked: 0 });
  try {
    const { tracks, failedIds, errors } = await fetchRelationTrackBatches(routes.map(route => route.relation_id));
    let ready = 0, missing = 0;
    for (const route of routes) {
      const relationId = String(route.relation_id);
      if (!tracks.has(relationId)) continue;
      const segments = tracks.get(relationId);
      const { error } = await supabase.rpc('finish_route_geometry_check', {
        p_route_id: route.route_id, p_segments: segments || null,
      });
      if (error) throw error;
      if (segments) ready++; else missing++;
    }
    if (errors.length) await recordServerError(errors[0], { route: '/api/admin/routes/verify-tracks' });
    if (failedIds.length === routes.length)
      return NextResponse.json({ error: 'La fuente de trazados no responde; se reintentará sin descartar rutas.' }, { status: 503 });
    return NextResponse.json({ done: false, checked: ready + missing, ready, missing, deferred: failedIds.length });
  } catch (error) {
    await recordServerError(error, { route: '/api/admin/routes/verify-tracks' });
    return NextResponse.json({ error: 'La fuente de trazados no responde; se reintentará sin descartar rutas.' }, { status: 503 });
  }
}
