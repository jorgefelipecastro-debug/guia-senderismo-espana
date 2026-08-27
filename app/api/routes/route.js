import { NextResponse } from 'next/server';
import { findCuratedRoute } from '../../../lib/route-curation';
import { getSupabaseAdmin } from '../../../lib/supabase-admin';

export const dynamic = 'force-dynamic';

const OVERPASS_ENDPOINTS = [
  'https://overpass.private.coffee/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass-api.de/api/interpreter',
];
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
    headers: {
      Accept: 'application/json',
      'Accept-Language': 'es',
      'User-Agent': 'Encumbrate/1.0 (https://www.encumbrate.es)',
    },
    signal: AbortSignal.timeout(10000),
    next: { revalidate: 86400 },
  });
  if (!response.ok) throw new Error(`Nominatim ${response.status}`);
  const [result] = await response.json();
  const lat = Number(result?.lat), lon = Number(result?.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return {
    lat, lon,
    label: result.display_name || query,
    osmType: result.osm_type || '',
    osmId: Number(result.osm_id) || null,
  };
}

function numberFrom(value) {
  if (value === undefined || value === null) return null;
  const match = String(value).replace(',', '.').match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function distanceKm(lat1, lon1, lat2, lon2) {
  const rad = value => value * Math.PI / 180;
  const dLat = rad(lat2 - lat1), dLon = rad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function parseDistance(tags) {
  const raw = tags.distance || tags.length || tags['distance:km'];
  const value = numberFrom(raw);
  if (value === null) return null;
  return /\bm\b/i.test(String(raw)) && !/km/i.test(String(raw)) ? value / 1000 : value;
}

function parseDuration(tags, kilometres, ascent) {
  const raw = tags.duration || tags.time || tags['walking_time'];
  if (raw) return String(raw).replace(/^0(?=\d:)/, '');
  if (!kilometres) return null;
  const hours = kilometres / 4 + (ascent || 0) / 600;
  const rounded = Math.max(0.5, Math.round(hours * 4) / 4);
  const whole = Math.floor(rounded), minutes = Math.round((rounded - whole) * 60);
  return `${whole ? `${whole} h` : ''}${minutes ? ` ${minutes} min` : ''}`.trim();
}

function classify(kilometres, ascent) {
  if ((kilometres !== null && kilometres >= 20) || (ascent !== null && ascent >= 1000)) return 'experto';
  if ((kilometres === null || kilometres <= 10) && (ascent === null || ascent <= 400)) return 'principiante';
  return 'intermedio';
}

function commonsImage(tags) {
  const value = tags.image || tags['wikimedia_commons:image'] || (/^File:/i.test(tags.wikimedia_commons || '') ? tags.wikimedia_commons : '');
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  const file = String(value).replace(/^File:/i, '');
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=1200`;
}

function hasSpecificImage(tags) {
  return Boolean(tags.image || tags['wikimedia_commons:image'] || /^File:/i.test(tags.wikimedia_commons || ''));
}

function durationLabel(minutes) {
  if (!Number.isFinite(Number(minutes)) || Number(minutes) <= 0) return null;
  const total = Math.round(Number(minutes)), hours = Math.floor(total / 60), rest = total % 60;
  return `${hours ? `${hours} h` : ''}${rest ? ` ${rest} min` : ''}`.trim();
}

function storedRoute(row, userPosition) {
  return {
    id: row.id, name: row.name, ref: row.route_ref || '', level: row.level,
    distanceKm: row.distance_km === null ? null : Number(row.distance_km),
    ascentM: row.ascent_m, maxAltitudeM: row.max_altitude_m, minAltitudeM: row.min_altitude_m,
    duration: durationLabel(row.duration_minutes), routeType: row.route_type || 'No publicado',
    description: row.description || `Sendero ${row.route_ref ? `${row.route_ref} ` : ''}publicado en OpenStreetMap. Comprueba siempre el estado y la señalización antes de salir.`,
    lat: row.latitude, lon: row.longitude,
    nearbyKm: distanceKm(userPosition.lat, userPosition.lon, row.latitude, row.longitude),
    image: row.image_url || null, imageIsSpecific: Boolean(row.image_verified && row.image_url),
    imageAttribution: row.image_credit || '', imageLicense: row.image_license || '',
    imageSourceUrl: row.image_source_url || '', imageGallery: [], wikipedia: row.wikipedia || '',
    wikidata: row.wikidata || '', commonsCategory: row.commons_category || '',
    sourceName: row.operator_name || 'OpenStreetMap', sourceUrl: row.source_url,
    officialUrl: row.official_url || '', metricsSource: row.distance_km !== null || row.ascent_m !== null ? 'Catálogo nacional auditado de Encúmbrate' : '',
    metricsSourceUrl: row.source_url, network: row.network || '', municipality: row.municipality || '',
    province: row.province, community: row.community, incompleteFields: row.incomplete_fields || [],
  };
}

function normalized(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').trim();
}

function normalizedRegionQuery(value) {
  return normalized(value).replace(/[,\s]+espana$/, '').trim();
}

async function databaseRoutes({ position, bbox, place, scope, offset, limit }) {
  const supabase = getSupabaseAdmin();
  if (scope === 'province' && place) {
    const { data: regions, error: regionError } = await supabase.from('route_import_regions').select('code,community,province,status,last_completed_at');
    if (regionError) throw regionError;
    const needle = normalizedRegionQuery(place);
    const region = (regions || []).find(item => normalized(item.province) === needle || normalized(item.community) === needle);
    if (!region || region.status !== 'ready') return { ready: false, routes: [] };
    const memberships = [];
    const batchSize = 1000;
    for (let from = 0; ; from += batchSize) {
      const { data, error } = await supabase.from('hiking_route_regions')
        .select('route_id,hiking_routes!inner(*)')
        .eq('region_code', region.code).eq('published', true).eq('hiking_routes.published', true)
        .order('route_id').range(from, from + batchSize - 1);
      if (error) throw error;
      memberships.push(...(data || []));
      if (!data || data.length < batchSize) break;
    }
    const routes = memberships.map(item => storedRoute(item.hiking_routes, position))
      .sort((a, b) => a.nearbyKm - b.nearbyKm || a.name.localeCompare(b.name, 'es'));
    return {
      ready: routes.length > 0,
      routes: routes.slice(offset, offset + limit),
      total: routes.length,
      nextCursor: offset + limit < routes.length ? String(offset + limit) : null,
      region,
    };
  }
  const [south, west, north, east] = bbox.split(',').map(Number);
  const rows = [];
  const batchSize = 1000;
  for (let from = 0; ; from += batchSize) {
    const { data, error } = await supabase.from('hiking_routes').select('*')
      .eq('published', true).gte('latitude', south).lte('latitude', north)
      .gte('longitude', west).lte('longitude', east)
      .order('id').range(from, from + batchSize - 1);
    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < batchSize) break;
  }
  const routes = rows.map(row => storedRoute(row, position))
    .sort((a, b) => a.nearbyKm - b.nearbyKm || a.name.localeCompare(b.name, 'es'));
  return { ready: routes.length > 0, routes: routes.slice(offset, offset + limit), total: routes.length, nextCursor: offset + limit < routes.length ? String(offset + limit) : null };
}

function normalize(element, userPosition) {
  const tags = element.tags || {};
  const lat = element.center?.lat ?? element.lat;
  const lon = element.center?.lon ?? element.lon;
  if (!tags.name || !Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  const curated = findCuratedRoute(tags.name, tags.ref);
  const publishedKilometres = parseDistance(tags);
  const publishedAscent = numberFrom(tags.ascent || tags['ascent:total'] || tags['ele:gain'] || tags['incline:up']);
  const kilometres = curated?.distanceKm ?? publishedKilometres;
  const ascent = curated?.ascentM ?? publishedAscent;
  const maxAltitude = curated?.maxAltitudeM ?? numberFrom(tags.maxele || tags['ele:max'] || tags.max_altitude || tags.ele);
  const minAltitude = curated?.minAltitudeM ?? numberFrom(tags.minele || tags['ele:min'] || tags.min_altitude);
  const directImage = commonsImage(tags), curatedImage = curated?.image || null;
  const level = classify(kilometres, ascent);
  return {
    id: `osm-${element.type}-${element.id}`,
    name: tags.name,
    ref: tags.ref || '',
    level,
    distanceKm: kilometres,
    ascentM: ascent,
    maxAltitudeM: maxAltitude,
    minAltitudeM: minAltitude,
    duration: curated?.duration || parseDuration(tags, kilometres, ascent),
    routeType: curated?.routeType || (tags.roundtrip === 'yes' ? 'Circular' : tags.roundtrip === 'no' ? 'Lineal' : 'No publicado'),
    description: tags.description || `Sendero ${tags.ref ? `${tags.ref} ` : ''}publicado en OpenStreetMap. Comprueba siempre el estado y la señalización antes de salir.`,
    lat,
    lon,
    nearbyKm: distanceKm(userPosition.lat, userPosition.lon, lat, lon),
    image: curatedImage?.src || directImage,
    imageIsSpecific: Boolean(curatedImage || hasSpecificImage(tags)),
    imageAttribution: curatedImage?.credit || (hasSpecificImage(tags) ? 'Imagen enlazada en la ficha pública de OpenStreetMap' : ''),
    imageLicense: curatedImage?.license || '',
    imageSourceUrl: curatedImage?.sourceUrl || (hasSpecificImage(tags) ? (tags.image || tags['wikimedia_commons:image'] || tags.wikimedia_commons) : ''),
    imageGallery: curated?.gallery || [],
    wikipedia: tags.wikipedia || '',
    wikidata: tags.wikidata || '',
    commonsCategory: /^Category:/i.test(tags.wikimedia_commons || '') ? tags.wikimedia_commons : '',
    sourceName: tags.operator || 'OpenStreetMap',
    sourceUrl: `https://www.openstreetmap.org/${element.type}/${element.id}`,
    officialUrl: curated?.officialUrl || tags.website || tags.url || '',
    metricsSource: curated?.metricsSource || (publishedKilometres !== null || publishedAscent !== null ? 'Ficha pública de OpenStreetMap' : ''),
    metricsSourceUrl: curated?.metricsSourceUrl || '',
    network: tags.network || '',
  };
}

async function fetchOverpass(query) {
  let lastError;
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
          Accept: 'application/json',
          'User-Agent': 'Encumbrate/1.0 (https://www.encumbrate.es)',
        },
        body: new URLSearchParams({ data: query }),
        signal: AbortSignal.timeout(18000),
        next: { revalidate: 21600 },
      });
      if (!response.ok) throw new Error(`Overpass ${response.status}`);
      return response.json();
    } catch (error) { lastError = error; }
  }
  throw lastError || new Error('No route source available');
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
    const latDelta = radius / 111000;
    const lonDelta = radius / (111000 * Math.max(.2, Math.cos(position.lat * Math.PI / 180)));
    const bbox = [position.lat - latDelta, position.lon - lonDelta, position.lat + latDelta, position.lon + lonDelta].join(',');
    try {
      const stored = await databaseRoutes({ position, bbox, place, scope: params.get('scope'), offset, limit });
      if (stored.ready) return NextResponse.json({ ...stored, position, searchLabel: geocoded?.label || '', attribution: 'Catálogo nacional Encúmbrate · © OpenStreetMap contributors', updatedAt: new Date().toISOString(), catalogSource: 'supabase' }, { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600' } });
    } catch (databaseError) {
      console.error('Persistent route catalog lookup failed; using live fallback', databaseError);
    }
    const provinceAreaId = params.get('scope') === 'province' && geocoded?.osmType === 'relation' && geocoded.osmId ? 3600000000 + geocoded.osmId : null;
    const query = provinceAreaId
      ? `[out:json][timeout:45];area(${provinceAreaId})->.searchArea;relation["route"="hiking"](area.searchArea);out tags center;`
      : `[out:json][timeout:30];relation["route"="hiking"](${bbox});out tags center;`;
    const data = await fetchOverpass(query);
    const routes = (data.elements || []).map(item => normalize(item, position)).filter(Boolean)
      .sort((a, b) => a.nearbyKm - b.nearbyKm || a.name.localeCompare(b.name, 'es'));
    const page = routes.slice(offset,offset+limit);
    return NextResponse.json({ routes: page, total: routes.length, nextCursor: offset+page.length<routes.length?String(offset+page.length):null, position, searchLabel: geocoded?.label || '', attribution: '© OpenStreetMap contributors · Importación nacional pendiente para esta zona', updatedAt: new Date().toISOString(), catalogSource: 'live-fallback' }, { headers: { 'Cache-Control': 'public, s-maxage=21600, stale-while-revalidate=86400' } });
  } catch (error) {
    console.error('Route catalog lookup failed', error);
    return NextResponse.json({ routes: [], position, attribution: 'Fuente de rutas temporalmente no disponible', error: 'No hemos podido consultar ahora el catálogo público de rutas.' }, { status: 503 });
  }
}
