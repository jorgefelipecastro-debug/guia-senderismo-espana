import test from 'node:test';
import assert from 'node:assert/strict';
import 'fake-indexeddb/auto';
import {readFile} from 'node:fs/promises';
import {downloadLiveOfflineMap,leafletBoundsFromMercator,liveMapBounds,liveMapTrackKey,readLiveOfflineMap} from '../lib/live-offline-map.js';

const track={id:'live-offline-test',name:'Ruta prueba',points:[{lat:38.35,lon:-0.49},{lat:38.36,lon:-0.47}]};

test('los límites offline cubren la ruta y se convierten a Leaflet',()=>{
  const bounds=liveMapBounds(track),leaflet=leafletBoundsFromMercator(bounds);
  assert.equal(bounds.length,4);
  assert.equal(leaflet.length,2);
  assert.ok(leaflet[0][0] < 38.35 && leaflet[1][0] > 38.36);
  assert.ok(leaflet[0][1] < -0.49 && leaflet[1][1] > -0.47);
});

test('la navegación guarda y recupera el mismo mapa offline por huella de trazado',async()=>{
  const response=()=>new Response(new Blob(['jpeg'],{type:'image/jpeg'}),{status:200,headers:{'content-type':'image/jpeg'}});
  const saved=await downloadLiveOfflineMap(track,{fetcher:async()=>response()});
  const loaded=await readLiveOfflineMap(track);
  assert.equal(loaded.id,track.id);
  assert.equal(loaded.key,liveMapTrackKey(track));
  assert.equal(saved.key,loaded.key);
  assert.equal(await readLiveOfflineMap({...track,points:[...track.points,{lat:38.37,lon:-0.46}]}),null);
});

test('la navegación activa coloca el mapa local bajo las teselas online y lo prepara automáticamente',async()=>{
  const source=await readFile(new URL('../app/LiveRouteGuide.js',import.meta.url),'utf8');
  assert.match(source,/readLiveOfflineMap/);
  assert.match(source,/downloadLiveOfflineMap/);
  assert.match(source,/offlineBasemap/);
  assert.match(source,/zIndex='180'/);
  assert.match(source,/Sin conexión · cartografía offline activa/);
  assert.match(source,/Precisión de ubicación/);
});
