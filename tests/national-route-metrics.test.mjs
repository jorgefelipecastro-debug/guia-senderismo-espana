import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchRegionRoutes, normalizeNationalRoute } from '../lib/national-routes.js';
import { classifyHikingRoute } from '../lib/route-classification.js';

const region = { code: 'jaen', province: 'Jaén', community: 'Andalucía' };

test('una etiqueta OSM ausente no se convierte en desnivel ni altitud de 0 m', () => {
  const row = normalizeNationalRoute({ id: 987654321, center: { lat: 38, lon: -3 }, tags: { name: 'Sendero de prueba', distance: '5 km' } }, region, '2026-09-25T00:00:00Z');
  assert.equal(row.distance_km, 5);
  assert.equal(row.ascent_m, null);
  assert.equal(row.max_altitude_m, null);
  assert.equal(row.min_altitude_m, null);
  assert.equal(row.level, 'sin_clasificar');
  assert.ok(row.incomplete_fields.includes('min_altitude_m'));
  assert.equal(classifyHikingRoute(25, null), 'sin_clasificar');
});

test('un cero publicado explícitamente por OSM se conserva', () => {
  const row = normalizeNationalRoute({ id: 987654322, center: { lat: 38, lon: -3 }, tags: { name: 'Sendero de prueba 2', distance: '5 km', ascent: '0', maxele: '0', minele: '0', duration: '1 h' } }, region, '2026-09-25T00:00:00Z');
  assert.equal(row.ascent_m, 0);
  assert.equal(row.max_altitude_m, 0);
  assert.equal(row.min_altitude_m, 0);
  assert.equal(row.level, 'principiante');
});

test('Jaén se consulta por celdas completas, sin publicar un lote parcial', async () => {
  const original = globalThis.fetch;
  let calls = 0, inFlight = 0, maxInFlight = 0;
  globalThis.fetch = async (_url, options) => {
    calls += 1;
    inFlight += 1;
    maxInFlight = Math.max(inFlight, maxInFlight);
    const query = new URLSearchParams(options.body).get('data');
    assert.match(query, /\((?:37|38)\.[0-9]+,-[0-9.]+,(?:37|38)\.[0-9]+,-[0-9.]+\)/);
    const id = calls;
    await new Promise(resolve => setTimeout(resolve, 4));
    inFlight -= 1;
    return { ok: true, json: async () => ({ elements: [{ id: 42 }, { id: 100 + id }] }) };
  };
  try {
    const data = await fetchRegionRoutes(3600000000, 'jaen');
    assert.equal(calls, 8);
    assert.equal(maxInFlight, 4);
    assert.equal(data.elements.length, 9);
  } finally { globalThis.fetch = original; }
});
