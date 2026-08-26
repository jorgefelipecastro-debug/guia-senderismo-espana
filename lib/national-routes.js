import { findCuratedRoute } from './route-curation';

const OVERPASS_ENDPOINTS = [
  'https://overpass.private.coffee/api/interpreter',
  'https://overpass-api.de/api/interpreter',
];

function numberFrom(value) {
  if (value === undefined || value === null) return null;
  const match = String(value).replace(',', '.').match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function distanceFrom(tags) {
  const raw = tags.distance || tags.length || tags['distance:km'];
  const amount = numberFrom(raw);
  if (amount === null) return null;
  return /\bm\b/i.test(String(raw)) && !/km/i.test(String(raw)) ? amount / 1000 : amount;
}

function durationMinutes(tags) {
  const raw = String(tags.duration || tags.time || tags.walking_time || '').trim();
  if (!raw) return null;
  const clock = raw.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (clock) return Number(clock[1]) * 60 + Number(clock[2]);
  const hours = raw.match(/(\d+(?:[.,]\d+)?)\s*(?:h|hora)/i);
  const minutes = raw.match(/(\d+)\s*(?:m|min)/i);
  const total = (hours ? Number(hours[1].replace(',', '.')) * 60 : 0) + (minutes ? Number(minutes[1]) : 0);
  return total > 0 ? Math.round(total) : null;
}

function directImage(tags) {
  const raw = tags.image || tags['wikimedia_commons:image'] || (/^File:/i.test(tags.wikimedia_commons || '') ? tags.wikimedia_commons : '');
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(String(raw).replace(/^File:/i, ''))}?width=1200`;
}

function classify(distance, ascent) {
  if ((distance !== null && distance >= 20) || (ascent !== null && ascent >= 1000)) return 'experto';
  if ((distance === null || distance <= 10) && (ascent === null || ascent <= 400)) return 'principiante';
  return 'intermedio';
}

function normalized(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').replace(/\s+/g, ' ').trim();
}

export async function resolveRegionArea(region) {
  if (region.osm_area_id) return Number(region.osm_area_id);
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', region.search_name);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('limit', '5');
  url.searchParams.set('countrycodes', 'es');
  const response = await fetch(url, {
    headers: { Accept: 'application/json', 'Accept-Language': 'es', 'User-Agent': 'Encumbrate/1.0 (https://www.encumbrate.es)' },
    signal: AbortSignal.timeout(15000),
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`Nominatim respondió ${response.status}`);
  const results = await response.json();
  const relation = results.find(item => item.osm_type === 'relation');
  if (!relation?.osm_id) throw new Error(`No se encontró el área administrativa de ${region.province}`);
  return 3600000000 + Number(relation.osm_id);
}

export async function fetchRegionRoutes(areaId) {
  const query = `[out:json][timeout:90];area(${areaId})->.searchArea;relation["route"="hiking"](area.searchArea);out tags center meta;`;
  let lastError;
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8', Accept: 'application/json', 'User-Agent': 'Encumbrate/1.0 (https://www.encumbrate.es)' },
        body: new URLSearchParams({ data: query }),
        signal: AbortSignal.timeout(55000),
        cache: 'no-store',
      });
      if (!response.ok) throw new Error(`Overpass respondió ${response.status}`);
      return response.json();
    } catch (error) { lastError = error; }
  }
  throw lastError || new Error('No se pudo consultar el catálogo público de la provincia.');
}

export function normalizeNationalRoute(element, region, seenAt) {
  const tags = element.tags || {};
  const latitude = Number(element.center?.lat ?? element.lat);
  const longitude = Number(element.center?.lon ?? element.lon);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  const realName = String(tags.name || '').trim();
  const routeRef = String(tags.ref || '').trim();
  const name = realName || routeRef || `Ruta pública OSM ${element.id}`;
  const curated = findCuratedRoute(name, routeRef);
  const distance = curated?.distanceKm ?? distanceFrom(tags);
  const ascent = curated?.ascentM ?? numberFrom(tags.ascent || tags['ascent:total'] || tags['ele:gain'] || tags['incline:up']);
  const maxAltitude = curated?.maxAltitudeM ?? numberFrom(tags.maxele || tags['ele:max'] || tags.max_altitude || tags.ele);
  const minAltitude = curated?.minAltitudeM ?? numberFrom(tags.minele || tags['ele:min'] || tags.min_altitude);
  const duration = curated?.durationMinutes ?? durationMinutes(tags);
  const image = curated?.image?.src || directImage(tags);
  const incomplete = [];
  if (!realName) incomplete.push('name');
  if (distance === null) incomplete.push('distance_km');
  if (ascent === null) incomplete.push('ascent_m');
  if (maxAltitude === null) incomplete.push('max_altitude_m');
  if (duration === null) incomplete.push('duration_minutes');
  if (!image) incomplete.push('image_url');
  return {
    id: `osm-relation-${element.id}`,
    source: 'openstreetmap', source_type: 'relation', external_id: Number(element.id),
    region_code: region.code, community: region.community, province: region.province,
    name, route_ref: routeRef || null, normalized_name: normalized(name), latitude, longitude,
    level: classify(distance, ascent), distance_km: distance, ascent_m: ascent,
    max_altitude_m: maxAltitude, min_altitude_m: minAltitude, duration_minutes: duration,
    route_type: curated?.routeType || (tags.roundtrip === 'yes' ? 'Circular' : tags.roundtrip === 'no' ? 'Lineal' : null),
    network: tags.network || null, operator_name: tags.operator || null,
    description: tags.description || null, official_url: curated?.officialUrl || tags.website || tags.url || null,
    source_url: `https://www.openstreetmap.org/relation/${element.id}`,
    wikipedia: tags.wikipedia || null, wikidata: tags.wikidata || null,
    commons_category: /^Category:/i.test(tags.wikimedia_commons || '') ? tags.wikimedia_commons : null,
    image_url: image || null, image_source_url: curated?.image?.sourceUrl || tags.image || tags.wikimedia_commons || null,
    image_credit: curated?.image?.credit || (image ? 'Imagen enlazada en OpenStreetMap' : null),
    image_license: curated?.image?.license || null, image_verified: Boolean(curated?.image || directImage(tags)),
    trace_available: true, enrichment_status: incomplete.length ? 'partial' : 'complete',
    incomplete_fields: incomplete, raw_tags: tags, published: true,
    source_updated_at: element.timestamp || null, last_seen_at: seenAt,
  };
}
