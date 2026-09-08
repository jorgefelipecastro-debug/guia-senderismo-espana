import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../lib/supabase-admin';
import { recordServerError } from '../../../lib/monitoring';

export const dynamic = 'force-dynamic';
const DEFAULT_POSITION = { lat: 38.3452, lon: -0.4815 };

async function geocodeSpain(place) {
  const query = String(place || '').trim().slice(0, 80);
  if (!query) return null;
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', query);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('limit', '1');
  url.searchParams.set('countrycodes', 'es');
  const response = await fetch(url, {
    headers: { Accept: 'application/json', 'Accept-Language': 'es', 'User-Agent': 'Encumbrate/1.0 (https://www.encumbrate.es)' },
    signal: AbortSignal.timeout(10000), next: { revalidate: 86400 },
  });
  if (!response.ok) throw new Error(`Nominatim ${response.status}`);
  const [result] = await response.json();
  const lat = Number(result?.lat), lon = Number(result?.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return { lat, lon, label: result.display_name || query };
}

function distanceKm(lat1, lon1, lat2, lon2) {
  const rad = value => value * Math.PI / 180;
  const dLat = rad(lat2 - lat1), dLon = rad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function durationLabel(minutes) {
  if (!Number.isFinite(Number(minutes)) || Number(minutes) <= 0) return null;
  const total = Math.round(Number(minutes)), hours = Math.floor(total / 60), rest = total % 60;
  return `${hours ? `${hours} h` : ''}${rest ? ` ${rest} min` : ''}`.trim();
}

function storedRoute(row, position, databaseDistanceM = null) {
  return {
    id: row.id, name: row.name, ref: row.route_ref || '', level: row.level,
    distanceKm: row.distance_km === null ? null : Number(row.distance_km),
    ascentM: row.ascent_m, maxAltitudeM: row.max_altitude_m, minAltitudeM: row.min_altitude_m,
    duration: durationLabel(row.duration_minutes), routeType: row.route_type || 'No publicado',
    description: row.description || `Sendero ${row.route_ref ? `${row.route_ref} ` : ''}publicado en OpenStreetMap. Comprueba siempre el estado y la señalización antes de salir.`,
    lat: row.latitude, lon: row.longitude,
    nearbyKm: Number.isFinite(Number(databaseDistanceM)) ? Number(databaseDistanceM) / 1000 : distanceKm(position.lat, position.lon, row.latitude, row.longitude),
    image: row.image_url || null, imageIsSpecific: Boolean(row.image_verified && row.image_url),
    imageAttribution: row.image_credit || '', imageLicense: row.image_license || '', imageSourceUrl: row.image_source_url || '', imageGallery: [],
    wikipedia: row.wikipedia || '', wikidata: row.wikidata || '', commonsCategory: row.commons_category || '',
    sourceName: row.operator_name || 'OpenStreetMap', sourceUrl: row.source_url, officialUrl: row.official_url || '',
    metricsSource: row.distance_km !== null || row.ascent_m !== null ? 'Catálogo nacional auditado de Encúmbrate' : '',
    metricsSourceUrl: row.source_url, network: row.network || '', municipality: row.municipality || '',
    province: row.province, community: row.community, incompleteFields: row.incomplete_fields || [],
  };
}

function normalized(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').trim();
}

async function databaseRoutes({ position, place, scope, offset, limit, radius }) {
  const supabase = getSupabaseAdmin();
  let region = null;
  if (scope === 'province' && place) {
    const { data: regions, error: regionError } = await supabase.from('route_import_regions').select('code,community,province,status,last_completed_at');
    if (regionError) throw regionError;
    const needle = normalized(place).replace(/[,\s]+espana$/, '').trim();
    region = (regions || []).find(item => normalized(item.province) === needle || normalized(item.community) === needle) || null;
    if (!region || region.status !== 'ready') return { routes: [], total: 0, nextCursor: null, region };
  }
  const { data, error } = await supabase.rpc('search_hiking_routes_postgis', {
    p_lat: position.lat, p_lon: position.lon, p_radius_m: radius,
    p_region_code: region?.code || null, p_offset: offset, p_limit: limit,
  });
  if (error) throw error;
  const routes = (data || []).map(item => storedRoute(item.route, position, item.distance_m));
  const total = Number(data?.[0]?.total_count || 0);
  return { routes, total, nextCursor: offset + routes.length < total ? String(offset + routes.length) : null, ...(region ? { region } : {}) };
}

export async function GET(request) {
  const params = request.nextUrl.searchParams;
  let position = DEFAULT_POSITION;
  try {
    const place = params.get('place');
    const geocoded = place ? await geocodeSpain(place) : null;
    if (place && !geocoded) return NextResponse.json({ error: 'No hemos encontrado esa localidad en España.' }, { status: 404 });
    const lat = Number(params.get('lat')), lon = Number(params.get('lon'));
    position = geocoded || {
      lat: Number.isFinite(lat) && lat >= -90 && lat <= 90 ? lat : DEFAULT_POSITION.lat,
      lon: Number.isFinite(lon) && lon >= -180 && lon <= 180 ? lon : DEFAULT_POSITION.lon,
    };
    const radius = Math.min(50000, Math.max(10000, Number(params.get('radius')) || 20000));
    const offset = Math.max(0, Number.parseInt(params.get('cursor') || '0', 10) || 0);
    const limit = Math.min(200, Math.max(3, Number.parseInt(params.get('limit') || '200', 10) || 200));
    const stored = await databaseRoutes({ position, place, scope: params.get('scope'), offset, limit, radius });
    return NextResponse.json({ ...stored, position, searchLabel: geocoded?.label || '', attribution: 'Catálogo nacional Encúmbrate · © OpenStreetMap contributors', updatedAt: new Date().toISOString(), catalogSource: 'supabase' }, { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600' } });
  } catch (error) {
    await recordServerError(error, { route: '/api/routes' });
    return NextResponse.json({ routes: [], position, attribution: 'Catálogo Encúmbrate temporalmente no disponible', error: 'No hemos podido consultar ahora el catálogo de rutas.' }, { status: 503 });
  }
}
