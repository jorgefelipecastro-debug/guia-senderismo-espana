import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const OVERPASS_ENDPOINTS = [
  'https://overpass.private.coffee/api/interpreter',
  'https://overpass-api.de/api/interpreter',
];

function haversine(a, b) {
  const rad = value => value * Math.PI / 180;
  const dLat = rad(b.lat - a.lat), dLon = rad(b.lon - a.lon);
  const value = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function geometryPoints(element) {
  const points = [];
  for (const member of element?.members || []) {
    for (const point of member.geometry || []) {
      if (Number.isFinite(point.lat) && Number.isFinite(point.lon)) points.push({ lat: point.lat, lon: point.lon });
    }
  }
  return points;
}

function parkingPoint(element) {
  const lat = element.center?.lat ?? element.lat;
  const lon = element.center?.lon ?? element.lon;
  return Number.isFinite(lat) && Number.isFinite(lon) ? { lat, lon } : null;
}

function nearbyPoint(element) {
  const point = parkingPoint(element);
  if (!point) return null;
  return { ...point, name: element.tags?.name || element.tags?.brand || element.tags?.operator || 'Lugar sin nombre publicado' };
}

function nearbyMapsUrl(point) {
  const url = new URL('https://www.google.com/maps/search/');
  url.searchParams.set('api', '1');
  url.searchParams.set('query', `${point.lat},${point.lon}`);
  return url.toString();
}

function distanceToRoute(point, points) {
  let distance = Infinity;
  for (const candidate of points) distance = Math.min(distance, haversine(point, candidate));
  return distance;
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
        next: { revalidate: 86400 },
      });
      if (!response.ok) throw new Error(`Overpass ${response.status}`);
      return response.json();
    } catch (error) { lastError = error; }
  }
  throw lastError || new Error('No route access source available');
}

function mapsDirections(destination, travelmode, origin) {
  const url = new URL('https://www.google.com/maps/dir/');
  url.searchParams.set('api', '1');
  if (origin) url.searchParams.set('origin', `${origin.lat},${origin.lon}`);
  url.searchParams.set('destination', `${destination.lat},${destination.lon}`);
  url.searchParams.set('travelmode', travelmode);
  url.searchParams.set('dir_action', 'navigate');
  return url.toString();
}

