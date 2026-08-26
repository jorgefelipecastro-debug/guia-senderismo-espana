import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabase-admin';

export const dynamic = 'force-dynamic';

const OVERPASS_ENDPOINTS = ['https://overpass.private.coffee/api/interpreter', 'https://overpass-api.de/api/interpreter'];

function distanceKm(a, b) {
  const rad = value => value * Math.PI / 180;
  const dLat = rad(b.lat - a.lat), dLon = rad(b.lon - a.lon);
  const value = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function geometryLines(elements) {
  return (elements || []).flatMap(element => {
    if (Array.isArray(element?.members)) return element.members.map(member => member.geometry).filter(line => Array.isArray(line) && line.length > 1);
    return Array.isArray(element?.geometry) && element.geometry.length > 1 ? [element.geometry] : [];
  });
}

function lineDistance(lines) {
  return lines.reduce((total, line) => total + line.slice(1).reduce((sum, point, index) => sum + distanceKm(line[index], point), 0), 0);
}

function sampleGeometry(lines, limit = 60) {
  const points = lines.flatMap((line, segment) => line.map(point => ({ ...point, segment }))).filter(point => Number.isFinite(point?.lat) && Number.isFinite(point?.lon));
  if (points.length <= limit) return points;
  return Array.from({ length: limit }, (_, index) => points[Math.round(index * (points.length - 1) / (limit - 1))]);
}

async function fetchOverpass(id) {
  const query = `[out:json][timeout:20];relation(${id})->.route;way(r.route);out geom;`;
  let lastError;
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8', Accept: 'application/json', 'User-Agent': 'Encumbrate/1.0 (https://www.encumbrate.es)' },
        body: new URLSearchParams({ data: query }),
        signal: AbortSignal.timeout(18000),
        next: { revalidate: 604800 },
      });
      if (!response.ok) throw new Error(`Overpass ${response.status}`);
      return response.json();
    } catch (error) { lastError = error; }
  }
  throw lastError || new Error('No route geometry available');
}

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
  const id = String(request.nextUrl.searchParams.get('id') || ''), match = id.match(/^osm-relation-(\d+)$/);
  if (!match) return NextResponse.json({ found: false, error: 'Identificador de ruta no válido.' }, { status: 400 });
  try {
    const data = await fetchOverpass(match[1]), lines = geometryLines(data.elements);
    if (!lines.length) return NextResponse.json({ found: false, error: 'El trazado público no incluye geometría suficiente.' });
    const distance = lineDistance(lines), samples = sampleGeometry(lines);
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
    return NextResponse.json({ found: true, distanceKm: distanceRounded, ascentM, maxAltitudeM, minAltitudeM, duration: duration(minutes), source: heights.length ? 'Calculado con el trazado OpenStreetMap y el modelo de elevación Open-Meteo' : 'Calculado con el trazado OpenStreetMap', calculated: true }, { headers: { 'Cache-Control': 'public, s-maxage=604800, stale-while-revalidate=2592000' } });
  } catch (error) {
    console.error('Route profile lookup failed', error);
    return NextResponse.json({ found: false, error: 'No hemos podido calcular ahora el perfil de esta ruta.' }, { status: 503 });
  }
}
