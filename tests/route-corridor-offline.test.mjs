import test from 'node:test';
import assert from 'node:assert/strict';
import 'fake-indexeddb/auto';
import {routeCorridorTiles} from '../public/offline/route-tiles.mjs';
import {downloadRouteOfflinePack,readBestOfflineTile} from '../lib/offline-mosaic.js';
import {downloadRouteDetail,readRouteMapPack} from '../public/offline/mosaic.mjs';
import {trackKey} from '../public/offline/maps.mjs';

const tileAt=(point,z)=>{
  const n=2**z,r=point.lat*Math.PI/180;
  return `${z}/${Math.floor((point.lon+180)/360*n)}/${Math.floor((1-Math.asinh(Math.tan(r))/Math.PI)/2*n)}`;
};

test('una ruta de más de 200 km guarda cartografía a lo largo de todo el recorrido',()=>{
  const points=Array.from({length:201},(_,i)=>i<=100
    ?{lat:38+i*.0095,lon:-.5}
    :{lat:38.95,lon:-.5+(i-100)*.012});
  const plan=routeCorridorTiles(points,{limit:900});
  assert.ok(plan.maxZoom>=14);
  assert.ok(plan.tiles.length<=900);
  const keys=new Set(plan.tiles.map(tile=>tile.key));
  for(const point of [points[0],points[50],points[100],points[150],points[200]])
    assert.ok(keys.has(tileAt(point,plan.maxZoom)));
});

test('la app y el visor offline comparten las teselas descargadas y confirman la persistencia',async()=>{
  const track={id:'corridor-test',name:'Ruta de prueba',points:[{lat:38,lon:-.5},{lat:38.005,lon:-.495}]};
  let requests=0;
  const fetcher=async()=>{
    requests++;
    return new Response(new Blob(['imagen'],{type:'image/jpeg'}),{status:200,headers:{'content-type':'image/jpeg'}});
  };
  const app=await downloadRouteOfflinePack(track,{fetcher,requestIntervalMs:0});
  assert.equal(app.status,'ready');
  assert.ok(await readBestOfflineTile(app.maxZoom,...tileAt(track.points[0],app.maxZoom).split('/').slice(1).map(Number)));
  const downloaded=requests;
  const viewer=await downloadRouteDetail(track,{fetcher,requestIntervalMs:0});
  assert.equal(viewer.status,'ready');
  assert.equal(viewer.completedTiles,viewer.totalTiles);
  assert.equal(requests,downloaded);
  assert.equal((await readRouteMapPack(track.id,trackKey(track))).status,'ready');
  assert.equal(await readRouteMapPack(track.id,'otro-trazado'),null);
});
