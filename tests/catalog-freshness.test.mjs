import test from 'node:test';
import assert from 'node:assert/strict';
import { catalogFreshness } from '../lib/catalog-freshness.js';

test('la fecha de consulta no se confunde con la fecha de importación', () => {
  const now = Date.parse('2026-09-24T19:00:00Z');
  const fresh = catalogFreshness('2026-09-23T12:00:00Z', now);
  const old = catalogFreshness('2026-08-20T12:00:00Z', now);
  assert.match(fresh.date, /23 de septiembre de 2026/);
  assert.equal(fresh.olderThan30Days, false);
  assert.equal(old.olderThan30Days, true);
  assert.equal(catalogFreshness(null, now), null);
  assert.equal(catalogFreshness('2026-09-25T19:00:00Z', now), null);
});
