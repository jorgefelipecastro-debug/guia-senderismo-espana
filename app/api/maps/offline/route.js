const MAX_BYTES = 10 * 1024 * 1024;
const SIZE = 2048;
const R = 6378137;

function unproject(x, y) {
  return {
    lon: (x / R) * 180 / Math.PI,
    lat: (2 * Math.atan(Math.exp(y / R)) - Math.PI / 2) * 180 / Math.PI,
  };
}

function parseBounds(value) {
  const bounds = String(value || '').split(',').map(Number);
  if (bounds.length !== 4 || !bounds.every(Number.isFinite)) throw new Error('invalid bbox');
  const [west, south, east, north] = bounds;
  if (east <= west || north <= south || east - west > 80000 || north - south > 80000) throw new Error('invalid extent');
  const sw = unproject(west, south), ne = unproject(east, north);
  if (sw.lat < 26 || ne.lat > 45.5 || sw.lon < -19.5 || ne.lon > 5.5) throw new Error('outside Spain');
  return bounds;
}

function ignUrl(bounds) {
  const params = new URLSearchParams({
    SERVICE: 'WMS', VERSION: '1.3.0', REQUEST: 'GetMap', LAYERS: 'mtn_rasterizado', STYLES: '',
    CRS: 'EPSG:3857', BBOX: bounds.join(','), WIDTH: String(SIZE), HEIGHT: String(SIZE), FORMAT: 'image/jpeg',
  });
  return `https://www.ign.es/wms-inspire/mapa-raster?${params}`;
}

export async function GET(request) {
  let bounds;
  try {
    bounds = parseBounds(new URL(request.url).searchParams.get('bbox'));
  } catch {
    return Response.json({ error: 'Zona de mapa no valida.' }, { status: 400 });
  }

  try {
    const response = await fetch(ignUrl(bounds), { cache: 'no-store', signal: AbortSignal.timeout(20000) });
    const type = response.headers.get('content-type') || '';
    const announced = Number(response.headers.get('content-length') || 0);
    if (!response.ok || !type.startsWith('image/') || announced > MAX_BYTES) throw new Error('invalid IGN response');
    const bytes = await response.arrayBuffer();
    if (!bytes.byteLength || bytes.byteLength > MAX_BYTES) throw new Error('invalid image size');
    return new Response(bytes, {
      status: 200,
      headers: {
        'Content-Type': type,
        'Content-Length': String(bytes.byteLength),
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('Offline map proxy failed', error);
    return Response.json({ error: 'No se ha podido preparar la cartografia offline.' }, { status: 502, headers: { 'Cache-Control': 'no-store' } });
  }
}
