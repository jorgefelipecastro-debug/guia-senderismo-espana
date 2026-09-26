import test from 'node:test';
import assert from 'node:assert/strict';
import { isContinuousOfflineTrack } from '../lib/offline-track-validation.js';
import { validNavigationTrack } from '../public/offline/maps.mjs';

test('los dos navegadores rechazan una descarga antigua con piezas separadas', () => {
  const a = { lat: 38, lon: -0.5 }, b = { lat: 38.01, lon: -0.49 };
  const c = { lat: 38.1, lon: -0.4 }, d = { lat: 38.11, lon: -0.39 };
  const old = { id: 'old', points: [a, b, c, d], segments: [[a, b], [c, d]] };
  assert.equal(isContinuousOfflineTrack(old), false);
  assert.equal(validNavigationTrack(old), false);
  const updated = { ...old, points: [a, b], segments: [[a, b]] };
  assert.equal(isContinuousOfflineTrack(updated), true);
  assert.equal(validNavigationTrack(updated), true);
});
