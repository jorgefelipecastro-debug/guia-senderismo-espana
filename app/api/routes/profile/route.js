import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabase-admin';
import { recordServerError } from '../../../../lib/monitoring';
import { resolveRouteGeometry, routeDistanceKm, sampleSegments } from '../../../../lib/route-geometry';

export const dynamic = 'force-dynamic';

async function elevations(points) {
  if (!points.length) return [];
  const url = new URL('https://api.open-meteo.com/v1/elevation');
  url.searchParams.set('latitude', points.map(point => point.lat.toFixed(5)).join(','));
  url.searchParams.set('longitude', points.map(point => point.lon.toFixed(5)).join(','));
  const response = await fetch(url, { signal: AbortSignal.timeout(12000), next: { revalidate: 2592000 } });
  if (!response.ok) throw new Error(`Elevation ${response.status}`);
  const data = await response.json();
  return (data.elevation || []).map(Number).filter(Number.isFinite);
}

function estimatedMinutes(distance, ascent) {
  if (!distance) return null;
  return Math.max(15, Math.round((distance / 4 + (ascent || 0) / 600) * 4) * 15);
}

function duration(minutes) {
  if (!minutes) return null;
  const whole = Math.floor(minutes / 60), rest = minutes % 60;
  return `${whole ? `${whole} h` : ''}${rest ? ` ${rest} min` : ''}`.trim();
}

export async function GET(request) {
  const id = String(request.nextUrl.searchParams.get('id') || '');
  if (!/^[a-z0-9-]+$/i.test(id)) return NextResponse.json({ found: false, error: 'Identificador de ruta no válido.' }, { status: 400 });
  try {
    const geometry = await resolveRouteGeometry(id);
    if (!geometry?.segments?.length) return NextResponse.json({ found: false, error: 'El trazado público no incluye geometría suficiente.' });
    const distance = routeDistanceKm(geometry.segments), samples = sampleSegments(geometry.segments);
    let heights = [];
    try { heights = await elevations(samples); } catch (error) { console.error('Route elevation lookup failed', error); }
    const maxAltitudeM = heights.length ? Math.round(Math.max(...heights)) : null;
    const minAltitudeM = heights.length ? Math.round(Math.min(...heights)) : null;
    const ascentM = heights.length > 1 ? Math.round(heights.slice(1).reduce((sum, height, index) => {
      const sameSegment = samples[index]?.segment === samples[index + 1]?.segment;
      return sum + (sameSegment && height - heights[index] >= 2 ? height - heights[index] : 0);
    }, 0)) : null;
    const distanceRounded = Math.round(distance * 10) / 10, minutes = estimatedMinutes(distanceRounded, ascentM);
    try {
      await getSupabaseAdmin().rpc('merge_hiking_route_enrichment', {
        p_route_id: id, p_distance_km: distanceRounded, p_ascent_m: ascentM,
        p_max_altitude_m: maxAltitudeM, p_min_altitude_m: minAltitudeM,
        p_duration_minutes: minutes,
      });
    } catch (persistError) { console.error('Route profile persistence failed', persistError); }
    return NextResponse.json({
      found: true,
      distanceKm: distanceRounded,
      ascentM,
      maxAltitudeM,
      minAltitudeM,
      duration: duration(minutes),
      source: heights.length ? `Calculado con ${geometry.source} y el modelo de elevación Open-Meteo` : `Calculado con ${geometry.source}`,
      calculated: true,
    }, { headers: { 'Cache-Control': 'public, s-maxage=604800, stale-while-revalidate=2592000' } });
  } catch (error) {
    await recordServerError(error,{route:'/api/routes/profile'});
    return NextResponse.json({ found: false, error: 'No hemos podido calcular ahora el perfil de esta ruta.' }, { status: 503 });
  }
}
