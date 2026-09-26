import { navigableSegments, relationSegments } from './route-geometry.js';

const ENDPOINTS = [
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
];

// Read-only Overpass geometries are fetched in small batches, never from the
// OpenStreetMap editing API. A failed request does not classify routes as missing.
export async function fetchRelationTracks(ids, fetcher = fetch) {
  if (!Array.isArray(ids) || !ids.length || ids.length > 12 || ids.some(id => !/^\d+$/.test(String(id)))) throw new Error('INVALID_RELATION_BATCH');
  const query = `[out:json][timeout:90];relation(id:${ids.join(',')});out geom;`;
  let failure;
  for (const endpoint of ENDPOINTS) {
    try {
      const response = await fetcher(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8', Accept: 'application/json', 'User-Agent': 'Encumbrate/1.0 (https://www.encumbrate.es)' },
        body: new URLSearchParams({ data: query }),
        signal: AbortSignal.timeout(110000), cache: 'no-store',
      });
      if (!response.ok) throw new Error(`Overpass ${response.status}`);
      const payload = await response.json();
      if (!Array.isArray(payload?.elements)) throw new Error('Overpass response incomplete');
      const found = new Map(payload.elements.filter(item => item.type === 'relation').map(item => [String(item.id), item]));
      return new Map(ids.map(id => {
        const relation = found.get(String(id));
        const segments = relation ? navigableSegments(relationSegments({ elements: [relation] }, id)) : null;
        return [String(id), segments];
      }));
    } catch (error) { failure = error; }
  }
  throw failure || new Error('Overpass unavailable');
}
