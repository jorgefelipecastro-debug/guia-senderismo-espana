import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {latLonToWorld,worldToLatLon,fitZoomForPoints,metersPerPixel} from '../public/offline/tile-map.mjs';

test('proyección GPS del mapa offline es reversible',()=>{
  const point={lat:38.428,lon:-0.401};
  for(const zoom of [5,9,13,15]){
    const world=latLonToWorld(point,zoom),back=worldToLatLon(world,zoom);
    assert.ok(Math.abs(back.lat-point.lat)<1e-8);
    assert.ok(Math.abs(back.lon-point.lon)<1e-8);
  }
});

test('fit calcula zoom menor para dos puntos alejados y mayor al acercarse',()=>{
  const far=fitZoomForPoints([{lat:38.43,lon:-0.40},{lat:38.31,lon:-0.52}],600,600,60);
  const near=fitZoomForPoints([{lat:38.40,lon:-0.50},{lat:38.405,lon:-0.495}],600,600,60);
  assert.ok(far.zoom<near.zoom);
  assert.ok(far.zoom>=5&&near.zoom<=15);
});

test('resolución aumenta al subir zoom',()=>{
  assert.ok(metersPerPixel(38,15)<metersPerPixel(38,13));
});

test('visor usa teselas interactivas, gestos y seguimiento GPS',async()=>{
  const [viewer,engine,html,worker]=await Promise.all([
    readFile(new URL('../public/offline/viewer.mjs',import.meta.url),'utf8'),
    readFile(new URL('../public/offline/tile-map.mjs',import.meta.url),'utf8'),
    readFile(new URL('../public/offline.html',import.meta.url),'utf8'),
    readFile(new URL('../public/sw.js',import.meta.url),'utf8'),
  ]);
  assert.match(viewer,/createOfflineGpsMap/);
  assert.match(viewer,/liveMap\.recenter/);
  assert.match(viewer,/liveMap\.fitPoints/);
  assert.match(engine,/pointerdown/);
  assert.match(engine,/pointermove/);
  assert.match(engine,/pinchStart/);
  assert.match(engine,/setPosition/);
  assert.match(engine,/follow=true/);
  assert.match(engine,/displaySegments/);
  assert.match(engine,/routePath\.setAttribute\('d',displaySegments\(\)/);
  assert.match(html,/id="gpsMapCanvas"/);
  assert.match(html,/touch-action:none/);
  assert.match(worker,/offline\/tile-map\.mjs/);
  assert.match(worker,/encumbrate-public-v24/);
});
