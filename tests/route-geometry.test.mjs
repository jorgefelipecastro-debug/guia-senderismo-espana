import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { flattenSegments, relationSegments, routeDistanceKm, sampleSegments } from '../lib/route-geometry.js';

test('reconstructs relation ways from the official OpenStreetMap full response', () => {
  const data = { elements: [
    { type:'relation', id:99, members:[{type:'way',ref:10,role:''},{type:'way',ref:11,role:''}] },
    { type:'way', id:10, nodes:[1,2,3] },
    { type:'way', id:11, nodes:[5,4,3] },
    { type:'node', id:1, lat:38, lon:-0.5 },
    { type:'node', id:2, lat:38.01, lon:-0.49 },
    { type:'node', id:3, lat:38.02, lon:-0.48 },
    { type:'node', id:4, lat:38.03, lon:-0.47 },
    { type:'node', id:5, lat:38.04, lon:-0.46 },
  ] };
  const segments = relationSegments(data, 99);
  assert.equal(segments.length, 2);
  assert.deepEqual(segments[1][0], { lat:38.02, lon:-0.48 });
  assert.deepEqual(flattenSegments(segments).at(-1), { lat:38.04, lon:-0.46 });
  assert.ok(routeDistanceKm(segments) > 0);
});

test('sampling preserves segment identity for elevation ascent calculations', () => {
  const segments = [[{lat:1,lon:1},{lat:1.1,lon:1.1}],[{lat:2,lon:2},{lat:2.1,lon:2.1}]];
  const sampled = sampleSegments(segments, 4);
  assert.deepEqual(sampled.map(point => point.segment), [0,0,1,1]);
});

test('runtime route endpoints contain no Overpass dependency', () => {
  const files = ['app/api/routes/profile/route.js','app/api/routes/track/route.js','lib/route-geometry.js'];
  for (const file of files) {
    const source = fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
    assert.equal(/overpass/i.test(source), false, `${file} must remain Overpass-free`);
  }
});
