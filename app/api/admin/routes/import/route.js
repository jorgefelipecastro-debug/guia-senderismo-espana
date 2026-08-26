import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../../lib/supabase-admin';
import { fetchRegionRoutes, normalizeNationalRoute, resolveRegionArea } from '../../../../../lib/national-routes';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

function equalSecret(provided, expected) {
  const left = Buffer.from(String(provided || ''));
  const right = Buffer.from(String(expected || ''));
  return left.length === right.length && timingSafeEqual(left, right);
}

async function authorize(request, supabase) {
  const { data, error } = await supabase.from('route_import_control').select('import_key,enabled').eq('id', true).single();
  if (error || !data?.enabled) return false;
  return equalSecret(request.headers.get('x-encumbrate-import-key'), data.import_key);
}

async function upsertBatches(supabase, table, rows, onConflict) {
  for (let offset = 0; offset < rows.length; offset += 400) {
    const { error } = await supabase.from(table).upsert(rows.slice(offset, offset + 400), { onConflict });
    if (error) throw error;
  }
}

export async function POST(request) {
  const supabase = getSupabaseAdmin();
  if (!(await authorize(request, supabase))) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  const { data: claimed, error: claimError } = await supabase.rpc('claim_next_route_import_region');
  if (claimError) return NextResponse.json({ error: 'No se pudo reservar la siguiente provincia.' }, { status: 500 });
  const region = claimed?.[0];
  if (!region) return NextResponse.json({ done: true, message: 'No hay provincias pendientes.' });
  const startedAt = new Date().toISOString();
  const { data: run, error: runError } = await supabase.from('route_import_runs').insert({ region_code: region.code, status: 'running', started_at: startedAt }).select('id').single();
  if (runError) return NextResponse.json({ error: 'No se pudo crear la auditoría de importación.' }, { status: 500 });
  try {
    const areaId = await resolveRegionArea(region);
    if (!region.osm_area_id) await supabase.from('route_import_regions').update({ osm_area_id: areaId }).eq('code', region.code);
    const payload = await fetchRegionRoutes(areaId);
    const routes = (payload.elements || []).map(item => normalizeNationalRoute(item, region, startedAt)).filter(Boolean);
    await upsertBatches(supabase, 'hiking_routes', routes, 'source,source_type,external_id');
    await upsertBatches(supabase, 'hiking_route_regions', routes.map(route => ({ route_id: route.id, region_code: region.code, published: true, last_seen_at: startedAt })), 'route_id,region_code');
    const { data: summary, error: finishError } = await supabase.rpc('complete_route_import_region', {
      p_region_code: region.code, p_run_id: run.id, p_started_at: startedAt,
      p_source_count: (payload.elements || []).length, p_upserted_count: routes.length,
    });
    if (finishError) throw finishError;
    return NextResponse.json({ done: false, region: region.province, imported: routes.length, ...summary });
  } catch (error) {
    const message = String(error?.message || 'Error de importación').slice(0, 800);
    await Promise.all([
      supabase.from('route_import_regions').update({ status: 'error', last_error: message }).eq('code', region.code),
      supabase.from('route_import_runs').update({ status: 'error', error_message: message, completed_at: new Date().toISOString() }).eq('id', run.id),
    ]);
    console.error('National route import failed', region.code, error);
    return NextResponse.json({ error: message, region: region.province }, { status: 502 });
  }
}
