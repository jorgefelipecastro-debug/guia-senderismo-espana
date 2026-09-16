import test from 'node:test';
import assert from 'node:assert/strict';
import 'fake-indexeddb/auto';
import {readFile} from 'node:fs/promises';
import {downloadLiveOfflineMap,leafletBoundsFromMercator,liveMapBounds,liveMapRecordCovers,liveMapTrackKey,liveMapUrl,readLiveOfflineMap} from '../lib/live-offline-map.js';
import {GET as offlineMapGET} from '../app/api/maps/offline/route.js';

const track={id:'live-offline-test',name:'Ruta prueba',points:[{lat:38.35,lon:-0.49},{lat:38.36,lon:-0.47}]};

test('los límites offline cubren la ruta y se convierten a Leaflet',()=>{
  const bounds=liveMapBounds(track),leaflet=leafletBoundsFromMercator(bounds);
  assert.equal(bounds.length,4);
  assert.equal(leaflet.length,2);
  assert.ok(leaflet[0][0] < 38.35 && leaflet[1][0] > 38.36);
  assert.ok(leaflet[0][1] < -0.49 && leaflet[1][1] > -0.47);
  assert.match(liveMapUrl(bounds),/^\/api\/maps\/offline\?bbox=/);
  assert.doesNotMatch(liveMapUrl(bounds),/ign\.es/);
});

test('los límites pueden ampliarse hasta la posición actual y detectan cobertura',()=>{
  const current={lat:38.47,lon:-0.50};
  const bounds=liveMapBounds(track,[current]);
  const record={bounds};
  assert.equal(liveMapRecordCovers(record,current),true);
  assert.equal(liveMapRecordCovers(record,{lat:40.4,lon:-3.7}),false);
});

test('la navegación valida, guarda, relee y vuelve a validar el mapa persistido',async()=>{
  const image=new Blob(['jpeg-persisted'],{type:'image/jpeg'});
  let validations=0,requestedUrl='';
  const current={lat:38.47,lon:-0.50};
  const saved=await downloadLiveOfflineMap(track,{
    extraPoints:[current],
    fetcher:async(url)=>{requestedUrl=String(url);return new Response(image,{status:200,headers:{'content-type':'image/jpeg'}})},
    validateImage:async(blob)=>{validations++;assert.equal(blob.type,'image/jpeg');assert.ok(blob.size>0)},
  });
  const loaded=await readLiveOfflineMap(track);
  assert.match(requestedUrl,/^\/api\/maps\/offline\?bbox=/);
  assert.equal(validations,2);
  assert.equal(loaded.id,track.id);
  assert.equal(loaded.key,liveMapTrackKey(track));
  assert.equal(saved.key,loaded.key);
  assert.equal(saved.blob.size,image.size);
  assert.equal(liveMapRecordCovers(loaded,current),true);
  assert.equal(await readLiveOfflineMap({...track,points:[...track.points,{lat:38.37,lon:-0.46}]}),null);
});

test('el proxy de mismo origen devuelve una imagen IGN válida y rechaza zonas inválidas',async()=>{
  const originalFetch=globalThis.fetch;
  let upstream='';
  globalThis.fetch=async(url)=>{
    upstream=String(url);
    return new Response(new Uint8Array([0xff,0xd8,0xff,0xd9]),{status:200,headers:{'content-type':'image/jpeg'}});
  };
  try {
    const bbox=liveMapBounds(track).join(',');
    const response=await offlineMapGET(new Request(`https://encumbrate.test/api/maps/offline?bbox=${encodeURIComponent(bbox)}`));
    assert.equal(response.status,200);
    assert.match(response.headers.get('content-type')||'',/^image\//);
    assert.match(upstream,/^https:\/\/www\.ign\.es\/wms-inspire\/mapa-raster\?/);
    const bad=await offlineMapGET(new Request('https://encumbrate.test/api/maps/offline?bbox=0,0,999999,999999'));
    assert.equal(bad.status,400);
  } finally {
    globalThis.fetch=originalFetch;
  }
});

test('la navegación activa mantiene fallback offline hasta confirmar OSM estable',async()=>{
  const source=await readFile(new URL('../app/LiveRouteGuide.js',import.meta.url),'utf8');
  const storage=await readFile(new URL('../lib/live-offline-map.js',import.meta.url),'utf8');
  assert.match(source,/readLiveOfflineMap/);
  assert.match(source,/downloadLiveOfflineMap/);
  assert.match(source,/liveMapRecordCovers/);
  assert.match(source,/offlineBasemap/);
  assert.match(source,/zIndex='250'/);
  assert.match(source,/OSM_TILE_STALL_MS=3500/);
  assert.match(source,/OSM_RECOVERY_MS=1200/);
  assert.match(source,/forceOffline\|\|!navigator\.onLine/);
  assert.match(source,/\.on\('tileerror',failTileCycle\)/);
  assert.match(source,/\.on\('tileload',markTileProgress\)/);
  assert.match(source,/armTileFailureWatchdog\(\);/);
  assert.match(source,/if\(tileCycleFailed\|\|tileCycleSuccess<1\)\{activateOfflineFallback\(\);return\}/);
  assert.match(source,/tiles\?\.setOpacity\(useOffline\?0:1\)/);
  assert.match(source,/offlineLayer\?\.setOpacity\(useOffline\?1:0\)/);
  assert.match(source,/extraPoints:extraPoint\?\[extraPoint\]:\[\]/);
  assert.match(source,/Cartografía offline activa · mapa online no disponible/);
  assert.match(source,/Sin conexión · cartografía offline activa/);
  assert.match(source,/Precisión de ubicación/);
  assert.match(storage,/const persisted=await readLiveOfflineMap\(track\)/);
  assert.match(storage,/await validateImage\(persisted\.blob\)/);
});
