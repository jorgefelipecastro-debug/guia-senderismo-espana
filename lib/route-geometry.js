import { getSupabaseAdmin } from './supabase-admin.js';
import { simplifyTrack } from './navigation-geometry.js';

export const OSM_RELATION_FALLBACKS = {
  'fedamon-pr-a-77': '12010082',
  'fedamon-pr-a-151': '12088516',
  'fedamon-pr-a-178': '12008794',
  'fedamon-pr-a-226': '6345906',
  'fedamon-pr-a-241': '12049904',
  'fedamon-pr-a-308': '13088384',
  'fedamon-pr-a-394': '12018722',
  'fedamon-pr-a-447': '15530482',
};

export function haversineKm(a, b) {
  const rad = value => value * Math.PI / 180;
  const dLat = rad(b.lat - a.lat), dLon = rad(b.lon - a.lon);
  const value = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

export function validPoint(point) {
  return Number.isFinite(point?.lat) && Number.isFinite(point?.lon) && Math.abs(point.lat) <= 90 && Math.abs(point.lon) <= 180;
}

function cleanLine(points) {
  const output = [];
  for (const point of points || []) {
    const next = { lat: Number(point?.lat), lon: Number(point?.lon) };
    if (!validPoint(next)) continue;
    const previous = output.at(-1);
    if (!previous || previous.lat !== next.lat || previous.lon !== next.lon) output.push(next);
  }
  return output;
}

export function relationSegments(data, relationId) {
  const nodes = new Map(), ways = new Map();
  const relation = (data?.elements || []).find(item => item.type === 'relation' && String(item.id) === String(relationId));
  for (const item of data?.elements || []) {
    if (item.type === 'node' && Number.isFinite(item.lat) && Number.isFinite(item.lon)) nodes.set(item.id, { lat: item.lat, lon: item.lon });
    if (item.type === 'way') ways.set(item.id, item.nodes || []);
  }
  const segments = [];
  let previousEnd = null;
  for (const member of relation?.members || []) {
    if (member.type !== 'way') continue;
    let line = cleanLine(member.geometry || (ways.get(member.ref) || []).map(id => nodes.get(id)).filter(Boolean));
    if (line.length < 2) continue;
    if (member.role === 'backward' || member.role === 'reverse') line = line.reverse();
    if (previousEnd) {
      const first = line[0], last = line.at(-1);
      if (haversineKm(previousEnd, last) < haversineKm(previousEnd, first)) line = line.reverse();
    }
    segments.push(line);
    previousEnd = line.at(-1);
  }
  return segments;
}

// Keep each way separate so a missing connection never becomes a fictitious GPS line.
export function navigableSegments(segments, maxPoints = 2000) {
  const clean = (segments || []).map(cleanLine).filter(line => line.length > 1);
  if (!clean.length || clean.some(line => line.some(point => point.lat < 27 || point.lat > 45 || point.lon < -19 || point.lon > 5))) return null;
  const total = clean.reduce((sum, line) => sum + line.length, 0);
  const sampled = clean.map(line => simplifyTrack(line, Math.max(2, Math.round(maxPoints * line.length / total))));
  return routeDistanceKm(sampled) >= 0.1 ? sampled : null;
}

export function flattenSegments(segments) {
  const result = [];
  for (const segment of segments || []) {
    for (const point of segment || []) {
      const previous = result.at(-1);
      if (!previous || previous.lat !== point.lat || previous.lon !== point.lon) result.push(point);
    }
  }
  return result;
}

export function routeDistanceKm(segments) {
  return (segments || []).reduce((total, segment) => total + segment.slice(1).reduce((sum, point, index) => sum + haversineKm(segment[index], point), 0), 0);
}

export function sampleSegments(segments, limit = 60) {
  const points = (segments || []).flatMap((segment, segmentIndex) => segment.map(point => ({ ...point, segment: segmentIndex })));
  if (points.length <= limit) return points;
  return Array.from({ length: limit }, (_, index) => points[Math.round(index * (points.length - 1) / (limit - 1))]);
}

export async function storedRouteGeometry(id) {
  const { data, error } = await getSupabaseAdmin()
    .from('hiking_routes')
    .select('raw_tags,source,trace_available')
    .eq('id', id)
    .eq('published', true)
    .maybeSingle();
  if (error) throw error;
  if (!data?.trace_available) return null;
  const ownSegments = data.source === 'openstreetmap' ? null : navigableSegments([(data.raw_tags?.trace_points || []).map(point => ({ lat: Number(point?.[0]), lon: Number(point?.[1]) }))]);
  if (ownSegments) return { segments: ownSegments, source: data.source === 'fedamon' ? 'FAM' : 'Catálogo oficial', official: true };
  if (data.source === 'openstreetmap' || data.raw_tags?.osm_relation_id) {
    const { data: track, error: trackError } = await getSupabaseAdmin().from('hiking_route_tracks')
      .select('segments').eq('route_id', id).eq('status', 'ready').maybeSingle();
    if (trackError) throw trackError;
    const segments = navigableSegments(track?.segments);
    return segments ? { segments, source: 'OpenStreetMap', official: false } : null;
  }
  return null;
}

export async function osmRelationGeometry(relationId, fetcher = fetch) {
  const response = await fetcher(`https://api.openstreetmap.org/api/0.6/relation/${relationId}/full.json`, {
    headers: { Accept: 'application/json', 'User-Agent': 'Encumbrate/1.0 (https://www.encumbrate.es)' },
    signal: AbortSignal.timeout(18000),
    next: { revalidate: 604800 },
  });
  if (!response.ok) throw new Error(`OpenStreetMap ${response.status}`);
  const segments = relationSegments(await response.json(), relationId);
  if (!segments.length) throw new Error('OpenStreetMap route geometry unavailable');
  return { segments, source: 'OpenStreetMap API', official: false };
}

export async function resolveRouteGeometry(id) {
  const raw = String(id || '');
  if (!/^[a-z0-9-]+$/i.test(raw)) throw new Error('INVALID_ROUTE_ID');
  return storedRouteGeometry(raw);
}
