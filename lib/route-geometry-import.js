import { navigableSegments, relationSegments } from './route-geometry.js';

const ENDPOINTS = [
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
];

// Read-only Overpass geometries are fetched in small batches, never from the
// OpenStreetMap editing API. A failed request does not classify routes as missing.
export async function fetchRelationTracks(ids, fetcher = fetch) {
  if (!Array.isArray(ids) || !ids.length || ids.length > 12 || ids.some(id => !/^\d+$/.test(String(id)))) throw new Error('INVALID_RELATION_BATCH');
  const query = `[out:json][timeout:60];relation(id:${ids.join(',')});out geom;`;
  let failure;
  for (const endpoint of ENDPOINTS) {
    try {
      const response = await fetcher(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8', Accept: 'application/json', 'User-Agent': 'Encumbrate/1.0 (https://www.encumbrate.es)' },
        body: new URLSearchParams({ data: query }),
        signal: AbortSignal.timeout(70000), cache: 'no-store',
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

// Keep each query small enough for shared Overpass servers. A failed half of
// a cron batch must not discard the geometry recovered from the other half.
export async function fetchRelationTrackBatches(ids, fetcher = fetch) {
  if (!Array.isArray(ids) || !ids.length || ids.length > 12 || ids.some(id => !/^\d+$/.test(String(id)))) throw new Error('INVALID_RELATION_BATCH');
  const groups = [];
  for (let index = 0; index < ids.length; index += 6) groups.push(ids.slice(index, index + 6));
  const results = await Promise.allSettled(groups.map(group => fetchRelationTracks(group, fetcher)));
  const tracks = new Map(), failedIds = [], errors = [];
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      for (const [id, segments] of result.value) tracks.set(id, segments);
    } else {
      failedIds.push(...groups[index].map(String));
      errors.push(result.reason);
    }
  });
  return { tracks, failedIds, errors };
}
