import { NextResponse } from 'next/server';
import { resolveRouteGeometry } from '../../../../lib/route-geometry';
import { recordServerError } from '../../../../lib/monitoring';

export const dynamic = 'force-dynamic';

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
  const id = String(request.nextUrl.searchParams.get('id') || '');
  if (!/^[a-z0-9-]+$/i.test(id)) return NextResponse.json({ error: 'Identificador de ruta no válido.' }, { status: 400 });
  try {
    const geometry = await resolveRouteGeometry(id);
    if (!geometry?.segments?.length) return NextResponse.json({ error: 'Esta ruta no dispone de un trazado GPS verificado.' }, { status: 404, headers: { 'Cache-Control': 'no-store' } });
    return new NextResponse(traceSvg(geometry.segments, geometry.source), { headers: { 'Content-Type': 'image/svg+xml; charset=utf-8', 'Cache-Control': 'no-store', 'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; sandbox" } });
  } catch (error) {
    await recordServerError(error,{route:'/api/routes/trace'});
    return NextResponse.json({ error: 'No hemos podido dibujar ahora el trazado.' }, { status: 503 });
  }
}
