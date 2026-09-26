import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { continuousRouteLine, flattenSegments, navigableSegments, relationSegments, routeDistanceKm, sampleSegments } from '../lib/route-geometry.js';
import { fetchRelationTracks } from '../lib/route-geometry-import.js';

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

test('only real Spanish route geometry qualifies for offline navigation', async () => {
  const reply = { elements: [
    { type:'relation', id:99, members:[
      {type:'way',ref:10,role:'',geometry:[{lat:38,lon:-0.5},{lat:38.01,lon:-0.49}]},
      {type:'way',ref:11,role:'',geometry:[{lat:38.01,lon:-0.49},{lat:38.02,lon:-0.48}]},
    ] },
    { type:'relation', id:100, members:[{type:'node',ref:12,role:'guidepost'}] },
  ] };
  const tracks = await fetchRelationTracks([99,100,101], async () => ({ok:true,json:async()=>reply}));
  assert.equal(tracks.get('99').length, 1);
  assert.ok(routeDistanceKm(tracks.get('99')) > 1);
  assert.equal(tracks.get('100'), null);
  assert.equal(tracks.get('101'), null);
  assert.equal(navigableSegments([[{lat:0,lon:0},{lat:1,lon:1}]]), null);
  assert.equal(navigableSegments([[{lat:38,lon:-0.5},{lat:38,lon:-0.5}]]), null);
});

test('orders and reverses OSM ways into one continuous downloadable walk', () => {
  const a = { lat: 38, lon: -0.5 }, b = { lat: 38.01, lon: -0.49 };
  const c = { lat: 38.02, lon: -0.48 }, d = { lat: 38.03, lon: -0.47 };
  const line = continuousRouteLine([[c, b], [c, d], [a, b]]);
  assert.deepEqual(line, [d, c, b, a]);
  assert.deepEqual(navigableSegments([[c, b], [c, d], [a, b]]), [[d, c, b, a]]);
});

test('a gap or ambiguous branching cannot be flattened into a false path', () => {
  const a = { lat: 38, lon: -0.5 }, b = { lat: 38.01, lon: -0.49 };
  const c = { lat: 38.02, lon: -0.48 }, d = { lat: 38.03, lon: -0.47 };
  assert.equal(navigableSegments([[a, b], [c, d]]), null);
  assert.equal(navigableSegments([[a, b], [b, c], [b, d]]), null);
  assert.deepEqual(continuousRouteLine([[a, b], [b, c], [c, a]]), [a, c, b, a]);
  assert.equal(navigableSegments([[a, { lat: 38.25, lon: -0.5 }]]), null);
});

test('sampling keeps real intermediate points when a sparse download would jump kilometres', () => {
  const original = Array.from({ length: 11 }, (_, index) => ({ lat: 38, lon: -0.5 + index * 0.005 }));
  const sampled = navigableSegments([original], 2);
  assert.ok(sampled[0].length > 2);
  assert.ok(sampled[0].every((point, index) => index === 0 || routeDistanceKm([[sampled[0][index - 1], point]]) <= 2));
  assert.deepEqual(sampled[0][0], original[0]);
  assert.deepEqual(sampled[0].at(-1), original.at(-1));
});

test('source failures do not classify unverified routes as missing', async () => {
  await assert.rejects(fetchRelationTracks([99], async () => ({ok:false,status:503})), /Overpass 503/);
});

test('runtime route endpoints contain no Overpass dependency', () => {
  const files = ['app/api/routes/profile/route.js','app/api/routes/track/route.js','lib/route-geometry.js'];
  for (const file of files) {
    const source = fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
    assert.equal(/overpass/i.test(source), false, `${file} must remain Overpass-free`);
  }
});
