import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabase-admin';

export const dynamic = 'force-dynamic';

const OVERPASS_ENDPOINTS = ['https://overpass.private.coffee/api/interpreter', 'https://overpass-api.de/api/interpreter'];

async function routeLines(id) {
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
      const data = await response.json();
      return (data.elements || []).map(element => element.geometry).filter(line => Array.isArray(line) && line.length > 1);
    } catch (error) { lastError = error; }
  }
  throw lastError || new Error('No route geometry available');
}

async function storedRouteLines(id) {
  const { data, error } = await getSupabaseAdmin().from('hiking_routes')
    .select('raw_tags,source')
    .eq('id', id)
    .eq('published', true)
    .maybeSingle();
  if (error) throw error;
  const points = data?.raw_tags?.trace_points;
  if (!Array.isArray(points) || points.length < 2) return null;
  const line = points.map(point => ({ lat: Number(point?.[0]), lon: Number(point?.[1]) }))
    .filter(point => Number.isFinite(point.lat) && Number.isFinite(point.lon));
  return line.length > 1 ? { lines: [line], source: data.source === 'fedamon' ? 'FAM' : 'OFICIAL' } : null;
}

function simplify(line, maximum = 160) {
  if (line.length <= maximum) return line;
  return Array.from({ length: maximum }, (_, index) => line[Math.round(index * (line.length - 1) / (maximum - 1))]);
}

function traceSvg(lines, source = 'OSM') {
  const points = lines.flat();
  const averageLat = points.reduce((sum, point) => sum + point.lat, 0) / points.length;
  const lonScale = Math.max(.2, Math.cos(averageLat * Math.PI / 180));
  const projected = lines.map(line => simplify(line).map(point => ({ x: point.lon * lonScale, y: -point.lat })));
  const all = projected.flat(), minX = Math.min(...all.map(point => point.x)), maxX = Math.max(...all.map(point => point.x)), minY = Math.min(...all.map(point => point.y)), maxY = Math.max(...all.map(point => point.y));
  const width = 800, height = 500, padding = 65, spanX = Math.max(.00001, maxX - minX), spanY = Math.max(.00001, maxY - minY), scale = Math.min((width - padding * 2) / spanX, (height - padding * 2) / spanY);
  const offsetX = (width - spanX * scale) / 2, offsetY = (height - spanY * scale) / 2;
  const paths = projected.map(line => line.map((point, index) => `${index ? 'L' : 'M'}${(offsetX + (point.x - minX) * scale).toFixed(1)},${(offsetY + (point.y - minY) * scale).toFixed(1)}`).join(' '));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Trazado público de la ruta"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#164d3a"/><stop offset="1" stop-color="#052d22"/></linearGradient><filter id="shadow"><feDropShadow dx="0" dy="5" stdDeviation="6" flood-opacity=".45"/></filter></defs><rect width="800" height="500" fill="url(#bg)"/><g fill="none" stroke="#dce9df" stroke-opacity=".12" stroke-width="2"><path d="M-40 120 Q180 20 410 115 T850 95"/><path d="M-20 260 Q190 150 420 250 T830 225"/><path d="M-30 400 Q200 295 430 390 T850 370"/></g><g fill="none" stroke="#d8ff77" stroke-linecap="round" stroke-linejoin="round" filter="url(#shadow)">${paths.map(path => `<path d="${path}" stroke="#032a1f" stroke-width="18"/><path d="${path}" stroke="#a7df36" stroke-width="9"/>`).join('')}</g><g transform="translate(32 423)"><rect width="350" height="48" rx="24" fill="#00271dd9"/><circle cx="26" cy="24" r="8" fill="#a7df36"/><text x="47" y="30" fill="#fff" font-family="Arial,sans-serif" font-size="17" font-weight="700">TRAZADO PÚBLICO · ${source}</text></g></svg>`;
}

export async function GET(request) {
  const id = String(request.nextUrl.searchParams.get('id') || ''), match = id.match(/^osm-relation-(\d+)$/);
  if (!/^[a-z0-9-]+$/i.test(id)) return NextResponse.json({ error: 'Identificador de ruta no válido.' }, { status: 400 });
  try {
    const stored = match ? null : await storedRouteLines(id);
    const lines = stored?.lines || (match ? await routeLines(match[1]) : []);
    if (!lines.length) throw new Error('Empty route geometry');
    return new NextResponse(traceSvg(lines, stored?.source || 'OSM'), { headers: { 'Content-Type': 'image/svg+xml; charset=utf-8', 'Cache-Control': 'public, s-maxage=604800, stale-while-revalidate=2592000', 'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; sandbox" } });
  } catch (error) {
    console.error('Route trace lookup failed', error);
    return NextResponse.json({ error: 'No hemos podido dibujar ahora el trazado.' }, { status: 503 });
  }
}