export async function GET(request) {
  const params = request.nextUrl.searchParams;
  const match = String(params.get('id') || '').match(/^osm-relation-(\d+)$/);
  const lat = Number(params.get('lat')), lon = Number(params.get('lon'));
  if (!match || !Number.isFinite(lat) || !Number.isFinite(lon)) {
    return NextResponse.json({ error: 'Referencia de acceso no válida.' }, { status: 400 });
  }

  try {
    const relationId = Number(match[1]);
    const query = `[out:json][timeout:22];relation(${relationId});out geom;(nwr["amenity"~"^(parking|restaurant|bar|cafe|clinic|hospital|doctors|pharmacy|shelter)$"](around:8000,${lat},${lon});nwr["tourism"~"^(alpine_hut|wilderness_hut|hostel|camp_site|chalet|hotel|guest_house)$"](around:8000,${lat},${lon});nwr["shop"~"^(convenience|supermarket|outdoor|general)$"](around:8000,${lat},${lon}););out tags center 160;`;
    const data = await fetchOverpass(query);
    const route = (data.elements || []).find(element => element.type === 'relation' && element.id === relationId);
    const points = geometryPoints(route);
    if (!points.length) throw new Error('Route geometry unavailable');

    const routeTags = route.tags || {};
    const dogValue = String(routeTags.dog || routeTags['dog:access'] || '').toLowerCase();
    const petPolicy = dogValue === 'no'
      ? { status: 'no', label: 'No aconsejable con perro', detail: 'La ficha pública del trazado indica que no se admiten perros.' }
      : ['leashed', 'leash'].includes(dogValue) || routeTags.leash === 'yes'
        ? { status: 'leash', label: 'Perro permitido con correa', detail: 'La ficha pública exige llevar al perro atado.' }
        : dogValue === 'yes'
          ? { status: 'yes', label: 'Apta para ir con perro', detail: 'La ficha pública admite perros. Usa correa cuando la normativa o la seguridad lo exijan.' }
          : { status: 'unknown', label: 'Condición para perros sin publicar', detail: 'Consulta la normativa local y del espacio protegido antes de llevarlo.' };

    const restrictedAccess = new Set(['private', 'customers', 'permit', 'no']);
    const parkings = (data.elements || []).filter(element => element.tags?.amenity === 'parking' && !restrictedAccess.has(element.tags?.access)).map(element => {
      const point = parkingPoint(element);
      if (!point) return null;
      let trailhead = points[0], distance = haversine(point, trailhead);
      for (const candidate of points) {
        const nextDistance = haversine(point, candidate);
        if (nextDistance < distance) { distance = nextDistance; trailhead = candidate; }
      }
      return { element, point, trailhead, distance };
    }).filter(Boolean).sort((a, b) => a.distance - b.distance);

    const best = parkings[0];
    const amenityGroups = { camping: [], shelters: [], lodging: [], food: [], medical: [], shops: [] };
    for (const element of data.elements || []) {
      const tags = element.tags || {}, point = nearbyPoint(element);
      if (!point || tags.amenity === 'parking') continue;
      const distance = distanceToRoute(point, points);
      const item = { ...point, distanceKm: distance, mapsUrl: nearbyMapsUrl(point) };
      if (tags.tourism === 'camp_site') amenityGroups.camping.push(item);
      if (['alpine_hut', 'wilderness_hut'].includes(tags.tourism) || tags.amenity === 'shelter') amenityGroups.shelters.push(item);
      if (['hostel', 'chalet', 'hotel', 'guest_house'].includes(tags.tourism)) amenityGroups.lodging.push(item);
      if (['restaurant', 'bar', 'cafe'].includes(tags.amenity)) amenityGroups.food.push(item);
      if (['clinic', 'hospital', 'doctors', 'pharmacy'].includes(tags.amenity)) amenityGroups.medical.push(item);
      if (tags.shop) amenityGroups.shops.push(item);
    }
    for (const list of Object.values(amenityGroups)) list.sort((a, b) => a.distanceKm - b.distanceKm).splice(3);
    const campingPolicy = amenityGroups.camping.length
      ? { status: 'site', label: 'Hay camping autorizado próximo', detail: 'No implica que esté permitida la acampada libre fuera de sus instalaciones.' }
      : { status: 'unknown', label: 'Acampada no confirmada', detail: 'No acampes sin comprobar antes la normativa municipal y del espacio protegido.' };
    if (!best) {
      const trailhead = points[0];
      return NextResponse.json({
        foundParking: false,
        trailhead,
        walkingUrl: mapsDirections(trailhead, 'walking'),
        petPolicy,
        campingPolicy,
        nearby: amenityGroups,
        note: 'OpenStreetMap no publica un aparcamiento público próximo a este trazado.',
      }, { headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' } });
    }

    const parkingName = best.element.tags?.name || best.element.tags?.description || 'Aparcamiento público próximo';
    return NextResponse.json({
      foundParking: true,
      parking: { ...best.point, name: parkingName, access: best.element.tags?.access || 'publicado sin restricción privada' },
      trailhead: best.trailhead,
      walkingDistanceKm: best.distance,
      drivingUrl: mapsDirections(best.point, 'driving'),
      walkingUrl: mapsDirections(best.trailhead, 'walking', best.point),
      petPolicy,
      campingPolicy,
      nearby: amenityGroups,
      note: 'Aparcamiento y punto de acceso calculados con datos públicos de OpenStreetMap. Comprueba señales, horarios y disponibilidad al llegar.',
    }, { headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' } });
  } catch (error) {
    console.error('Route access lookup failed', error);
    return NextResponse.json({ error: 'No hemos podido comprobar ahora el acceso y el aparcamiento de esta ruta.' }, { status: 503 });
  }
}
